
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

const Navigation: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isClubMenuOpen, setIsClubMenuOpen] = useState(false);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const { isLoggedIn, user, openAuthModal, logout } = useAuth();
  const { cartCount } = useCart();
  const profileRef = useRef<HTMLDivElement>(null);
  const clubMenuRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  const navItems = [
    { name: 'Home', to: '/' },
    { name: 'News', to: '/news' },
    { name: 'Fixtures', to: '/fixtures' },
    { name: 'Logs', to: '/logs' },
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
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSearch = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && searchQuery.trim()) {
      navigate(`/news?q=${encodeURIComponent(searchQuery.trim())}`);
      setIsOpen(false); // Close mobile menu if open
    }
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

                <div className="relative">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                    <SearchIcon className="h-4 w-4 text-gray-300" />
                  </span>
                  <input
                    type="text"
                    placeholder="Search..."
                    aria-label="Search"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyDown={handleSearch}
                    className="bg-white/20 text-white placeholder-gray-300 rounded-full py-1.5 pl-9 pr-4 text-sm w-36 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-primary focus:ring-accent focus:w-48 transition-all duration-300"
                  />
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
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyDown={handleSearch}
                    className="block w-full bg-primary-dark text-white placeholder-gray-400 rounded-full py-2 pl-10 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-primary focus:ring-accent"
                  />
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
