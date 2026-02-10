
import React, { useState, useEffect } from 'react';
import { fetchAllCompetitions, handleFirestoreError } from '../../services/api';
import { Team, Competition } from '../../data/teams';
import { Card, CardContent } from '../ui/Card';
import Button from '../ui/Button';
import Spinner from '../ui/Spinner';
import { db } from '../../services/firebase';
import { doc, updateDoc, getDoc } from 'firebase/firestore';
import { removeUndefinedProps } from '../../services/utils';
import SaveIcon from '../icons/SaveIcon';
import RefreshIcon from '../icons/RefreshIcon';

const ManualStandings: React.FC = () => {
    const [leagues, setLeagues] = useState<{ id: string, name: string }[]>([]);
    const [selectedLeague, setSelectedLeague] = useState('');
    const [teams, setTeams] = useState<Team[]>([]);
    const [loading, setLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        const loadLeagues = async () => {
            setLoading(true);
            try {
                const allData = await fetchAllCompetitions();
                const list = Object.entries(allData)
                    .filter(([_, comp]) => comp && comp.name)
                    .map(([id, comp]) => ({ id, name: comp.name! }));
                setLeagues(list.sort((a, b) => a.name.localeCompare(b.name)));
                if (list.length > 0) setSelectedLeague(list[0].id);
            } catch (e) {
                console.error(e);
            } finally {
                setLoading(false);
            }
        };
        loadLeagues();
    }, []);

    useEffect(() => {
        if (!selectedLeague) return;
        const loadTeams = async () => {
            setLoading(true);
            try {
                const docRef = doc(db, 'competitions', selectedLeague);
                const snap = await getDoc(docRef);
                if (snap.exists()) {
                    const data = snap.data() as Competition;
                    setTeams(data.teams || []);
                }
            } catch (e) {
                console.error(e);
            } finally {
                setLoading(false);
            }
        };
        loadTeams();
    }, [selectedLeague]);

    const handleStatChange = (teamId: number, field: keyof Team['stats'], value: string) => {
        const numValue = parseInt(value, 10) || 0;
        setTeams(prev => prev.map(t => {
            if (t.id === teamId) {
                return {
                    ...t,
                    stats: { ...t.stats, [field]: numValue }
                };
            }
            return t;
        }));
    };

    const handleFormChange = (teamId: number, value: string) => {
        setTeams(prev => prev.map(t => {
            if (t.id === teamId) {
                return {
                    ...t,
                    stats: { ...t.stats, form: value }
                };
            }
            return t;
        }));
    };

    const handleSave = async () => {
        if (!selectedLeague) return;
        setIsSaving(true);
        try {
            const docRef = doc(db, 'competitions', selectedLeague);
            await updateDoc(docRef, {
                teams: removeUndefinedProps(teams)
            });
            alert("Standings updated successfully!");
        } catch (error) {
            handleFirestoreError(error, 'manual standings update');
        } finally {
            setIsSaving(false);
        }
    };

    const inputClass = "w-14 text-center border border-gray-300 rounded p-1 text-xs focus:ring-1 focus:ring-primary outline-none";

    return (
        <Card className="shadow-lg animate-fade-in">
            <CardContent className="p-6">
                <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
                    <div>
                        <h3 className="text-2xl font-bold font-display">Manual Standings Override</h3>
                        <p className="text-sm text-gray-500">Manually adjust team statistics for the current league table.</p>
                    </div>
                    <select 
                        value={selectedLeague} 
                        onChange={e => setSelectedLeague(e.target.value)}
                        className="border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/20"
                    >
                        {leagues.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
                    </select>
                </div>

                {loading ? <div className="flex justify-center py-10"><Spinner /></div> : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead className="bg-gray-50 text-[10px] font-black uppercase text-gray-400 border-b">
                                <tr>
                                    <th className="px-2 py-3 text-left">Team</th>
                                    <th className="px-1 py-3 text-center">P</th>
                                    <th className="px-1 py-3 text-center">W</th>
                                    <th className="px-1 py-3 text-center">D</th>
                                    <th className="px-1 py-3 text-center">L</th>
                                    <th className="px-1 py-3 text-center">GF</th>
                                    <th className="px-1 py-3 text-center">GA</th>
                                    <th className="px-1 py-3 text-center">Pts</th>
                                    <th className="px-2 py-3 text-left">Form (e.g. W D L)</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y">
                                {teams.map(team => (
                                    <tr key={team.id} className="hover:bg-gray-50/50">
                                        <td className="px-2 py-2 font-bold text-gray-800">{team.name}</td>
                                        <td className="px-1 py-2 text-center"><input type="number" value={team.stats.p} onChange={e => handleStatChange(team.id, 'p', e.target.value)} className={inputClass} /></td>
                                        <td className="px-1 py-2 text-center"><input type="number" value={team.stats.w} onChange={e => handleStatChange(team.id, 'w', e.target.value)} className={inputClass} /></td>
                                        <td className="px-1 py-2 text-center"><input type="number" value={team.stats.d} onChange={e => handleStatChange(team.id, 'd', e.target.value)} className={inputClass} /></td>
                                        <td className="px-1 py-2 text-center"><input type="number" value={team.stats.l} onChange={e => handleStatChange(team.id, 'l', e.target.value)} className={inputClass} /></td>
                                        <td className="px-1 py-2 text-center"><input type="number" value={team.stats.gs} onChange={e => handleStatChange(team.id, 'gs', e.target.value)} className={inputClass} /></td>
                                        <td className="px-1 py-2 text-center"><input type="number" value={team.stats.gc} onChange={e => handleStatChange(team.id, 'gc', e.target.value)} className={inputClass} /></td>
                                        <td className="px-1 py-2 text-center"><input type="number" value={team.stats.pts} onChange={e => handleStatChange(team.id, 'pts', e.target.value)} className={inputClass + " font-black text-primary"} /></td>
                                        <td className="px-2 py-2"><input type="text" value={team.stats.form} onChange={e => handleFormChange(team.id, e.target.value)} className="w-full border border-gray-300 rounded p-1 text-xs" /></td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        
                        <div className="mt-8 flex justify-end gap-3 border-t pt-6">
                            <Button onClick={() => setSelectedLeague(selectedLeague)} variant="outline" className="flex items-center gap-2">
                                <RefreshIcon className="w-4 h-4" /> Reset
                            </Button>
                            <Button onClick={handleSave} disabled={isSaving} className="bg-primary text-white hover:bg-primary-dark flex items-center gap-2 px-8">
                                {isSaving ? <Spinner className="w-4 h-4 border-white" /> : <SaveIcon className="w-4 h-4" />}
                                Save Standings
                            </Button>
                        </div>
                    </div>
                )}
            </CardContent>
        </Card>
    );
};

export default ManualStandings;
