
import React, { useState, lazy } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import AdminLoginPrompt from './AdminLoginPrompt';
import ApprovalQueue from './ApprovalQueue';
import MergeTeams from './MergeTeams';
import RecalculateLogs from './RecalculateLogs';
import CreateEntities from './CreateEntities';
import TournamentBracket from './TournamentBracket';
import NewsManagement from './NewsManagement';
import ShopManagement from './ShopManagement';
import ScoutingManagement from './ScoutingManagement';
import DirectoryManagement from './DirectoryManagement';
import VideoManagement from './VideoManagement';
import ResetAllData from './ResetAllData';
import LiveUpdatesEntry from './LiveUpdatesEntry';
import ManageMatches from './ManageMatches';
import FeatureManagement from './FeatureManagement';
import RefereeManagement from './RefereeManagement';
import CategoryManagement from './CategoryManagement';
import CommunityEventManagement from './CommunityEventManagement';
import LegalAndContracts from './LegalAndContracts';
import HybridTournamentManagement from './HybridTournamentManagement';
import MaintenanceTools from './MaintenanceTools';
import UserManagement from './UserManagement';
import InquiryManagement from './InquiryManagement';
import AdminInsights from './AdminInsights';
import MerchantSettings from './MerchantSettings';

import CheckCircleIcon from '../icons/CheckCircleIcon';
import GitMergeIcon from '../icons/GitMergeIcon';
import RefreshIcon from '../icons/RefreshIcon';
import DatabaseIcon from '../icons/DatabaseIcon';
import BracketIcon from '../icons/BracketIcon';
import NewspaperIcon from '../icons/NewspaperIcon';
import TagIcon from '../icons/TagIcon';
import BinocularsIcon from '../icons/BinocularsIcon';
import BookIcon from '../icons/BookIcon';
import FilmIcon from '../icons/FilmIcon';
import LayersIcon from '../icons/LayersIcon';
import AlertTriangleIcon from '../icons/AlertTriangleIcon';
import UsersIcon from '../icons/UsersIcon';
import MegaphoneIcon from '../icons/MegaphoneIcon';
import RadioIcon from '../icons/RadioIcon';
import CalendarIcon from '../icons/CalendarIcon';
import YouthIcon from '../icons/YouthIcon';
import SparklesIcon from '../icons/SparklesIcon';
import WhistleIcon from '../icons/WhistleIcon';
import ShareIcon from '../icons/ShareIcon';
import ImageIcon from '../icons/ImageIcon';
import ScaleIcon from '../icons/ScaleIcon';
import GlobeIcon from '../icons/GlobeIcon';
import SettingsIcon from '../icons/SettingsIcon';
import ShieldIcon from '../icons/ShieldIcon';
import BriefcaseIcon from '../icons/BriefcaseIcon';
import MicIcon from '../icons/MicIcon';
import CreditCardIcon from '../icons/CreditCardIcon';
import { Link } from 'react-router-dom';

const ManageTeams = lazy(() => import('./ManageTeams'));
const AdManagement = lazy(() => import('./AdManagement'));
const SeedDatabase = lazy(() => import('./SeedDatabase'));
const YouthManagement = lazy(() => import('./YouthManagement'));
const SocialMediaGenerator = lazy(() => import('./SocialMediaGenerator'));
const TeamCrestManager = lazy(() => import('./TeamCrestManager'));

type AdminTab = 'approvals' | 'users' | 'news' | 'shop' | 'scouting' | 'directory' | 'videos' | 'ads' | 'create' | 'merge' | 'standings' | 'tournament' | 'categories' | 'reset' | 'teams' | 'live' | 'matches' | 'seed' | 'youth' | 'features' | 'referees' | 'social' | 'crests' | 'community' | 'contracts' | 'international' | 'maintenance' | 'inquiries' | 'insights' | 'finance';

const AdminPanelPage: React.FC = () => {
  const { isLoggedIn, user } = useAuth();
  const [activeTab, setActiveTab] = useState<AdminTab>('approvals');

  if (!isLoggedIn || user?.role !== 'super_admin') {
    return (
      <div className="bg-gray-50 py-12">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 animate-fade-in">
          <AdminLoginPrompt />
        </div>
      </div>
    );
  }

  const renderContent = () => {
    switch (activeTab) {
      case 'approvals': return <ApprovalQueue />;
      case 'users': return <UserManagement />;
      case 'inquiries': return <InquiryManagement />;
      case 'news': return <NewsManagement />;
      case 'shop': return <ShopManagement />;
      case 'scouting': return <ScoutingManagement />;
      case 'youth': return <YouthManagement />;
      case 'directory': return <DirectoryManagement />;
      case 'crests': return <TeamCrestManager />;
      case 'videos': return <VideoManagement />;
      case 'features': return <FeatureManagement />;
      case 'referees': return <RefereeManagement />;
      case 'ads': return <AdManagement />;
      case 'live': return <LiveUpdatesEntry />;
      case 'matches': return <ManageMatches />;
      case 'create': return <CreateEntities />;
      case 'categories': return <CategoryManagement />;
      case 'teams': return <ManageTeams />;
      case 'merge': return <MergeTeams />;
      case 'standings': return <RecalculateLogs />;
      case 'tournament': return <TournamentBracket />;
      case 'international': return <HybridTournamentManagement />;
      case 'community': return <CommunityEventManagement />;
      case 'contracts': return <LegalAndContracts />;
      case 'seed': return <SeedDatabase />;
      case 'reset': return <ResetAllData />;
      case 'social': return <SocialMediaGenerator />;
      case 'maintenance': return <MaintenanceTools />;
      case 'insights': return <AdminInsights />;
      case 'finance': return <MerchantSettings />;
      default: return null;
    }
  };

  const TabButton: React.FC<{tabName: AdminTab; label: string; Icon: React.FC<React.SVGProps<SVGSVGElement>>; className?: string}> = ({ tabName, label, Icon, className = '' }) => {
    const isActive = activeTab === tabName;
    
    return (
        <button
            onClick={() => setActiveTab(tabName)}
            className={`flex items-center gap-3 px-4 py-3 text-sm font-semibold rounded-lg transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-primary-light w-full text-left ${
                isActive 
                ? `shadow-lg scale-[1.02] ${className || 'bg-primary text-white'}`
                : `hover:bg-gray-100 ${className ? '' : 'text-gray-600'}`
            }`}
            role="tab"
            aria-selected={isActive}
        >
            <Icon className={`w-5 h-5 ${isActive ? 'text-white' : 'text-gray-400'}`} />
            <span className={isActive ? 'text-white' : ''}>{label}</span>
        </button>
    );
  };

  return (
    <div className="bg-gray-50 py-12">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 animate-fade-in">
            <div className="mb-8">
                <h1 className="text-4xl font-display font-extrabold text-blue-800">
                    Administrator Panel
                </h1>
                <p className="text-lg text-gray-600">
                    High-level data management and moderation tools.
                </p>
            </div>

            <div className="flex flex-col md:flex-row gap-8 items-start">
                <aside className="w-full md:w-64 flex-shrink-0">
                    <div className="space-y-2 bg-white p-3 rounded-lg shadow-sm border border-gray-200">
                        <h4 className="font-bold text-xs uppercase text-gray-400 px-4 pt-2">Strategy & AI</h4>
                        <TabButton tabName="insights" label="AI Daily Insights" Icon={SparklesIcon} className="bg-indigo-600 text-white hover:bg-indigo-700" />
                        
                        <h4 className="font-bold text-xs uppercase text-gray-400 px-4 pt-4">Finance</h4>
                        <TabButton tabName="finance" label="Merchant & Payouts" Icon={CreditCardIcon} className="bg-green-600 text-white hover:bg-green-700" />
                        <TabButton tabName="inquiries" label="Partner Inquiries" Icon={BriefcaseIcon} className="bg-blue-600 text-white hover:bg-blue-700" />

                        <h4 className="font-bold text-xs uppercase text-gray-400 px-4 pt-4">Content</h4>
                        <TabButton tabName="news" label="News" Icon={NewspaperIcon} />
                        <TabButton tabName="social" label="Social Gen" Icon={ShareIcon} className="bg-purple-600 text-white hover:bg-purple-700" />
                        <TabButton tabName="shop" label="Shop Items" Icon={TagIcon} />
                        <TabButton tabName="features" label="Features Content" Icon={SparklesIcon} />
                        <TabButton tabName="scouting" label="Scouting" Icon={BinocularsIcon} />
                        <TabButton tabName="youth" label="Youth Page" Icon={YouthIcon} />
                        <TabButton tabName="referees" label="Referees" Icon={WhistleIcon} />
                        <TabButton tabName="directory" label="Directory" Icon={BookIcon} />
                        <TabButton tabName="crests" label="Logos & Crests" Icon={ImageIcon} />
                        <TabButton tabName="videos" label="Videos" Icon={FilmIcon} />
                        <TabButton tabName="ads" label="Ad Management" Icon={MegaphoneIcon} />

                        <h4 className="font-bold text-xs uppercase text-gray-400 px-4 pt-4">Moderation & Data</h4>
                        <TabButton tabName="approvals" label="Approval Queue" Icon={CheckCircleIcon} />
                        <TabButton tabName="users" label="User Permissions" Icon={ShieldIcon} />
                        <TabButton tabName="community" label="Community Events" Icon={UsersIcon} />
                        <TabButton tabName="live" label="Live Updates Entry" Icon={RadioIcon} />
                        <TabButton tabName="matches" label="Manage Matches" Icon={CalendarIcon} />
                        <TabButton tabName="international" label="International Hub" Icon={GlobeIcon} />
                        <TabButton tabName="create" label="Create Entities" Icon={DatabaseIcon} />
                        <TabButton tabName="categories" label="Manage Categories" Icon={LayersIcon} />
                        <TabButton tabName="teams" label="Manage Teams" Icon={UsersIcon} />
                        <TabButton tabName="merge" label="Merge Teams" Icon={GitMergeIcon} />
                        <TabButton tabName="standings" label="Recalculate Logs" Icon={RefreshIcon} />
                        <TabButton tabName="tournament" label="Tournament Bracket" Icon={BracketIcon} />

                        <h4 className="font-bold text-xs uppercase text-gray-400 px-4 pt-4">System</h4>
                        <TabButton tabName="maintenance" label="Maintenance" Icon={SettingsIcon} className="bg-blue-600 text-white hover:bg-blue-700" />
                        <TabButton tabName="contracts" label="Legal & Contracts" Icon={ScaleIcon} />

                        <div className="!mt-6 pt-4 border-t border-red-200">
                            <h4 className="font-bold text-xs uppercase text-red-600 px-4">Danger Zone</h4>
                             <div className="p-2 space-y-2">
                                <TabButton tabName="seed" label="Seed Database" Icon={DatabaseIcon} className="bg-green-600 hover:bg-green-700 text-white" />
                                <TabButton tabName="reset" label="Reset All Competition Data" Icon={AlertTriangleIcon} className="bg-red-600 hover:bg-red-700 text-white" />
                            </div>
                        </div>
                    </div>
                </aside>
                <main className="flex-grow w-full">
                    {renderContent()}
                </main>
            </div>
        </div>
    </div>
  );
};

export default AdminPanelPage;
