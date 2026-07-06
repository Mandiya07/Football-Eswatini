
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
import LiveTicker from './LiveTicker';
import LogOutIcon from './icons/LogOutIcon';
import DatabaseIcon from './icons/DatabaseIcon';
import NewspaperIcon from './icons/NewspaperIcon';
import MenuIcon from './icons/MenuIcon';
import TrophyIcon from './icons/TrophyIcon';
import ShieldCheckIcon from './icons/ShieldCheckIcon';
import { Download as DownloadIconLucide, Smartphone as SmartphoneIconLucide } from 'lucide-react';


const Navigation: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const location = useLocation();
  
  const { isLoggedIn, user, openAuthModal, logout } = useAuth();
  const { cartCount } = useCart();
  const userMenuRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  const [isInstallable, setIsInstallable] = useState((window as any).isPWAInstallable?.() || false);
  const [isStandalone, setIsStandalone] = useState(false);

  useEffect(() => {
    setIsStandalone(window.matchMedia('(display-mode: standalone)').matches);

    const handlePromptAvailable = () => {
      setIsInstallable(true);
    };

    const handlePromptUsed = () => {
      setIsInstallable(false);
    };

    window.addEventListener('pwa-prompt-available', handlePromptAvailable);
    window.addEventListener('pwa-prompt-used', handlePromptUsed);

    return () => {
      window.removeEventListener('pwa-prompt-available', handlePromptAvailable);
      window.removeEventListener('pwa-prompt-used', handlePromptUsed);
    };
  }, []);

  const handleInstallClick = async () => {
    await (window as any).installPWA?.();
  };

  const isSuperAdmin = user?.role === 'super_admin';
  const isClubAdmin = user?.role === 'club_admin' || isSuperAdmin;
  const isLeagueAdmin = user?.role === 'league_admin' || isSuperAdmin;
  const isJournalist = user?.role === 'journalist' || isSuperAdmin;
  const isEFAAuthorized = user?.canAccessEFADashboard || isSuperAdmin;

  const navItems = [
    { name: 'Home', to: '/' },
    { name: 'News', to: '/news' },
    { name: 'Matches', to: '/fixtures' },
    { name: 'Logs', to: '/logs' },
    { name: 'Live', to: '/live-updates' },
    { name: 'Cups', to: '/cups' },
    { name: 'National', to: '/national-team' },
    { name: 'Women', to: '/womens' },
    { name: 'Youth', to: '/youth' },
    { name: 'Regional', to: '/regional' },
    { name: 'International', to: '/international' },
    { name: 'Videos', to: '/media' },
    { name: 'Podcasts', to: '/podcasts' },
    { name: 'Shop', to: '/shop'},
  ];

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setIsUserMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    setIsOpen(false);
    setIsUserMenuOpen(false);
  }, [location.pathname]);

  const handleSearchSubmit = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && searchQuery.trim()) {
      navigate(`/news?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  const getNavLinkClass = ({ isActive }: { isActive: boolean }) => {
    const baseClass = "relative h-full flex items-center text-[11px] xl:text-[12px] 2xl:text-[13px] font-bold px-2 xl:px-2.5 2xl:px-3.5 transition-all duration-300 whitespace-nowrap tracking-tighter";
    return isActive 
      ? `${baseClass} text-white bg-white/10 backdrop-blur-md` 
      : `${baseClass} text-white/70 hover:text-white hover:bg-white/5`;
  };

  return (
    <>
      <header className="sticky top-0 z-[120] w-full shadow-2xl">
        <SecondaryNavigation />
        
        <div className="bg-[#002B7F] border-b border-white/10">
          <div className="container mx-auto px-4">
            <div className="flex items-center h-20">
              <div className="flex items-center h-full">
                <NavLink to="/" className="flex-shrink-0 mr-4 sm:mr-8 xl:mr-12 transition-transform hover:scale-105 active:scale-95">
                  <Logo className="h-7 sm:h-9 xl:h-10 w-auto" />
                </NavLink>
                
                <nav className="hidden lg:flex items-center h-full overflow-x-auto scrollbar-hide">
                  <div className="flex items-center h-full">
                    {navItems.map((item) => (
                      <NavLink key={item.name} to={item.to} className={getNavLinkClass}>
                        {({ isActive }) => (
                          <>
                            {item.name}
                            {isActive && (
                              <div className="absolute bottom-0 left-0 right-0 h-1 bg-accent shadow-[0_-2px_10px_rgba(253,185,19,0.5)]"></div>
                            )}
                          </>
                        )}
                      </NavLink>
                    ))}
                  </div>
                </nav>
              </div>

              <div className="flex items-center gap-2 xl:gap-4 ml-auto flex-shrink-0">
                <div className="relative hidden xl:block">
                  <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/50" />
                  <input
                    type="text"
                    placeholder="Search news..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyDown={handleSearchSubmit}
                    className="bg-white/10 text-white placeholder-white/40 rounded-xl py-2 pl-10 pr-4 text-sm w-32 2xl:w-44 focus:w-52 focus:bg-white/20 outline-none border border-white/5 focus:border-white/20 transition-all"
                  />
                </div>

                {!isStandalone && (
                  <button 
                    onClick={() => {
                      if (isInstallable) {
                        handleInstallClick();
                      } else {
                        alert("To install the app on this device:\n\n1. Tap your browser's Share or Menu button\n2. Select 'Add to Home Screen' or 'Install App'\n3. Open the app directly from your home screen!");
                      }
                    }}
                    className="hidden md:flex items-center gap-1 bg-accent hover:bg-yellow-500 text-primary-dark font-black text-[9px] uppercase tracking-wider px-2 py-1.5 rounded-lg transition-all shadow-md active:scale-95 shrink-0"
                    title="Install official App to your device"
                  >
                    <DownloadIconLucide className="w-3 h-3" />
                    <span>Install</span>
                  </button>
                )}

                <button onClick={() => setIsCartOpen(true)} className="relative text-white hover:text-accent transition-colors p-2" aria-label="Cart">
                  <ShoppingCartIcon className="w-6 h-6" />
                  {cartCount > 0 && (
                    <span className="absolute top-1 right-1 h-4 w-4 rounded-full bg-secondary text-white text-[10px] font-bold flex items-center justify-center ring-2 ring-[#002B7F]">
                      {cartCount}
                    </span>
                  )}
                </button>

                {isLoggedIn ? (
                  <>
                    {/* Desktop dropdown */}
                    <div className="relative hidden lg:block" ref={userMenuRef}>
                      <button 
                        onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                        className="w-10 h-10 rounded-full border-2 border-white/20 hover:border-accent transition-all overflow-hidden shadow-lg hover:scale-105"
                      >
                        <img src={user?.avatar || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(user?.name || 'User')}`} alt="Profile" referrerPolicy="no-referrer" className="w-full h-full object-cover" />
                      </button>
                      
                      {isUserMenuOpen && (
                        <div className="absolute top-full right-0 mt-3 w-56 bg-white rounded-2xl shadow-2xl border border-gray-100 py-2 text-gray-800 animate-in slide-in-from-top-3 duration-200">
                          <div className="px-5 py-3 border-b border-gray-50 text-center">
                            <p className="font-black text-sm truncate text-gray-900">{user?.name}</p>
                            <p className="text-[10px] text-primary/50 font-black tracking-widest uppercase">{user?.role?.replace('_', ' ')}</p>
                          </div>
                          <div className="p-1.5">
                            <Link to="/profile" className="flex items-center gap-3 px-4 py-2.5 text-sm font-bold hover:bg-gray-50 rounded-xl transition-colors">
                              <UserCircleIcon className="w-5 h-5 text-gray-400" /> My Profile
                            </Link>
                            {isLeagueAdmin && (
                              <Link to="/data-management" className="flex items-center gap-3 px-4 py-2.5 text-sm font-bold hover:bg-blue-50 rounded-xl transition-colors text-blue-600">
                                <TrophyIcon className="w-5 h-5" /> League Portal
                              </Link>
                            )}
                            {isEFAAuthorized && (
                              <Link to="/admin/efa-dashboard" className="flex items-center gap-3 px-4 py-2.5 text-sm font-bold hover:bg-yellow-50 rounded-xl transition-colors text-yellow-600">
                                <ShieldCheckIcon className="w-5 h-5" /> EFA Dashboard
                              </Link>
                            )}
                            {isClubAdmin && (
                              <Link to="/club-management" className="flex items-center gap-3 px-4 py-2.5 text-sm font-bold hover:bg-green-50 rounded-xl transition-colors text-green-600">
                                <DatabaseIcon className="w-5 h-5" /> Club Portal
                              </Link>
                            )}
                            {isJournalist && (
                              <Link to="/press" className="flex items-center gap-3 px-4 py-2.5 text-sm font-bold hover:bg-indigo-50 rounded-xl transition-colors text-indigo-600">
                                <NewspaperIcon className="w-5 h-5" /> Press Portal
                              </Link>
                            )}
                            <button onClick={logout} className="flex items-center gap-3 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 rounded-xl w-full text-left font-black border-t border-gray-50 mt-1.5">
                              <LogOutIcon className="w-5 h-5" /> Sign Out
                            </button>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Mobile direct profile avatar */}
                    <Link 
                      to="/profile" 
                      className="w-9 h-9 rounded-full border border-white/20 hover:border-accent transition-all overflow-hidden shadow-md active:scale-95 lg:hidden flex items-center justify-center shrink-0"
                      aria-label="My Profile"
                    >
                      <img src={user?.avatar || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(user?.name || 'User')}`} alt="Profile" referrerPolicy="no-referrer" className="w-full h-full object-cover" />
                    </Link>
                  </>
                ) : (
                  <>
                    {/* Desktop Sign In */}
                    <Button variant="accent" size="sm" onClick={openAuthModal} className="hidden lg:flex h-9 px-4 rounded-xl text-[10px] tracking-widest shadow-xl">
                      Sign In
                    </Button>

                    {/* Mobile Sign In */}
                    <button 
                      onClick={openAuthModal}
                      className="lg:hidden text-white/90 hover:text-white p-2 flex items-center justify-center transition-all active:scale-95 shrink-0"
                      aria-label="Sign In"
                    >
                      <UserCircleIcon className="w-6 h-6" />
                    </button>
                  </>
                )}
                
                <button onClick={() => setIsOpen(!isOpen)} className="lg:hidden text-white p-2">
                  {isOpen ? <XIcon className="w-7 h-7" /> : <MenuIcon className="w-7 h-7" />}
                </button>
              </div>
            </div>
          </div>
        </div>

        {isOpen && (
          <div className="lg:hidden fixed inset-0 z-[130] bg-[#002B7F] animate-in fade-in slide-in-from-right duration-300 flex flex-col">
             <div className="flex justify-between items-center p-6 border-b border-white/10">
                <Logo className="h-8 w-auto" />
                <button onClick={() => setIsOpen(false)} className="text-white p-2 hover:bg-white/10 rounded-full transition-colors"><XIcon className="w-7 h-7" /></button>
             </div>
             <nav className="flex flex-col p-6 gap-2 overflow-y-auto flex-grow custom-scrollbar">
                {navItems.map((item) => (
                  <NavLink 
                    key={item.name} 
                    to={item.to} 
                    className={({ isActive }) => `px-6 py-3.5 text-lg font-black rounded-2xl transition-all ${isActive ? 'bg-white text-primary shadow-2xl scale-[1.02]' : 'text-white/80 hover:bg-white/10 hover:text-white'}`}
                  >
                    {item.name}
                  </NavLink>
                ))}

                {isLoggedIn && (
                  <div className="mt-6 pt-6 border-t border-white/10 space-y-2">
                    <p className="px-6 text-[10px] font-black tracking-widest text-white/40 uppercase mb-3">Account & Portals</p>
                    
                    <Link 
                      to="/profile" 
                      onClick={() => setIsOpen(false)}
                      className={`flex items-center gap-4 px-6 py-3.5 text-base font-black rounded-2xl transition-all ${location.pathname === '/profile' ? 'bg-white text-primary shadow-2xl' : 'text-white/80 hover:bg-white/10 hover:text-white'}`}
                    >
                      <UserCircleIcon className="w-6 h-6" />
                      My Profile
                    </Link>

                    {isLeagueAdmin && (
                      <Link 
                        to="/data-management" 
                        onClick={() => setIsOpen(false)}
                        className={`flex items-center gap-4 px-6 py-3.5 text-base font-black rounded-2xl transition-all ${location.pathname === '/data-management' ? 'bg-white text-blue-600 shadow-2xl' : 'text-blue-300 hover:bg-white/10 hover:text-blue-200'}`}
                      >
                        <TrophyIcon className="w-6 h-6" />
                        League Portal
                      </Link>
                    )}

                    {isEFAAuthorized && (
                      <Link 
                        to="/admin/efa-dashboard" 
                        onClick={() => setIsOpen(false)}
                        className={`flex items-center gap-4 px-6 py-3.5 text-base font-black rounded-2xl transition-all ${location.pathname === '/admin/efa-dashboard' ? 'bg-white text-yellow-600 shadow-2xl' : 'text-yellow-300 hover:bg-white/10 hover:text-yellow-200'}`}
                      >
                        <ShieldCheckIcon className="w-6 h-6" />
                        EFA Dashboard
                      </Link>
                    )}

                    {isClubAdmin && (
                      <Link 
                        to="/club-management" 
                        onClick={() => setIsOpen(false)}
                        className={`flex items-center gap-4 px-6 py-3.5 text-base font-black rounded-2xl transition-all ${location.pathname === '/club-management' ? 'bg-white text-green-600 shadow-2xl' : 'text-green-300 hover:bg-white/10 hover:text-green-200'}`}
                      >
                        <DatabaseIcon className="w-6 h-6" />
                        Club Portal
                      </Link>
                    )}

                    {isJournalist && (
                      <Link 
                        to="/press" 
                        onClick={() => setIsOpen(false)}
                        className={`flex items-center gap-4 px-6 py-3.5 text-base font-black rounded-2xl transition-all ${location.pathname === '/press' ? 'bg-white text-indigo-600 shadow-2xl' : 'text-indigo-300 hover:bg-white/10 hover:text-indigo-200'}`}
                      >
                        <NewspaperIcon className="w-6 h-6" />
                        Press Portal
                      </Link>
                    )}
                  </div>
                )}

                {/* Mobile PWA Install Prompt */}
                {!isStandalone && (
                  isInstallable ? (
                    <div className="mx-6 my-4 p-5 bg-gradient-to-br from-blue-900 to-indigo-950 rounded-2xl border border-white/10 text-white shadow-2xl shrink-0">
                      <div className="flex items-center gap-3 mb-2">
                        <SmartphoneIconLucide className="w-5 h-5 text-accent" />
                        <h4 className="font-bold text-sm">Download Official App</h4>
                      </div>
                      <p className="text-[11px] text-white/70 leading-relaxed mb-4">
                        Install Football Eswatini on your device for instant offline access & real-time live logs!
                      </p>
                      <button 
                        onClick={() => { setIsOpen(false); handleInstallClick(); }}
                        className="w-full h-11 bg-accent hover:bg-yellow-500 text-primary-dark font-black text-xs uppercase tracking-wider rounded-xl transition-all shadow-lg active:scale-95 flex items-center justify-center gap-2"
                      >
                        <DownloadIconLucide className="w-4 h-4" /> Install Now
                      </button>
                    </div>
                  ) : (
                    <div className="mx-6 my-4 p-5 bg-white/5 rounded-2xl border border-white/10 text-white shrink-0">
                      <div className="flex items-center gap-3 mb-2">
                        <SmartphoneIconLucide className="w-5 h-5 text-accent" />
                        <h4 className="font-bold text-sm">Install App on Device</h4>
                      </div>
                      <p className="text-[10px] text-white/70 leading-relaxed">
                        Tap the browser's <strong>Share</strong> button, then select <strong>"Add to Home Screen"</strong> to install for standard fullscreen app experience!
                      </p>
                    </div>
                  )
                )}
             </nav>
             <div className="p-6 border-t border-white/5 bg-[#001F5C]">
                {!isLoggedIn ? (
                  <Button onClick={() => { setIsOpen(false); openAuthModal(); }} className="w-full h-14 rounded-2xl bg-accent text-primary-dark font-black text-base shadow-2xl active:scale-95 transition-transform">
                      Sign In / Join Hub
                  </Button>
                ) : (
                  <div className="flex items-center gap-4 p-4 bg-white/5 rounded-2xl border border-white/10">
                    <Link to="/profile" onClick={() => setIsOpen(false)} className="flex items-center gap-3 flex-grow min-w-0 group hover:opacity-85 transition-opacity">
                      <img src={user?.avatar || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(user?.name || 'User')}`} alt="" referrerPolicy="no-referrer" className="w-12 h-12 rounded-full border-2 border-accent transition-transform group-hover:scale-105" />
                      <div className="min-w-0">
                        <p className="font-black text-white truncate group-hover:text-accent transition-colors">{user?.name}</p>
                        <p className="text-[10px] text-accent font-black uppercase tracking-widest">{user?.role?.replace('_', ' ')}</p>
                      </div>
                    </Link>
                    <button onClick={logout} className="p-2 text-red-400 hover:text-red-300 hover:bg-white/5 rounded-xl transition-colors" aria-label="Sign Out">
                      <LogOutIcon className="w-6 h-6" />
                    </button>
                  </div>
                )}
             </div>
          </div>
        )}

        <LiveTicker />
      </header>
      
      {isCartOpen && <CartModal isOpen={isCartOpen} onClose={() => setIsCartOpen(false)} />}
    </>
  );
};

export default Navigation;
