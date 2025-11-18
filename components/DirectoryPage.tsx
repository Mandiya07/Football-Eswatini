import React, { useState, useMemo, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent } from './ui/Card';
import { DirectoryEntity, EntityCategory, Region } from '../data/directory';
import { fetchDirectoryEntries } from '../services/api';
import SearchIcon from './icons/SearchIcon';
import ShieldIcon from './icons/ShieldIcon';
import SchoolIcon from './icons/SchoolIcon';
import WhistleIcon from './icons/WhistleIcon';
import BuildingIcon from './icons/BuildingIcon';
import PhoneIcon from './icons/PhoneIcon';
import MailIcon from './icons/MailIcon';
import Spinner from './ui/Spinner';
import ArrowRightIcon from './icons/ArrowRightIcon';

const categoryIcons: Record<EntityCategory, React.FC<React.SVGProps<SVGSVGElement>>> = {
    'Club': ShieldIcon,
    'Academy': SchoolIcon,
    'Referee': WhistleIcon,
    'Association': BuildingIcon,
};

const CATEGORY_OPTIONS: { value: EntityCategory | 'all', label: string }[] = [
    { value: 'all', label: 'All Categories' },
    { value: 'Club', label: 'Clubs' },
    { value: 'Academy', label: 'Academies' },
    { value: 'Referee', label: 'Referees' },
    { value: 'Association', label: 'Associations' },
];

const REGION_OPTIONS: { value: Region | 'all', label: string }[] = [
    { value: 'all', label: 'All Regions' },
    { value: 'Hhohho', label: 'Hhohho' },
    { value: 'Manzini', label: 'Manzini' },
    { value: 'Lubombo', label: 'Lubombo' },
    { value: 'Shiselweni', label: 'Shiselweni' },
];


const DirectoryCard: React.FC<{ entity: DirectoryEntity; }> = ({ entity }) => {
    const Icon = categoryIcons[entity.category] || ShieldIcon;
    const isClickable = entity.category === 'Club' && entity.teamId && entity.competitionId;

    const content = (
        <CardContent className="p-2 flex items-center gap-3">
            <div className="flex-shrink-0 w-10 h-10 flex items-center justify-center bg-gray-100 rounded-md">
                {entity.crestUrl ? (
                    <img src={entity.crestUrl} alt={`${entity.name} crest`} className="w-8 h-8 object-contain" />
                ) : (
                    <Icon className="w-5 h-5 text-gray-500" />
                )}
            </div>
            
            <div className="flex-grow min-w-0">
                <p className={`font-bold text-sm text-gray-900 truncate ${isClickable ? 'group-hover:text-primary' : ''} transition-colors`}>
                    {entity.name}
                </p>
                <div className="flex flex-wrap items-center gap-x-2 text-[11px] text-gray-600">
                    <span className="font-semibold">{entity.category}</span>
                    <span className="text-gray-300">&bull;</span>
                    <span>{entity.region}</span>
                    {entity.tier && <>
                        <span className="text-gray-300">&bull;</span>
                        <span>{entity.tier}</span>
                    </>}
                </div>
            </div>

            <div className="flex-shrink-0 flex items-center">
                {entity.contact?.phone && (
                    <a href={`tel:${entity.contact.phone}`} onClick={e => e.stopPropagation()} className="p-1.5 text-gray-400 hover:text-primary rounded-full hover:bg-primary/10" aria-label="Call">
                        <PhoneIcon className="w-4 h-4" />
                    </a>
                )}
                {entity.contact?.email && (
                    <a href={`mailto:${entity.contact.email}`} onClick={e => e.stopPropagation()} className="p-1.5 text-gray-400 hover:text-primary rounded-full hover:bg-primary/10" aria-label="Email">
                        <MailIcon className="w-4 h-4" />
                    </a>
                )}
                {isClickable && (
                    <div className="p-1.5 text-gray-400 group-hover:text-primary">
                        <ArrowRightIcon className="w-5 h-5"/>
                    </div>
                )}
            </div>
        </CardContent>
    );

    if (isClickable) {
        return (
            <Link to={`/competitions/${entity.competitionId}/teams/${entity.teamId}`} className="group block h-full" aria-label={`View profile for ${entity.name}`}>
                <Card className="transition-all duration-200 hover:shadow-md hover:border-primary/50 border h-full">
                    {content}
                </Card>
            </Link>
        );
    }
    
    return (
        <Card className="border h-full">
            {content}
        </Card>
    );
};


const DirectoryPage: React.FC = () => {
    const [allEntries, setAllEntries] = useState<DirectoryEntity[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedCategory, setSelectedCategory] = useState<EntityCategory | 'all'>('all');
    const [selectedRegion, setSelectedRegion] = useState<Region | 'all'>('all');

    useEffect(() => {
        const loadData = async () => {
            setLoading(true);
            try {
                const dataFromDb = await fetchDirectoryEntries();
                setAllEntries(dataFromDb);
            } catch (error) {
                console.error("Error fetching directory entries from Firestore:", error);
                setAllEntries([]);
            } finally {
                setLoading(false);
            }
        };
        loadData();
    }, []);

    const filteredAndSortedEntries = useMemo(() => {
        const lowerCaseSearchTerm = searchTerm.trim().toLowerCase();

        return allEntries
            .filter(entity => {
                // A valid entity must have a name and a region to be displayed.
                if (!entity || !entity.name || !entity.region) return false;

                const matchesRegion = selectedRegion === 'all'
                    ? true
                    : (entity.region || '').trim().toLowerCase() === selectedRegion.toLowerCase();

                const matchesSearch = !lowerCaseSearchTerm
                    ? true
                    : entity.name.toLowerCase().includes(lowerCaseSearchTerm);

                const matchesCategory = selectedCategory === 'all'
                    ? true
                    : (() => {
                        const entityCategory = (entity.category || '').trim().toLowerCase();
                        const filterCategory = selectedCategory.toLowerCase();

                        if (filterCategory === 'club') {
                            // For a 'Club' filter, identify by category OR by the presence of a 'tier'.
                            // This makes the filter resilient to missing or incorrect category data for clubs.
                            return entityCategory.startsWith('club') || !!entity.tier;
                        }
                        
                        // For all other categories, the check remains strict on the category field.
                        return entityCategory.startsWith(filterCategory);
                    })();
                
                return matchesSearch && matchesCategory && matchesRegion;
            })
            .sort((a, b) => a.name.localeCompare(b.name));
    }, [searchTerm, selectedCategory, selectedRegion, allEntries]);

    const inputClass = "block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md shadow-sm";

    return (
        <div className="bg-gray-50 py-12">
            <div className="container mx-auto px-4 sm:px-6 lg:px-8 animate-fade-in">
                <div className="text-center mb-12">
                    <h1 className="text-4xl md:text-5xl font-display font-extrabold text-blue-800 mb-2">
                        Football Directory
                    </h1>
                    <p className="text-lg text-gray-600 max-w-3xl mx-auto">
                        A comprehensive listing of clubs, academies, referees, and associations across Eswatini.
                    </p>
                </div>

                <Card className="shadow-lg mb-8 max-w-4xl mx-auto">
                    <CardContent className="p-4">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="relative">
                                <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                                    <SearchIcon className="h-5 w-5 text-gray-400" />
                                </span>
                                <input 
                                    type="text"
                                    placeholder="Search by name..."
                                    value={searchTerm}
                                    onChange={e => setSearchTerm(e.target.value)}
                                    className={`${inputClass} pl-10`}
                                />
                            </div>
                            <div>
                                <select value={selectedCategory} onChange={e => setSelectedCategory(e.target.value as any)} className={inputClass}>
                                     {CATEGORY_OPTIONS.map(opt => (
                                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                                    ))}
                                </select>
                            </div>
                             <div>
                                <select value={selectedRegion} onChange={e => setSelectedRegion(e.target.value as any)} className={inputClass}>
                                    {REGION_OPTIONS.map(opt => (
                                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                                    ))}
                                </select>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <div className="max-w-4xl mx-auto">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {loading ? <div className="flex justify-center p-8 md:col-span-2"><Spinner /></div> :
                         filteredAndSortedEntries.length > 0 ? filteredAndSortedEntries.map(entity => (
                            <DirectoryCard 
                                key={entity.id}
                                entity={entity}
                            />
                        )) : (
                            <div className="text-center py-12 text-gray-500 md:col-span-2">
                                <p className="font-semibold">No results found</p>
                                <p className="text-sm">Try adjusting your search or filters.</p>
                            </div>
                        )}
                    </div>
                </div>

            </div>
        </div>
    );
};

export default DirectoryPage;