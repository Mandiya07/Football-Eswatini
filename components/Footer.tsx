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
        { name: 'International Hub', to: '/international' },
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
    <footer className="bg-primary text-white mt-20 border-t-4 border-accent">
      <div className="container mx-auto py-12 px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-12">
          {/* Logo & Socials */}
          <div className="space-y-6">
            <div className="inline-block">
                <Link to="/" className="block bg-transparent">
                    {/* Strictly no filters here to avoid black background box */}
                    <Logo className="h-14 md:h-16 w-auto bg-transparent" />
                </Link>
            </div>
            <p className="text-white/60 text-xs leading-relaxed max-w-xs uppercase font-bold tracking-tight">
              Official Digital Gateway to Football in the Kingdom of Eswatini.
            </p>
            <div className="flex gap-3">
              <a href="https://www.facebook.com/61584176729752/" target="_blank" rel="noreferrer" className="bg-white/5 p-2 rounded-lg hover:bg-accent hover:text-primary transition-all">
                <FacebookIcon className="w-4 h-4" />
              </a>
              <a href="https://youtube.com" target="_blank" rel="noreferrer" className="bg-white/5 p-2 rounded-lg hover:bg-accent hover:text-primary transition-all">
                <YouTubeIcon className="w-4 h-4" />
              </a>
              <a href="https://instagram.com" target="_blank" rel="noreferrer" className="bg-white/5 p-2 rounded-lg hover:bg-accent hover:text-primary transition-all">
                <InstagramIcon className="w-4 h-4" />
              </a>
            </div>
          </div>

          {/* Site Map Columns */}
          {footerSections.map((section) => (
            <div key={section.title}>
              <h4 className="font-black text-[10px] uppercase tracking-[0.2em] mb-6 text-accent opacity-80">{section.title}</h4>
              <ul className="space-y-3">
                {section.links.map((link) => (
                  <li key={link.name}>
                    <Link to={link.to} className="text-white/50 hover:text-white transition-colors text-xs font-black uppercase tracking-tight">
                      {link.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="pt-8 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-4 text-[10px] text-white/30 font-black uppercase tracking-widest">
            <p>&copy; {new Date().getFullYear()} Football Eswatini. All Rights Reserved.</p>
            <div className="flex gap-6">
                <Link to="/privacy" className="hover:text-white transition-colors">Privacy</Link>
                <Link to="/terms" className="hover:text-white transition-colors">Terms</Link>
            </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;