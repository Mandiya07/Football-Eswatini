

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

  return (
    <footer className="bg-primary text-white mt-20">
      <div className="container mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row justify-between items-center gap-8">
          <div className="text-center md:text-left">
            <Link to="/" className="inline-block">
                <LogoSVG className="h-14 w-auto mx-auto md:mx-0" />
            </Link>
            <p className="text-sm text-neutral/70 mt-2">&copy; {new Date().getFullYear()} Football Eswatini. All Rights Reserved.</p>
          </div>
          
          <div className="flex justify-center items-center gap-6">
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
