
import React, { useState, useEffect, useMemo } from 'react';
import { fetchAllCompetitions, fetchDirectoryEntries, updateDirectoryEntry, addDirectoryEntry, deleteDirectoryEntry, handleFirestoreError } from '../../services/api';
import { DirectoryEntity } from '../../data/directory';
import { Card, CardContent } from '../ui/Card';
import Spinner from '../ui/Spinner';
import SearchIcon from '../icons/SearchIcon';
import ImageUploader from '../ui/ImageUploader';
import { findInMap, removeUndefinedProps } from '../../services/utils';
import TrashIcon from '../icons/TrashIcon';
import Button from '../ui/Button';
import InfoIcon from '../icons/InfoIcon';
import { db } from '../../services/firebase';
// Added collection to the imports from firebase/firestore
import { doc, writeBatch, collection } from 'firebase/firestore';

interface EntityItem {
    id?: string;
    name: string;
    currentCrest: string;
    source: 'directory' | 'competition';
    category: string;
}

const TeamCrestManager: React.FC = () => {
    const [allItems, setAllItems] = useState<EntityItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedCategory, setSelectedCategory] = useState<string>('All');
    const [savingStatus, setSavingStatus] = useState<Record<string, 'saving' | 'saved' | 'error' | 'deleting'>>({});
    const [autoSyncToDirectory, setAutoSyncToDirectory] = useState(true);

    const [directoryEntries, setDirectoryEntries] = useState<Map<string, DirectoryEntity>>(new Map());

    const loadAllData = async () => {
        setLoading(true);
        try {
            const [allComps, dirEntries] = await Promise.all([
                fetchAllCompetitions(),
                fetchDirectoryEntries()
            ]);

            const dirMap = new Map<string, DirectoryEntity>();
            dirEntries.forEach(e => dirMap.set(e.name.trim().toLowerCase(), e));
            setDirectoryEntries(dirMap);

            const entityMap = new Map<string, EntityItem>();

            for (const entry of dirEntries) {
                entityMap.set(entry.name, {
                    id: entry.id,
                    name: entry.name,
                    currentCrest: entry.crestUrl || '',
                    source: 'directory',
                    category: entry.category
                });
            }

            for (const comp of Object.values(allComps)) {
                for (const team of comp.teams || []) {
                    if (!entityMap.has(team.name)) {
                        entityMap.set(team.name, {
                            name: team.name,
                            currentCrest: team.crestUrl || '',
                            source: 'competition',
                            category: 'Club' 
                        });
                    }
                }
            }

            setAllItems(Array.from(entityMap.values()).sort((a, b) => a.name.localeCompare(b.name)));

        } catch (error) {
            console.error("Failed to load entity data", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadAllData();
    }, []);

    const filteredItems = useMemo(() => {
        return allItems.filter(item => {
            const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase());
            const matchesCategory = selectedCategory === 'All' || item.category === selectedCategory;
            return matchesSearch && matchesCategory;
        });
    }, [allItems, searchTerm, selectedCategory]);

    const categories = useMemo(() => {
        const cats = new Set(allItems.map(i => i.category));
        return ['All', ...Array.from(cats).sort()];
    }, [allItems]);

    const handleSaveCrest = async (item: EntityItem, newCrestUrl: string) => {
        const itemName = item.name;
        setSavingStatus(prev => ({ ...prev, [itemName]: 'saving' }));
        
        try {
            const batch = writeBatch(db);
            const dirEntry = findInMap(itemName, directoryEntries);
            const allComps = await fetchAllCompetitions();
            
            // 1. Update Directory (If exists or if auto-sync is on)
            if (dirEntry) {
                const dirRef = doc(db, 'directory', dirEntry.id);
                batch.update(dirRef, { crestUrl: newCrestUrl });
            } else if (autoSyncToDirectory) {
                // Simplified creation of directory entry
                const newDirRef = doc(collection(db, 'directory'));
                batch.set(newDirRef, {
                    name: itemName,
                    category: item.category || 'Club',
                    region: 'Hhohho',
                    crestUrl: newCrestUrl,
                    tier: 'Regional'
                });
            }

            // 2. Global Sync: Update every competition where this team exists
            Object.entries(allComps).forEach(([compId, comp]) => {
                if (comp.teams) {
                    const teamIndex = comp.teams.findIndex(t => t.name === itemName);
                    if (teamIndex !== -1) {
                        const updatedTeams = [...comp.teams];
                        updatedTeams[teamIndex] = { ...updatedTeams[teamIndex], crestUrl: newCrestUrl };
                        const compRef = doc(db, 'competitions', compId);
                        batch.update(compRef, { teams: removeUndefinedProps(updatedTeams) });
                    }
                }
            });

            await batch.commit();
            
            await loadAllData();
            setSavingStatus(prev => ({ ...prev, [itemName]: 'saved' }));
            setTimeout(() => setSavingStatus(prev => {
                const ns = { ...prev };
                delete ns[itemName];
                return ns;
            }), 2000);
        } catch (error) {
            handleFirestoreError(error, `save crest for ${itemName}`);
            setSavingStatus(prev => ({ ...prev, [itemName]: 'error' }));
        }
    };

    const handleDeleteItem = async (item: EntityItem) => {
        if (!window.confirm(`Permanently remove "${item.name}" from the directory? This only removes the Directory metadata; standard Competition data is preserved.`)) return;
        
        const itemName = item.name;
        if (!item.id) {
            alert("This entry is not in the Directory database yet.");
            return;
        }

        setSavingStatus(prev => ({ ...prev, [itemName]: 'deleting' }));
        try {
            await deleteDirectoryEntry(item.id);
            await loadAllData();
        } catch (error) {
            handleFirestoreError(error, `delete directory entry ${itemName}`);
            setSavingStatus(prev => ({ ...prev, [itemName]: 'error' }));
        } finally {
            setSavingStatus(prev => {
                const newState = { ...prev };
                delete newState[itemName];
                return newState;
            });
        }
    };

    return (
        <Card className="shadow-lg animate-fade-in">
            <CardContent className="p-6">
                <h3 className="text-2xl font-bold font-display mb-2">Entity Logo Manager</h3>
                <p className="text-sm text-gray-600 mb-6">
                    Update logos globally. Uploading a logo here syncs it with the Hero, Standings, and Directory automatically.
                </p>

                <div className="bg-blue-50 border border-blue-100 p-4 rounded-xl mb-6 flex items-start gap-4">
                    <div className="flex-shrink-0 mt-1">
                        <input 
                            type="checkbox" 
                            id="dirSyncToggle" 
                            checked={autoSyncToDirectory}
                            onChange={(e) => setAutoSyncToDirectory(e.target.checked)}
                            className="h-5 w-5 rounded text-blue-600 focus:ring-blue-500 cursor-pointer"
                        />
                    </div>
                    <div>
                        <label htmlFor="dirSyncToggle" className="block text-sm font-bold text-blue-900 cursor-pointer">
                            Auto-sync new entities to Public Directory
                        </label>
                        <p className="text-xs text-blue-700 mt-1">
                            When enabled, teams not already in the directory will be added automatically when you upload a logo. This ensures the public listing stays current.
                        </p>
                    </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-4 mb-6">
                    <div className="relative flex-grow">
                        <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                            <SearchIcon className="h-5 w-5 text-gray-400" />
                        </span>
                        <input
                            type="text"
                            placeholder="Search by team name..."
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                            className="block w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-xl shadow-sm focus:ring-2 focus:ring-blue-500 sm:text-sm"
                        />
                    </div>
                    <div className="relative min-w-[200px]">
                        <select
                            value={selectedCategory}
                            onChange={e => setSelectedCategory(e.target.value)}
                            className="block w-full px-3 py-2.5 border border-gray-300 rounded-xl shadow-sm focus:ring-2 focus:ring-blue-500 sm:text-sm"
                        >
                            {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                        </select>
                    </div>
                </div>

                {loading ? <div className="flex justify-center py-12"><Spinner /></div> : (
                    <div className="space-y-4">
                        {filteredItems.map(item => (
                            <div key={item.name} className="p-4 bg-white border border-gray-100 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 group">
                                <div className="flex items-center gap-4 flex-grow">
                                    <div className="w-16 h-16 flex-shrink-0 bg-gray-50 rounded-2xl border border-gray-100 p-2 flex items-center justify-center shadow-inner">
                                        {item.currentCrest ? (
                                            <img 
                                                src={item.currentCrest} 
                                                alt="" 
                                                className="max-h-full max-w-full object-contain"
                                            />
                                        ) : (
                                            <div className="text-gray-300 font-black text-xl">{item.name.charAt(0)}</div>
                                        )}
                                    </div>
                                    <div>
                                        <p className="font-black text-gray-900 text-lg leading-none mb-1">{item.name}</p>
                                        <div className="flex items-center gap-2 text-xs">
                                            <span className="bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full font-bold text-[9px] uppercase tracking-wider">{item.category}</span>
                                            <span className="text-gray-300">•</span>
                                            <span className={`${item.source === 'directory' ? 'text-green-600 font-bold' : 'text-gray-400 italic'}`}>
                                                {item.source === 'directory' ? 'Digital Member' : 'League Entry Only'}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3 w-full sm:w-auto">
                                    <ImageUploader 
                                        onUpload={(base64) => handleSaveCrest(item, base64)} 
                                        status={savingStatus[item.name] === 'deleting' ? undefined : (savingStatus[item.name] as any)}
                                    />
                                    {item.source === 'directory' && (
                                        <Button 
                                            onClick={() => handleDeleteItem(item)} 
                                            disabled={savingStatus[item.name] === 'deleting'}
                                            className="bg-red-50 text-red-600 hover:bg-red-100 h-9 w-9 p-0 flex items-center justify-center rounded-xl border border-red-100 transition-all"
                                            title="Delete Directory Entry"
                                        >
                                            {savingStatus[item.name] === 'deleting' ? <Spinner className="w-4 h-4 border-2 border-red-600"/> : <TrashIcon className="w-4 h-4" />}
                                        </Button>
                                    )}
                                </div>
                            </div>
                        ))}
                        {filteredItems.length === 0 && (
                            <div className="text-center py-20 text-gray-500 border-2 border-dashed rounded-[2rem] bg-gray-50">
                                <SearchIcon className="w-10 h-10 mx-auto mb-4 opacity-10" />
                                <p className="font-bold">No entities found.</p>
                            </div>
                        )}
                    </div>
                )}
            </CardContent>
        </Card>
    );
};

export default TeamCrestManager;
