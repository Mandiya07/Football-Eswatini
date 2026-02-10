import React from 'react';
import { Link } from 'react-router-dom';
import FacebookIcon from './icons/FacebookIcon';
import YouTubeIcon from './icons/YouTubeIcon';
import InstagramIcon from './icons/InstagramIcon';
import { useAuth } from '../contexts/AuthContext';

const SecondaryNavigation: React.FC = () => {
    const { user } = useAuth();
    const linkClass = "text-xs text-white/70 hover:text-white transition-colors";

    return (
        <div className="bg-primary-dark text-white hidden sm:block">
            <div className="container mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between items-center h-8">
                    {/* Left side links */}
                    <div className="flex items-center space-x-4">
                        <Link to="/about" className={linkClass}>About</Link>
                        <Link to="/directory" className={linkClass}>Directory</Link>
                        <Link to="/interactive" className={linkClass}>Interactive</Link>
                        <Link to="/scouting" className={linkClass}>Scouting</Link>
                        <Link to="/referees" className={linkClass}>Referees</Link>
                        <Link to="/pitch-deck" className={`${linkClass} text-accent/90 hover:text-accent font-bold`}>Pitch Deck</Link>
                        <Link to="/partnerships" className={`${linkClass} text-yellow-400/90 hover:text-yellow-400 font-semibold`}>Partner with Us</Link>
                        <Link to="/contact" className={linkClass}>Contact</Link>
                        {user?.role === 'super_admin' && (
                             <Link to="/admin-panel" className="text-xs text-yellow-400/80 hover:text-yellow-400 font-bold">Admin Panel</Link>
                        )}
                    </div>

                    {/* Right side social icons */}
                    <div className="flex items-center space-x-4">
                        <a href="https://www.facebook.com/61584176729752/" target="_blank" rel="noopener noreferrer" aria-label="Facebook" className="text-white/70 hover:text-white transition-colors">
                            <FacebookIcon className="w-4 h-4" />
                        </a>
                        <a href="https://youtube.com" target="_blank" rel="noopener noreferrer" aria-label="YouTube" className="text-white/70 hover:text-white transition-colors">
                            <YouTubeIcon className="w-4 h-4" />
                        </a>
                        <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" aria-label="Instagram" className="text-white/70 hover:text-white transition-colors">
                            <InstagramIcon className="w-4 h-4" />
                        </a>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SecondaryNavigation;