
import React from 'react';
import { Link } from 'react-router-dom';
import Button from './ui/Button';
import Logo from './Logo';
import TrophyIcon from './icons/TrophyIcon';

const NotFound: React.FC = () => {
  return (
    <div className="min-h-[80vh] flex flex-col items-center justify-center p-6 text-center animate-fade-in">
      <div className="mb-8 p-6 bg-primary/5 rounded-full relative">
        <TrophyIcon className="w-24 h-24 text-primary opacity-20" />
        <div className="absolute inset-0 flex items-center justify-center font-display font-black text-6xl text-primary">
          404
        </div>
      </div>
      <Logo className="h-12 w-auto mb-8 opacity-50 grayscale" />
      <h1 className="text-4xl font-display font-black text-slate-900 mb-4 uppercase tracking-tighter">
        Final Whistle Blown Early!
      </h1>
      <p className="text-lg text-slate-600 max-w-md mb-10 leading-relaxed">
        We couldn't find the page you're looking for. It might have been moved, deleted, or never existed in our stadium.
      </p>
      <div className="flex flex-col sm:flex-row gap-4">
        <Link to="/">
          <Button className="bg-primary text-white h-12 px-8 rounded-xl font-bold uppercase tracking-widest shadow-lg">
            Back to Home
          </Button>
        </Link>
        <Link to="/fixtures">
          <Button variant="outline" className="h-12 px-8 rounded-xl font-bold uppercase tracking-widest">
            Check Matches
          </Button>
        </Link>
      </div>
    </div>
  );
};

export default NotFound;
