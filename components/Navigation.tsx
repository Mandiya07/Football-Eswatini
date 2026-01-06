
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
    { name: 'Matches', to: '/fixtures' },
    { name: 'Logs', to: '/logs' },
    { name: 'Live', to: '/live-updates' },
    { name: 'Cups', to: '/cups' },
    { name: 'National', to: '/national-team' },
    { name: 'Women', to: '/womens' },
    { name: 'Regional', to: '/regional' },
    { name: 'Youth', to: '/youth' },
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
    const baseClass = "text-white hover:text-accent transition-all duration-300 text-[13px] xl:text-[14px] font-bold tracking-tight h-full flex items-center px-3 border-b-4 border-transparent whitespace-nowrap";
    const activeClass = "text-accent !border-accent active-mobile-nav bg-white/5";
    return `${baseClass} ${isActive ? activeClass : 'opacity-90 hover:opacity-100 hover:bg-white/5'}`;
  };

  return (
    <>
      <header className="sticky top-0 z-[120] w-full">
        <SecondaryNavigation />
        
        <div className="bg-[#002B7F] backdrop-blur-xl shadow-2xl border-b border-white/10 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-primary-dark/50 to-transparent pointer-events-none"></div>

          <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
            <div className="flex items-center justify-between h-16 lg:h-20">
              <div className="flex-shrink-0 flex items-center gap-4">
                <NavLink to="/" onClick={() => setIsOpen(false)}>
                  <Logo className="h-10 lg:h-12 w-auto drop-shadow-lg" />
                </NavLink>
                
                {!isOnline && (
                  <div className="hidden xl:flex items-center gap-1.5 px-3 py-1 bg-red-500/20 border border-red-500/30 rounded-full text-red-400 text-[9px] font-black uppercase tracking-widest animate-pulse">
                    <WifiOffIcon className="w-3.5 h-3.5" />
                    No Connection
                  </div>
                )}
              </div>
              
              <div className="hidden lg:flex items-center h-full overflow-x-auto scrollbar-hide">
                  {navItems.map((item) => (
                    <NavLink key={item.name} to={item.to} className={getNavLinkClass}>
                      {item.name}
                    </NavLink>
                  ))}
              </div>

              <div className="flex items-center gap-2 lg:gap-4">
                  <div className="relative hidden xl:block" ref={searchRef}>
                      <input
                          type="text"
                          placeholder="Explore..."
                          value={searchQuery}
                          onChange={handleSearchChange}
                          onKeyDown={handleSearchSubmit}
                          className="bg-white/10 text-white placeholder-white/50 rounded-full py-2.5 pl-11 pr-5 text-xs w-48 focus:outline-none focus:ring-2 focus:ring-[#FDB913] focus:w-72 transition-all duration-500 border border-white/10 hover:bg-white/15"
                      />
                      <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
                          <SearchIcon className="h-4 w-4 text-white/40" />
                      </div>
                  </div>

                  <button onClick={() => setIsCartOpen(true)} className="relative text-white p-2.5 hover:text-accent transition-all hover:scale-110" aria-label="Cart">
                    <ShoppingCartIcon className="w-6 h-6" />
                    {cartCount > 0 && (
                        <span className="absolute top-1 right-1 h-5 w-5 rounded-full bg-secondary text-white text-[10px] font-black flex items-center justify-center border-2 border-[#002B7F] shadow-lg animate-bounce">
                            {cartCount}
                        </span>
                    )}
                  </button>

                  <div className="flex items-center gap-3">
                    {isLoggedIn && user ? (
                      <div className="flex items-center gap-3">
                          {isAdmin && (
                              <div className="relative" ref={managementRef}>
                                  <Button 
                                      variant="accent"
                                      size="sm"
                                      onClick={() => setIsManagementOpen(!isManagementOpen)}
                                      className="hidden sm:flex items-center gap-1.5 rounded-full px-5 py-2.5 shadow-lg transform hover:scale-105 active:scale-95 transition-all"
                                  >
                                      <BriefcaseIcon className="w-4 h-4" />
                                      Portal
                                      <ChevronDownIcon className={`w-3.5 h-3.5 transition-transform duration-300 ${isManagementOpen ? 'rotate-180' : ''}`} />
                                  </Button>
                                  
                                  {isManagementOpen && (
                                      <div className="absolute top-full right-0 mt-3 w-64 bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden py-3 text-slate-900 z-[140] animate-in fade-in slide-in-from-top-2">
                                          <Link to="/club-management" onClick={() => setIsManagementOpen(false)} className="flex items-center gap-3 px-5 py-3 text-sm font-bold hover:bg-slate-50 transition-colors">
                                              <BriefcaseIcon className="w-5 h-5 text-blue-600" /> Management Portal
                                          </Link>
                                          {isSuperAdmin && (
                                              <>
                                                  <Link to="/ai-assistant" onClick={() => setIsManagementOpen(false)} className="flex items-center gap-3 px-5 py-3 text-sm font-bold hover:bg-slate-50 transition-colors">
                                                      <SparklesIcon className="w-5 h-5 text-purple-600" /> Article AI Engine
                                                  </Link>
                                                  <Link to="/admin-panel" onClick={() => setIsManagementOpen(false)} className="flex items-center gap-3 px-5 py-3 text-sm font-bold hover:bg-slate-50 transition-colors">
                                                      <ShieldIcon className="w-5 h-5 text-red-600" /> Admin Control
                                                  </Link>
                                              </>
                                          )}
                                      </div>
                                  )}
                              </div>
                          )}
                          <Link to="/profile" className="block relative group">
                            <img src={user.avatar} alt="Profile" className="w-10 h-10 rounded-full border-2 border-white/20 group-hover:border-accent transition-all shadow-xl object-cover" />
                          </Link>
                      </div>
                    ) : (
                      <Button variant="accent" size="sm" onClick={openAuthModal} className="text-[11px] font-black rounded-full px-6 shadow-xl hover:scale-105 active:scale-95 transition-all">
                        Sign In
                      </Button>
                    )}
                    
                    <button onClick={() => setIsOpen(!isOpen)} className="lg:hidden text-white p-2.5 rounded-lg hover:bg-white/10 transition-colors">
                      {isOpen ? <XIcon className="w-7 h-7" /> : <MenuIcon className="w-7 h-7" />}
                    </button>
                  </div>
              </div>
            </div>
          </div>
        </div>

        {/* Mobile Sidebar/Menu */}
        {isOpen && (
          <div className="lg:hidden fixed inset-0 z-[130] bg-slate-900 animate-in fade-in slide-in-from-top">
             <div className="flex justify-between items-center p-6 border-b border-white/10 bg-[#002B7F]">
                <Logo className="h-8 w-auto" />
                <button onClick={() => setIsOpen(false)} className="text-white p-2"><XIcon className="w-8 h-8" /></button>
             </div>
             <nav className="flex flex-col items-center gap-4 pt-10 px-6 h-full overflow-y-auto pb-20">
                {navItems.map((item) => (
                    <NavLink 
                        key={item.name} 
                        to={item.to} 
                        onClick={() => setIsOpen(false)}
                        className={({ isActive }) => `text-2xl font-bold py-2 w-full text-center transition-all ${isActive ? 'text-accent border-b-2 border-accent' : 'text-white hover:text-accent'}`}
                    >
                        {item.name}
                    </NavLink>
                ))}
                {!isLoggedIn && (
                  <Button onClick={() => { setIsOpen(false); openAuthModal(); }} className="mt-8 w-full py-4 text-lg font-bold" variant="accent">Sign In / Register</Button>
                )}
             </nav>
          </div>
        )}

        <LiveTicker />
      </header>
      
      {isCartOpen && <CartModal isOpen={isCartOpen} onClose={() => setIsCartOpen(false)} />}
    </>
  );
};

const MenuIcon: React.FC<{className?: string}> = ({className}) => (
    <svg className={className} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
        <line x1="3" y1="12" x2="21" y2="12"></line>
        <line x1="3" y1="6" x2="21" y2="6"></line>
        <line x1="3" y1="18" x2="21" y2="18"></line>
    </svg>
);

const ShieldIcon: React.FC<{className?: string}> = ({className}) => (
    <svg className={className} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
    </svg>
);

export default Navigation;
