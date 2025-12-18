
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
import { fetchNews, fetchAllCompetitions, fetchDirectoryEntries } from '../services/api';
import { NewsItem } from '../data/news';
import { DirectoryEntity } from '../data/directory';
import TrophyIcon from './icons/TrophyIcon';
import CalendarIcon from './icons/CalendarIcon';
import NewspaperIcon from './icons/NewspaperIcon';

interface SearchResult {
    type: 'news' | 'team' | 'match';
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
  const [cachedData, setCachedData] = useState<{ news: NewsItem[], teams: DirectoryEntity[], competitions: any } | null>(null);

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
    { name: 'International', to: '/international' },
    { name: 'Live', to: '/live-updates' },
    { name: 'Cups', to: '/cups' },
    { name: 'Womens', to: '/womens' },
    { name: 'Youth', to: '/youth' },
    { name: 'National Team', to: '/national-team' },
    { name: 'Media', to: '/media' },
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
          const [newsData, competitionsData, directoryData] = await Promise.all([
              fetchNews(),
              fetchAllCompetitions(),
              fetchDirectoryEntries()
          ]);
          setCachedData({ news: newsData, teams: directoryData, competitions: competitionsData });
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
          
          // 1. Filter News (Limit 3)
          const newsMatches = cachedData.news.filter(n => n.title.toLowerCase().includes(term)).slice(0, 3);
          newsMatches.forEach(n => results.push({ type: 'news', title: n.title, subtitle: n.date, link: n.url, id: n.id }));

          // 2. Filter Teams (Limit 3)
          // Search in Directory for cleaner data, fallback to competitions if needed
          const teamMatches = cachedData.teams.filter(t => t.name.toLowerCase().includes(term) && t.category === 'Club').slice(0, 3);
          teamMatches.forEach(t => results.push({ 
              type: 'team', 
              title: t.name, 
              subtitle: t.tier || t.region, 
              link: t.competitionId && t.teamId ? `/competitions/${t.competitionId}/teams/${t.teamId}` : '/directory', 
              id: t.id 
          }));

          // 3. Filter Fixtures (Limit 3) - Search upcoming fixtures in competitions
          let fixtureCount = 0;
          Object.values(cachedData.competitions).forEach((comp: any) => {
              if (fixtureCount >= 3) return;
              (comp.fixtures || []).forEach((f: any) => {
                  if (fixtureCount >= 3) return;
                  if (f.status !== 'finished' && (f.teamA.toLowerCase().includes(term) || f.teamB.toLowerCase().includes(term))) {
                      results.push({
                          type: 'match',
                          title: `${f.teamA} vs ${f.teamB}`,
                          subtitle: `${f.date} • ${comp.name}`,
                          link: '/fixtures',
                          id: `fix-${f.id}`
                      });
                      fixtureCount++;
                  }
              });
          });

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
    const baseClass = "text-white hover:text-accent transition-colors duration-300 text-sm font-medium";
    const activeClass = "text-accent font-bold";
    return `${baseClass} ${isActive ? activeClass : ''}`;
  };

  const getMobileNavLinkClass = ({ isActive }: { isActive: boolean }) => {
    const baseClass = "text-gray-300 hover:bg-primary-dark hover:text-white block px-3 py-2 rounded-md text-base font-medium";
    const activeClass = "bg-primary-dark text-white";
    return `${baseClass} ${isActive ? activeClass : ''}`;
  };

  const ResultIcon = ({ type }: { type: SearchResult['type'] }) => {
      if (type === 'news') return <NewspaperIcon className="w-4 h-4 text-gray-500" />;
      if (type === 'team') return <ShieldIcon className="w-4 h-4 text-blue-500" />;
      if (type === 'match') return <CalendarIcon className="w-4 h-4 text-green-500" />;
      return null;
  };

  return (
    <>
      <header className="bg-primary/95 backdrop-blur-sm sticky top-0 z-50 shadow-lg">
        <SecondaryNavigation />
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex-shrink-0">
              <NavLink to="/">
                <Logo className="h-12 w-auto" />
              </NavLink>
            </div>
            <div className="hidden xl:block">
              <div className="ml-10 flex items-center space-x-4">
                {navItems.map((item) => (
                  <NavLink key={item.name} to={item.to} className={getNavLinkClass}>
                    {item.name}
                  </NavLink>
                ))}
                
                {/* Dedicated Club Portal Dropdown for Club Admins */}
                {isLoggedIn && user?.role === 'club_admin' && (
                  <div className="relative" ref={clubMenuRef}>
                      <button 
                          onClick={() => setIsClubMenuOpen(!isClubMenuOpen)}
                          className="flex items-center gap-1 text-white hover:text-accent transition-colors duration-300 text-sm font-bold border border-white/20 px-3 py-1.5 rounded-md hover:bg-white/10 group"
                      >
                          <ShieldIcon className="w-4 h-4 group-hover:text-accent" />
                          <span>Club Portal</span>
                          <ChevronDownIcon className={`w-3 h-3 transition-transform duration-200 ${isClubMenuOpen ? 'rotate-180' : ''}`} />
                      </button>
                      {isClubMenuOpen && (
                          <div className="absolute right-0 mt-2 w-56 bg-white rounded-md shadow-lg py-1 z-50 animate-fade-in-fast ring-1 ring-black ring-opacity-5">
                               <div className="px-4 py-2 text-xs font-bold text-gray-500 uppercase border-b bg-gray-50 truncate">
                                  {user.club || 'My Club'}
                                </div>
                               <Link to="/club-management?tab=scores" onClick={() => setIsClubMenuOpen(false)} className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 hover:text-primary font-medium">Update Scores</Link>
                               <Link to="/club-management?tab=news" onClick={() => setIsClubMenuOpen(false)} className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 hover:text-primary font-medium">Post News</Link>
                               <Link to="/club-management?tab=squad" onClick={() => setIsClubMenuOpen(false)} className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 hover:text-primary font-medium">Manage Squad</Link>
                               <Link to="/club-management?tab=matchday" onClick={() => setIsClubMenuOpen(false)} className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 hover:text-primary font-medium">Team Sheet</Link>
                               <div className="border-t border-gray-100 my-1"></div>
                               <Link to="/club-management" onClick={() => setIsClubMenuOpen(false)} className="block px-4 py-2 text-sm font-bold text-primary hover:bg-gray-50">Go to Dashboard &rarr;</Link>
                          </div>
                      )}
                  </div>
                )}

                <div className="relative" ref={searchRef}>
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                    <SearchIcon className="h-4 w-4 text-gray-300" />
                  </span>
                  <input
                    type="text"
                    placeholder="Search..."
                    aria-label="Search"
                    value={searchQuery}
                    onChange={handleSearchChange}
                    onFocus={handleSearchFocus}
                    onKeyDown={handleSearchSubmit}
                    className="bg-white/20 text-white placeholder-gray-300 rounded-full py-1.5 pl-9 pr-4 text-sm w-36 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-primary focus:ring-accent focus:w-64 transition-all duration-300"
                  />
                  
                  {/* Search Suggestions Dropdown */}
                  {showSuggestions && searchQuery.trim() && (
                      <div className="absolute top-full right-0 mt-2 w-72 bg-white rounded-md shadow-lg z-50 overflow-hidden ring-1 ring-black ring-opacity-5 animate-fade-in-fast">
                          {suggestions.length > 0 ? (
                              <ul>
                                  {suggestions.map((result, idx) => (
                                      <li key={`${result.type}-${result.id}-${idx}`} className="border-b last:border-b-0 border-gray-100">
                                          <button 
                                              onClick={() => handleSuggestionClick(result.link)}
                                              className="w-full text-left px-4 py-3 hover:bg-gray-50 flex items-start gap-3 transition-colors"
                                          >
                                              <div className="mt-0.5"><ResultIcon type={result.type} /></div>
                                              <div className="min-w-0">
                                                  <p className="text-sm font-semibold text-gray-800 truncate">{result.title}</p>
                                                  {result.subtitle && <p className="text-xs text-gray-500 truncate">{result.subtitle}</p>}
                                              </div>
                                          </button>
                                      </li>
                                  ))}
                                  <li className="bg-gray-50">
                                      <button 
                                          onClick={() => handleSuggestionClick(`/news?q=${encodeURIComponent(searchQuery)}`)}
                                          className="w-full text-center py-2 text-xs font-bold text-primary hover:underline"
                                      >
                                          View all results for "{searchQuery}"
                                      </button>
                                  </li>
                              </ul>
                          ) : (
                              <div className="p-4 text-center text-sm text-gray-500">No matches found.</div>
                          )}
                      </div>
                  )}
                </div>

                {/* Cart Icon */}
                <button 
                  onClick={() => setIsCartOpen(true)}
                  className="relative text-white hover:text-accent transition-colors p-2 rounded-full"
                  aria-label={`Open shopping cart with ${cartCount} items`}
                  >
                  <ShoppingCartIcon className="w-6 h-6" />
                  {cartCount > 0 && (
                      <span className="absolute top-0 right-0 block h-4 w-4 rounded-full bg-secondary text-white text-[10px] font-bold ring-2 ring-primary">
                          {cartCount}
                      </span>
                  )}
                </button>
                {/* Profile/Login section */}
                <div ref={profileRef} className="relative">
                  {isLoggedIn && user ? (
                    <button onClick={() => setIsProfileOpen(!isProfileOpen)} className="flex items-center gap-2 text-white text-sm font-medium">
                      <img src={user.avatar} alt="User avatar" className="w-8 h-8 rounded-full" />
                    </button>
                  ) : (
                    <button onClick={openAuthModal} className="text-sm font-medium text-neutral-dark bg-accent/90 hover:bg-accent px-3 py-1.5 rounded-md">
                      Log In
                    </button>
                  )}
                  {isProfileOpen && isLoggedIn && user && (
                    <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-50 animate-fade-in-fast">
                      <div className="px-4 py-2 text-sm text-gray-700 border-b">
                        <p className="font-semibold">{user.name}</p>
                        <p className="text-xs text-gray-500 truncate">{user.email}</p>
                      </div>
                      <Link to="/profile" onClick={() => setIsProfileOpen(false)} className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">My Profile</Link>
                      {(user.role === 'club_admin' || user.role === 'super_admin') && (
                        <Link to="/club-management" onClick={() => setIsProfileOpen(false)} className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">Club Portal</Link>
                      )}
                      {user.role === 'super_admin' && (
                        <>
                          <Link to="/data-management" onClick={() => setIsProfileOpen(false)} className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">Data Management</Link>
                          <Link to="/admin-panel" onClick={() => setIsProfileOpen(false)} className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">Admin Panel</Link>
                        </>
                      )}
                      <button onClick={() => { logout(); setIsProfileOpen(false); }} className="w-full text-left block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">Log Out</button>
                    </div>
                  )}
                </div>
              </div>
            </div>
            <div className="-mr-2 flex xl:hidden items-center gap-2">
              <button 
                  onClick={() => setIsCartOpen(true)}
                  className="relative text-white hover:text-accent transition-colors p-2 rounded-full"
                  aria-label={`Open shopping cart with ${cartCount} items`}
                  >
                  <ShoppingCartIcon className="w-6 h-6" />
                  {cartCount > 0 && (
                      <span className="absolute top-0 right-0 block h-4 w-4 rounded-full bg-secondary text-white text-[10px] font-bold ring-2 ring-primary">
                          {cartCount}
                      </span>
                  )}
                </button>
              <button
                onClick={() => setIsOpen(!isOpen)}
                type="button"
                className="bg-primary inline-flex items-center justify-center p-2 rounded-md text-gray-300 hover:text-white hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-primary focus:ring-white"
                aria-controls="mobile-menu"
                aria-expanded={isOpen}
              >
                <span className="sr-only">Open main menu</span>
                {isOpen ? (
                  <svg className="block h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                ) : (
                  <svg className="block h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
                  </svg>
                )}
              </button>
            </div>
          </div>
        </div>

        {isOpen && (
          <div className="xl:hidden" id="mobile-menu">
            <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
              <div className="relative px-2 py-2">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-5 pointer-events-none">
                    <SearchIcon className="h-5 w-5 text-gray-400" />
                  </span>
                  <input
                    type="text"
                    placeholder="Search..."
                    aria-label="Search"
                    value={searchQuery}
                    onChange={handleSearchChange}
                    onKeyDown={handleSearchSubmit}
                    className="block w-full bg-primary-dark text-white placeholder-gray-400 rounded-full py-2 pl-10 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-primary focus:ring-accent"
                  />
                  {/* Mobile Search Suggestions - Inline */}
                  {showSuggestions && searchQuery.trim() && suggestions.length > 0 && (
                      <div className="mt-2 bg-white rounded-md shadow-lg overflow-hidden">
                          <ul>
                              {suggestions.map((result, idx) => (
                                  <li key={`${result.type}-${result.id}-${idx}`} className="border-b last:border-b-0 border-gray-100">
                                      <button 
                                          onClick={() => handleSuggestionClick(result.link)}
                                          className="w-full text-left px-4 py-3 flex items-start gap-3 active:bg-gray-100"
                                      >
                                          <div className="mt-0.5"><ResultIcon type={result.type} /></div>
                                          <div className="min-w-0">
                                              <p className="text-sm font-semibold text-gray-800 truncate">{result.title}</p>
                                          </div>
                                      </button>
                                  </li>
                              ))}
                          </ul>
                      </div>
                  )}
                </div>
              {navItems.map((item) => (
                <NavLink to={item.to} key={item.name} onClick={() => setIsOpen(false)} className={getMobileNavLinkClass}>
                  {item.name}
                </NavLink>
              ))}
              
              {/* Mobile Club Portal Shortcuts */}
              {isLoggedIn && user?.role === 'club_admin' && (
                  <div className="mt-2 mb-2 pb-2 border-b border-primary-light/50">
                      <div className="px-3 text-xs font-bold text-accent uppercase tracking-wider mb-1 mt-3">Club Management</div>
                      <NavLink to="/club-management" onClick={() => setIsOpen(false)} className="text-white hover:bg-primary-light block px-3 py-2 rounded-md text-base font-medium flex items-center gap-2 bg-white/10">
                         <ShieldIcon className="w-4 h-4" /> Club Portal Dashboard
                      </NavLink>
                      <div className="pl-4 space-y-1 mt-1">
                          <NavLink to="/club-management?tab=scores" onClick={() => setIsOpen(false)} className="text-gray-300 hover:text-white hover:bg-primary-light block px-3 py-1.5 rounded-md text-sm">Update Scores</NavLink>
                          <NavLink to="/club-management?tab=news" onClick={() => setIsOpen(false)} className="text-gray-300 hover:text-white hover:bg-primary-light block px-3 py-1.5 rounded-md text-sm">Post News</NavLink>
                          <NavLink to="/club-management?tab=matchday" onClick={() => setIsOpen(false)} className="text-gray-300 hover:text-white hover:bg-primary-light block px-3 py-1.5 rounded-md text-sm">Team Sheet</NavLink>
                      </div>
                  </div>
              )}
                
              <div className="border-t border-primary-dark mt-3 pt-3">
                {isLoggedIn && user ? (
                  <>
                    <Link to="/profile" onClick={() => setIsOpen(false)} className="text-gray-300 hover:bg-primary-dark hover:text-white flex items-center gap-3 px-3 py-2 rounded-md text-base font-medium">
                      <img src={user.avatar} alt="User avatar" className="w-8 h-8 rounded-full" />
                      <span>My Profile</span>
                    </Link>
                    {(user.role === 'club_admin' || user.role === 'super_admin') && (
                        <Link to="/club-management" onClick={() => setIsOpen(false)} className="text-gray-300 hover:bg-primary-dark hover:text-white block px-3 py-2 rounded-md text-base font-medium">Club Portal</Link>
                    )}
                    {user.role === 'super_admin' && (
                       <>
                          <Link to="/data-management" onClick={() => setIsOpen(false)} className="text-gray-300 hover:bg-primary-dark hover:text-white block px-3 py-2 rounded-md text-base font-medium">Data Management</Link>
                          <Link to="/admin-panel" onClick={() => setIsOpen(false)} className="text-gray-300 hover:bg-primary-dark hover:text-white block px-3 py-2 rounded-md text-base font-medium">Admin Panel</Link>
                        </>
                    )}
                    <button onClick={() => { logout(); setIsOpen(false); }} className="w-full text-left text-gray-300 hover:bg-primary-dark hover:text-white block px-3 py-2 rounded-md text-base font-medium">
                      Log Out
                    </button>
                  </>
                ) : (
                  <button onClick={() => { openAuthModal(); setIsOpen(false); }} className="w-full text-left text-gray-300 hover:bg-primary-dark hover:text-white block px-3 py-2 rounded-md text-base font-medium">
                    Log In
                  </button>
                )}
              </div>
            </div>
          </div>
        )}
      </header>
      {isCartOpen && <CartModal isOpen={isCartOpen} onClose={() => setIsCartOpen(false)} />}
    </>
  );
};

export default Navigation;
