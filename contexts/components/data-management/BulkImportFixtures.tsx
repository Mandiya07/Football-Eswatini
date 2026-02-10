
import React, { useState, useEffect, useRef } from 'react';
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
import FileIcon from '../icons/FileIcon';
import ImageIcon from '../icons/ImageIcon';
// Add missing import for CloudDownloadIcon
import CloudDownloadIcon from '../icons/CloudDownloadIcon';
import { Competition, CompetitionFixture, Team } from '../../data/teams';

interface ParsedFixture extends Omit<Partial<CompetitionFixture>, 'status'> {
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
    status?: CompetitionFixture['status'] | 'error';
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
            <div className="absolute bottom-full mb-2 w-max max-w-xs bg-gray-800 text-white text-xs rounded py-1 px-2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10 text-center">
                {tooltipText}
                 <div className="absolute top-full left-1/2 -translate-x-1/2 w-0 h-0 border-x-4 border-x-transparent border-t-4 border-t-gray-800"></div>
            </div>
        </div>
    );
};

const BulkImportFixtures: React.FC = () => {
    const [pastedText, setPastedText] = useState('');
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [fileBase64, setFileBase64] = useState<string | null>(null);
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

    const fileInputRef = useRef<HTMLInputElement>(null);

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

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            setSelectedFile(file);
            const reader = new FileReader();
            reader.onloadend = () => {
                if (typeof reader.result === 'string') {
                    // Extract base64 without prefix
                    const base64 = reader.result.split(',')[1];
                    setFileBase64(base64);
                }
            };
            reader.readAsDataURL(file);
        }
    };

    const handleParse = async () => {
        if (!pastedText.trim() && !fileBase64) return setError('Please paste some text or upload a document to parse.');
        if (!currentCompetitionData) return setError('Please select a valid competition.');
        
        if (!process.env.API_KEY) {
            return setError('System Error: API_KEY is not configured.');
        }
        
        setIsParsing(true);
        setError('');
        setParsedFixtures([]);
        
        const isResultsImport = importType === 'results';
        const officialTeamNames = (currentCompetitionData.teams || []).map(t => t.name);
        const existingMatches = [...(currentCompetitionData.fixtures || []), ...(currentCompetitionData.results || [])];

        const prompt = `You are an expert sports data parser for Football Eswatini. 
        ${fileBase64 ? "Analyze the provided document/image and extract" : "Analyze the following text containing"} football ${isResultsImport ? '**result**' : '**fixture**'} information. 
        Extract the details for each match and return it as a JSON array. 
        
        GUIDELINES:
        - The 'status' should be '${isResultsImport ? 'finished' : 'scheduled'}', but can also be 'postponed', 'cancelled', 'abandoned', or 'suspended' if indicated.
        - ${isResultsImport ? "'scoreA' and 'scoreB' are REQUIRED for finished matches." : "'scoreA' and 'scoreB' MUST be null or omitted."}
        - Extract 'venue' if mentioned.
        - 'fullDate' must be in 'YYYY-MM-DD' format. Assume year ${new Date().getFullYear()} if missing.
        - 'time' should be in 'HH:MM' (24h).
        - For each field, provide a confidence score (0-1) in a 'confidenceScores' object.

        ${pastedText ? `Text context: ${pastedText}` : ""}`;

        const responseSchema = {
            type: Type.ARRAY,
            items: {
                type: Type.OBJECT,
                properties: {
                    teamA: { type: Type.STRING },
                    teamB: { type: Type.STRING },
                    fullDate: { type: Type.STRING },
                    time: { type: Type.STRING },
                    scoreA: { type: Type.NUMBER },
                    scoreB: { type: Type.NUMBER },
                    status: { type: Type.STRING, enum: ['scheduled', 'finished', 'postponed', 'cancelled', 'abandoned', 'suspended'] },
                    venue: { type: Type.STRING },
                    confidenceScores: {
                        type: Type.OBJECT,
                        properties: {
                            teamA: { type: Type.NUMBER }, teamB: { type: Type.NUMBER }, fullDate: { type: Type.NUMBER },
                            time: { type: Type.NUMBER }, scoreA: { type: Type.NUMBER }, scoreB: { type: Type.NUMBER },
                            venue: { type: Type.NUMBER }, status: { type: Type.NUMBER }
                        }
                    }
                },
                required: ['teamA', 'teamB', 'fullDate']
            }
        };

        try {
            const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
            
            const contents = fileBase64 ? {
                parts: [
                    { inlineData: { data: fileBase64, mimeType: selectedFile!.type } },
                    { text: prompt }
                ]
            } : prompt;

            const response = await ai.models.generateContent({ 
                model: 'gemini-3-flash-preview', 
                contents: contents, 
                config: { responseMimeType: 'application/json', responseSchema } 
            });

            const parsedData = JSON.parse(response.text || '[]');

            const processedData: ParsedFixture[] = parsedData.map((item: any, index: number) => {
                const scores = Object.values(item.confidenceScores || {}).map(v => typeof v === 'number' ? v : 0.3);
                const overallConfidence = scores.length > 0 ? scores.reduce((a, b) => a + b, 0) / scores.length : 0.5;
                const warnings: string[] = [];

                const normalizedTeamA = normalizeTeamName(item.teamA, officialTeamNames);
                const normalizedTeamB = normalizeTeamName(item.teamB, officialTeamNames);
                if (!normalizedTeamA) warnings.push(`Could not match Home Team: "${item.teamA}"`);
                if (!normalizedTeamB) warnings.push(`Could not match Away Team: "${item.teamB}"`);

                const existingMatch = existingMatches.find(f => 
                    f.fullDate === item.fullDate && 
                    f.teamA === normalizedTeamA && 
                    f.teamB === normalizedTeamB
                );
                
                const isDuplicate = !!existingMatch;
                let reviewStatus: ParsedFixture['reviewStatus'] = 'auto-publish';

                if (isDuplicate && existingMatch) {
                    const timeImproved = (existingMatch.time === '00:00' && item.time !== '00:00') || (!existingMatch.time && !!item.time);
                    const venueImproved = (!existingMatch.venue && !!item.venue);
                    const statusUpdated = existingMatch.status !== 'finished' && item.status === 'finished';
                    
                    if (timeImproved || venueImproved || statusUpdated) {
                        reviewStatus = 'update';
                    } else {
                         reviewStatus = 'manual-review';
                         warnings.push("Exact duplicate found.");
                    }
                }

                if (overallConfidence < 0.5 || !normalizedTeamA || !normalizedTeamB) {
                    reviewStatus = 'reject';
                } else if (overallConfidence < 0.85 && reviewStatus !== 'update') {
                    reviewStatus = 'manual-review';
                    warnings.unshift(`Low AI confidence (${(overallConfidence * 100).toFixed(0)}%)`);
                }

                const shouldSelect = reviewStatus !== 'reject' && (reviewStatus === 'update' || !isDuplicate);
                let finalStatus = item.status || (isResultsImport ? 'finished' : 'scheduled');

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
            setError('AI extraction failed. ' + (err as Error).message);
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
                if (!docSnap.exists()) throw new Error("Competition not found.");

                const competition = docSnap.data() as Competition;
                
                const newItems = itemsToSave.map(pf => {
                     const date = new Date(`${pf.fullDate}T${pf.time || '00:00'}`);
                     const fixtureData: Partial<CompetitionFixture> = {
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
                    newItems.forEach(newItem => {
                        const existingIndex = existingResults.findIndex(r => 
                            r.teamA === newItem.teamA && r.teamB === newItem.teamB && r.fullDate === newItem.fullDate
                        );
                        
                        if (existingIndex !== -1) {
                            existingResults[existingIndex] = { 
                                ...existingResults[existingIndex], 
                                ...newItem, 
                                id: existingResults[existingIndex].id 
                            };
                        } else {
                            existingResults.push(newItem);
                        }

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
                    newItems.forEach(newItem => {
                        const existingIndex = existingFixtures.findIndex(f => 
                             f.teamA === newItem.teamA && f.teamB === newItem.teamB && f.fullDate === newItem.fullDate
                        );

                        if (existingIndex !== -1) {
                            existingFixtures[existingIndex] = {
                                ...existingFixtures[existingIndex],
                                ...newItem,
                                id: existingFixtures[existingIndex].id
                            };
                        } else {
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
            setSelectedFile(null);
            setFileBase64(null);
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
            alert("Cannot approve: Team names are not recognized. Please Edit and select valid teams.");
            return;
        }

        const approvedFixture: ParsedFixture = {
            ...fixtureToApprove,
            reviewStatus: 'auto-publish',
            selected: true,
            warnings: ['Manually approved.'],
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
            finalFixture = {
                ...updatedData as ParsedFixture,
                normalizedTeamA,
                normalizedTeamB,
                warnings: ["Selection Required"],
                reviewStatus: 'reject', 
                selected: false,
            };
        } else {
            finalFixture = {
                ...updatedData as ParsedFixture,
                normalizedTeamA,
                normalizedTeamB,
                warnings: ['Manually approved.'], 
                reviewStatus: 'auto-publish', 
                selected: true, 
                isDuplicate: false, 
            };
        }
        
        setParsedFixtures(prev => prev.map(f => f.tempId === editingFixtureId ? finalFixture : f));
        handleCancelEdit();
    };

    const handleClearAll = () => {
        if(window.confirm("Clear all items?")) {
            setParsedFixtures([]);
            setPastedText('');
            setSelectedFile(null);
            setFileBase64(null);
            setSuccessMessage('');
            setError('');
        }
    };

    return (
        <div className="bg-gray-50 py-12">
            <div className="container mx-auto px-4 sm:px-6 lg:px-8 animate-fade-in">
                 <div className="text-center mb-12">
                    <h1 className="text-4xl md:text-5xl font-display font-black text-blue-800 mb-2">
                        AI Bulk Importer
                    </h1>
                    <p className="text-lg text-gray-600 max-w-3xl mx-auto">
                        Extract fixtures and results from <strong>text, images, or PDF documents</strong> using high-performance multimodal AI.
                    </p>
                </div>
                
                <Card className="max-w-6xl mx-auto shadow-lg">
                    <CardContent className="p-8 space-y-6">
                        {successMessage && <div className="p-3 bg-green-100 text-green-800 rounded-md flex items-center gap-2"><CheckCircleIcon className="w-5 h-5"/>{successMessage}</div>}
                        {error && <div className="p-3 bg-red-100 text-red-800 rounded-md">{error}</div>}
                        
                        <div className="space-y-4">
                            <label className="block text-sm font-bold text-gray-700 uppercase tracking-widest">1. Data Configuration</label>
                            <div className="flex flex-col md:flex-row gap-4 bg-gray-50 p-4 rounded-2xl border border-gray-100">
                                <div className="flex gap-2 p-1 bg-white border rounded-xl w-fit shadow-sm">
                                    <label className={`flex items-center gap-2 px-4 py-2 rounded-lg cursor-pointer transition-all ${importType === 'fixtures' ? 'bg-primary text-white shadow-md' : 'text-gray-500'}`}><input type="radio" name="importType" value="fixtures" checked={importType === 'fixtures'} onChange={() => setImportType('fixtures')} className="sr-only" /><span className="text-sm font-bold uppercase tracking-tight">Fixtures</span></label>
                                    <label className={`flex items-center gap-2 px-4 py-2 rounded-lg cursor-pointer transition-all ${importType === 'results' ? 'bg-primary text-white shadow-md' : 'text-gray-500'}`}><input type="radio" name="importType" value="results" checked={importType === 'results'} onChange={() => setImportType('results')} className="sr-only" /><span className="text-sm font-bold uppercase tracking-tight">Results</span></label>
                                </div>
                                {loadingComps ? <Spinner/> : (
                                    <select value={selectedComp} onChange={e => setSelectedComp(e.target.value)} className="block w-full md:w-auto px-4 py-2 border border-gray-300 rounded-xl shadow-sm focus:ring-2 focus:ring-primary">
                                        <option disabled>Select Destination Hub</option>
                                        {competitions.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                    </select>
                                )}
                                <input type="number" value={matchday} onChange={e => setMatchday(e.target.value)} className="block w-full md:w-40 px-4 py-2 border border-gray-300 rounded-xl shadow-sm focus:ring-2 focus:ring-primary" placeholder="Matchday #" min="1" />
                            </div>
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                            <div className="space-y-3">
                                <label htmlFor="paste-area" className="block text-sm font-bold text-gray-700 uppercase tracking-widest">2a. Raw Text Feed</label>
                                <textarea id="paste-area" rows={6} value={pastedText} onChange={e => setPastedText(e.target.value)} className="block w-full text-sm p-4 border border-gray-200 rounded-2xl shadow-inner font-mono bg-gray-50 focus:bg-white transition-colors" placeholder="Paste match details here..."/>
                            </div>
                            <div className="space-y-3">
                                <label className="block text-sm font-bold text-gray-700 uppercase tracking-widest">2b. Document / Image Input</label>
                                <div 
                                    onClick={() => fileInputRef.current?.click()}
                                    className={`relative flex flex-col items-center justify-center border-4 border-dashed rounded-[2rem] p-8 transition-all cursor-pointer group ${selectedFile ? 'bg-blue-50 border-blue-400' : 'bg-gray-50 border-gray-200 hover:border-primary hover:bg-white'}`}
                                >
                                    <input type="file" ref={fileInputRef} onChange={handleFileChange} accept="application/pdf,image/*" className="hidden" />
                                    {selectedFile ? (
                                        <div className="text-center animate-in zoom-in duration-300">
                                            <div className="bg-blue-600 p-4 rounded-3xl shadow-xl mb-4 mx-auto w-fit">
                                                {selectedFile.type.includes('image') ? <ImageIcon className="w-10 h-10 text-white" /> : <FileIcon className="w-10 h-10 text-white" />}
                                            </div>
                                            <p className="font-bold text-blue-900 truncate max-w-[200px]">{selectedFile.name}</p>
                                            <p className="text-[10px] font-black text-blue-500 uppercase mt-1">Ready for AI processing</p>
                                            <button 
                                                onClick={(e) => { e.stopPropagation(); setSelectedFile(null); setFileBase64(null); }}
                                                className="mt-4 text-[10px] font-black text-red-600 uppercase hover:underline"
                                            >Remove File</button>
                                        </div>
                                    ) : (
                                        <div className="text-center">
                                            <div className="bg-white p-4 rounded-3xl shadow-sm mb-4 border border-gray-100 group-hover:scale-110 transition-transform">
                                                <CloudDownloadIcon className="w-10 h-10 text-gray-300" />
                                            </div>
                                            <p className="font-bold text-gray-400 group-hover:text-primary">Upload PDF or Photo</p>
                                            <p className="text-[10px] font-black text-gray-300 uppercase mt-1">Multi-modal AI Extraction</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                        
                        <div className="text-center pt-4">
                            <Button 
                                onClick={handleParse} 
                                disabled={isParsing} 
                                className="bg-primary text-white hover:bg-primary-dark h-14 w-full md:w-72 flex justify-center items-center gap-3 rounded-2xl shadow-xl font-black uppercase tracking-widest text-xs active:scale-95 transition-all"
                            >
                                {isParsing ? <Spinner className="w-5 h-5 border-white border-2"/> : <><SparklesIcon className="w-5 h-5 text-accent" /> Perform AI Extraction</>}
                            </Button>
                        </div>
                        
                        {parsedFixtures.length > 0 && (
                            <div className="space-y-6 pt-10 border-t border-gray-100 animate-fade-in">
                                <div className="flex justify-between items-center">
                                    <div>
                                        <h3 className="text-2xl font-black font-display uppercase tracking-tight">Review & Refine</h3>
                                        <p className="text-sm text-gray-500">Extracted {parsedFixtures.length} items. Please verify team names.</p>
                                    </div>
                                    <Button onClick={handleClearAll} className="bg-red-50 text-red-600 hover:bg-red-100 font-bold px-4 h-9 rounded-xl border border-red-100">Clear Workspace</Button>
                                </div>

                                <div className="overflow-x-auto border border-gray-200 rounded-[2.5rem] bg-white shadow-inner">
                                <table className="w-full text-sm">
                                    <thead className="bg-gray-50 text-left text-[10px] font-black uppercase tracking-widest text-gray-400 border-b">
                                        <tr>
                                            <th className="p-4 w-12 text-center">AI</th>
                                            <th className="p-4 w-12"><input type="checkbox" checked={parsedFixtures.every(f => f.selected)} onChange={e => setParsedFixtures(prev => prev.map(f => ({ ...f, selected: e.target.checked && f.status !== 'error' })))} className="h-4 w-4" /></th>
                                            <th className="p-4">Matchup</th>
                                            <th className="p-4">Schedule</th>
                                            <th className="p-4">Venue</th>
                                            <th className="p-4">Score/Type</th>
                                            <th className="p-4 w-24 text-center">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100">
                                        {parsedFixtures.map(f => (
                                            f.tempId === editingFixtureId ? (
                                                <tr key={`${f.tempId}-edit`} className="bg-blue-50/50">
                                                    <td colSpan={8} className="p-6">
                                                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 items-end bg-white p-6 rounded-3xl border border-blue-200 shadow-sm">
                                                            <div>
                                                                <label className="text-[10px] font-black text-gray-400 uppercase">Home Team</label>
                                                                <select name="teamA" value={editedData.teamA} onChange={handleEditChange} className="block w-full text-sm p-2 border rounded-xl">
                                                                    <option value="" disabled>-- Select --</option>
                                                                    {(currentCompetitionData?.teams || []).map(t => <option key={t.id} value={t.name}>{t.name}</option>)}
                                                                </select>
                                                            </div>
                                                            <div>
                                                                <label className="text-[10px] font-black text-gray-400 uppercase">Away Team</label>
                                                                <select name="teamB" value={editedData.teamB} onChange={handleEditChange} className="block w-full text-sm p-2 border rounded-xl">
                                                                    <option value="" disabled>-- Select --</option>
                                                                    {(currentCompetitionData?.teams || []).map(t => <option key={t.id} value={t.name}>{t.name}</option>)}
                                                                </select>
                                                            </div>
                                                            {importType === 'results' && <>
                                                                <div><label className="text-[10px] font-black text-gray-400 uppercase">H Score</label><input type="number" name="scoreA" value={editedData.scoreA} onChange={handleEditChange} className="block w-full text-sm p-2 border rounded-xl"/></div>
                                                                <div><label className="text-[10px] font-black text-gray-400 uppercase">A Score</label><input type="number" name="scoreB" value={editedData.scoreB} onChange={handleEditChange} className="block w-full text-sm p-2 border rounded-xl"/></div>
                                                            </>}
                                                            <div>
                                                                <label className="text-[10px] font-black text-gray-400 uppercase">Status</label>
                                                                <select name="status" value={editedData.status} onChange={handleEditChange} className="block w-full text-sm p-2 border rounded-xl">
                                                                    <option value="scheduled">Scheduled</option>
                                                                    <option value="finished">Finished</option>
                                                                    <option value="postponed">Postponed</option>
                                                                    <option value="cancelled">Cancelled</option>
                                                                </select>
                                                            </div>
                                                            <div><label className="text-[10px] font-black text-gray-400 uppercase">Date</label><input type="date" name="fullDate" value={editedData.fullDate} onChange={handleEditChange} className="block w-full text-sm p-2 border rounded-xl"/></div>
                                                            <div><label className="text-[10px] font-black text-gray-400 uppercase">Time</label><input type="time" name="time" value={editedData.time} onChange={handleEditChange} className="block w-full text-sm p-2 border rounded-xl"/></div>
                                                        </div>
                                                        <div className="flex justify-end gap-3 mt-4">
                                                            <Button onClick={handleCancelEdit} className="bg-gray-200 text-gray-800 text-xs h-9 px-6 rounded-xl font-bold">Cancel</Button>
                                                            <Button onClick={handleSaveEdit} className="bg-primary text-white text-xs h-9 px-8 rounded-xl font-black uppercase tracking-widest">Update AI Entry</Button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ) : (
                                                <tr key={f.tempId} className={`${!f.selected ? 'bg-gray-50/50 grayscale opacity-40' : 'hover:bg-gray-50/50'} transition-all`}>
                                                    <td className="p-4 text-center"><StatusIndicator status={f.reviewStatus} warnings={f.warnings} /></td>
                                                    <td className="p-4 text-center"><input type="checkbox" checked={f.selected} onChange={() => handleToggleSelection(f.tempId)} className="h-4 w-4 rounded" disabled={f.reviewStatus === 'reject'} /></td>
                                                    <td className="p-4">
                                                        <div className="flex flex-col font-bold text-gray-900 leading-tight">
                                                            <span className={!f.normalizedTeamA ? 'text-red-500' : ''}>{f.normalizedTeamA || f.teamA}</span>
                                                            <span className="text-[9px] text-gray-300 my-0.5 uppercase tracking-tighter">VS</span>
                                                            <span className={!f.normalizedTeamB ? 'text-red-500' : ''}>{f.normalizedTeamB || f.teamB}</span>
                                                        </div>
                                                        {f.isDuplicate && !f.warnings.includes("update") && <span className="text-[8px] font-black text-orange-500 uppercase mt-1 block">Possible Duplicate</span>}
                                                    </td>
                                                    <td className="p-4 text-xs font-semibold text-gray-600">
                                                        <div>{f.fullDate}</div>
                                                        <div className="opacity-50">{f.time}</div>
                                                    </td>
                                                    <td className="p-4 text-xs text-gray-500 truncate max-w-[150px]">{f.venue || '-'}</td>
                                                    <td className="p-4 text-center font-black">
                                                        {f.status === 'finished' ? (
                                                            <div className="bg-green-50 text-green-700 px-2 py-1 rounded-lg border border-green-100">{f.scoreA} : {f.scoreB}</div>
                                                        ) : <span className="text-gray-300 uppercase text-[10px]">TBD</span>}
                                                    </td>
                                                    <td className="p-4">
                                                        <div className="flex justify-center gap-1">
                                                            <Button onClick={() => handleEditClick(f)} className="bg-gray-100 text-gray-600 h-8 w-8 p-0 flex items-center justify-center rounded-lg border hover:bg-blue-600 hover:text-white transition-all"><PencilIcon className="w-4 h-4"/></Button>
                                                            {f.reviewStatus !== 'auto-publish' && f.reviewStatus !== 'update' && f.normalizedTeamA && f.normalizedTeamB && (
                                                                <Button onClick={() => handleApprove(f.tempId)} className="bg-green-100 text-green-700 h-8 w-8 p-0 flex items-center justify-center rounded-lg border border-green-200" title="Manually Approve"><CheckCircleIcon className="w-4 h-4" /></Button>
                                                            )}
                                                            <Button onClick={() => handleRemoveFixture(f.tempId)} className="bg-red-50 text-red-600 h-8 w-8 p-0 flex items-center justify-center rounded-lg border border-red-100 hover:bg-red-600 hover:text-white transition-all"><TrashIcon className="w-4 h-4" /></Button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            )
                                        ))}
                                    </tbody>
                                </table>
                                </div>
                                <div className="flex justify-end pt-4">
                                    <Button onClick={handleSave} disabled={isSaving || parsedFixtures.filter(f => f.selected).length === 0} className="bg-green-600 text-white h-14 px-12 rounded-2xl shadow-xl font-black uppercase tracking-widest text-xs">
                                        {isSaving ? <Spinner className="w-5 h-5 border-white border-2"/> : `Save Selected Hub Records (${parsedFixtures.filter(f => f.selected).length})`}
                                    </Button>
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
