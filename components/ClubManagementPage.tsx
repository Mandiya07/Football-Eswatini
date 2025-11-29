
import React, { useState, lazy, Suspense } from 'react';
import { useAuth } from '../contexts/AuthContext';
import ClubLoginPrompt from './management/ClubLoginPrompt';
import UpdateScores from './management/UpdateScores';
import ManageSquad from './management/ManageSquad';
import ManageMatchDay from './management/ManageMatchDay';
import ManageStaff from './management/ManageStaff';
import TrophyIcon from './icons/TrophyIcon';
import UsersIcon from './icons/UsersIcon';
import ClipboardListIcon from './icons/ClipboardListIcon';
import BriefcaseIcon from './icons/BriefcaseIcon';
import NewspaperIcon from './icons/NewspaperIcon';
import PhotoIcon from './icons/PhotoIcon';
import VoteIcon from './icons/VoteIcon';
import ShareIcon from './icons/ShareIcon';
import SectionLoader from './SectionLoader';

const ClubNewsManagement = lazy(() => import('./management/ClubNewsManagement'));
const ClubGalleryManagement = lazy(() => import('./management/ClubGalleryManagement'));
const ClubPollsManagement = lazy(() => import('./management/ClubPollsManagement'));
const ClubSocialMedia = lazy(() => import('./management/ClubSocialMedia'));

const ClubManagementPage: React.FC = () => {
  const { isLoggedIn, user } = useAuth();
  const [activeTab, setActiveTab] = useState<'scores' | 'squad' | 'staff' | 'matchday' | 'news' | 'gallery' | 'polls' | 'social'>('scores');

  if (!isLoggedIn || (user?.role !== 'club_admin' && user?.role !== 'super_admin')) {
    return (
        <div className="bg-gray-50 py-12">
            <div className="container mx-auto px-4 sm:px-6 lg:px-8 animate-fade-in">
                <ClubLoginPrompt />
            </div>
        </div>
    );
  }

  const renderContent = () => {
    switch (activeTab) {
      case 'scores':
        return <UpdateScores clubName={user.club!} />;
      case 'squad':
        return <ManageSquad clubName={user.club!} />;
      case 'staff':
        return <ManageStaff clubName={user.club!} />;
      case 'matchday':
        return <ManageMatchDay clubName={user.club!} />;
      case 'news':
        return <Suspense fallback={<SectionLoader />}><ClubNewsManagement clubName={user.club!} /></Suspense>;
      case 'gallery':
        return <Suspense fallback={<SectionLoader />}><ClubGalleryManagement clubName={user.club!} /></Suspense>;
      case 'polls':
        return <Suspense fallback={<SectionLoader />}><ClubPollsManagement clubName={user.club!} /></Suspense>;
      case 'social':
        return <Suspense fallback={<SectionLoader />}><ClubSocialMedia clubName={user.club!} /></Suspense>;
      default:
        return null;
    }
  };

  const TabButton: React.FC<{tabName: typeof activeTab; label: string; Icon: React.FC<React.SVGProps<SVGSVGElement>>}> = ({ tabName, label, Icon }) => (
    <button
        onClick={() => setActiveTab(tabName)}
        className={`flex items-center gap-3 px-4 py-3 text-sm font-semibold rounded-md transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-light w-full text-left ${
            activeTab === tabName 
            ? 'bg-primary text-white shadow-md'
            : 'text-gray-600 hover:bg-gray-100 hover:text-primary'
        }`}
        role="tab"
        aria-selected={activeTab === tabName}
    >
        <Icon className="w-5 h-5" />
        <span>{label}</span>
    </button>
  );


  return (
    <div className="bg-gray-50 py-12">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 animate-fade-in">
            <div className="mb-8">
                <h1 className="text-4xl font-display font-extrabold text-blue-800">
                    Welcome, {user.club}
                </h1>
                <p className="text-lg text-gray-600">
                    Manage your team's data, content, and fan engagement.
                </p>
            </div>

            <div className="flex flex-col lg:flex-row gap-8 items-start">
                <aside className="w-full lg:w-72 flex-shrink-0">
                    <div className="bg-white p-4 rounded-lg shadow-md border border-gray-200">
                        <div className="space-y-1">
                            <p className="px-4 py-2 text-xs font-bold text-gray-400 uppercase tracking-wider">Team Management</p>
                            <TabButton tabName="scores" label="Update Scores" Icon={TrophyIcon} />
                            <TabButton tabName="squad" label="Manage Squad" Icon={UsersIcon} />
                            <TabButton tabName="staff" label="Manage Staff" Icon={BriefcaseIcon} />
                            <TabButton tabName="matchday" label="Submit Team Sheet" Icon={ClipboardListIcon} />
                            
                            <div className="my-4 border-t border-gray-100"></div>
                            
                            <p className="px-4 py-2 text-xs font-bold text-gray-400 uppercase tracking-wider">Fan Engagement</p>
                            <TabButton tabName="news" label="News & Announcements" Icon={NewspaperIcon} />
                            <TabButton tabName="gallery" label="Photo Galleries" Icon={PhotoIcon} />
                            <TabButton tabName="polls" label="Fan Polls" Icon={VoteIcon} />
                            <TabButton tabName="social" label="Social Media Integration" Icon={ShareIcon} />
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

export default ClubManagementPage;
