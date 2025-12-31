
import React, { useState, useRef, useEffect } from 'react';
import { NavLink, Link, useNavigate, useLocation } from 'react-router-dom';
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
import Button from './ui/Button';
import BriefcaseIcon from './icons/BriefcaseIcon';
import ChevronDownIcon from './icons/ChevronDownIcon';
import SparklesIcon from './icons/SparklesIcon';
import WifiOffIcon from './icons/WifiOffIcon';
import LiveTicker from './LiveTicker';

const Navigation: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isManagementOpen, setIsManagementOpen] = useState(false);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const location = useLocation();
  
  const { isLoggedIn, user, openAuthModal } = useAuth();
  const { cartCount } = useCart();
  const managementRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  const isSuperAdmin = user?.role === 'super_admin';
  const isClubAdmin = user?.role === 'club_admin';
  const isLeagueAdmin = user?.role === 'league_admin';
  const isAdmin = isSuperAdmin || isClubAdmin || isLeagueAdmin;

  const navItems = [
    { name: 'Home', to: '/' },
    { name: 'News', to: '/news' },
    { name: 'National', to: '/national-team' },
    { name: 'Regional', to: '/regional' },
    { name: 'Matches', to: '/fixtures' },
    { name: 'Logs', to: '/logs' },
    { name: 'Intl', to: '/international' },
    { name: 'Fans', to: '/interactive' },
    { name: 'Shop', to: '/shop'},
  ];

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  useEffect(() => {
    if (scrollRef.current) {
        const activeItem = scrollRef.current.querySelector('.active-mobile-nav');
        if (activeItem) {
            activeItem.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
        }
    }
  }, [location.pathname]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (managementRef.current && !managementRef.current.contains(event.target as Node)) {
        setIsManagementOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      setSearchQuery(e.target.value);
  };

  const handleSearchSubmit = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && searchQuery.trim()) {
      navigate(`/news?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  const getNavLinkClass = ({ isActive }: { isActive: boolean }) => {
    const baseClass = "text-white hover:text-accent transition-all duration-300 text-[12px] xl:text-[13px] font-black uppercase tracking-tight xl:tracking-wider h-full flex items-center px-2 xl:px-3 border-b-4 border-transparent whitespace-nowrap";
    const activeClass = "text-accent !border-accent active-mobile-nav shadow-[inset_0_-4px_0_0_rgba(253,185,19,1)]";
    return `${baseClass} ${isActive ? activeClass : 'opacity-80 hover:opacity-100'}`;
  };

  return (
    <>
      <header className="bg-primary backdrop-blur-md sticky top-0 z-[100] shadow-xl w-full overflow-hidden">
        <SecondaryNavigation />
        
        <div className="container mx-auto px-2 sm:px-4 lg:px-6 xl:px-8 border-b border-white/5">
          <div className="flex items-center justify-between h-16 lg:h-20">
            <div className="flex-shrink-0 flex items-center gap-2 xl:gap-4">
              <NavLink to="/" onClick={() => setIsOpen(false)}>
                <Logo className="h-8 lg:h-12 xl:h-14 w-auto" />
              </NavLink>
              
              {!isOnline && (
                <div className="hidden xl:flex items-center gap-1.5 px-2.5 py-1 bg-amber-500/20 border border-amber-500/30 rounded text-amber-400 text-[10px] font-bold uppercase tracking-widest animate-pulse">
                  <WifiOffIcon className="w-3.5 h-3.5" />
                  Offline
                </div>
              )}
            </div>
            
            <div className="hidden lg:flex items-center space-x-0 h-full">
                {navItems.map((item) => (
                  <NavLink key={item.name} to={item.to} className={getNavLinkClass}>
                    {item.name}
                  </NavLink>
                ))}
            </div>

            <div className="flex items-center gap-1 sm:gap-2">
                <div className="relative" ref={searchRef}>
                    <input
                        type="text"
                        placeholder="Search..."
                        value={searchQuery}
                        onChange={handleSearchChange}
                        onKeyDown={handleSearchSubmit}
                        className="hidden xl:block bg-white/10 text-white placeholder-white/40 rounded-full py-1.5 pl-10 pr-4 text-xs w-32 xl:w-40 focus:outline-none focus:ring-2 focus:ring-accent focus:w-56 transition-all duration-300 border border-white/20"
                    />
                    <div className="xl:absolute xl:inset-y-0 xl:left-3 hidden xl:flex items-center pointer-events-none">
                        <SearchIcon className="h-5 w-5 md:h-4 md:w-4 text-white/50" />
                    </div>
                    {/* Mobile/Tablet Search Button */}
                    <button onClick={() => navigate('/news')} className="xl:hidden text-white p-2 hover:text-accent">
                        <SearchIcon className="h-6 w-6" />
                    </button>
                </div>

                <button onClick={() => setIsCartOpen(true)} className="relative text-white p-2 hover:text-accent transition-colors" aria-label="Cart">
                  <ShoppingCartIcon className="w-6 h-6" />
                  {cartCount > 0 && <span className="absolute top-1 right-1 h-4 w-4 rounded-full bg-secondary text-white text-[10px] font-bold flex items-center justify-center border border-primary">{cartCount}</span>}
                </button>

                <div className="flex items-center gap-2 h-full ml-1">
                  {isLoggedIn && user ? (
                    <div className="flex items-center gap-2 lg:gap-3 h-full">
                        {isAdmin && (
                            <div className="relative h-full flex items-center" ref={managementRef}>
                                <button 
                                    onClick={() => setIsManagementOpen(!isManagementOpen)}
                                    className="hidden sm:flex text-[10px] xl:text-xs font-bold text-primary-dark bg-accent hover:bg-yellow-400 px-2 xl:px-3 py-2 rounded-lg transition-all items-center gap-1 shadow-lg"
                                >
                                    <BriefcaseIcon className="w-3.5 h-3.5 xl:w-4 xl:h-4" />
                                    Portal
                                    <ChevronDownIcon className={`w-3 h-3 xl:w-3.5 xl:h-3.5 transition-transform duration-200 ${isManagementOpen ? 'rotate-180' : ''}`} />
                                </button>
                                
                                {isManagementOpen && (
                                    <div className="absolute top-full right-0 mt-2 w-56 bg-white rounded-xl shadow-2xl border border-gray-100 overflow-hidden animate-slide-up py-2 text-primary-dark">
                                        <Link to="/club-management" onClick={() => setIsManagementOpen(false)} className="flex items-center gap-3 px-4 py-2.5 text-sm font-semibold hover:bg-blue-50 transition-colors">
                                            <BriefcaseIcon className="w-4 h-4 text-blue-500" /> Management Portal
                                        </Link>
                                        {isSuperAdmin && (
                                            <>
                                                <Link to="/data-management" onClick={() => setIsManagementOpen(false)} className="flex items-center gap-3 px-4 py-2.5 text-sm font-semibold hover:bg-purple-50 transition-colors">
                                                    <SparklesIcon className="w-4 h-4 text-purple-500" /> Data & AI Import
                                                </Link>
                                                <Link to="/admin-panel" onClick={() => setIsManagementOpen(false)} className="flex items-center gap-3 px-4 py-2.5 text-sm font-semibold hover:bg-red-50 transition-colors">
                                                    <ShieldIcon className="w-4 h-4 text-red-500" /> Admin Panel
                                                </Link>
                                            </>
                                        )}
                                    </div>
                                )}
                            </div>
                        )}
                        <Link to="/profile" className="flex items-center h-full">
                          <img src={user.avatar} alt="Profile" className="w-8 h-8 lg:w-10 lg:h-10 rounded-full border-2 border-white/20 hover:border-accent transition-colors shadow-md" />
                        </Link>
                    </div>
                  ) : (
                    <button onClick={openAuthModal} className="text-[10px] lg:text-xs font-black uppercase text-primary-dark bg-accent px-3 lg:px-5 py-2 lg:py-2.5 rounded-lg hover:bg-yellow-400 transition-colors shadow-lg">
                      Login
                    </button>
                  )}
                </div>
            </div>
          </div>
        </div>

        <div className="lg:hidden bg-primary-dark/50 border-b border-white/5 relative overflow-hidden">
            <nav 
                ref={scrollRef}
                className="flex items-center overflow-x-auto scrollbar-hide py-1 px-4 gap-1 snap-x snap-mandatory"
            >
                {navItems.map((item) => (
                    <NavLink 
                        key={item.name} 
                        to={item.to} 
                        className={({ isActive }) => `
                            flex-shrink-0 px-4 py-3 text-[11px] font-bold uppercase tracking-wider transition-all duration-300 snap-center
                            ${isActive ? 'text-accent border-b-2 border-accent' : 'text-white/60 hover:text-white'}
                            ${isActive ? 'active-mobile-nav shadow-[inset_0_-2px_0_0_rgba(253,185,19,1)]' : ''}
                        `}
                    >
                        {item.name}
                    </NavLink>
                ))}
            </nav>
        </div>

        {/* Integrated LiveTicker to ensure it's sticky with the header */}
        <LiveTicker />
      </header>
      
      {isCartOpen && <CartModal isOpen={isCartOpen} onClose={() => setIsCartOpen(false)} />}
    </>
  );
};

const ShieldIcon: React.FC<{className?: string}> = ({className}) => (
    <svg className={className} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
    </svg>
);

export default Navigation;
