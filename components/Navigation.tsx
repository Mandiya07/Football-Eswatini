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
import XIcon from './icons/XIcon';
import { fetchNews, fetchAllCompetitions, fetchDirectoryEntries, fetchHybridTournaments } from '../services/api';
import { NewsItem } from '../data/news';
import { DirectoryEntity } from '../data/directory';
import { HybridTournament } from '../data/international';
// Added missing Button import
import Button from './ui/Button';

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
  const searchRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  const navItems = [
    { name: 'Home', to: '/' },
    { name: 'News', to: '/news' },
    { name: 'Fixtures', to: '/fixtures' },
    { name: 'Logs', to: '/logs' },
    { name: 'International', to: '/international' },
    { name: 'Live', to: '/live-updates' },
    { name: 'Fan Zone', to: '/interactive' },
    { name: 'Shop', to: '/shop'},
  ];

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
        setIsProfileOpen(false);
      }
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

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
              <NavLink to="/" onClick={() => setIsOpen(false)}>
                <Logo className="h-14 w-auto" />
              </NavLink>
            </div>
            
            {/* Desktop Menu */}
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
                    placeholder="Search..."
                    value={searchQuery}
                    onChange={handleSearchChange}
                    onFocus={loadSearchData}
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
                    <Link to="/profile">
                      <img src={user.avatar} alt="" className="w-9 h-9 rounded-full border-2 border-white/20 hover:border-accent transition-colors" />
                    </Link>
                  ) : (
                    <button onClick={openAuthModal} className="text-xs font-black uppercase text-primary-dark bg-accent px-4 py-2 rounded-lg hover:bg-yellow-400 transition-colors shadow-lg">
                      Login
                    </button>
                  )}
                </div>
              </div>
            </div>
            
            {/* Mobile Actions */}
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
        
        {/* FAN TICKER */}
        <div className="bg-primary-dark/80 backdrop-blur-sm h-10 overflow-hidden flex items-center border-t border-white/5">
            <div className="bg-red-600 h-full px-4 flex items-center text-[10px] font-black text-white uppercase tracking-widest z-10 whitespace-nowrap border-r border-red-700">
                Live Shouts
            </div>
            <div className="flex-grow whitespace-nowrap animate-marquee relative">
                <span className="inline-block px-8 text-xs text-white/90">🔥 Join the live chat for the big weekend matches!</span>
                <span className="inline-block px-8 text-xs text-white/90">🏆 Predicted scores are rolling in on the Fan Zone.</span>
                <span className="inline-block px-8 text-xs text-white/90">📰 Breaking: New youth tournament dates confirmed.</span>
            </div>
        </div>

        {/* Mobile Menu Overlay */}
        <div className={`fixed inset-0 bg-primary/95 z-[200] transition-transform duration-300 xl:hidden ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}>
            <div className="flex flex-col h-full">
                <div className="flex justify-between items-center p-6 border-b border-white/10">
                    <Logo className="h-10 w-auto" />
                    <button onClick={() => setIsOpen(false)} className="text-white"><XIcon className="w-8 h-8"/></button>
                </div>
                <div className="flex-grow overflow-y-auto p-6 space-y-6">
                    {navItems.map((item) => (
                        <NavLink 
                            key={item.name} 
                            to={item.to} 
                            onClick={() => setIsOpen(false)}
                            className={({ isActive }) => `block text-2xl font-display font-bold uppercase tracking-wide ${isActive ? 'text-accent' : 'text-white'}`}
                        >
                            {item.name}
                        </NavLink>
                    ))}
                    <div className="pt-6 border-t border-white/10">
                        {isLoggedIn ? (
                            <Link to="/profile" onClick={() => setIsOpen(false)} className="flex items-center gap-4 text-white">
                                <img src={user?.avatar} className="w-12 h-12 rounded-full border-2 border-accent" alt="" />
                                <div>
                                    <p className="font-bold">{user?.name}</p>
                                    <p className="text-sm opacity-60">View Profile</p>
                                </div>
                            </Link>
                        ) : (
                            <Button onClick={() => { setIsOpen(false); openAuthModal(); }} className="w-full bg-accent text-primary-dark font-black py-4">LOGIN / SIGNUP</Button>
                        )}
                    </div>
                </div>
            </div>
        </div>
      </header>
      
      {isCartOpen && <CartModal isOpen={isCartOpen} onClose={() => setIsCartOpen(false)} />}
    </>
  );
};

export default Navigation;