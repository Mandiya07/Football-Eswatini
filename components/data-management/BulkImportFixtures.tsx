
import React, { useState, useEffect } from 'react';
import { GoogleGenAI, Type } from '@google/genai';
import { Card, CardContent } from '../ui/Card';
import Button from '../ui/Button';
import Spinner from '../ui/Spinner';
import { fetchAllCompetitions, fetchCompetition } from '../../services/api';
import { db } from '../../services/firebase';
import { doc, runTransaction } from 'firebase/firestore';
import { calculateStandings, normalizeTeamName, removeUndefinedProps } from '../../services/utils';
import SparklesIcon from '../icons/SparklesIcon';
import CheckCircleIcon from '../icons/CheckCircleIcon';
import AlertTriangleIcon from '../icons/AlertTriangleIcon';
import XCircleIcon from '../icons/XCircleIcon';
import PencilIcon from '../icons/PencilIcon';
import TrashIcon from '../icons/TrashIcon';
import { Competition, CompetitionFixture, Team } from '../../data/teams';

interface ParsedFixture extends Partial<CompetitionFixture> {
    tempId: number;
    selected: boolean;
    teamA: string;
    teamB: string;
    overallConfidence: number;
    reviewStatus: 'auto-publish' | 'manual-review' | 'reject' | 'update';
    normalizedTeamA: string | null;
    normalizedTeamB: string | null;
    isDuplicate: boolean;
    warnings: string[];
}

interface EditFormData extends Partial<Omit<ParsedFixture, 'scoreA' | 'scoreB'>> {
    scoreA?: string | number;
    scoreB?: string | number;
}

const StatusIndicator: React.FC<{ status: ParsedFixture['reviewStatus'], warnings: string[] }> = ({ status, warnings }) => {
    const details = {
        'auto-publish': { Icon: CheckCircleIcon, color: 'text-green-500', label: 'New' },
        'update': { Icon: CheckCircleIcon, color: 'text-teal-500', label: 'Update' },
        'manual-review': { Icon: AlertTriangleIcon, color: 'text-yellow-500', label: 'Review' },
        'reject': { Icon: XCircleIcon, color: 'text-red-500', label: 'Rejected' }
    };

    const { Icon, color, label } = details[status] || details['manual-review'];
    const tooltipText = warnings.length > 0 ? `${label}: ${warnings.join(', ')}` : label;

    return (
        <div className="group relative flex justify-center">
            <Icon className={`w-5 h-5 ${color}`} />
            <div className="absolute bottom-full mb-2 w-max max-w-xs bg-gray-800 text-white text-xs rounded py-1 px-2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
                {tooltipText}
                 <div className="absolute top-full left-1/2 -translate-x-1/2 w-0 h-0 border-x-4 border-x-transparent border-t-4 border-t-gray-800"></div>
            </div>
        </div>
    );
};


const BulkImportFixtures: React.FC = () => {
    const [pastedText, setPastedText] = useState('');
    const [parsedFixtures, setParsedFixtures] = useState<ParsedFixture[]>([]);
    const [isParsing, setIsParsing] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState('');
    const [successMessage, setSuccessMessage] = useState('');

    const [competitions, setCompetitions] = useState<{ id: string, name: string }[]>([]);
    const [selectedComp, setSelectedComp] = useState('mtn-premier-league');
    const [currentCompetitionData, setCurrentCompetitionData] = useState<Competition | null>(null);
    const [matchday, setMatchday] = useState('');
    const [loadingComps, setLoadingComps] = useState(true);
    const [importType, setImportType] = useState<'fixtures' | 'results'>('fixtures');
    
    const [editingFixtureId, setEditingFixtureId] = useState<number | null>(null);
    const [editedData, setEditedData] = useState<EditFormData>({});


    useEffect(() => {
        const loadCompetitions = async () => {
            const allComps = await fetchAllCompetitions();
            const leagueList = Object.entries(allComps).map(([id, comp]) => ({ id, name: comp.name }));
            setCompetitions(leagueList);
            setLoadingComps(false);
        };
        loadCompetitions();
    }, []);

    useEffect(() => {
        const loadCompData = async () => {
            if (selectedComp) {
                const data = await fetchCompetition(selectedComp);
                setCurrentCompetitionData(data || null);
            }
        };
        loadCompData();
    }, [selectedComp]);


    const handleParse = async () => {
        if (!pastedText.trim()) return setError('Please paste some text to parse.');
        if (!currentCompetitionData) return setError('Please select a valid competition.');
        
        if (!process.env.API_KEY) {
            return setError('System Error: API_KEY is not configured. Please add the API_KEY environment variable in your Vercel project settings.');
        }
        
        setIsParsing(true);
        setError('');
        setParsedFixtures([]);
        
        const isResultsImport = importType === 'results';
        const officialTeamNames = (currentCompetitionData.teams || []).map(t => t.name);
        const existingMatches = [...(currentCompetitionData.fixtures || []), ...(currentCompetitionData.results || [])];

        const prompt = `You are an expert sports data parser. Analyze the following text containing football ${isResultsImport ? '**result**' : '**fixture**'} information. Extract the details for each match and return it as a JSON array that conforms to the provided schema. For each extracted field, provide a confidence score between 0 and 1 representing your certainty in the accuracy of the extracted data. Include these scores in a 'confidenceScores' object for each match.
- The 'status' should be '${isResultsImport ? 'finished' : 'scheduled'}', but can also be 'postponed', 'cancelled', 'abandoned', or 'suspended' if indicated in the text.
- ${isResultsImport ? "'scoreA' and 'scoreB' are REQUIRED for finished matches." : "'scoreA' and 'scoreB' MUST be null or omitted."}
- If a venue/stadium is mentioned, extract it into the 'venue' field; otherwise, omit the field.
- 'fullDate' must be in 'YYYY-MM-DD' format. Assume the current year (${new Date().getFullYear()}) if not specified.
- 'time' should be in 'HH:MM' 24-hour format.

Text to parse:\n\n${pastedText}`;

        const responseSchema = {
            type: Type.ARRAY,
            items: {
                type: Type.OBJECT,
                properties: {
                    teamA: { type: Type.STRING },
                    teamB: { type: Type.STRING },
                    fullDate: { type: Type.STRING, description: 'Format: YYYY-MM-DD' },
                    time: { type: Type.STRING, description: 'Format: HH:MM' },
                    scoreA: { type: Type.NUMBER },
                    scoreB: { type: Type.NUMBER },
                    status: { type: Type.STRING, enum: ['scheduled', 'finished', 'postponed', 'cancelled', 'abandoned', 'suspended'] },
                    venue: { type: Type.STRING, description: 'Optional venue name.' },
                    confidenceScores: {
                        type: Type.OBJECT,
                        properties: {
                            teamA: { type: Type.NUMBER }, teamB: { type: Type.NUMBER }, fullDate: { type: Type.NUMBER },
                            time: { type: Type.NUMBER }, scoreA: { type: Type.NUMBER }, scoreB: { type: Type.NUMBER },
                            venue: { type: Type.NUMBER }, status: { type: Type.NUMBER }
                        }
                    }
                },
            }
        };

        try {
            const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
            const response = await ai.models.generateContent({ model: 'gemini-2.5-flash', contents: prompt, config: { responseMimeType: 'application/json', responseSchema } });
            const parsedData = JSON.parse(response.text);

            const processedData: ParsedFixture[] = parsedData.map((item: any, index: number) => {
                const scores = Object.values(item.confidenceScores || {}).map(v => typeof v === 'number' ? v : 0.3);
                const overallConfidence = scores.length > 0 ? scores.reduce((a, b) => a + b, 0) / scores.length : 0.5;
                const warnings: string[] = [];

                const normalizedTeamA = normalizeTeamName(item.teamA, officialTeamNames);
                const normalizedTeamB = normalizeTeamName(item.teamB, officialTeamNames);
                if (!normalizedTeamA) warnings.push(`Could not match Home Team: "${item.teamA}"`);
                if (!normalizedTeamB) warnings.push(`Could not match Away Team: "${item.teamB}"`);

                // Look for existing match
                const existingMatch = existingMatches.find(f => 
                    f.fullDate === item.fullDate && 
                    f.teamA === normalizedTeamA && 
                    f.teamB === normalizedTeamB
                );
                
                const isDuplicate = !!existingMatch;
                let reviewStatus: ParsedFixture['reviewStatus'] = 'auto-publish';
                let isUpdate = false;

                if (isDuplicate && existingMatch) {
                    // Check if new data improves existing
                    const timeImproved = (existingMatch.time === '00:00' && item.time !== '00:00') || (!existingMatch.time && !!item.time);
                    const venueImproved = (!existingMatch.venue && !!item.venue);
                    // Status changed to finished?
                    const statusUpdated = existingMatch.status !== 'finished' && item.status === 'finished';
                    
                    if (timeImproved || venueImproved || statusUpdated) {
                        isUpdate = true;
                        reviewStatus = 'update';
                    } else {
                         reviewStatus = 'manual-review'; // Flag duplicate
                         warnings.push("Exact duplicate found.");
                    }
                }

                if (overallConfidence < 0.5 || !normalizedTeamA || !normalizedTeamB) {
                    reviewStatus = 'reject';
                } else if (overallConfidence < 0.85 && reviewStatus !== 'update') {
                    reviewStatus = 'manual-review';
                    warnings.unshift(`Low AI confidence (${(overallConfidence * 100).toFixed(0)}%)`);
                }

                // Auto-deselect exact duplicates that aren't updates
                const shouldSelect = reviewStatus !== 'reject' && (reviewStatus === 'update' || !isDuplicate);

                // Default status logic
                let finalStatus = item.status;
                if (!finalStatus) {
                     finalStatus = isResultsImport ? 'finished' : 'scheduled';
                }

                return {
                    ...item,
                    tempId: index,
                    selected: shouldSelect,
                    status: finalStatus,
                    overallConfidence,
                    reviewStatus,
                    normalizedTeamA,
                    normalizedTeamB,
                    isDuplicate,
                    warnings,
                };
            });
            setParsedFixtures(processedData);
        } catch (err) {
            console.error(err);
            setError('AI parsing failed. Please check the format of your text or try again. ' + (err as Error).message);
        } finally {
            setIsParsing(false);
        }
    };
    
    const handleToggleSelection = (tempId: number) => {
        setParsedFixtures(prev => prev.map(f => f.tempId === tempId ? { ...f, selected: !f.selected } : f));
    };

    const handleRemoveFixture = (tempId: number) => {
        setParsedFixtures(prev => prev.filter(f => f.tempId !== tempId));
    };

    const handleSave = async () => {
        const itemsToSave = parsedFixtures.filter(f => f.selected);
        if (itemsToSave.length === 0) return setError("No items selected to save.");
        if (!matchday) return setError("Please enter a matchday number for this import.");

        setIsSaving(true);
        setError('');
        setSuccessMessage('');

        try {
            const docRef = doc(db, 'competitions', selectedComp);
            await runTransaction(db, async (transaction) => {
                const docSnap = await transaction.get(docRef);
                if (!docSnap.exists()) throw new Error("Competition not found in database.");

                const competition = docSnap.data() as Competition;
                
                // Process items to save
                const newItems = itemsToSave.map(pf => {
                     const date = new Date(`${pf.fullDate}T${pf.time || '00:00'}`);
                     const fixtureData: Partial<CompetitionFixture> = {
                        // Temporarily set a new ID, we might overwrite if updating
                        id: Date.now() + pf.tempId,
                        matchday: parseInt(matchday, 10),
                        teamA: pf.normalizedTeamA!,
                        teamB: pf.normalizedTeamB!,
                        fullDate: pf.fullDate,
                        date: date.getDate().toString(),
                        day: date.toLocaleDateString('en-US', { weekday: 'short' }).toUpperCase(),
                        time: pf.time!,
                        status: pf.status as any,
                        venue: pf.venue,
                     };
                     if (pf.status === 'finished' || pf.status === 'abandoned') {
                         if (pf.scoreA !== undefined) fixtureData.scoreA = pf.scoreA;
                         if (pf.scoreB !== undefined) fixtureData.scoreB = pf.scoreB;
                    }
                    return fixtureData as CompetitionFixture;
                });

                let existingFixtures = competition.fixtures || [];
                let existingResults = competition.results || [];

                if (importType === 'results') {
                    // Upsert Results Logic
                    newItems.forEach(newItem => {
                        const existingIndex = existingResults.findIndex(r => 
                             r.teamA === newItem.teamA && r.teamB === newItem.teamB && r.fullDate === newItem.fullDate
                        );
                        
                        if (existingIndex !== -1) {
                            // Update existing: Merge but keep ID
                            existingResults[existingIndex] = { 
                                ...existingResults[existingIndex], 
                                ...newItem, 
                                id: existingResults[existingIndex].id 
                            };
                        } else {
                            // Add new
                            existingResults.push(newItem);
                        }

                        // Remove corresponding scheduled fixture if exists
                        existingFixtures = existingFixtures.filter(f => 
                            !(f.teamA === newItem.teamA && f.teamB === newItem.teamB && f.fullDate === newItem.fullDate)
                        );
                    });
                    
                    const updatedTeams = calculateStandings(competition.teams || [], existingResults, existingFixtures);

                    transaction.update(docRef, removeUndefinedProps({
                        results: existingResults,
                        fixtures: existingFixtures,
                        teams: updatedTeams
                    }));

                } else { 
                    // Upsert Fixtures Logic
                    newItems.forEach(newItem => {
                        const existingIndex = existingFixtures.findIndex(f => 
                             f.teamA === newItem.teamA && f.teamB === newItem.teamB && f.fullDate === newItem.fullDate
                        );

                        if (existingIndex !== -1) {
                            // Update
                            existingFixtures[existingIndex] = {
                                ...existingFixtures[existingIndex],
                                ...newItem,
                                id: existingFixtures[existingIndex].id
                            };
                        } else {
                            // Add
                            existingFixtures.push(newItem);
                        }
                    });

                    transaction.update(docRef, removeUndefinedProps({
                        fixtures: existingFixtures
                    }));
                }
            });

            setSuccessMessage(`${itemsToSave.length} ${importType} processed successfully!`);
            setPastedText('');
            setParsedFixtures([]);
            setMatchday('');
        } catch(err) {
            console.error(err);
            setError('Failed to save data. ' + (err as Error).message);
        } finally {
            setIsSaving(false);
        }
    };

    const handleEditClick = (fixture: ParsedFixture) => {
        setEditingFixtureId(fixture.tempId);
        setEditedData({
            ...fixture,
            teamA: fixture.normalizedTeamA || fixture.teamA || '',
            teamB: fixture.normalizedTeamB || fixture.teamB || '',
            scoreA: fixture.scoreA != null ? String(fixture.scoreA) : '',
            scoreB: fixture.scoreB != null ? String(fixture.scoreB) : '',
        });
    };

    const handleApprove = (tempId: number) => {
        const fixtureToApprove = parsedFixtures.find(f => f.tempId === tempId);
        if (!fixtureToApprove) return;

        if (!fixtureToApprove.normalizedTeamA || !fixtureToApprove.normalizedTeamB) {
            alert("Cannot approve: One or both team names are not recognized. Please use the Edit button to select valid teams from the list first.");
            return;
        }

        const approvedFixture: ParsedFixture = {
            ...fixtureToApprove,
            reviewStatus: 'auto-publish',
            selected: true,
            warnings: ['Manually approved by user.'],
            isDuplicate: false, 
        };

        setParsedFixtures(prev => prev.map(f => f.tempId === tempId ? approvedFixture : f));
    };

    const handleEditChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setEditedData(prev => ({ ...prev, [name]: value }));
    };

    const handleCancelEdit = () => {
        setEditingFixtureId(null);
        setEditedData({});
    };
    
    const handleSaveEdit = () => {
        const fixtureToUpdate = parsedFixtures.find(f => f.tempId === editingFixtureId);
        if (!fixtureToUpdate || !currentCompetitionData) return;
    
        const officialTeamNames = (currentCompetitionData.teams || []).map(t => t.name);
    
        const updatedData: Partial<ParsedFixture> = {
            ...fixtureToUpdate,
            ...editedData,
            scoreA: (editedData.scoreA !== '' && editedData.scoreA != null) ? Number(editedData.scoreA) : undefined,
            scoreB: (editedData.scoreB !== '' && editedData.scoreB != null) ? Number(editedData.scoreB) : undefined,
        };
    
        const normalizedTeamA = normalizeTeamName(updatedData.teamA!, officialTeamNames);
        const normalizedTeamB = normalizeTeamName(updatedData.teamB!, officialTeamNames);
    
        let finalFixture: ParsedFixture;
    
        if (!normalizedTeamA || !normalizedTeamB) {
            const warnings: string[] = [];
            if (!normalizedTeamA) warnings.push(`Invalid Home Team: "${updatedData.teamA}". Please select a valid team.`);
            if (!normalizedTeamB) warnings.push(`Invalid Away Team: "${updatedData.teamB}". Please select a valid team.`);
            
            finalFixture = {
                ...updatedData as ParsedFixture,
                normalizedTeamA,
                normalizedTeamB,
                warnings,
                reviewStatus: 'reject', 
                selected: false,
            };
        } else {
            finalFixture = {
                ...updatedData as ParsedFixture,
                normalizedTeamA,
                normalizedTeamB,
                warnings: ['Manually approved by user.'], 
                reviewStatus: 'auto-publish', 
                selected: true, 
                isDuplicate: false, 
            };
        }
        
        setParsedFixtures(prev => prev.map(f => f.tempId === editingFixtureId ? finalFixture : f));
        handleCancelEdit();
    };

    const handleClearAll = () => {
        if(window.confirm("Are you sure you want to clear all items?")) {
            setParsedFixtures([]);
            setPastedText('');
            setSuccessMessage('');
            setError('');
        }
    };


    return (
        <div className="bg-gray-50 py-12">
            <div className="container mx-auto px-4 sm:px-6 lg:px-8 animate-fade-in">
                 <div className="text-center mb-12">
                    <h1 className="text-4xl md:text-5xl font-display font-extrabold text-blue-800 mb-2">
                        AI Bulk Import
                    </h1>
                    <p className="text-lg text-gray-600 max-w-3xl mx-auto">
                        Select an import type, then paste your data. The AI will parse, validate, and score the confidence of each item for your review.
                    </p>
                </div>
                
                <Card className="max-w-6xl mx-auto shadow-lg">
                    <CardContent className="p-8 space-y-6">
                        {successMessage && <div className="p-3 bg-green-100 text-green-800 rounded-md flex items-center gap-2"><CheckCircleIcon className="w-5 h-5"/>{successMessage}</div>}
                        {error && <div className="p-3 bg-red-100 text-red-800 rounded-md">{error}</div>}
                        
                        <div className="space-y-4">
                            <label className="block text-sm font-medium text-gray-700">1. Select Import Type & Destination</label>
                            <div className="flex flex-col md:flex-row gap-4">
                                <div className="flex gap-2 p-1 bg-gray-100 rounded-lg w-fit">
                                    <label className={`flex items-center gap-2 px-3 py-1.5 rounded-md cursor-pointer ${importType === 'fixtures' ? 'bg-white shadow' : ''}`}><input type="radio" name="importType" value="fixtures" checked={importType === 'fixtures'} onChange={() => setImportType('fixtures')} className="h-4 w-4" /><span className="text-sm font-semibold">Fixtures</span></label>
                                    <label className={`flex items-center gap-2 px-3 py-1.5 rounded-md cursor-pointer ${importType === 'results' ? 'bg-white shadow' : ''}`}><input type="radio" name="importType" value="results" checked={importType === 'results'} onChange={() => setImportType('results')} className="h-4 w-4" /><span className="text-sm font-semibold">Results</span></label>
                                </div>
                                {loadingComps ? <Spinner/> : <select value={selectedComp} onChange={e => setSelectedComp(e.target.value)} className="block w-full md:w-auto px-3 py-2 border border-gray-300 rounded-md shadow-sm"><option disabled>Select Competition</option>{competitions.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}</select>}
                                <input type="number" value={matchday} onChange={e => setMatchday(e.target.value)} className="block w-full md:w-40 px-3 py-2 border border-gray-300 rounded-md shadow-sm" placeholder="Matchday #" min="1" />
                            </div>
                        </div>

                        <div>
                            <label htmlFor="paste-area" className="block text-sm font-medium text-gray-700 mb-1">2. Paste Data Here</label>
                            <textarea id="paste-area" rows={6} value={pastedText} onChange={e => setPastedText(e.target.value)} className="block w-full text-sm p-3 border border-gray-300 rounded-md shadow-sm font-mono" placeholder="Example: Mbabane Highlanders vs. Manzini Wanderers - Nov 4, 3pm at Mavuso Sports Centre (Postponed)"/>
                        </div>
                        
                        <div className="text-center">
                            <Button onClick={handleParse} disabled={isParsing} className="bg-primary text-white hover:bg-primary-dark h-10 w-48 flex justify-center items-center gap-2"><SparklesIcon className="w-5 h-5" /> {isParsing ? <Spinner className="w-5 h-5 border-2"/> : '3. Parse with AI'}</Button>
                        </div>
                        
                        {parsedFixtures.length > 0 && (
                            <div className="space-y-4 pt-4 border-t">
                                <div className="flex justify-between items-center">
                                    <h3 className="text-xl font-bold font-display">4. Review and Save</h3>
                                    <Button onClick={handleClearAll} className="bg-red-100 text-red-600 hover:bg-red-200 text-xs px-3 py-1">Clear All</Button>
                                </div>
                                <div className="overflow-x-auto border rounded-lg">
                                <table className="w-full text-sm">
                                    <thead className="bg-gray-100 text-left"><tr><th className="p-2 w-12 text-center">Status</th><th className="p-2 w-12"></th><th className="p-2">Home</th><th className="p-2">Away</th><th className="p-2">Date & Time</th><th className="p-2">Venue</th><th className="p-2">Score / Status</th><th className="p-2 w-24 text-center">Actions</th></tr></thead>
                                    <tbody className="divide-y">
                                        {parsedFixtures.map(f => (
                                            f.tempId === editingFixtureId ? (
                                                <tr key={`${f.tempId}-edit`} className="bg-blue-50">
                                                    <td colSpan={8} className="p-4">
                                                        <h4 className="font-bold mb-2">Editing Match</h4>
                                                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 items-end">
                                                            <div>
                                                                <label className="text-xs font-bold">Home Team</label>
                                                                <select name="teamA" value={editedData.teamA} onChange={handleEditChange} className="block w-full text-sm p-1 border-gray-300 rounded-md"><option value="" disabled>-- Select --</option>{(currentCompetitionData?.teams || []).map(t => <option key={t.id} value={t.name}>{t.name}</option>)}</select>
                                                            </div>
                                                            <div>
                                                                <label className="text-xs font-bold">Away Team</label>
                                                                <select name="teamB" value={editedData.teamB} onChange={handleEditChange} className="block w-full text-sm p-1 border-gray-300 rounded-md"><option value="" disabled>-- Select --</option>{(currentCompetitionData?.teams || []).map(t => <option key={t.id} value={t.name}>{t.name}</option>)}</select>
                                                            </div>
                                                            {importType === 'results' && <>
                                                                <div><label className="text-xs font-bold">Home Score</label><input type="number" name="scoreA" value={editedData.scoreA} onChange={handleEditChange} className="block w-full text-sm p-1 border-gray-300 rounded-md"/></div>
                                                                <div><label className="text-xs font-bold">Away Score</label><input type="number" name="scoreB" value={editedData.scoreB} onChange={handleEditChange} className="block w-full text-sm p-1 border-gray-300 rounded-md"/></div>
                                                            </>}
                                                            <div>
                                                                <label className="text-xs font-bold">Status</label>
                                                                <select name="status" value={editedData.status} onChange={handleEditChange} className="block w-full text-sm p-1 border-gray-300 rounded-md">
                                                                    <option value="scheduled">Scheduled</option>
                                                                    <option value="finished">Finished</option>
                                                                    <option value="postponed">Postponed</option>
                                                                    <option value="cancelled">Cancelled</option>
                                                                    <option value="abandoned">Abandoned</option>
                                                                    <option value="suspended">Suspended</option>
                                                                </select>
                                                            </div>
                                                            <div><label className="text-xs font-bold">Date</label><input type="date" name="fullDate" value={editedData.fullDate} onChange={handleEditChange} className="block w-full text-sm p-1 border-gray-300 rounded-md"/></div>
                                                            <div><label className="text-xs font-bold">Time</label><input type="time" name="time" value={editedData.time} onChange={handleEditChange} className="block w-full text-sm p-1 border-gray-300 rounded-md"/></div>
                                                        </div>
                                                        <div className="flex justify-end gap-2 mt-4">
                                                            <Button onClick={handleCancelEdit} className="bg-gray-200 text-gray-800 text-xs h-8">Cancel</Button>
                                                            <Button onClick={handleSaveEdit} className="bg-green-600 text-white text-xs h-8">Save Changes</Button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ) : (
                                                <tr key={f.tempId} className={`${!f.selected ? 'bg-gray-50 text-gray-500' : 'bg-white'} ${f.status === 'error' ? 'bg-red-50' : ''}`}>
                                                    <td className="p-2 text-center"><StatusIndicator status={f.reviewStatus} warnings={f.warnings} /></td>
                                                    <td className="p-2 text-center"><input type="checkbox" checked={f.selected} onChange={() => handleToggleSelection(f.tempId)} className="h-4 w-4 rounded" disabled={f.reviewStatus === 'reject'} /></td>
                                                    <td className="p-2">{f.normalizedTeamA ? <>{f.normalizedTeamA}{f.normalizedTeamA !== f.teamA && <span className="text-xs text-gray-500 ml-1">(from: "{f.teamA}")</span>}</> : <span className="text-red-500">{f.teamA} ?</span>}</td>
                                                    <td className="p-2">{f.normalizedTeamB ? <>{f.normalizedTeamB}{f.normalizedTeamB !== f.teamB && <span className="text-xs text-gray-500 ml-1">(from: "{f.teamB}")</span>}</> : <span className="text-red-500">{f.teamB} ?</span>}</td>
                                                    <td className="p-2">{f.fullDate} @ {f.time}</td>
                                                    <td className="p-2">{f.venue || <i className="text-gray-400">Not specified</i>}</td>
                                                    <td className="p-2 font-bold">
                                                        {f.status === 'finished' ? `${f.scoreA} - ${f.scoreB}` : f.status === 'scheduled' ? 'TBD' : <span className="text-xs uppercase bg-gray-200 px-1 rounded">{f.status}</span>}
                                                    </td>
                                                    <td className="p-2 text-center">
                                                        <div className="flex justify-center gap-1">
                                                            <Button onClick={() => handleEditClick(f)} className="bg-gray-200 text-gray-700 h-7 w-7 p-0 flex items-center justify-center" title="Edit" type="button"><PencilIcon className="w-4 h-4"/></Button>
                                                            {f.reviewStatus !== 'auto-publish' && f.reviewStatus !== 'update' && (
                                                                <Button onClick={() => handleApprove(f.tempId)} className="bg-green-100 text-green-700 hover:bg-green-200 h-7 w-7 p-0 flex items-center justify-center" title="Manually Approve" type="button"><CheckCircleIcon className="w-4 h-4" /></Button>
                                                            )}
                                                            <Button 
                                                                onClick={(e) => { 
                                                                    e.stopPropagation(); 
                                                                    handleRemoveFixture(f.tempId); 
                                                                }} 
                                                                className="bg-red-100 text-red-600 hover:bg-red-200 h-7 w-7 p-0 flex items-center justify-center" 
                                                                title="Remove" 
                                                                type="button"
                                                            >
                                                                <TrashIcon className="w-4 h-4" />
                                                            </Button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            )
                                        ))}
                                    </tbody>
                                </table>
                                </div>
                                <div className="text-right">
                                    <Button onClick={handleSave} disabled={isSaving || parsedFixtures.filter(f => f.selected).length === 0} className="bg-green-600 text-white h-10 w-48 flex justify-center items-center">{isSaving ? <Spinner className="w-5 h-5 border-2"/> : `Save Selected (${parsedFixtures.filter(f => f.selected).length})`}</Button>
                                </div>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
};

export default BulkImportFixtures;
