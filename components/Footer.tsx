
import React from 'react';
import { Link } from 'react-router-dom';
import FacebookIcon from './icons/FacebookIcon';
import YouTubeIcon from './icons/YouTubeIcon';
import InstagramIcon from './icons/InstagramIcon';
import Logo from './Logo';

const Footer: React.FC = () => {

  const socialLinks = [
    { name: 'Facebook', Icon: FacebookIcon, href: 'https://www.facebook.com/61584176729752/' },
    { name: 'YouTube', Icon: YouTubeIcon, href: 'https://youtube.com' },
    { name: 'Instagram', Icon: InstagramIcon, href: 'https://instagram.com' },
  ];

  return (
    <footer className="bg-primary text-white mt-20">
      <div className="container mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row justify-between items-center gap-8">
          <div className="text-center md:text-left">
            <Link to="/" className="inline-block">
                <Logo className="h-14 w-auto mx-auto md:mx-0" />
            </Link>
            <div className="flex flex-col md:flex-row gap-4 mt-4 text-sm text-neutral/70">
                <p>&copy; {new Date().getFullYear()} Football Eswatini. All Rights Reserved.</p>
                <span className="hidden md:inline">•</span>
                <Link to="/partnerships" className="hover:text-accent transition-colors">Partnership & Opportunities</Link>
            </div>
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
