
import React, { useState, useMemo, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent } from './ui/Card';
import { DirectoryEntity, EntityCategory, Region } from '../data/directory';
import { fetchDirectoryEntries, fetchCategories, Category, fetchAllCompetitions } from '../services/api';
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
import { superNormalize } from '../services/utils';
import { Competition } from '../data/teams';
import Button from './ui/Button';

const staticCategoryIcons: Record<EntityCategory, React.FC<React.SVGProps<SVGSVGElement>>> = {
    'Club': ShieldIcon,
    'Academy': SchoolIcon,
    'Referee': WhistleIcon,
    'Association': BuildingIcon,
    'Schools': SchoolIcon,
};

const CATEGORY_OPTIONS: { value: EntityCategory | 'all', label: string }[] = [
    { value: 'all', label: 'All Categories' },
    { value: 'Club', label: 'Clubs' },
    { value: 'Academy', label: 'Academies' },
    { value: 'Schools', label: 'Schools' },
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
    { value: 'Schools', label: 'Schools' },
];

const ALLOWED_CLUB_TIERS = [
    'Premier League', 
    'NFD', 
    'Regional', 
    'Womens League',
    'Schools'
];

// CRITICAL FIX: Explicit mapping for high-priority hubs to prevent incorrect linking
const TIER_PRIORITY_HUB: Record<string, string> = {
    'Premier League': 'mtn-premier-league',
    'NFD': 'national-first-division',
    'Womens League': 'eswatini-women-football-league'
};

const DirectoryCard: React.FC<{ entity: DirectoryEntity; categoryLogo?: string; allComps: Record<string, Competition> }> = ({ entity, categoryLogo, allComps }) => {
    const [isExpanded, setIsExpanded] = useState(false);
    const StaticIcon = staticCategoryIcons[entity.category] || ShieldIcon;
    
    // RESOLVE PROFILE LINK: Context-Aware Reliable Lookup
    const profileLink = useMemo(() => {
        if (entity.category !== 'Club' && entity.category !== 'Academy') return null;
        
        const normName = superNormalize(entity.name);
        
        // Priority 1: Use Tier Mapping to check the correct league hub first
        // This prevents PL teams from linking to Ladies teams by accident
        const priorityHubId = entity.tier ? TIER_PRIORITY_HUB[entity.tier] : null;
        if (priorityHubId && allComps[priorityHubId]) {
            const league = allComps[priorityHubId];
            const teamMatch = league.teams?.find(t => 
                superNormalize(t.name) === normName || 
                String(t.id) === String(entity.teamId)
            );
            if (teamMatch) return `/competitions/${priorityHubId}/teams/${teamMatch.id}`;
        }
        
        // Priority 2: Explicitly mapped IDs (if tier check failed)
        if (entity.teamId && entity.competitionId) {
            return `/competitions/${entity.competitionId}/teams/${entity.teamId}`;
        }

        // Priority 3: Global scan (Fallback)
        for (const [compId, comp] of Object.entries(allComps)) {
            if (compId === priorityHubId) continue; // Already checked
            const league = comp as Competition;
            const teamMatch = league.teams?.find(t => 
                superNormalize(t.name) === normName || 
                String(t.id) === String(entity.teamId)
            );
            if (teamMatch) {
                return `/competitions/${compId}/teams/${teamMatch.id}`;
            }
        }
        return null;
    }, [entity, allComps]);

    const isClickable = !!profileLink;

    return (
        <Card className={`border transition-all duration-200 ${isExpanded ? 'shadow-md border-primary/30' : 'hover:shadow-sm'}`}>
            <div className="p-3">
                <div className="flex items-center gap-3">
                    <div className="flex-shrink-0 w-12 h-12 flex items-center justify-center bg-gray-50 rounded-lg border border-gray-100 overflow-hidden">
                        {entity.crestUrl ? <img src={entity.crestUrl} alt="" className="w-9 h-9 object-contain" /> : categoryLogo ? <img src={categoryLogo} alt="" className="w-8 h-8 object-contain opacity-70" /> : <StaticIcon className="w-6 h-6 text-gray-400" />}
                    </div>
                    
                    <div className="flex-grow min-w-0">
                        {isClickable ? (
                            <Link to={profileLink!} className="font-bold text-gray-900 truncate hover:text-blue-600 hover:underline transition-colors block">{entity.name}</Link>
                        ) : (
                            <h3 className="font-bold text-gray-900 truncate">{entity.name}</h3>
                        )}
                        <div className="flex flex-wrap items-center gap-x-2 text-[10px] text-gray-500 mt-0.5 uppercase font-bold tracking-wider">
                            <span className="text-gray-700">{entity.category}</span>
                            <span>&bull;</span>
                            <span>{entity.region || 'National'}</span>
                            {entity.tier && <><span className="mx-1">&bull;</span><span className="text-blue-600">{entity.tier}</span></>}
                        </div>
                    </div>

                    <div className="flex-shrink-0 flex items-center gap-1">
                        {isClickable && <Link to={profileLink!} className="p-2 text-blue-600 hover:bg-blue-50 rounded-full transition-colors"><ArrowRightIcon className="w-5 h-5"/></Link>}
                        <button 
                            onClick={() => setIsExpanded(!isExpanded)} 
                            className={`p-2 rounded-full transition-colors ${isExpanded ? 'bg-gray-100 text-gray-800' : 'text-gray-400 hover:text-gray-600 hover:bg-gray-50'}`}
                        >
                            <ChevronDownIcon className={`w-5 h-5 transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`} />
                        </button>
                    </div>
                </div>

                {isExpanded && (
                    <div className="mt-3 pt-3 border-t border-gray-100 animate-fade-in space-y-3 text-sm text-gray-600">
                        {entity.nickname && <p><span className="font-semibold text-gray-700">Nickname:</span> {entity.nickname}</p>}
                        {entity.founded && <p><span className="font-semibold text-gray-700">Founded:</span> {entity.founded}</p>}
                        {entity.stadium && <div className="flex items-start gap-2"><MapPinIcon className="w-4 h-4 text-gray-400 mt-0.5" /><span>{entity.stadium}</span></div>}
                        {(entity.contact?.phone || entity.contact?.email) && (
                            <div className="flex flex-wrap gap-3 pt-1">
                                {entity.contact.phone && <a href={`tel:${entity.contact.phone}`} className="flex items-center gap-1.5 text-blue-600 hover:underline bg-blue-50 px-2 py-1 rounded"><PhoneIcon className="w-3.5 h-3.5" /> {entity.contact.phone}</a>}
                                {entity.contact.email && <a href={`mailto:${entity.contact.email}`} className="flex items-center gap-1.5 text-blue-600 hover:underline bg-blue-50 px-2 py-1 rounded"><MailIcon className="w-3.5 h-3.5" /> {entity.contact.email}</a>}
                            </div>
                        )}
                        {isClickable && <div className="pt-2"><Link to={profileLink!} className="w-full"><Button className="w-full bg-blue-600 text-white hover:bg-blue-700 h-10 rounded-xl font-bold flex items-center justify-center gap-2">Open Full Team Hub <ArrowRightIcon className="w-4 h-4"/></Button></Link></div>}
                    </div>
                )}
            </div>
        </Card>
    );
};

const DirectoryPage: React.FC = () => {
    const [allEntries, setAllEntries] = useState<DirectoryEntity[]>([]);
    const [categories, setCategories] = useState<Category[]>([]);
    const [allComps, setAllComps] = useState<Record<string, Competition>>({});
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedCategory, setSelectedCategory] = useState<EntityCategory | 'all'>('all');
    const [selectedRegion, setSelectedRegion] = useState<Region | 'all'>('all');
    const [selectedTier, setSelectedTier] = useState<string>('all');

    useEffect(() => {
        const loadData = async () => {
            setLoading(true);
            try {
                const [directoryData, catData, competitionsData] = await Promise.all([
                    fetchDirectoryEntries(),
                    fetchCategories(),
                    fetchAllCompetitions()
                ]);
                setCategories(catData);
                setAllComps(competitionsData);
                setAllEntries(directoryData.filter(entity => {
                    if (entity.category !== 'Club' && entity.category !== 'Schools') return true;
                    return entity.tier && ALLOWED_CLUB_TIERS.includes(entity.tier);
                }));
            } catch (error) { console.error(error); }
            finally { setLoading(false); }
        };
        loadData();
    }, []);

    const filteredAndSortedEntries = useMemo(() => {
        const term = searchTerm.trim().toLowerCase();
        return allEntries
            .filter(entity => {
                if (!entity?.name) return false;
                const matchesRegion = selectedRegion === 'all' || (entity.region || '').toLowerCase() === selectedRegion.toLowerCase();
                const matchesSearch = !term || entity.name.toLowerCase().includes(term);
                const matchesTier = selectedTier === 'all' || (entity.tier || '').toLowerCase() === selectedTier.toLowerCase();
                const matchesCategory = selectedCategory === 'all' || (entity.category || '').toLowerCase() === selectedCategory.toLowerCase();
                return matchesSearch && matchesCategory && matchesRegion && matchesTier;
            })
            .sort((a, b) => (a.name || '').localeCompare(b.name || ''));
    }, [searchTerm, selectedCategory, selectedRegion, selectedTier, allEntries]);

    return (
        <div className="bg-gray-50 py-12">
            <div className="container mx-auto px-4 sm:px-6 lg:px-8 animate-fade-in">
                <div className="text-center mb-12">
                    <h1 className="text-4xl md:text-5xl font-display font-extrabold text-blue-800 mb-2">Football Directory</h1>
                    <p className="text-lg text-gray-600 max-w-3xl mx-auto">A comprehensive listing of clubs, academies, referees, and associations across Eswatini.</p>
                </div>

                <Card className="shadow-lg mb-8 max-w-5xl mx-auto">
                    <CardContent className="p-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                            <div className="relative">
                                <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none"><SearchIcon className="h-5 w-5 text-gray-400" /></span>
                                <input type="text" placeholder="Search by name..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 sm:text-sm" />
                            </div>
                            <select value={selectedCategory} onChange={e => setSelectedCategory(e.target.value as any)} className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm sm:text-sm">
                                {CATEGORY_OPTIONS.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                            </select>
                            <select value={selectedRegion} onChange={e => setSelectedRegion(e.target.value as any)} className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm sm:text-sm">
                                {REGION_OPTIONS.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                            </select>
                            <select value={selectedTier} onChange={e => setSelectedTier(e.target.value)} className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm sm:text-sm">
                                {TIER_OPTIONS.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                            </select>
                        </div>
                    </CardContent>
                </Card>

                <div className="max-w-5xl mx-auto">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-start">
                        {loading ? <div className="flex justify-center p-8 md:col-span-2"><Spinner /></div> :
                         filteredAndSortedEntries.length > 0 ? filteredAndSortedEntries.map(entity => {
                            const catFromDb = categories.find(c => c.name.toLowerCase().includes(entity.category.toLowerCase()));
                            return <DirectoryCard key={entity.id} entity={entity} categoryLogo={catFromDb?.logoUrl} allComps={allComps} />;
                         }) : (
                            <div className="text-center py-12 text-gray-500 md:col-span-2 border-2 border-dashed rounded-3xl"><p className="font-semibold">No results found</p></div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default DirectoryPage;
