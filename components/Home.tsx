import React, { useState, useEffect, lazy, Suspense } from 'react';
import Hero from './Hero';
import QuickAccess from './QuickAccess';
import OnboardingModal from './OnboardingModal';
import { useAuth } from '../contexts/AuthContext';
import SectionLoader from './SectionLoader';
import LiveScoreboard from './LiveScoreboard';

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
      <div className="sticky top-16 lg:top-20 z-50">
        <LiveScoreboard />
      </div>
      
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 mt-12 relative z-10">
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
                    <h2 className="text-3xl font-display font-black text-slate-900">Recent & Upcoming</h2>
                    <a href="#/fixtures" className="text-[#002B7F] font-bold text-sm hover:underline">View All Matches</a>
                </div>
                <Suspense fallback={<SectionLoader />}>
                    <Fixtures showSelector={false} defaultCompetition="mtn-premier-league" maxHeight="max-h-[600px]" />
                </Suspense>
            </div>
            
            <div className="lg:col-span-4 space-y-8">
                <div className="flex items-center justify-between">
                    <h2 className="text-3xl font-display font-black text-slate-900">Standings</h2>
                    <a href="#/logs" className="text-[#002B7F] font-bold text-sm hover:underline">Full Tables</a>
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