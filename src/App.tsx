import React, { Suspense, lazy } from 'react';
import { HashRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider, useAuth } from '../contexts/AuthContext';
import { CartProvider } from '../contexts/CartContext';
import { DataCacheProvider } from '../contexts/DataCacheContext';
import Navigation from '../components/Navigation';
import Footer from '../components/Footer';
import AuthModal from '../components/AuthModal';
import PWAInstallBanner from '../components/PWAInstallBanner';

console.log("App.tsx module loaded");

import Home from '../components/Home';
// Lazy load components
const EFADashboard = lazy(() => import('../components/EFADashboard'));
const EFAHubPage = lazy(() => import('../components/EFAHubPage'));
const NewsPage = lazy(() => import('../components/NewsPage'));
const NewsArticlePage = lazy(() => import('../components/NewsArticlePage'));
const FixturesPage = lazy(() => import('../components/FixturesPage'));
const LogsPage = lazy(() => import('../components/LogsPage'));
const LiveUpdatesPage = lazy(() => import('../components/LiveUpdatesPage'));
const CupsPage = lazy(() => import('../components/CupsPage'));
const NationalTeamLandingPage = lazy(() => import('../components/NationalTeamLandingPage'));
const WomensPage = lazy(() => import('../components/WomensPage'));
const YouthPage = lazy(() => import('../components/YouthPage'));
const RegionalPage = lazy(() => import('../components/RegionalPage'));
const InternationalPage = lazy(() => import('../components/InternationalPage'));
const MediaPage = lazy(() => import('../components/MediaPage'));
const ShopPage = lazy(() => import('../components/ShopPage'));
const UserProfilePage = lazy(() => import('../components/UserProfilePage'));
const PodcastsPage = lazy(() => import('../components/PodcastsPage'));
const DataManagementPage = lazy(() => import('../components/DataManagementPage'));
const ManageTeamsPage = lazy(() => import('../components/data-management/ManageTeamsPage'));
const BulkImportFixtures = lazy(() => import('../components/data-management/BulkImportFixtures'));
const ApiImportPage = lazy(() => import('../components/data-management/ApiImport'));
const TournamentBracketPage = lazy(() => import('../components/data-management/TournamentBracketPage'));
const ClubManagementPage = lazy(() => import('../components/ClubManagementPage'));
const JournalistPortalPage = lazy(() => import('../components/JournalistPortalPage'));
const AdminPanelPage = lazy(() => import('../components/AdminPanelPage'));
const AIAssistantPage = lazy(() => import('../components/AIAssistantPage'));
const AIAgentPage = lazy(() => import('../components/AIAgentPage'));
const SubmitFixturesPage = lazy(() => import('../components/SubmitFixturesPage'));
const SubmitResultsPage = lazy(() => import('../components/SubmitResultsPage'));
const TeamProfilePage = lazy(() => import('../components/TeamProfilePage'));
const PlayerProfilePage = lazy(() => import('../components/PlayerProfilePage'));
const CompetitionHubPage = lazy(() => import('../components/CompetitionHubPage'));
const LeagueRegistrationPage = lazy(() => import('../components/LeagueRegistrationPage'));
const RegionDetailPage = lazy(() => import('../components/RegionDetailPage'));
const U19Page = lazy(() => import('../components/U19Page'));
const U20Page = lazy(() => import('../components/U20Page'));
const BuildItU13Page = lazy(() => import('../components/BuildItU13Page'));
const GrassrootsU13Page = lazy(() => import('../components/GrassrootsU13Page'));
const HubU17Page = lazy(() => import('../components/HubU17Page'));
const NationalU15Page = lazy(() => import('../components/NationalU15Page'));
const NationalU17Page = lazy(() => import('../components/NationalU17Page'));
const SchoolsPage = lazy(() => import('../components/SchoolsPage'));
const NationalTeamDetailPage = lazy(() => import('../components/NationalTeamDetailPage'));
const NationalTeamPage = lazy(() => import('../components/NationalTeamPage'));
const NationalFirstDivisionPage = lazy(() => import('../components/NationalFirstDivisionPage'));
const PremierLeaguePage = lazy(() => import('../components/PremierLeaguePage'));
const About = lazy(() => import('../components/About'));
const DirectoryPage = lazy(() => import('../components/DirectoryPage'));
const InteractivePage = lazy(() => import('../components/InteractivePage'));
const ScoutingPage = lazy(() => import('../components/ScoutingPage'));
const RefereesPage = lazy(() => import('../components/RefereesPage'));
const PitchDeckPage = lazy(() => import('../components/PitchDeckPage'));
const UmbuluziPitchPage = lazy(() => import('../components/UmbuluziPitchPage'));
const PartnershipPage = lazy(() => import('../components/PartnershipPage'));
const CoachsCornerPage = lazy(() => import('../components/CoachsCornerPage'));
const MemoryLanePage = lazy(() => import('../components/MemoryLanePage'));
const ExclusivePage = lazy(() => import('../components/ExclusivePage'));
const TeamYamPage = lazy(() => import('../components/TeamYamPage'));

const ContactPage = lazy(() => import('../components/ContactPage'));
const NotFound = lazy(() => import('../components/NotFound'));

const AppContent: React.FC = () => {
  const { isAuthModalOpen, closeAuthModal } = useAuth();
  return (
    <>
      <AuthModal isOpen={isAuthModalOpen} onClose={closeAuthModal} />
      <PWAInstallBanner />
      <div className="flex flex-col min-h-screen">
        <Navigation />
        <main className="flex-grow">
          <Suspense fallback={<div className="flex items-center justify-center min-h-screen text-primary font-bold">Loading Soccer Hub...</div>}>
            <Routes>
              <Route path="/efa-hub" element={<EFAHubPage />} />
              <Route path="/admin/efa-dashboard" element={<EFADashboard />} />
              <Route path="/" element={<Home />} />
              <Route path="/news" element={<NewsPage />} />
              <Route path="/news/:id" element={<NewsArticlePage />} />
              <Route path="/fixtures" element={<FixturesPage />} />
              <Route path="/logs" element={<LogsPage />} />
              <Route path="/live-updates" element={<LiveUpdatesPage />} />
              <Route path="/cups" element={<CupsPage />} />
              <Route path="/national-team" element={<NationalTeamLandingPage />} />
              <Route path="/national-team/:teamId" element={<NationalTeamDetailPage />} />
              <Route path="/national-team/all" element={<NationalTeamPage />} />
              <Route path="/premier-league" element={<PremierLeaguePage />} />
              <Route path="/first-division" element={<NationalFirstDivisionPage />} />
              <Route path="/womens" element={<WomensPage />} />
              <Route path="/youth" element={<YouthPage />} />
              <Route path="/youth/u19" element={<U19Page />} />
              <Route path="/youth/u20" element={<U20Page />} />
              <Route path="/youth/build-it-u13" element={<BuildItU13Page />} />
              <Route path="/youth/grassroots-u13" element={<GrassrootsU13Page />} />
              <Route path="/youth/hub-u17" element={<HubU17Page />} />
              <Route path="/youth/national-u15" element={<NationalU15Page />} />
              <Route path="/youth/national-u17" element={<NationalU17Page />} />
              <Route path="/schools" element={<SchoolsPage />} />
              <Route path="/regional" element={<RegionalPage />} />
              <Route path="/region/:regionId" element={<RegionDetailPage />} />
              <Route path="/international" element={<InternationalPage />} />
              <Route path="/media" element={<MediaPage />} />
              <Route path="/podcasts" element={<PodcastsPage />} />
              <Route path="/shop" element={<ShopPage />} />
              <Route path="/profile" element={<UserProfilePage />} />
              <Route path="/about" element={<About />} />
              <Route path="/directory" element={<DirectoryPage />} />
              <Route path="/interactive" element={<InteractivePage />} />
              <Route path="/scouting" element={<ScoutingPage />} />
              <Route path="/referees" element={<RefereesPage />} />
              <Route path="/pitch-deck" element={<PitchDeckPage />} />
              <Route path="/pitch-umbuluzi" element={<UmbuluziPitchPage />} />
              <Route path="/partnerships" element={<PartnershipPage />} />
              <Route path="/coachs-corner" element={<CoachsCornerPage />} />
              <Route path="/memory-lane" element={<MemoryLanePage />} />
              <Route path="/exclusive" element={<ExclusivePage />} />
              <Route path="/team-yam" element={<TeamYamPage />} />
              <Route path="/contact" element={<ContactPage />} />
              <Route path="/data-management" element={<DataManagementPage />} />
              <Route path="/data-management/teams" element={<ManageTeamsPage />} />
              <Route path="/data-management/bulk-import" element={<BulkImportFixtures />} />
              <Route path="/data-management/api-import" element={<ApiImportPage />} />
              <Route path="/data-management/tournament-bracket" element={<TournamentBracketPage />} />
              <Route path="/submit-fixtures" element={<SubmitFixturesPage />} />
              <Route path="/submit-results" element={<SubmitResultsPage />} />
              <Route path="/club-management" element={<ClubManagementPage />} />
              <Route path="/press" element={<JournalistPortalPage />} />
              <Route path="/admin" element={<AdminPanelPage />} />
              <Route path="/ai-assistant" element={<AIAssistantPage />} />
              <Route path="/voice-scout" element={<AIAgentPage />} />
              <Route path="/team/:teamId" element={<TeamProfilePage />} />
              <Route path="/competitions/:competitionId/teams/:teamId" element={<TeamProfilePage />} />
              <Route path="/player/:playerId" element={<PlayerProfilePage />} />
              <Route path="/players/:playerId" element={<PlayerProfilePage />} />
              <Route path="/region-hub/:compId" element={<CompetitionHubPage />} />
              <Route path="/league-registration" element={<LeagueRegistrationPage />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </Suspense>
        </main>
        <Footer />
      </div>
    </>
  );
};

const App: React.FC = () => {
  return (
    <AuthProvider>
      <CartProvider>
        <DataCacheProvider>
          <Router>
            <AppContent />
          </Router>
        </DataCacheProvider>
      </CartProvider>
    </AuthProvider>
  );
};

export default App;
