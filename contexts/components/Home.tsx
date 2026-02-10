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
    if (isLoggedIn && !localStorage.getItem('onboardingComplete')) {
        const timer = setTimeout(() => setShowOnboarding(true), 500);
        return () => clearTimeout(timer);
    }
  }, [isLoggedIn]);

  const handleOnboardingFinish = () => {
      localStorage.setItem('onboardingComplete', 'true');
      setShowOnboarding(false);
  };

  return (
    <>
      {showOnboarding && <OnboardingModal onClose={handleOnboardingFinish} />}
      <Hero />
      
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
        
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
            <div className="lg:col-span-8 space-y-8">
                <div className="flex items-center justify-between">
                    <h2 className="text-3xl font-display font-black text-slate-900 uppercase tracking-tighter">Match Schedule</h2>
                    <a href="#/fixtures" className="text-white font-black text-[11px] uppercase tracking-widest bg-primary px-4 py-2 rounded-full shadow-md hover:bg-primary-dark transition-colors">View All &rarr;</a>
                </div>
                <Suspense fallback={<SectionLoader />}>
                    <Fixtures showSelector={false} defaultCompetition="mtn-premier-league" maxHeight="max-h-[600px]" />
                </Suspense>
            </div>
            
            <div className="lg:col-span-4 space-y-8">
                <div className="flex items-center justify-between">
                    <h2 className="text-3xl font-display font-black text-slate-900 uppercase tracking-tighter">Leagues</h2>
                    <a href="#/logs" className="text-white font-black text-[11px] uppercase tracking-widest bg-primary px-4 py-2 rounded-full shadow-md hover:bg-primary-dark transition-colors">Tables &rarr;</a>
                </div>
                <Suspense fallback={<SectionLoader />}>
                    <Logs showSelector={false} defaultLeague="mtn-premier-league" maxHeight="max-h-[600px]" />
                </Suspense>
                
                <div className="pt-6">
                   <AdBanner placement="homepage-sidebar" className="h-64" />
                </div>
            </div>
        </div>

        <Suspense fallback={<SectionLoader />}>
          <VideoHub />
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