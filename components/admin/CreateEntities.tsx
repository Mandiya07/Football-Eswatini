
import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '../ui/Card';
import Button from '../ui/Button';
import { db } from '../../services/firebase';
import { doc, setDoc, updateDoc, getDoc, arrayUnion } from 'firebase/firestore';
import { CompetitionFixture } from '../../data/teams';
import Spinner from '../ui/Spinner';
// FIX: Import 'fetchCategories' which is now correctly exported from the API service.
import { fetchCategories, Category, handleFirestoreError } from '../../services/api';

const CreateEntities: React.FC = () => {
    const [leagueName, setLeagueName] = useState('');
    const [externalApiId, setExternalApiId] = useState('');
    const [seasonYear, setSeasonYear] = useState('');
    const [fixture, setFixture] = useState({ home: '', away: '', date: '' });
    const [submitting, setSubmitting] = useState<string | null>(null);
    const [categories, setCategories] = useState<Category[]>([]);
    const [selectedCategory, setSelectedCategory] = useState('');

    useEffect(() => {
        const loadCategories = async () => {
            const cats = await fetchCategories();
            setCategories(cats);
            if (cats.length > 0) {
                setSelectedCategory(cats[0].id);
            }
        };
        loadCategories();
    }, []);


    const handleSubmit = (type: 'league' | 'season' | 'fixture', data: any) => async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(type);
        try {
            switch(type) {
                case 'league':
                    // Sanitize ID: lowercase, replace spaces with dashes, remove everything else except dashes and alphanumeric
                    const leagueId = data.leagueName.toLowerCase()
                        .replace(/\s+/g, '-')
                        .replace(/[^a-z0-9-]/g, '');
                        
                    await setDoc(doc(db, "competitions", leagueId), {
                        name: data.leagueName,
                        teams: [],
                        fixtures: [],
                        results: [],
                        categoryId: data.categoryId,
                        externalApiId: data.externalApiId || null,
                    });
                    setLeagueName('');
                    setExternalApiId('');
                    break;
                case 'fixture':
                    // For simplicity, this adds to premier-league. A real app would need a league selector.
                    const competitionId = 'mtn-premier-league';
                    const docRef = doc(db, 'competitions', competitionId);
                    const matchDate = new Date(data.date);
                    const newFixture: CompetitionFixture = {
                        id: Date.now(),
                        teamA: data.home,
                        teamB: data.away,
                        fullDate: matchDate.toISOString().split('T')[0],
                        date: matchDate.getDate().toString(),
                        day: matchDate.toLocaleDateString('en-US', { weekday: 'short' }).toUpperCase(),
                        time: matchDate.toTimeString().substring(0, 5),
                        status: 'scheduled'
                    };
                    await updateDoc(docRef, {
                        fixtures: arrayUnion(newFixture)
                    });
                    setFixture({ home: '', away: '', date: '' });
                    break;
                case 'season':
                     console.log(`Creating new ${type}:`, data);
                     // This is a complex operation (archiving old data, resetting stats)
                     // and is beyond the scope of a simple form.
                     alert("'Create Season' is a placeholder for a more complex workflow.");
                     setSeasonYear('');
                     break;
            }
            alert(`${type.charAt(0).toUpperCase() + type.slice(1)} created successfully!`);
        } catch (error) {
            handleFirestoreError(error, `create ${type}`);
        } finally {
            setSubmitting(null);
        }
    };
    
    const inputClass = "block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm";
    const labelClass = "block text-sm font-medium text-gray-700 mb-1";

    return (
        <div className="space-y-8 animate-fade-in">
            <Card className="shadow-lg">
                <CardContent className="p-6">
                    <h3 className="text-2xl font-bold font-display mb-1">Create New League</h3>
                    <p className="text-sm text-gray-600 mb-4">Add a new competition to the system.</p>
                    <form onSubmit={handleSubmit('league', { leagueName, externalApiId, categoryId: selectedCategory })} className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label htmlFor="leagueName" className={labelClass}>League Name</label>
                                <input type="text" id="leagueName" value={leagueName} onChange={e => setLeagueName(e.target.value)} required className={inputClass} placeholder="e.g., Women's Super League" />
                            </div>
                            <div>
                                <label htmlFor="category" className={labelClass}>Category</label>
                                <select id="category" value={selectedCategory} onChange={e => setSelectedCategory(e.target.value)} className={inputClass}>
                                    {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                </select>
                            </div>
                        </div>
                        <div>
                            <label htmlFor="externalApiId" className={labelClass}>External API ID (Optional)</label>
                            <input type="text" id="externalApiId" value={externalApiId} onChange={e => setExternalApiId(e.target.value)} className={inputClass} placeholder="e.g., 2021 (football-data) or 4328 (thesportsdb)" />
                            <p className="text-xs text-gray-500 mt-1">
                                Link competition data from external APIs (Football-Data.org or TheSportsDB) to enable automatic imports.
                            </p>
                        </div>
                        <div className="text-right">
                             <Button type="submit" className="bg-primary text-white hover:bg-primary-dark h-11 w-36 flex justify-center items-center" disabled={submitting === 'league'}>
                                {submitting === 'league' ? <Spinner className="w-5 h-5 border-2" /> : 'Create League'}
                            </Button>
                        </div>
                    </form>
                </CardContent>
            </Card>

            <Card className="shadow-lg">
                <CardContent className="p-6">
                    <h3 className="text-2xl font-bold font-display mb-1">Create New Season</h3>
                    <p className="text-sm text-gray-600 mb-4">Archive existing data and start a new season.</p>
                    <form onSubmit={handleSubmit('season', { seasonYear })} className="space-y-4">
                        <div>
                            <label htmlFor="seasonYear" className={labelClass}>Season Year</label>
                            <input type="text" id="seasonYear" value={seasonYear} onChange={e => setSeasonYear(e.target.value)} required className={inputClass} placeholder="e.g., 2024/2025" />
                        </div>
                        <div className="text-right">
                            <Button type="submit" className="bg-primary text-white hover:bg-primary-dark h-11 w-36 flex justify-center items-center" disabled={submitting === 'season'}>
                                {submitting === 'season' ? <Spinner className="w-5 h-5 border-2" /> : 'Create Season'}
                            </Button>
                        </div>
                    </form>
                </CardContent>
            </Card>

            <Card className="shadow-lg">
                <CardContent className="p-6">
                    <h3 className="text-2xl font-bold font-display mb-1">Add Single Fixture</h3>
                    <p className="text-sm text-gray-600 mb-4">Quickly add a one-off fixture to the Premier League.</p>
                    <form onSubmit={handleSubmit('fixture', fixture)} className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div>
                                <label htmlFor="home" className={labelClass}>Home Team</label>
                                <input type="text" id="home" value={fixture.home} onChange={e => setFixture({...fixture, home: e.target.value})} required className={inputClass} />
                            </div>
                            <div>
                                <label htmlFor="away" className={labelClass}>Away Team</label>
                                <input type="text" id="away" value={fixture.away} onChange={e => setFixture({...fixture, away: e.target.value})} required className={inputClass} />
                            </div>
                            <div>
                                <label htmlFor="date" className={labelClass}>Date & Time</label>
                                <input type="datetime-local" id="date" value={fixture.date} onChange={e => setFixture({...fixture, date: e.target.value})} required className={inputClass} />
                            </div>
                        </div>
                        <div className="text-right">
                            <Button type="submit" className="bg-primary text-white hover:bg-primary-dark h-11 w-36 flex justify-center items-center" disabled={submitting === 'fixture'}>
                                {submitting === 'fixture' ? <Spinner className="w-5 h-5 border-2" /> : 'Add Fixture'}
                            </Button>
                        </div>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
};

export default CreateEntities;
