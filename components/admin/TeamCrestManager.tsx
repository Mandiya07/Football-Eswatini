
import React, { useState, useEffect, useMemo } from 'react';
import { fetchAllCompetitions, fetchDirectoryEntries, updateDirectoryEntry, addDirectoryEntry, deleteDirectoryEntry, handleFirestoreError } from '../../services/api';
import { DirectoryEntity } from '../../data/directory';
import { Card, CardContent } from '../ui/Card';
import Spinner from '../ui/Spinner';
import SearchIcon from '../icons/SearchIcon';
import ImageUploader from '../ui/ImageUploader';
import { findInMap } from '../../services/utils';
import FilterIcon from '../icons/FilterIcon';
import TrashIcon from '../icons/TrashIcon';
import Button from '../ui/Button';

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

            // 1. Load ALL entities from the directory
            for (const entry of dirEntries) {
                entityMap.set(entry.name, {
                    id: entry.id,
                    name: entry.name,
                    currentCrest: entry.crestUrl || '',
                    source: 'directory',
                    category: entry.category
                });
            }

            // 2. Add teams from competitions that aren't in the directory yet
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
            const dirEntry = findInMap(itemName, directoryEntries);
            
            if (dirEntry) {
                await updateDirectoryEntry(dirEntry.id, { crestUrl: newCrestUrl });
            } else {
                const newEntry: Omit<DirectoryEntity, 'id'> = {
                    name: itemName,
                    category: (item.category as any) || 'Club',
                    region: 'Hhohho', 
                    crestUrl: newCrestUrl
                };
                await addDirectoryEntry(newEntry);
            }
            
            await loadAllData();
            setSavingStatus(prev => ({ ...prev, [itemName]: 'saved' }));
            setTimeout(() => setSavingStatus(prev => ({ ...prev, [itemName]: undefined })), 2000);
        } catch (error) {
            handleFirestoreError(error, `save crest for ${itemName}`);
            setSavingStatus(prev => ({ ...prev, [itemName]: 'error' }));
        }
    };

    const handleDeleteItem = async (item: EntityItem) => {
        if (!window.confirm(`Permanently remove "${item.name}" from the directory? If this is a competition team, they will remain in the league tables but won't have a linked profile.`)) return;
        
        if (item.source === 'competition') {
            alert("This entity only exists in a Competition document. To delete it permanently, go to 'Manage Teams'.");
            return;
        }

        if (!item.id) return;

        const itemName = item.name;
        setSavingStatus(prev => ({ ...prev, [itemName]: 'deleting' }));
        
        try {
            await deleteDirectoryEntry(item.id);
            await loadAllData();
        } catch (error) {
            handleFirestoreError(error, `delete directory entry ${itemName}`);
            setSavingStatus(prev => ({ ...prev, [itemName]: 'error' }));
        }
    };

    return (
        <Card className="shadow-lg animate-fade-in">
            <CardContent className="p-6">
                <h3 className="text-2xl font-bold font-display mb-2">Entity Logo Manager</h3>
                <p className="text-sm text-gray-600 mb-6">
                    Update logos for all entities. Deleting an item here removes it from the public Directory.
                </p>

                <div className="flex flex-col sm:flex-row gap-4 mb-6">
                    <div className="relative flex-grow">
                        <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                            <SearchIcon className="h-5 w-5 text-gray-400" />
                        </span>
                        <input
                            type="text"
                            placeholder="Search..."
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                            className="block w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-2 focus:ring-blue-500 sm:text-sm"
                        />
                    </div>
                    <div className="relative min-w-[200px]">
                        <select
                            value={selectedCategory}
                            onChange={e => setSelectedCategory(e.target.value)}
                            className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-2 focus:ring-blue-500 sm:text-sm"
                        >
                            {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                        </select>
                    </div>
                </div>

                {loading ? <div className="flex justify-center py-12"><Spinner /></div> : (
                    <div className="space-y-4">
                        {filteredItems.map(item => (
                            <div key={item.name} className="p-4 bg-white border rounded-lg flex flex-col sm:flex-row sm:items-center justify-between gap-4 group">
                                <div className="flex items-center gap-4 flex-grow">
                                    <img 
                                        src={item.currentCrest || 'https://via.placeholder.com/64/CCCCCC/FFFFFF?text=?'} 
                                        alt="" 
                                        className="w-12 h-12 object-contain flex-shrink-0 bg-gray-50 rounded-lg p-1 border"
                                    />
                                    <div>
                                        <p className="font-bold text-gray-800">{item.name}</p>
                                        <div className="flex items-center gap-2 text-xs">
                                            <span className="bg-gray-100 text-gray-600 px-2 py-0.5 rounded font-medium">{item.category}</span>
                                            <span className="text-gray-400">•</span>
                                            <span className={`${item.source === 'directory' ? 'text-green-600 font-bold' : 'text-gray-400 italic'}`}>
                                                {item.source === 'directory' ? 'Directory Member' : 'Competition Only'}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3 w-full sm:w-auto">
                                    <ImageUploader 
                                        onUpload={(base64) => handleSaveCrest(item, base64)} 
                                        status={savingStatus[item.name] === 'deleting' ? undefined : (savingStatus[item.name] as any)}
                                    />
                                    <Button 
                                        onClick={() => handleDeleteItem(item)} 
                                        disabled={savingStatus[item.name] === 'deleting'}
                                        className="bg-red-50 text-red-600 hover:bg-red-100 h-9 w-9 p-0 flex items-center justify-center rounded-lg"
                                        title="Delete Entity"
                                    >
                                        {savingStatus[item.name] === 'deleting' ? <Spinner className="w-4 h-4 border-2 border-red-600"/> : <TrashIcon className="w-4 h-4" />}
                                    </Button>
                                </div>
                            </div>
                        ))}
                        {filteredItems.length === 0 && (
                            <div className="text-center py-12 text-gray-500">
                                No entities found.
                            </div>
                        )}
                    </div>
                )}
            </CardContent>
        </Card>
    );
};

export default TeamCrestManager;
