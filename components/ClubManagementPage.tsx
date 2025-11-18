import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import ClubLoginPrompt from './management/ClubLoginPrompt';
import UpdateScores from './management/UpdateScores';
import ManageSquad from './management/ManageSquad';
import ManageMatchDay from './management/ManageMatchDay';
import TrophyIcon from './icons/TrophyIcon';
import UsersIcon from './icons/UsersIcon';
import ClipboardListIcon from './icons/ClipboardListIcon';
import ManageStaff from './management/ManageStaff';
import BriefcaseIcon from './icons/BriefcaseIcon';

const ClubManagementPage: React.FC = () => {
  const { isLoggedIn, user } = useAuth();
  const [activeTab, setActiveTab] = useState<'scores' | 'squad' | 'staff' | 'matchday'>('scores');

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
      default:
        return null;
    }
  };

  const TabButton: React.FC<{tabName: 'scores' | 'squad' | 'staff' | 'matchday'; label: string; Icon: React.FC<React.SVGProps<SVGSVGElement>>}> = ({ tabName, label, Icon }) => (
    <button
        onClick={() => setActiveTab(tabName)}
        className={`flex items-center gap-2 px-4 py-3 text-sm font-semibold rounded-md transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-light w-full text-left ${
            activeTab === tabName 
            ? 'bg-primary text-white'
            : 'text-gray-600 hover:bg-gray-100'
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
                    Manage your team's data and match-day information.
                </p>
            </div>

            <div className="flex flex-col md:flex-row gap-8 items-start">
                <aside className="w-full md:w-64 flex-shrink-0">
                    <div className="flex flex-row md:flex-col gap-2 bg-white p-3 rounded-lg shadow-sm border border-gray-200">
                        <TabButton tabName="scores" label="Update Scores" Icon={TrophyIcon} />
                        <TabButton tabName="squad" label="Manage Squad" Icon={UsersIcon} />
                        <TabButton tabName="staff" label="Manage Staff" Icon={BriefcaseIcon} />
                        <TabButton tabName="matchday" label="Match Day Hub" Icon={ClipboardListIcon} />
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