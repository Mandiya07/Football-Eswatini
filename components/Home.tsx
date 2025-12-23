
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
      <LiveScoreboard />
      <QuickAccess />
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-20">
        <Suspense fallback={<SectionLoader />}>
          <SponsorSpotlight />
        </Suspense>
        <Suspense fallback={<SectionLoader />}>
          <NewsSection />
        </Suspense>
        
        <div id="matches-and-logs" className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
            <div className="w-full">
                <h2 className="text-3xl font-display font-bold mb-6 text-gray-800">Recent & Upcoming</h2>
                <Suspense fallback={<SectionLoader />}>
                    <Fixtures showSelector={false} defaultCompetition="mtn-premier-league" maxHeight="max-h-[300px]" />
                </Suspense>
            </div>
            <div className="w-full">
                <h2 className="text-3xl font-display font-bold mb-6 text-gray-800">League Standings</h2>
                <Suspense fallback={<SectionLoader />}>
                    <Logs showSelector={false} defaultLeague="mtn-premier-league" maxHeight="max-h-[300px]" />
                </Suspense>
            </div>
        </div>

        <Suspense fallback={<SectionLoader />}>
          <VideoHub />
        </Suspense>
        <Suspense fallback={<SectionLoader />}>
          <AdBanner placement="homepage-banner" />
        </Suspense>
        <Suspense fallback={<SectionLoader />}>
            <Features />
        </Suspense>
      </div>
    </>
  );
};

export default Home;
