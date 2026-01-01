import React, { useState, useMemo, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent } from './ui/Card';
import { DirectoryEntity, EntityCategory, Region } from '../data/directory';
import { fetchDirectoryEntries, fetchAllCompetitions, fetchCategories } from '../services/api';
import SearchIcon from './icons/SearchIcon';
import ShieldIcon from './icons/ShieldIcon';
import SchoolIcon from './icons/SchoolIcon';
import WhistleIcon from './icons/WhistleIcon';
import BuildingIcon from './icons/BuildingIcon';
import PhoneIcon from './icons/PhoneIcon';
import MailIcon from './icons/MailIcon';
import Spinner from './ui/Spinner';
import ArrowRightIcon from './icons/ArrowRightIcon';
import ChevronDownIcon from './icons/ChevronDownIcon';
import MapPinIcon from './icons/MapPinIcon';
import AdBanner from './AdBanner';

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

const TIER_OPTIONS: { value: string, label: string }[] = [
    { value: 'all', label: 'All Leagues / Levels' },
    { value: 'Premier League', label: 'MTN Premier League' },
    { value: 'NFD', label: 'National First Division' },
    { value: 'Regional', label: 'Super League / Regional' },
    { value: 'Womens League', label: 'Women\'s League' },
];

// Define explicitly which club tiers are allowed to be shown in the directory
const ALLOWED_CLUB_TIERS = [
    'Premier League', 
    'NFD', 
    'Regional', 
    'Womens League'
];

const DirectoryCard: React.FC<{ entity: DirectoryEntity; }> = ({ entity }) => {
    const [isExpanded, setIsExpanded] = useState(false);
    const Icon = categoryIcons[entity.category] || ShieldIcon;
    const isClickable = entity.category === 'Club' && entity.teamId && entity.competitionId;

    const renderName = () => {
        if (isClickable) {
            return (
                <Link to={`/competitions/${entity.competitionId}/teams/${entity.teamId}`} className="font-bold text-gray-900 truncate hover:text-blue-600 hover:underline">
                    {entity.name}
                </Link>
            );
        }
        return <h3 className="font-bold text-gray-900 truncate">{entity.name}</h3>;
    };

    return (
        <Card className={`border transition-all duration-200 ${isExpanded ? 'shadow-md border-primary/30' : 'hover:shadow-sm'}`}>
            <div className="p-3">
                {/* Header Section - Always Visible */}
                <div className="flex items-center gap-3">
                    <div className="flex-shrink-0 w-12 h-12 flex items-center justify-center bg-gray-50 rounded-lg border border-gray-100">
                        {entity.crestUrl ? (
                            <img src={entity.crestUrl} alt={`${entity.name} crest`} className="w-9 h-9 object-contain" />
                        ) : (
                            <Icon className="w-6 h-6 text-gray-400" />
                        )}
                    </div>
                    
                    <div className="flex-grow min-w-0">
                        <div className="flex justify-between items-start">
                            <div>
                                {renderName()}
                                <div className="flex flex-wrap items-center gap-x-2 text-xs text-gray-500 mt-0.5">
                                    <span className="bg-gray-100 px-1.5 py-0.5 rounded text-gray-700 font-medium">{entity.category}</span>
                                    <span>&bull;</span>
                                    <span>{entity.region || 'National'}</span>
                                    {entity.tier && <>
                                        <span>&bull;</span>
                                        <span className="text-blue-600 font-semibold">{entity.tier}</span>
                                    </>}
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="flex-shrink-0 flex items-center gap-1">
                        {isClickable && (
                            <Link 
                                to={`/competitions/${entity.competitionId}/teams/${entity.teamId}`} 
                                className="p-2 text-blue-600 hover:bg-blue-50 rounded-full transition-colors" 
                                title="Visit Team Hub"
                            >
                                <ArrowRightIcon className="w-5 h-5"/>
                            </Link>
                        )}
                        <button 
                            onClick={() => setIsExpanded(!isExpanded)}
                            className={`p-2 rounded-full transition-colors ${isExpanded ? 'bg-gray-100 text-gray-800' : 'text-gray-400 hover:text-gray-600 hover:bg-gray-50'}`}
                            aria-label={isExpanded ? "Collapse details" : "Expand details"}
                        >
                            <ChevronDownIcon className={`w-5 h-5 transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`} />
                        </button>
                    </div>
                </div>

                {/* Expanded Details Section */}
                {isExpanded && (
                    <div className="mt-3 pt-3 border-t border-gray-100 animate-fade-in space-y-3 text-sm text-gray-600">
                        {entity.nickname && (
                            <p><span className="font-semibold text-gray-700">Nickname:</span> {entity.nickname}</p>
                        )}
                        {entity.founded && (
                            <p><span className="font-semibold text-gray-700">Founded:</span> {entity.founded}</p>
                        )}
                        {entity.stadium && (
                            <div className="flex items-start gap-2">
                                <MapPinIcon className="w-4 h-4 text-gray-400 mt-0.5" />
                                <span>{entity.stadium}</span>
                            </div>
                        )}
                        
                        {(entity.contact?.phone || entity.contact?.email) && (
                            <div className="flex flex-wrap gap-3 pt-1">
                                {entity.contact.phone && (
                                    <a href={`tel:${entity.contact.phone}`} className="flex items-center gap-1.5 text-blue-600 hover:underline bg-blue-50 px-2 py-1 rounded">
                                        <PhoneIcon className="w-3.5 h-3.5" /> {entity.contact.phone}
                                    </a>
                                )}
                                {entity.contact.email && (
                                    <a href={`mailto:${entity.contact.email}`} className="flex items-center gap-1.5 text-blue-600 hover:underline bg-blue-50 px-2 py-1 rounded">
                                        <MailIcon className="w-3.5 h-3.5" /> {entity.contact.email}
                                    </a>
                                )}
                            </div>
                        )}

                        {entity.leaders && entity.leaders.length > 0 && (
                            <div className="bg-gray-50 p-2 rounded">
                                <p className="text-xs font-bold text-gray-500 uppercase mb-1">Leadership</p>
                                {entity.leaders.map((l, idx) => (
                                    <p key={idx} className="text-xs"><span className="font-medium">{l.role}:</span> {l.name}</p>
                                ))}
                            </div>
                        )}

                        {entity.honours && entity.honours.length > 0 && (
                            <div className="bg-yellow-50 p-2 rounded border border-yellow-100">
                                <p className="text-xs font-bold text-yellow-700 uppercase mb-1">Honours</p>
                                <ul className="list-disc list-inside text-xs text-yellow-900">
                                    {entity.honours.map((h, idx) => <li key={idx}>{h}</li>)}
                                </ul>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </Card>
    );
};


const DirectoryPage: React.FC = () => {
    const [allEntries, setAllEntries] = useState<DirectoryEntity[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedCategory, setSelectedCategory] = useState<EntityCategory | 'all'>('all');
    const [selectedRegion, setSelectedRegion] = useState<Region | 'all'>('all');
    const [selectedTier, setSelectedTier] = useState<string>('all');

    useEffect(() => {
        const loadData = async () => {
            setLoading(true);
            try {
                // Fetch Directory Entries. 
                const directoryData = await fetchDirectoryEntries();
                
                // Filter entries to ensure only specific club tiers are shown
                const validEntries = directoryData.filter(entity => {
                    // Always show non-club entities (Associations, Referees, Academies)
                    if (entity.category !== 'Club') return true;

                    // For Clubs, strictly check against the allowed tiers
                    // This excludes any unassigned tiers or disallowed tiers (like Schools)
                    if (entity.tier && ALLOWED_CLUB_TIERS.includes(entity.tier)) {
                        return true;
                    }

                    return false;
                });

                setAllEntries(validEntries);
            } catch (error) {
                console.error("Error fetching directory data:", error);
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
                if (!entity || !entity.name) return false;

                const entityRegionLower = (entity.region || '').trim().toLowerCase();
                const entityTierLower = (entity.tier || '').trim().toLowerCase();
                const entityCategoryLower = (entity.category || '').trim().toLowerCase();

                // 1. User Selected Filters
                const matchesRegion = selectedRegion === 'all'
                    ? true
                    : entityRegionLower === selectedRegion.toLowerCase();

                const matchesSearch = !lowerCaseSearchTerm
                    ? true
                    : entity.name.toLowerCase().includes(lowerCaseSearchTerm);

                const matchesTier = selectedTier === 'all'
                    ? true
                    : entityTierLower === selectedTier.toLowerCase();

                const matchesCategory = selectedCategory === 'all'
                    ? true
                    : (() => {
                        if (selectedCategory.toLowerCase() === 'club') {
                            return entityCategoryLower.startsWith('club');
                        }
                        return entityCategoryLower.startsWith(selectedCategory.toLowerCase());
                    })();
                
                return matchesSearch && matchesCategory && matchesRegion && matchesTier;
            })
            .sort((a, b) => a.name.localeCompare(b.name));
    }, [searchTerm, selectedCategory, selectedRegion, selectedTier, allEntries]);

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

                <AdBanner placement="directory-banner" className="mb-8 max-w-5xl mx-auto" />

                <Card className="shadow-lg mb-8 max-w-5xl mx-auto">
                    <CardContent className="p-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
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
                            <div>
                                <select value={selectedTier} onChange={e => setSelectedTier(e.target.value)} className={inputClass}>
                                    {TIER_OPTIONS.map(opt => (
                                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                                    ))}
                                </select>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <div className="max-w-5xl mx-auto">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-start">
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