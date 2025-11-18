


import React from 'react';
import { Link } from 'react-router-dom';
import FacebookIcon from './icons/FacebookIcon';
import YouTubeIcon from './icons/YouTubeIcon';
import InstagramIcon from './icons/InstagramIcon';

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

const Footer: React.FC = () => {

  const socialLinks = [
    { name: 'Facebook', Icon: FacebookIcon, href: 'https://facebook.com' },
    { name: 'YouTube', Icon: YouTubeIcon, href: 'https://youtube.com' },
    { name: 'Instagram', Icon: InstagramIcon, href: 'https://instagram.com' },
  ];

  const linkClass = "text-neutral/80 hover:text-accent transition-colors text-sm";

  return (
    <footer className="bg-primary text-white mt-20">
      <div className="container mx-auto py-16 px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          <div className="md:col-span-2 lg:col-span-1">
            <Link to="/">
                <LogoSVG className="h-14 w-auto" />
            </Link>
            <p className="text-sm text-neutral/70 mt-4">Your official source for football in the Kingdom of Eswatini.</p>
          </div>

          <div>
            <h4 className="font-bold uppercase tracking-wider text-sm text-neutral/60">Explore</h4>
            <ul className="mt-4 space-y-3">
              <li><Link to="/features" className={linkClass}>Features</Link></li>
              <li><Link to="/national-team" className={linkClass}>National Team</Link></li>
              <li><Link to="/interactive" className={linkClass}>Interactive</Link></li>
              <li><Link to="/memory-lane" className={linkClass}>Memory Lane</Link></li>
              <li><Link to="/coachs-corner" className={linkClass}>Coach's Corner</Link></li>
              <li><Link to="/referees" className={linkClass}>Referees</Link></li>
              <li><Link to="/ai-assistant" className={linkClass}>AI Assistant</Link></li>
            </ul>
          </div>
          
          <div>
            <h4 className="font-bold uppercase tracking-wider text-sm text-neutral/60">Resources</h4>
            <ul className="mt-4 space-y-3">
              <li><Link to="/directory" className={linkClass}>Directory</Link></li>
              <li><Link to="/scouting" className={linkClass}>Scouting</Link></li>
              <li><Link to="/club-management" className={linkClass}>Club Portal</Link></li>
              <li><Link to="/admin-panel" className={linkClass}>Admin Panel</Link></li>
              <li><Link to="/data-management" className={linkClass}>Data Management</Link></li>
              <li><Link to="/submit-results" className={linkClass}>Submit Results</Link></li>
              <li><Link to="/submit-fixtures" className={linkClass}>Submit Fixtures</Link></li>
            </ul>
          </div>
          
          <div>
            <h4 className="font-bold uppercase tracking-wider text-sm text-neutral/60">About</h4>
            <ul className="mt-4 space-y-3">
              <li><Link to="/about" className={linkClass}>About Us</Link></li>
              <li><Link to="/contact" className={linkClass}>Contact</Link></li>
              <li><a href="#" onClick={(e) => e.preventDefault()} className={linkClass}>Privacy Policy</a></li>
              <li><a href="#" onClick={(e) => e.preventDefault()} className={linkClass}>Terms of Service</a></li>
            </ul>
          </div>
        </div>
        
        <hr className="my-10 border-white/20" />
        
        <div className="flex flex-col md:flex-row justify-between items-center gap-6">
           <p className="text-sm text-neutral/70 order-2 md:order-1">&copy; {new Date().getFullYear()} Football Eswatini. All Rights Reserved.</p>
           <div className="flex justify-center items-center gap-6 order-1 md:order-2">
            {socialLinks.map(({ name, Icon, href }) => (
              <a 
                key={name} 
                href={href} 
                target="_blank" 
                rel="noopener noreferrer" 
                aria-label={`Follow us on ${name}`}
                className="text-neutral/80 hover:text-accent transition-colors"
              >
                <Icon className="w-6 h-6" />
              </a>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;