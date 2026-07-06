import React from 'react';
import { Link } from 'react-router-dom';
import FacebookIcon from './icons/FacebookIcon';
import YouTubeIcon from './icons/YouTubeIcon';
import InstagramIcon from './icons/InstagramIcon';
import { useAuth } from '../contexts/AuthContext';

const SecondaryNavigation: React.FC = () => {
    const { user } = useAuth();
    const linkClass = "text-xs text-white/70 hover:text-white transition-colors flex-shrink-0 py-1 leading-normal";

    return (
        <div className="bg-[#001b5c] text-white border-b border-white/5 w-full h-auto min-h-fit">
            <div className="container mx-auto px-4 sm:px-6 lg:px-8 h-auto min-h-fit">
                <div className="flex justify-between items-center h-auto min-h-fit py-2.5 gap-4">
                    {/* Left side links - scrollable on mobile */}
                    <div className="flex items-center space-x-4 overflow-x-auto scrollbar-hide whitespace-nowrap flex-grow h-auto min-h-fit py-1 my-auto">
                        <Link to="/about" className={linkClass}>About</Link>
                        <Link to="/directory" className={linkClass}>Directory</Link>
                        <Link to="/interactive" className={linkClass}>Interactive</Link>
                        <Link to="/scouting" className={linkClass}>Scouting</Link>
                        <Link to="/referees" className={linkClass}>Referees</Link>
                        <Link to="/pitch-deck" className={`${linkClass} text-accent/90 hover:text-accent font-bold`}>Pitch Deck</Link>
                        <Link to="/efa-hub" className={`${linkClass} text-accent/90 hover:text-accent font-bold animate-pulse`}>EFA Hub</Link>
                        <Link to="/partnerships" className={`${linkClass} text-yellow-400/90 hover:text-yellow-400 font-semibold`}>Partner with Us</Link>
                        <Link to="/contact" className={linkClass}>Contact</Link>
                        {(user?.role === 'super_admin' || user?.role === 'referee_admin') && (
                             <Link to="/admin" className="text-xs text-yellow-400/80 hover:text-yellow-400 font-bold flex-shrink-0 py-1 leading-normal">Admin Panel</Link>
                        )}
                    </div>

                    {/* Right side social icons */}
                    <div className="flex items-center space-x-3 flex-shrink-0 ml-2 h-auto min-h-fit">
                        <a href="https://www.facebook.com/61584176729752/" target="_blank" rel="noopener noreferrer" aria-label="Facebook" className="text-white/70 hover:text-white transition-colors">
                            <FacebookIcon className="w-3.5 h-3.5" />
                        </a>
                        <a href="https://youtube.com" target="_blank" rel="noopener noreferrer" aria-label="YouTube" className="text-white/70 hover:text-white transition-colors">
                            <YouTubeIcon className="w-3.5 h-3.5" />
                        </a>
                        <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" aria-label="Instagram" className="text-white/70 hover:text-white transition-colors">
                            <InstagramIcon className="w-3.5 h-3.5" />
                        </a>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SecondaryNavigation;