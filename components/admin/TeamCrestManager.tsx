import React, { useState, useEffect, useMemo } from 'react';
import { fetchAllCompetitions, fetchDirectoryEntries, updateDirectoryEntry, addDirectoryEntry, handleFirestoreError } from '../../services/api';
import { Team } from '../../data/teams';
import { DirectoryEntity } from '../../data/directory';
import { Card, CardContent } from '../ui/Card';
import Spinner from '../ui/Spinner';
import Button from '../ui/Button';
import SearchIcon from '../icons/SearchIcon';
import ImageUploader from '../ui/ImageUploader';
import SaveIcon from '../icons/SaveIcon';
import CheckCircleIcon from '../icons/CheckCircleIcon';
import AlertTriangleIcon from '../icons/AlertTriangleIcon';
import { findInMap } from '../../services/utils';

interface UniqueTeam {
    name: string;
    currentCrest: string;
    source: 'directory' | 'competition' | 'placeholder';
}

const TeamCrestManager: React.FC = () => {
    const [allTeams, setAllTeams] = useState<UniqueTeam[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [savingStatus, setSavingStatus] = useState<Record<string, 'saving' | 'saved' | 'error'>>({});

    const [directoryEntries, setDirectoryEntries] = useState<Map<string, DirectoryEntity>>(new Map());

    useEffect(() => {
        const loadAllTeamData = async () => {
            setLoading(true);
            try {
                const [allComps, dirEntries] = await Promise.all([
                    fetchAllCompetitions(),
                    fetchDirectoryEntries()
                ]);

                const dirMap = new Map<string, DirectoryEntity>();
                dirEntries.forEach(e => dirMap.set(e.name.trim().toLowerCase(), e));
                setDirectoryEntries(dirMap);

                const teamMap = new Map<string, UniqueTeam>();

                // 1. Prioritize teams from the directory
                for (const entry of dirEntries) {
                    if (entry.category === 'Club') {
                        teamMap.set(entry.name, {
                            name: entry.name,
                            currentCrest: entry.crestUrl || '',
                            source: 'directory'
                        });
                    }
                }

                // 2. Add teams from competitions that aren't in the directory
                for (const comp of Object.values(allComps)) {
                    for (const team of comp.teams || []) {
                        if (!teamMap.has(team.name)) {
                            teamMap.set(team.name, {
                                name: team.name,
                                currentCrest: team.crestUrl || '',
                                source: 'competition'
                            });
                        }
                    }
                }

                setAllTeams(Array.from(teamMap.values()).sort((a, b) => a.name.localeCompare(b.name)));

            } catch (error) {
                console.error("Failed to load team data", error);
            } finally {
                setLoading(false);
            }
        };
        loadAllTeamData();
    }, []);

    const filteredTeams = useMemo(() => {
        return allTeams.filter(team =>
            team.name.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }, [allTeams, searchTerm]);

    const handleSaveCrest = async (teamName: string, newCrestUrl: string) => {
        setSavingStatus(prev => ({ ...prev, [teamName]: 'saving' }));
        
        try {
            const dirEntry = findInMap(teamName, directoryEntries);
            
            if (dirEntry) {
                // Update existing directory entry
                await updateDirectoryEntry(dirEntry.id, { crestUrl: newCrestUrl });
            } else {
                // Create a new directory entry
                const newEntry: Omit<DirectoryEntity, 'id'> = {
                    name: teamName,
                    category: 'Club',
                    region: 'Hhohho', // Default, should be updated if more info is available
                    crestUrl: newCrestUrl
                };
                await addDirectoryEntry(newEntry);
            }
            
            // Optimistically update local state
            setAllTeams(prev => prev.map(t => t.name === teamName ? { ...t, currentCrest: newCrestUrl, source: 'directory' } : t));
            
            setSavingStatus(prev => ({ ...prev, [teamName]: 'saved' }));
            setTimeout(() => setSavingStatus(prev => ({ ...prev, [teamName]: undefined })), 2000);

        } catch (error) {
            handleFirestoreError(error, `save crest for ${teamName}`);
            setSavingStatus(prev => ({ ...prev, [teamName]: 'error' }));
        }
    };

    return (
        <Card className="shadow-lg animate-fade-in">
            <CardContent className="p-6">
                <h3 className="text-2xl font-bold font-display mb-2">Team Crest Manager</h3>
                <p className="text-sm text-gray-600 mb-6">
                    Manage all team logos in one place. Uploading a crest here saves it to the central Directory, automatically updating it across the entire website.
                </p>

                <div className="relative mb-6 max-w-lg">
                    <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                        <SearchIcon className="h-5 w-5 text-gray-400" />
                    </span>
                    <input
                        type="text"
                        placeholder="Search for a team..."
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                        className="block w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    />
                </div>

                {loading ? <div className="flex justify-center py-12"><Spinner /></div> : (
                    <div className="space-y-4">
                        {filteredTeams.map(team => (
                            <div key={team.name} className="p-4 bg-white border rounded-lg flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                <div className="flex items-center gap-4 flex-grow">
                                    <img 
                                        src={team.currentCrest || 'https://via.placeholder.com/64/CCCCCC/FFFFFF?text=?'} 
                                        alt={`${team.name} crest`} 
                                        className="w-12 h-12 object-contain flex-shrink-0 bg-gray-100 rounded-full p-1 border"
                                    />
                                    <div>
                                        <p className="font-bold text-gray-800">{team.name}</p>
                                        <p className={`text-xs font-medium ${team.source === 'directory' ? 'text-green-600' : 'text-gray-500'}`}>
                                            Crest Source: <span className="font-bold">{team.source.charAt(0).toUpperCase() + team.source.slice(1)}</span>
                                        </p>
                                    </div>
                                </div>
                                <div className="w-full sm:w-auto">
                                    <ImageUploader 
                                        onUpload={(base64) => handleSaveCrest(team.name, base64)} 
                                        status={savingStatus[team.name]}
                                    />
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </CardContent>
        </Card>
    );
};

export default TeamCrestManager;