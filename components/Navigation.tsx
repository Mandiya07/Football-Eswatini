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
import LogOutIcon from './icons/LogOutIcon';
import DatabaseIcon from './icons/DatabaseIcon';
import RadioIcon from './icons/RadioIcon';
import ShieldIcon from './icons/ShieldIcon';

const Navigation: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const location = useLocation();
  
  const { isLoggedIn, user, openAuthModal, logout } = useAuth();
  const { cartCount } = useCart();
  const userMenuRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLDivElement>(null);
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
    { name: 'International', to: '/international' },
    { name: 'Videos', to: '/media' },
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
    const handleClickOutside = (event: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setIsUserMenuOpen(false);
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
    const baseClass = "text-white hover:text-accent transition-all duration-300 text-[11px] xl:text-[12px] font-black tracking-wider h-full flex items-center px-2 xl:px-3 border-b-2 border-transparent whitespace-nowrap";
    const activeClass = "text-accent !border-accent bg-white/5";
    return `${baseClass} ${isActive ? activeClass : 'opacity-70 hover:opacity-100 hover:bg-white/5'}`;
  };

  return (
    <>
      <header className="sticky top-0 z-[120] w-full shadow-2xl">
        <SecondaryNavigation />
        
        <div className="bg-[#002B7F]/95 backdrop-blur-xl border-b border-white/5 relative">
          <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-5 pointer-events-none"></div>

          <div className="container mx-auto px-4 relative z-10">
            <div className="flex items-center justify-between h-16 lg:h-18">
              <div className="flex-shrink-0 flex items-center gap-4 mr-4">
                <NavLink to="/" onClick={() => setIsOpen(false)} className="bg-transparent">
                  <Logo className="h-7 lg:h-8 w-auto transform transition-transform hover:scale-105" />
                </NavLink>
                
                {!isOnline && (
                  <div className="hidden xl:flex items-center gap-1.5 px-2 py-0.5 bg-red-500/20 border border-red-500/30 rounded-full text-red-400 text-[8px] font-black uppercase tracking-widest animate-pulse">
                    Offline
                  </div>
                )}
              </div>
              
              <div className="hidden lg:flex items-center h-full gap-0.5">
                  {navItems.map((item) => (
                    <NavLink key={item.name} to={item.to} className={getNavLinkClass}>
                      {item.name}
                    </NavLink>
                  ))}
              </div>

              <div className="flex items-center gap-2 flex-shrink-0 ml-4">
                  <div className="relative hidden xl:block" ref={searchRef}>
                      <input
                          type="text"
                          placeholder="Search..."
                          value={searchQuery}
                          onChange={handleSearchChange}
                          onKeyDown={handleSearchSubmit}
                          className="bg-white/5 text-white placeholder-white/20 rounded-full py-1.5 pl-9 pr-4 text-[11px] w-24 focus:outline-none focus:ring-1 focus:ring-accent focus:w-40 transition-all duration-500 border border-white/10 hover:bg-white/10"
                      />
                      <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
                          <SearchIcon className="h-3 w-3 text-white/20" />
                      </div>
                  </div>

                  <button onClick={() => setIsCartOpen(true)} className="relative text-white p-2 hover:text-accent transition-all transform hover:scale-110" aria-label="Cart">
                    <ShoppingCartIcon className="w-5 h-5" />
                    {cartCount > 0 && (
                        <span className="absolute top-1 right-1 h-4 w-4 rounded-full bg-secondary text-white text-[8px] font-black flex items-center justify-center border border-[#002B7F] shadow-xl">
                            {cartCount}
                        </span>
                    )}
                  </button>

                  <div className="flex items-center gap-2">
                    {isLoggedIn && user ? (
                      <div className="relative" ref={userMenuRef}>
                        <button 
                          onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                          className="flex items-center gap-2 group focus:outline-none p-1 rounded-full hover:bg-white/5 transition-colors"
                        >
                          <img 
                            src={user.avatar} 
                            alt="Profile" 
                            className="w-8 h-8 rounded-full border border-white/20 group-hover:border-accent transition-all object-cover" 
                          />
                        </button>
                        
                        {isUserMenuOpen && (
                          <div className="absolute top-full right-0 mt-2 w-60 bg-white rounded-xl shadow-2xl border border-slate-200 overflow-hidden py-2 text-slate-900 z-[150] animate-in fade-in slide-in-from-top-2 duration-200">
                            <div className="px-4 py-2 border-b border-slate-100 bg-gray-50/50">
                                <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest">Account</p>
                                <p className="font-bold text-xs truncate">{user.name}</p>
                            </div>
                            
                            <div className="py-1">
                              <Link to="/profile" onClick={() => setIsUserMenuOpen(false)} className="flex items-center gap-3 px-4 py-2 text-xs font-bold hover:bg-blue-50 transition-colors">
                                <UserCircleIcon className="w-4 h-4 text-blue-600" /> My Profile
                              </Link>
                              {isSuperAdmin && (
                                <Link to="/admin-panel" onClick={() => setIsUserMenuOpen(false)} className="flex items-center gap-3 px-4 py-2 text-xs font-bold hover:bg-red-50 text-red-600">
                                    <ShieldIcon className="w-4 h-4" /> Admin Center
                                </Link>
                              )}
                            </div>
                            
                            <div className="border-t border-slate-100 mt-1">
                              <button 
                                onClick={() => { setIsUserMenuOpen(false); logout(); }}
                                className="flex items-center gap-3 px-4 py-2 text-xs font-bold text-gray-500 hover:bg-gray-50 w-full text-left"
                              >
                                <LogOutIcon className="w-4 h-4" /> Sign Out
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    ) : (
                      <Button variant="accent" size="sm" onClick={openAuthModal} className="text-[10px] h-8 font-black uppercase tracking-widest rounded-lg px-4 shadow-xl hover:scale-105 active:scale-95 transition-all">
                        Sign In
                      </Button>
                    )}
                    
                    <button onClick={() => setIsOpen(!isOpen)} className="lg:hidden text-white p-2 rounded-lg hover:bg-white/5 transition-colors" aria-label="Menu">
                      {isOpen ? <XIcon className="w-6 h-6" /> : <MenuIcon className="w-6 h-6" />}
                    </button>
                  </div>
              </div>
            </div>
          </div>
        </div>

        {isOpen && (
          <div className="lg:hidden fixed inset-0 z-[130] bg-slate-950 animate-in fade-in duration-300">
             <div className="flex justify-between items-center p-6 border-b border-white/5 bg-[#002B7F]">
                <Logo className="h-8 w-auto" />
                <button onClick={() => setIsOpen(false)} className="text-white p-2 bg-white/5 rounded-full"><XIcon className="w-6 h-6" /></button>
             </div>
             <nav className="flex flex-col items-center gap-2 pt-8 px-6 h-full overflow-y-auto pb-32">
                {navItems.map((item) => (
                    <NavLink 
                        key={item.name} 
                        to={item.to} 
                        onClick={() => setIsOpen(false)}
                        className={({ isActive }) => `text-xl font-black tracking-tighter py-4 w-full text-center transition-all ${isActive ? 'text-accent' : 'text-white/40 hover:text-white'}`}
                    >
                        {item.name}
                    </NavLink>
                ))}
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

export default Navigation;