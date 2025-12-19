
import React, { useState, useRef, useEffect } from 'react';
import { NavLink, Link, useNavigate } from 'react-router-dom';
import SearchIcon from './icons/SearchIcon';
import UserCircleIcon from './icons/UserCircleIcon';
import { useAuth } from '../contexts/AuthContext';
import { useCart } from '../contexts/CartContext';
import ShoppingCartIcon from './icons/ShoppingCartIcon';
import CartModal from './CartModal';
import SecondaryNavigation from './SecondaryNavigation';
import Logo from './Logo';
import ShieldIcon from './icons/ShieldIcon';
import ChevronDownIcon from './icons/ChevronDownIcon';
// Added XIcon import to fix reference error
import XIcon from './icons/XIcon';
import { fetchNews, fetchAllCompetitions, fetchDirectoryEntries, fetchHybridTournaments } from '../services/api';
import { NewsItem } from '../data/news';
import { DirectoryEntity } from '../data/directory';
import { HybridTournament } from '../data/international';
import TrophyIcon from './icons/TrophyIcon';
import CalendarIcon from './icons/CalendarIcon';
import NewspaperIcon from './icons/NewspaperIcon';
import GlobeIcon from './icons/GlobeIcon';
import MessageSquareIcon from './icons/MessageSquareIcon';

interface SearchResult {
    type: 'news' | 'team' | 'match' | 'tournament';
    title: string;
    subtitle?: string;
    link: string;
    id: string;
}

const Navigation: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isClubMenuOpen, setIsClubMenuOpen] = useState(false);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Search State
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [suggestions, setSuggestions] = useState<SearchResult[]>([]);
  const [dataLoaded, setDataLoaded] = useState(false);
  const [cachedData, setCachedData] = useState<{ 
    news: NewsItem[], 
    teams: DirectoryEntity[], 
    competitions: any,
    hybridTournaments: HybridTournament[]
  } | null>(null);

  const { isLoggedIn, user, openAuthModal, logout } = useAuth();
  const { cartCount } = useCart();
  const profileRef = useRef<HTMLDivElement>(null);
  const clubMenuRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  const navItems = [
    { name: 'Home', to: '/' },
    { name: 'News', to: '/news' },
    { name: 'Fixtures', to: '/fixtures' },
    { name: 'Logs', to: '/logs' },
    { name: 'Hub', to: '/international' },
    { name: 'Live', to: '/live-updates' },
    { name: 'Fan Zone', to: '/interactive' }, // Renamed from Interactive
    { name: 'Shop', to: '/shop'},
  ];

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
        setIsProfileOpen(false);
      }
      if (clubMenuRef.current && !clubMenuRef.current.contains(event.target as Node)) {
        setIsClubMenuOpen(false);
      }
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Lazy load data on first search interaction
  const loadSearchData = async () => {
      if (dataLoaded || cachedData) return;
      
      try {
          const [newsData, competitionsData, directoryData, hybridData] = await Promise.all([
              fetchNews(),
              fetchAllCompetitions(),
              fetchDirectoryEntries(),
              fetchHybridTournaments()
          ]);
          setCachedData({ 
            news: newsData, 
            teams: directoryData, 
            competitions: competitionsData,
            hybridTournaments: hybridData
          });
          setDataLoaded(true);
      } catch (err) {
          console.error("Failed to load search data", err);
      }
  };

  const handleSearchFocus = () => {
      loadSearchData();
      if (searchQuery.trim().length > 0) setShowSuggestions(true);
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const query = e.target.value;
      setSearchQuery(query);
      
      if (query.trim().length === 0) {
          setSuggestions([]);
          setShowSuggestions(false);
          return;
      }
      
      setShowSuggestions(true);
      
      if (cachedData) {
          const term = query.toLowerCase();
          const results: SearchResult[] = [];
          
          const newsMatches = cachedData.news.filter(n => n.title.toLowerCase().includes(term)).slice(0, 3);
          newsMatches.forEach(n => results.push({ type: 'news', title: n.title, subtitle: n.date, link: n.url, id: n.id }));

          const teamMatches = cachedData.teams.filter(t => t.name.toLowerCase().includes(term) && t.category === 'Club').slice(0, 3);
          teamMatches.forEach(t => results.push({ 
              type: 'team', 
              title: t.name, 
              subtitle: t.tier || t.region, 
              link: t.competitionId && t.teamId ? `/competitions/${t.competitionId}/teams/${t.teamId}` : '/directory', 
              id: t.id 
          }));

          setSuggestions(results);
      }
  };

  const handleSearchSubmit = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && searchQuery.trim()) {
      navigate(`/news?q=${encodeURIComponent(searchQuery.trim())}`);
      setIsOpen(false);
      setShowSuggestions(false);
    }
  };
  
  const handleSuggestionClick = (link: string) => {
      navigate(link);
      setIsOpen(false);
      setShowSuggestions(false);
      setSearchQuery('');
  };

  const getNavLinkClass = ({ isActive }: { isActive: boolean }) => {
    const baseClass = "text-white/80 hover:text-accent transition-all duration-300 text-sm font-bold uppercase tracking-wider h-full flex items-center px-2 border-b-4 border-transparent";
    const activeClass = "text-accent border-accent";
    return `${baseClass} ${isActive ? activeClass : ''}`;
  };

  return (
    <>
      <header className="bg-primary backdrop-blur-md sticky top-0 z-[100] shadow-xl">
        <SecondaryNavigation />
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-20">
            <div className="flex-shrink-0">
              <NavLink to="/">
                <Logo className="h-14 w-auto" />
              </NavLink>
            </div>
            <div className="hidden xl:block h-full">
              <div className="flex items-center space-x-2 h-full">
                {navItems.map((item) => (
                  <NavLink key={item.name} to={item.to} className={getNavLinkClass}>
                    {item.name}
                  </NavLink>
                ))}
                
                <div className="relative pl-4" ref={searchRef}>
                  <span className="absolute inset-y-0 left-7 flex items-center pointer-events-none">
                    <SearchIcon className="h-4 w-4 text-white/50" />
                  </span>
                  <input
                    type="text"
                    placeholder="Search teams, news..."
                    value={searchQuery}
                    onChange={handleSearchChange}
                    onFocus={handleSearchFocus}
                    onKeyDown={handleSearchSubmit}
                    className="bg-white/10 text-white placeholder-white/40 rounded-full py-2 pl-10 pr-4 text-xs w-48 focus:outline-none focus:ring-2 focus:ring-accent focus:w-64 transition-all duration-300 border border-white/20"
                  />
                </div>

                <button onClick={() => setIsCartOpen(true)} className="relative text-white hover:text-accent p-2 ml-2">
                  <ShoppingCartIcon className="w-6 h-6" />
                  {cartCount > 0 && <span className="absolute top-0 right-0 h-4 w-4 rounded-full bg-secondary text-white text-[10px] font-bold flex items-center justify-center">{cartCount}</span>}
                </button>

                <div ref={profileRef} className="relative ml-2">
                  {isLoggedIn && user ? (
                    <button onClick={() => setIsProfileOpen(!isProfileOpen)} className="flex items-center gap-2">
                      <img src={user.avatar} alt="" className="w-9 h-9 rounded-full border-2 border-white/20 hover:border-accent transition-colors" />
                    </button>
                  ) : (
                    <button onClick={openAuthModal} className="text-xs font-black uppercase text-primary-dark bg-accent px-4 py-2 rounded-lg hover:bg-yellow-400 transition-colors shadow-lg shadow-accent/20">
                      Login
                    </button>
                  )}
                </div>
              </div>
            </div>
            
            <div className="xl:hidden flex items-center gap-3">
               <button onClick={() => setIsCartOpen(true)} className="relative text-white">
                  <ShoppingCartIcon className="w-6 h-6" />
                  {cartCount > 0 && <span className="absolute top-0 right-0 h-4 w-4 rounded-full bg-secondary text-white text-[10px] font-bold flex items-center justify-center">{cartCount}</span>}
                </button>
                <button onClick={() => setIsOpen(!isOpen)} className="text-white p-2">
                   {isOpen ? <XIcon className="w-8 h-8" /> : <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16m-7 6h7" /></svg>}
                </button>
            </div>
          </div>
        </div>
        
        {/* FAN TICKER - Interactive Layer */}
        <div className="bg-primary-dark/80 backdrop-blur-sm h-10 overflow-hidden flex items-center border-t border-white/5">
            <div className="bg-red-600 h-full px-4 flex items-center text-[10px] font-black text-white uppercase tracking-widest z-10 whitespace-nowrap border-r border-red-700">
                Live Shouts
            </div>
            <div className="flex-grow whitespace-nowrap animate-marquee relative">
                <span className="inline-block px-8 text-xs text-white/90">🔥 <strong>Sipho M.</strong> just predicted a 2-0 win for Swallows!</span>
                <span className="inline-block px-8 text-xs text-white/90">📣 Join the live chat for <strong>Highlanders vs Wanderers</strong>!</span>
                <span className="inline-block px-8 text-xs text-white/90">🏆 <strong>Lwazi</strong> reached Level 5 Fan status!</span>
                <span className="inline-block px-8 text-xs text-white/90">📰 Breaking: New youth tournament announced in Hhohho.</span>
                <span className="inline-block px-8 text-xs text-white/90">⚽ GOAL! <strong>Royal Leopards</strong> lead 1-0 against Buffaloes.</span>
            </div>
        </div>
      </header>
      
      {isCartOpen && <CartModal isOpen={isCartOpen} onClose={() => setIsCartOpen(false)} />}
    </>
  );
};

export default Navigation;