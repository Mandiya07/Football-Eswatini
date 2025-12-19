import React from 'react';
import { Link } from 'react-router-dom';
import FacebookIcon from './icons/FacebookIcon';
import YouTubeIcon from './icons/YouTubeIcon';
import InstagramIcon from './icons/InstagramIcon';
import Logo from './Logo';

const Footer: React.FC = () => {
  const footerSections = [
    {
      title: 'Competitions',
      links: [
        { name: 'Premier League', to: '/premier-league' },
        { name: 'First Division', to: '/first-division' },
        { name: 'Domestic Cups', to: '/cups' },
        { name: 'Women\'s Football', to: '/womens' },
        { name: 'Regional Leagues', to: '/regional' },
      ]
    },
    {
      title: 'Community',
      links: [
        { name: 'Directory', to: '/directory' },
        { name: 'Scouting', to: '/scouting' },
        { name: 'Referees', to: '/referees' },
        { name: 'Youth Spotlight', to: '/youth' },
        { name: 'Fan Zone', to: '/interactive' },
      ]
    },
    {
      title: 'Football Eswatini',
      links: [
        { name: 'About Us', to: '/about' },
        { name: 'Partnerships', to: '/partnerships' },
        { name: 'Coach\'s Corner', to: '/coachs-corner' },
        { name: 'Memory Lane', to: '/memory-lane' },
        { name: 'Contact', to: '/contact' },
      ]
    }
  ];

  return (
    <footer className="bg-primary text-white mt-20 border-t-8 border-accent">
      <div className="container mx-auto py-16 px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-12">
          {/* Logo & Socials */}
          <div className="space-y-6">
            <Link to="/" className="inline-block">
                <Logo className="h-16 w-auto" />
            </Link>
            <p className="text-white/60 text-sm leading-relaxed">
              Your official digital gateway to football in the Kingdom of Eswatini. Empowering clubs, players, and fans.
            </p>
            <div className="flex gap-4">
              <a href="https://www.facebook.com/61584176729752/" target="_blank" rel="noreferrer" className="bg-white/10 p-2 rounded-full hover:bg-accent hover:text-primary transition-all">
                <FacebookIcon className="w-5 h-5" />
              </a>
              <a href="https://youtube.com" target="_blank" rel="noreferrer" className="bg-white/10 p-2 rounded-full hover:bg-accent hover:text-primary transition-all">
                <YouTubeIcon className="w-5 h-5" />
              </a>
              <a href="https://instagram.com" target="_blank" rel="noreferrer" className="bg-white/10 p-2 rounded-full hover:bg-accent hover:text-primary transition-all">
                <InstagramIcon className="w-5 h-5" />
              </a>
            </div>
          </div>

          {/* Site Map Columns */}
          {footerSections.map((section) => (
            <div key={section.title}>
              <h4 className="font-display font-bold text-lg mb-6 uppercase tracking-wider text-accent">{section.title}</h4>
              <ul className="space-y-4">
                {section.links.map((link) => (
                  <li key={link.name}>
                    <Link to={link.to} className="text-white/70 hover:text-white transition-colors text-sm font-medium">
                      {link.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="pt-8 border-t border-white/10 flex flex-col md:flex-row justify-between items-center gap-4 text-xs text-white/40 font-bold uppercase tracking-widest">
            <p>&copy; {new Date().getFullYear()} Football Eswatini. All Rights Reserved.</p>
            <div className="flex gap-6">
                <Link to="/about" className="hover:text-white transition-colors">Privacy Policy</Link>
                <Link to="/about" className="hover:text-white transition-colors">Terms of Service</Link>
            </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;