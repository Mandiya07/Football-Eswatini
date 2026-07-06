import React, { useState, useEffect, lazy, Suspense } from 'react';
import Hero from './Hero';
import QuickAccess from './QuickAccess';
import OnboardingModal from './OnboardingModal';
import { useAuth } from '../contexts/AuthContext';
import SectionLoader from './SectionLoader';
import LiveScoreboard from './LiveScoreboard';
import { Link } from 'react-router-dom';
import TagIcon from './icons/TagIcon';
import ShoppingCartIcon from './icons/ShoppingCartIcon';
import ArrowRightIcon from './icons/ArrowRightIcon';
import GlobeIcon from './icons/GlobeIcon';
import { Card } from './ui/Card';
import ShieldCheckIcon from './icons/ShieldCheckIcon';
import SparklesIcon from './icons/SparklesIcon';
import { safeLocalStorage } from '../services/utils';

// Lazy load components that are below the fold
const SponsorSpotlight = lazy(() => import('./SponsorSpotlight'));
const NewsSection = lazy(() => import('./News'));
const VideoHub = lazy(() => import('./VideoHub'));
const AdBanner = lazy(() => import('./AdBanner'));
const Fixtures = lazy(() => import('./Fixtures'));
const Logs = lazy(() => import('./Logs'));
const Features = lazy(() => import('./Features'));

const Home: React.FC = () => {
  const { isLoggedIn } = useAuth();
  const [showOnboarding, setShowOnboarding] = useState(false);

  useEffect(() => {
    if (isLoggedIn && !safeLocalStorage.getItem('onboardingComplete')) {
        const timer = setTimeout(() => setShowOnboarding(true), 500);
        return () => clearTimeout(timer);
    }
  }, [isLoggedIn]);

  const handleOnboardingFinish = () => {
      safeLocalStorage.setItem('onboardingComplete', 'true');
      setShowOnboarding(false);
  };

  return (
    <>
      {showOnboarding && <OnboardingModal onClose={handleOnboardingFinish} />}
      <Hero />
      
      {/* Official App Sponsor Bar */}
      <div className="bg-[#002B7F] py-3 border-y border-white/10 uppercase font-black text-center relative overflow-hidden group">
          <div className="container mx-auto px-4 flex items-center justify-center gap-2 sm:gap-6 text-white group-hover:scale-[1.01] transition-transform">
              <span className="text-[10px] sm:text-xs tracking-[0.3em] opacity-60 hidden md:block">Strategic Partnership</span>
              <div className="bg-white/10 p-1 rounded-lg border border-white/10 flex items-center gap-2 px-3">
                  <ShieldCheckIcon className="w-4 h-4 text-accent" />
                  <span className="text-[10px] sm:text-xs tracking-widest">Sponsored by EFA</span>
              </div>
              <span className="text-[10px] sm:text-xs tracking-[0.3em] opacity-60 flex items-center gap-2">
                  Keeping High-Depth Soccer Free for Fans <SparklesIcon className="w-3 h-3 text-accent" />
              </span>
          </div>
          <div className="absolute top-0 right-0 h-full w-32 bg-gradient-to-l from-accent/10 to-transparent pointer-events-none"></div>
      </div>

      <div className="relative z-40 bg-white">
        <LiveScoreboard />
      </div>

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 mt-12 space-y-12">
        <QuickAccess />
      </div>

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-24">
        
        <Suspense fallback={<SectionLoader />}>
          <div className="max-w-5xl mx-auto">
             <SponsorSpotlight />
          </div>
        </Suspense>

        <Suspense fallback={<SectionLoader />}>
            <NewsSection limit={3} />
        </Suspense>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
            <div className="space-y-8">
                <div className="flex items-center justify-between">
                    <h2 className="text-3xl font-display font-black text-slate-900 uppercase tracking-tighter">Match Schedule</h2>
                    <Link to="/fixtures" className="text-white font-black text-[11px] uppercase tracking-widest bg-primary px-4 py-2 rounded-full shadow-md hover:bg-primary-dark transition-colors">View All &rarr;</Link>
                </div>
                <Suspense fallback={<SectionLoader />}>
                    <Fixtures showSelector={false} defaultCompetition="mtn-premier-league" maxHeight="h-[600px]" />
                </Suspense>
            </div>
            
            <div className="space-y-8">
                <div className="flex items-center justify-between">
                    <h2 className="text-3xl font-display font-black text-slate-900 uppercase tracking-tighter">Leagues</h2>
                    <Link to="/logs" className="text-white font-black text-[11px] uppercase tracking-widest bg-primary px-4 py-2 rounded-full shadow-md hover:bg-primary-dark transition-colors">Tables &rarr;</Link>
                </div>
                <Suspense fallback={<SectionLoader />}>
                    <Logs showSelector={false} defaultLeague="mtn-premier-league" maxHeight="h-[600px]" />
                </Suspense>
                
                <div className="pt-6">
                   <AdBanner placement="homepage-sidebar" className="h-64" />
                </div>
            </div>
        </div>

        <Suspense fallback={<SectionLoader />}>
          <VideoHub limit={3} />
        </Suspense>

        <div className="py-12 border-y border-slate-100">
          <Suspense fallback={<SectionLoader />}>
            <AdBanner placement="homepage-banner" />
          </Suspense>
        </div>

        <Suspense fallback={<SectionLoader />}>
            <Features />
        </Suspense>
      </div>
    </>
  );
};

export default Home;