
import React, { useState, useEffect, useMemo } from 'react';
import { addDirectoryEntry, deleteDirectoryEntry, fetchDirectoryEntries, updateDirectoryEntry, fetchAllCompetitions, handleFirestoreError } from '../../services/api';
import { DirectoryEntity, DirectoryEntity as DirectoryEntityType } from '../../data/directory';
import { Card, CardContent } from '../ui/Card';
import Button from '../ui/Button';
import Spinner from '../ui/Spinner';
import PlusCircleIcon from '../icons/PlusCircleIcon';
import TrashIcon from '../icons/TrashIcon';
import PencilIcon from '../icons/PencilIcon';
import SearchIcon from '../icons/SearchIcon';
import FilterIcon from '../icons/FilterIcon';
import RefreshIcon from '../icons/RefreshIcon';
import DirectoryFormModal from './DirectoryFormModal';

const DirectoryManagement: React.FC = () => {
    const [entries, setEntries] = useState<DirectoryEntity[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingEntry, setEditingEntry] = useState<DirectoryEntity | null>(null);

    // Filter State
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedCategory, setSelectedCategory] = useState<string>('All');

    const loadEntries = async () => {
        setLoading(true);
        const data = await fetchDirectoryEntries();
        setEntries(data);
        setLoading(false);
    };

    useEffect(() => {
        loadEntries();
    }, []);

    // Filter Logic
    const filteredEntries = useMemo(() => {
        return entries.filter(entry => {
            const matchesSearch = entry.name.toLowerCase().includes(searchTerm.toLowerCase());
            const matchesCategory = selectedCategory === 'All' || entry.category === selectedCategory;
            return matchesSearch && matchesCategory;
        });
    }, [entries, searchTerm, selectedCategory]);

    const handleAddNew = () => {
        setEditingEntry(null);
        setIsModalOpen(true);
    };

    const handleEdit = (entry: DirectoryEntity) => {
        setEditingEntry(entry);
        setIsModalOpen(true);
    };

    const handleDelete = async (id: string) => {
        if (window.confirm("Delete this directory entry?")) {
            await deleteDirectoryEntry(id);
            loadEntries();
        }
    };

    const handleSave = async (data: Omit<DirectoryEntity, 'id'>, id?: string) => {
        if (id) {
            await updateDirectoryEntry(id, data);
        } else {
            await addDirectoryEntry(data);
        }
        setIsModalOpen(false);
        loadEntries();
    };

    const handleSyncTeams = async () => {
        if (!window.confirm("This will scan all competitions (Premier League, NFD, Super Leagues) and add any missing teams to the directory. This helps keep the directory up to date.\n\nProceed?")) return;

        setLoading(true);
        try {
            const [competitionsData, existingDirectory] = await Promise.all([
                fetchAllCompetitions(),
                fetchDirectoryEntries()
            ]);

            // Create a set of normalized existing names for duplicate checking
            const existingNames = new Set(existingDirectory.map(e => e.name.trim().toLowerCase()));
            let addedCount = 0;

            const newEntries: Omit<DirectoryEntity, 'id'>[] = [];

            Object.entries(competitionsData).forEach(([compId, comp]) => {
                let tier: DirectoryEntityType['tier'] = undefined;
                let region: DirectoryEntityType['region'] = 'Hhohho'; // Default
                const compNameLower = comp.name.toLowerCase();

                // Determine Tier based on competition name
                if (compNameLower.includes('premier')) tier = 'Premier League';
                else if (compNameLower.includes('first division') || compNameLower.includes('nfd')) tier = 'NFD';
                else if (compNameLower.includes('women') || compNameLower.includes('ladies')) tier = 'Womens League';
                else if (compNameLower.includes('school') || compNameLower.includes('student')) tier = 'Schools';
                else if (compNameLower.includes('regional') || compNameLower.includes('super league')) tier = 'Regional';

                // Determine Region based on competition name
                if (compNameLower.includes('manzini')) region = 'Manzini';
                else if (compNameLower.includes('lubombo')) region = 'Lubombo';
                else if (compNameLower.includes('shiselweni')) region = 'Shiselweni';
                else if (compNameLower.includes('hhohho')) region = 'Hhohho';

                if (comp.teams) {
                    comp.teams.forEach(team => {
                        const teamNameClean = team.name.trim();
                        const teamNameLower = teamNameClean.toLowerCase();

                        if (!existingNames.has(teamNameLower)) {
                            // Avoid adding duplicates within the same batch
                            if (!newEntries.find(e => e.name.toLowerCase() === teamNameLower)) {
                                newEntries.push({
                                    name: teamNameClean,
                                    category: 'Club',
                                    region: region,
                                    tier: tier,
                                    crestUrl: team.crestUrl,
                                    teamId: team.id,
                                    competitionId: compId
                                });
                                existingNames.add(teamNameLower);
                            }
                        }
                    });
                }
            });

            // Process additions
            for (const entry of newEntries) {
                await addDirectoryEntry(entry);
                addedCount++;
            }

            if (addedCount > 0) {
                alert(`Successfully synced! Added ${addedCount} new teams to the Directory.`);
                loadEntries(); // Refresh
            } else {
                alert("Directory is already up to date. No new teams found.");
            }

        } catch (error) {
            console.error("Sync failed", error);
            handleFirestoreError(error, "sync directory teams");
        } finally {
            setLoading(false);
        }
    };

    const categories = ['All', 'Club', 'Academy', 'Referee', 'Association'];

    return (
        <>
            <Card className="shadow-lg animate-fade-in">
                <CardContent className="p-6">
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
                        <h3 className="text-2xl font-bold font-display">Directory Management</h3>
                        <div className="flex gap-2 flex-wrap">
                             <Button onClick={handleSyncTeams} disabled={loading} className="bg-blue-600 text-white hover:bg-blue-700 inline-flex items-center gap-2">
                                <RefreshIcon className="w-5 h-5" /> Sync Teams from Leagues
                            </Button>
                            <Button onClick={handleAddNew} className="bg-primary text-white hover:bg-primary-dark inline-flex items-center gap-2">
                                <PlusCircleIcon className="w-5 h-5" /> Add Entry
                            </Button>
                        </div>
                    </div>
                    
                    {/* Filters */}
                    <div className="flex flex-col sm:flex-row gap-4 mb-6">
                        <div className="relative flex-grow">
                            <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                                <SearchIcon className="h-5 w-5 text-gray-400" />
                            </span>
                            <input
                                type="text"
                                placeholder="Search by name..."
                                value={searchTerm}
                                onChange={e => setSearchTerm(e.target.value)}
                                className="block w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                            />
                        </div>
                        <div className="relative min-w-[200px]">
                            <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                                <FilterIcon className="h-4 w-4 text-gray-400" />
                            </span>
                            <select
                                value={selectedCategory}
                                onChange={e => setSelectedCategory(e.target.value)}
                                className="block w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                            >
                                {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                            </select>
                        </div>
                    </div>

                    {loading ? <div className="flex justify-center py-8"><Spinner /></div> : (
                        <div className="space-y-3">
                            {filteredEntries.length > 0 ? filteredEntries.map(entry => (
                                <div key={entry.id} className="p-3 bg-white border rounded-lg flex items-center justify-between gap-3 hover:bg-gray-50 transition-colors">
                                    <div className="flex items-center gap-3">
                                        <div className="h-10 w-10 bg-gray-100 rounded-full flex items-center justify-center overflow-hidden border">
                                            {entry.crestUrl ? (
                                                <img src={entry.crestUrl} alt={entry.name} className="w-full h-full object-contain" />
                                            ) : (
                                                <span className="text-xs font-bold text-gray-400">{entry.name.charAt(0)}</span>
                                            )}
                                        </div>
                                        <div>
                                            <p className="font-semibold text-gray-900">{entry.name}</p>
                                            <div className="flex flex-wrap gap-2 text-xs text-gray-500">
                                                <span className="bg-gray-200 px-1.5 py-0.5 rounded text-gray-700">{entry.category}</span>
                                                <span>•</span>
                                                <span>{entry.region}</span>
                                                {entry.tier && (
                                                    <>
                                                        <span>•</span>
                                                        <span className="text-blue-600 font-medium">{entry.tier}</span>
                                                    </>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex-shrink-0 flex items-center gap-2">
                                        <Button onClick={() => handleEdit(entry)} className="bg-blue-100 text-blue-700 h-8 w-8 p-0 flex items-center justify-center"><PencilIcon className="w-4 h-4" /></Button>
                                        <Button onClick={() => handleDelete(entry.id)} className="bg-red-100 text-red-700 h-8 w-8 p-0 flex items-center justify-center"><TrashIcon className="w-4 h-4" /></Button>
                                    </div>
                                </div>
                            )) : (
                                <div className="text-center py-12 text-gray-500">
                                    <p>No entries found matching your filters.</p>
                                </div>
                            )}
                        </div>
                    )}
                </CardContent>
            </Card>
            {isModalOpen && <DirectoryFormModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onSave={handleSave} entry={editingEntry} />}
        </>
    );
};

export default DirectoryManagement;
