import React, { useState, useRef, useEffect } from 'react';
import { NavLink, Link } from 'react-router-dom';
import SearchIcon from './icons/SearchIcon';
import UserCircleIcon from './icons/UserCircleIcon';
import { useAuth } from '../contexts/AuthContext';
import { useCart } from '../contexts/CartContext';
import ShoppingCartIcon from './icons/ShoppingCartIcon';
import CartModal from './CartModal';

const LogoSVG: React.FC<{className?: string}> = ({ className }) => {
  // A simplified SVG representation of the logo with a transparent background
  const svgString = `<svg viewBox="0 0 525 100" xmlns="http://www.w3.org/2000/svg">
    <style>
      .football { font-family: Impact, sans-serif; font-weight: 900; font-size: 60px; fill: #E53935; }
      .eswatini { font-family: serif; font-weight: 700; font-size: 38px; fill: #E0E0E0; }
      .slogan { font-family: serif; font-style: italic; font-size: 16px; fill: #FBC531; }
    </style>
    <text x="0" y="60" class="football">FOOTBALL</text>
    <g transform="translate(245, 18)">
      <circle cx="30" cy="30" r="30" fill="#FBC531"/>
      <path d="M29.5,19c-1.1,0-2,1.3-2,3s0.9,3,2,3s2-1.3,2-3S30.6,19,29.5,19z M21.8,27.1l6,2.5l2.7-6.5l3.8,1.6l-2.7,6.5l6,2.5l-1.6,3.8l-6-2.5l-2.7,6.5l-3.8-1.6l2.7-6.5l-6-2.5L21.8,27.1z M22,48c-1.7,0-3-1.3-3-3s1.3-3,3-3s3,1.3,3,3S23.7,48,22,48z" fill="black"/>
    </g>
    <text x="315" y="55" class="eswatini">Eswatini</text>
    <text x="315" y="75" class="slogan">IT'S GAME TIME!</text>
  </svg>`;
  return <img src={`data:image/svg+xml;utf8,${encodeURIComponent(svgString)}`} alt="Football Eswatini Logo" className={className} />;
};


const Navigation: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const { isLoggedIn, user, openAuthModal, logout } = useAuth();
  const { cartCount } = useCart();
  const profileRef = useRef<HTMLDivElement>(null);

  const navItems = [
    { name: 'Home', to: '/' },
    { name: 'News', to: '/news' },
    { name: 'Fixtures', to: '/fixtures' },
    { name: 'Logs', to: '/logs' },
    { name: 'Live', to: '/live-updates' },
    { name: 'Media', to: '/media' },
    { name: 'Womens', to: '/womens' },
    { name: 'Youth', to: '/youth' },
    { name: 'National Team', to: '/national-team' },
    { name: 'Shop', to: '/shop'},
    { name: 'AI Assistant', to: '/ai-assistant' },
  ];

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
        setIsProfileOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

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
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex-shrink-0">
              <NavLink to="/">
                <LogoSVG className="h-12 w-auto" />
              </NavLink>
            </div>
            <div className="hidden md:block">
              <div className="ml-10 flex items-center space-x-4">
                {navItems.map((item) => (
                  <NavLink key={item.name} to={item.to} className={getNavLinkClass}>
                    {item.name}
                  </NavLink>
                ))}
                
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                    <SearchIcon className="h-4 w-4 text-gray-300" />
                  </span>
                  <input
                    type="text"
                    placeholder="Search..."
                    aria-label="Search"
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
                        <Link to="/admin-panel" onClick={() => setIsProfileOpen(false)} className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">Admin Panel</Link>
                      )}
                      <button onClick={() => { logout(); setIsProfileOpen(false); }} className="w-full text-left block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">Log Out</button>
                    </div>
                  )}
                </div>
              </div>
            </div>
            <div className="-mr-2 flex md:hidden items-center gap-2">
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
          <div className="md:hidden" id="mobile-menu">
            <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
              <div className="relative px-2 py-2">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-5 pointer-events-none">
                    <SearchIcon className="h-5 w-5 text-gray-400" />
                  </span>
                  <input
                    type="text"
                    placeholder="Search..."
                    aria-label="Search"
                    className="block w-full bg-primary-dark text-white placeholder-gray-400 rounded-full py-2 pl-10 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-primary focus:ring-accent"
                  />
                </div>
              {navItems.map((item) => (
                <NavLink to={item.to} key={item.name} onClick={() => setIsOpen(false)} className={getMobileNavLinkClass}>
                  {item.name}
                </NavLink>
              ))}
                
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
                        <Link to="/admin-panel" onClick={() => setIsOpen(false)} className="text-gray-300 hover:bg-primary-dark hover:text-white block px-3 py-2 rounded-md text-base font-medium">Admin Panel</Link>
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
