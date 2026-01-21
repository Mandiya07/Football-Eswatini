
import React, { Suspense, lazy } from 'react';
import { HashRouter, Routes, Route } from 'react-router-dom';
import Navigation from './components/Navigation';
import Footer from './components/Footer';
import Home from './components/Home';
import About from './components/About';
import FixturesPage from './components/FixturesPage';
import LogsPage from './components/LogsPage';
import FeaturesPage from './components/FeaturesPage';
import ContactPage from './components/ContactPage';
import TeamProfilePage from './components/TeamProfilePage';
import PlayerProfilePage from './components/PlayerProfilePage';
import AuthModal from './components/AuthModal';
import { useAuth } from './contexts/AuthContext';
import DataManagementPage from './components/DataManagementPage';


const InteractivePage = lazy(() => import('./components/InteractivePage'));
const MediaPage = lazy(() => import('./components/MediaPage'));
const UserProfilePage = lazy(() => import('./components/UserProfilePage'));
const ProfileSetupPage = lazy(() => import('./components/ProfileSetupPage'));
const NewsPage = lazy(() => import('./components/NewsPage'));
const NewsArticlePage = lazy(() => import('./components/NewsArticlePage'));
const AdminPanelPage = lazy(() => import('./components/admin/AdminPanelPage'));
const ShopPage = lazy(() => import('./components/ShopPage'));
const YouthPage = lazy(() => import('./components/YouthPage'));
const U20Page = lazy(() => import('./components/U20Page'));
const SchoolsPage = lazy(() => import('./components/SchoolsPage'));
const HubU17Page = lazy(() => import('./components/HubU17Page'));
const BuildItU13Page = lazy(() => import('./components/BuildItU13Page'));
const WomensPage = lazy(() => import('./components/WomensPage'));
const PremierLeaguePage = lazy(() => import('./components/PremierLeaguePage'));
const NationalFirstDivisionPage = lazy(() => import('./components/NationalFirstDivisionPage'));
const CupsPage = lazy(() => import('./components/CupsPage'));
const DirectoryPage = lazy(() => import('./components/DirectoryPage'));
const ScoutingPage = lazy(() => import('./components/ScoutingPage'));
const ClubManagementPage = lazy(() => import('./components/ClubManagementPage'));
const CoachsCornerPage = lazy(() => import('./components/CoachsCornerPage'));
const MemoryLanePage = lazy(() => import('./components/MemoryLanePage'));
const SubmitResultsPage = lazy(() => import('./components/SubmitResultsPage'));
const BulkImportPage = lazy(() => import('./components/data-management/BulkImportFixtures'));
const ApiImportPage = lazy(() => import('./components/data-management/ApiImport'));
const SubmitFixturesPage = lazy(() => import('./components/SubmitFixturesPage'));
const RefereesPage = lazy(() => import('./components/RefereesPage'));
const AIAssistantPage = lazy(() => import('./components/AIAssistantPage'));
const AIAgentPage = lazy(() => import('./components/AIAgentPage'));
const NationalTeamLandingPage = lazy(() => import('./components/NationalTeamLandingPage'));
const NationalTeamDetailPage = lazy(() => import('./components/NationalTeamDetailPage'));
const RegionalPage = lazy(() => import('./components/RegionalPage'));
const RegionDetailPage = lazy(() => import('./components/RegionDetailPage'));
const CompetitionHubPage = lazy(() => import('./components/CompetitionHubPage'));
const LiveUpdatesPage = lazy(() => import('./components/LiveUpdatesPage'));
const TeamYamPage = lazy(() => import('./components/TeamYamPage'));
const ExclusivePage = lazy(() => import('./components/ExclusivePage'));
const PartnershipPage = lazy(() => import('./components/PartnershipPage'));
const ClubRegistrationPage = lazy(() => import('./components/ClubRegistrationPage'));
const AdvertiserOnboardingPage = lazy(() => import('./components/AdvertiserOnboardingPage'));
const SponsorOnboardingPage = lazy(() => import('./components/SponsorOnboardingPage'));
const BrandedClubExample = lazy(() => import('./components/BrandedClubExample'));
const InternationalPage = lazy(() => import('./components/InternationalPage'));
const LeagueRegistrationPage = lazy(() => import('./components/LeagueRegistrationPage'));
const PitchDeckPage = lazy(() => import('./components/pitch-deck-page'));


const App: React.FC = () => {
  const { isAuthModalOpen, closeAuthModal } = useAuth();
  
  return (
    <HashRouter>
      <div className="min-h-screen font-sans text-gray-800 antialiased">
        <Navigation />
        <main>
          <Suspense fallback={<div className="p-8 text-center">Loading Page...</div>}>
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/news" element={<NewsPage />} />
              <Route path="/news/:slug" element={<NewsArticlePage />} />
              <Route path="/about" element={<About />} />
              <Route path="/fixtures" element={<FixturesPage />} />
              <Route path="/logs" element={<LogsPage />} />
              <Route path="/live-updates" element={<LiveUpdatesPage />} />
              <Route path="/referees" element={<RefereesPage />} />
              <Route path="/features" element={<FeaturesPage />} />
              <Route path="/cups" element={<CupsPage />} />
              <Route path="/interactive" element={<InteractivePage />} />
              <Route path="/media" element={<MediaPage />} />
              <Route path="/youth" element={<YouthPage />} />
              <Route path="/youth/u20" element={<U20Page />} />
              <Route path="/youth/hub-u17" element={<HubU17Page />} />
              <Route path="/youth/build-it-u13" element={<BuildItU13Page />} />
              <Route path="/schools" element={<SchoolsPage />} />
              <Route path="/womens" element={<WomensPage />} />
              <Route path="/premier-league" element={<PremierLeaguePage />} />
              <Route path="/first-division" element={<NationalFirstDivisionPage />} />
              <Route path="/national-team" element={<NationalTeamLandingPage />} />
              <Route path="/national-team/:teamId" element={<NationalTeamDetailPage />} />
              <Route path="/international" element={<InternationalPage />} />
              <Route path="/regional" element={<RegionalPage />} />
              <Route path="/region/:regionId" element={<RegionDetailPage />} />
              <Route path="/region-hub/:compId" element={<CompetitionHubPage />} />
              <Route path="/league-registration" element={<LeagueRegistrationPage />} />
              <Route path="/contact" element={<ContactPage />} />
              <Route path="/partnerships" element={<PartnershipPage />} />
              <Route path="/club-registration" element={<ClubRegistrationPage />} />
              <Route path="/advertiser-onboarding" element={<AdvertiserOnboardingPage />} />
              <Route path="/sponsor-onboarding" element={<SponsorOnboardingPage />} />
              <Route path="/branded-example" element={<BrandedClubExample />} />
              <Route path="/shop" element={<ShopPage />} />
              <Route path="/profile" element={<UserProfilePage />} />
              <Route path="/profile/setup" element={<ProfileSetupPage />} />
              <Route path="/directory" element={<DirectoryPage />} />
              <Route path="/scouting" element={<ScoutingPage />} />
              <Route path="/competitions/:competitionId/teams/:teamId" element={<TeamProfilePage />} />
              <Route path="/players/:playerId" element={<PlayerProfilePage />} />
              <Route path="/admin-panel" element={<AdminPanelPage />} />
              <Route path="/club-management" element={<ClubManagementPage />} />
              <Route path="/coachs-corner" element={<CoachsCornerPage />} />
              <Route path="/memory-lane" element={<MemoryLanePage />} />
              <Route path="/team-yam" element={<TeamYamPage />} />
              <Route path="/exclusive" element={<ExclusivePage />} />
              <Route path="/data-management" element={<DataManagementPage />} />
              <Route path="/data-management/bulk-import" element={<BulkImportPage />} />
              <Route path="/data-management/api-import" element={<ApiImportPage />} />
              <Route path="/submit-results" element={<SubmitResultsPage />} />
              <Route path="/submit-fixtures" element={<SubmitFixturesPage />} />
              <Route path="/ai-assistant" element={<AIAssistantPage />} />
              <Route path="/voice-scout" element={<AIAgentPage />} />
              <Route path="/pitch-deck" element={<PitchDeckPage />} />
            </Routes>
          </Suspense>
        </main>
        <Footer />
        <AuthModal isOpen={isAuthModalOpen} onClose={closeAuthModal} />
      </div>
    </HashRouter>
  );
};

export default App;
