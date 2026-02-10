
import React, { useState, lazy, Suspense, useEffect } from 'react';
import { useAuth, ManagedTeam } from '../contexts/AuthContext';
import { useSearchParams } from 'react-router-dom';
import ClubLoginPrompt from './management/ClubLoginPrompt';
import UpdateScores from './management/UpdateScores';
import ManageSquad from './management/ManageSquad';
import ManageMatchDay from './management/ManageMatchDay';
import ManageStaff from './management/ManageStaff';
import BillingManagement from './management/BillingManagement'; 
import ManageFriendlies from './management/ManageFriendlies';
import TrophyIcon from './icons/TrophyIcon';
import UsersIcon from './icons/UsersIcon';
import ClipboardListIcon from './icons/ClipboardListIcon';
import BriefcaseIcon from './icons/BriefcaseIcon';
import NewspaperIcon from './icons/NewspaperIcon';
import PhotoIcon from './icons/PhotoIcon';
import VoteIcon from './icons/VoteIcon';
import ShareIcon from './icons/ShareIcon';
import BarChartIcon from './icons/BarChartIcon';
import PaintBucketIcon from './icons/PaintBucketIcon';
import CreditCardIcon from './icons/CreditCardIcon'; 
import SectionLoader from './SectionLoader';
import FilmIcon from './icons/FilmIcon';
import GlobeIcon from './icons/GlobeIcon';
import ChevronDownIcon from './icons/ChevronDownIcon';
import ShieldCheckIcon from './icons/ShieldCheckIcon';
import LockIcon from './icons/LockIcon';
import Button from './ui/Button';
import { Card, CardContent } from './ui/Card';
import SparklesIcon from './icons/SparklesIcon';
import ArrowRightIcon from './icons/ArrowRightIcon';

const ClubNewsManagement = lazy(() => import('./management/ClubNewsManagement'));
const ClubGalleryManagement = lazy(() => import('./management/ClubGalleryManagement'));
const ClubPollsManagement = lazy(() => import('./management/ClubPollsManagement'));
const ClubSocialMedia = lazy(() => import('./management/ClubSocialMedia'));
const ClubAnalytics = lazy(() => import('./management/ClubAnalytics'));
const ClubBranding = lazy(() => import('./management/ClubBranding'));
const ClubVideoManagement = lazy(() => import('./management/ClubVideoManagement'));

type ClubTab = 'scores' | 'squad' | 'staff' | 'matchday' | 'news' | 'gallery' | 'videos' | 'polls' | 'social' | 'analytics' | 'branding' | 'billing' | 'friendlies';

const TIER_RANK: Record<string, number> = {
    'Basic': 0,
    'Professional': 1,
    'Elite': 2,
    'Enterprise': 3
};

const TAB_REQUIREMENTS: Record<ClubTab, number> = {
    'scores': 1, 'friendlies': 1, 'squad': 1, 'staff': 1, 'matchday': 1, 'news': 1,
    'gallery': 1, 'videos': 2, 'polls': 2, 'social': 2, 'branding': 0, 'analytics': 3, 'billing': 0
};

const ClubManagementPage: React.FC = () => {
  const { isLoggedIn, user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  
  const userTier = user?.subscription?.tier || 'Basic';
  const userRank = TIER_RANK[userTier] || 0;

  const tabParam = searchParams.get('tab');
  const validTabs: ClubTab[] = ['scores', 'squad', 'staff', 'matchday', 'news', 'gallery', 'videos', 'polls', 'social', 'analytics', 'branding', 'billing', 'friendlies'];
  
  const initialTab = (tabParam && validTabs.includes(tabParam as ClubTab)) 
    ? (tabParam as ClubTab) 
    : (userRank >= 1 ? 'scores' : 'billing');

  const [activeTab, setActiveTabState] = useState<ClubTab>(initialTab);
  
  const managedTeams = user?.managedTeams || [];
  const [activeTeam, setActiveTeam] = useState<ManagedTeam | null>(managedTeams[0] || null);

  useEffect(() => {
      const currentTab = searchParams.get('tab');
      if (currentTab && validTabs.includes(currentTab as ClubTab)) {
          setActiveTabState(currentTab as ClubTab);
      }
  }, [searchParams]);

  const setActiveTab = (tab: ClubTab) => {
      setActiveTabState(tab);
      setSearchParams({ tab });
  };

  if (!isLoggedIn || (user?.role !== 'club_admin' && user?.role !== 'super_admin')) {
    return (
        <div className="bg-slate-50 min-h-screen py-12">
            <div className="container mx-auto px-4 animate-fade-in">
                <ClubLoginPrompt />
            </div>
        </div>
    );
  }

  const isAuthorized = (tab: ClubTab) => user?.role === 'super_admin' || userRank >= TAB_REQUIREMENTS[tab];

  const renderContent = () => {
    if (!isAuthorized(activeTab)) {
        return (
            <Card className="shadow-2xl border-0 overflow-hidden rounded-[2rem] bg-white animate-fade-in">
                <div className="h-2 bg-gradient-to-r from-indigo-600 to-purple-600"></div>
                <CardContent className="p-10 text-center flex flex-col items-center">
                    <div className="bg-indigo-50 p-6 rounded-full mb-6"><LockIcon className="w-12 h-12 text-indigo-600" /></div>
                    <h3 className="text-2xl font-display font-black text-slate-900 mb-4 uppercase tracking-tighter">Premium Hub Feature</h3>
                    <p className="text-slate-600 max-w-md mx-auto mb-10 text-sm">
                        The <strong>{activeTab.charAt(0).toUpperCase() + activeTab.slice(1)}</strong> suite is reserved for our 
                        <span className="font-bold text-indigo-600"> {Object.keys(TIER_RANK).find(k => TIER_RANK[k] === TAB_REQUIREMENTS[activeTab])}</span> partners.
                    </p>
                    <Button onClick={() => setActiveTab('billing')} className="bg-indigo-600 text-white px-8 h-12 rounded-xl font-bold uppercase text-[10px] tracking-widest shadow-xl">Upgrade Subscription</Button>
                </CardContent>
            </Card>
        );
    }

    const currentName = activeTeam?.teamName || user.club || '';
    const currentCompId = activeTeam?.competitionId || 'independent-clubs';

    switch (activeTab) {
      case 'scores': return <UpdateScores clubName={currentName} />;
      case 'squad': return <ManageSquad clubName={currentName} competitionId={currentCompId} />;
      case 'staff': return <ManageStaff clubName={currentName} />;
      case 'matchday': return <ManageMatchDay clubName={currentName} />;
      case 'friendlies': return <ManageFriendlies clubName={currentName} />;
      case 'branding': return <Suspense fallback={<SectionLoader />}><ClubBranding clubName={currentName} currentCompetitionId={currentCompId} /></Suspense>;
      case 'news': return <Suspense fallback={<SectionLoader />}><ClubNewsManagement clubName={currentName} /></Suspense>;
      case 'gallery': return <Suspense fallback={<SectionLoader />}><ClubGalleryManagement clubName={currentName} /></Suspense>;
      case 'videos': return <Suspense fallback={<SectionLoader />}><ClubVideoManagement clubName={currentName} /></Suspense>;
      case 'polls': return <Suspense fallback={<SectionLoader />}><ClubPollsManagement clubName={currentName} /></Suspense>;
      case 'social': return <Suspense fallback={<SectionLoader />}><ClubSocialMedia clubName={currentName} /></Suspense>;
      case 'analytics': return <Suspense fallback={<SectionLoader />}><ClubAnalytics clubName={currentName} /></Suspense>;
      case 'billing': return <BillingManagement />;
      default: return null;
    }
  };

  const TabButton: React.FC<{tabName: ClubTab; label: string; Icon: React.FC<any>}> = ({ tabName, label, Icon }) => {
    const active = activeTab === tabName;
    const locked = !isAuthorized(tabName);
    
    return (
        <button
            onClick={() => setActiveTab(tabName)}
            className={`flex items-center gap-3 px-4 py-3 text-sm font-bold rounded-xl transition-all flex-shrink-0 lg:w-full text-left relative overflow-hidden ${
                active 
                ? 'bg-primary text-white shadow-lg scale-[1.02]'
                : 'text-slate-500 hover:bg-slate-100 hover:text-primary'
            } ${locked ? 'opacity-50 grayscale-[0.5]' : ''}`}
        >
            <Icon className="w-5 h-5 flex-shrink-0" />
            <span className="whitespace-nowrap">{label}</span>
            {locked && <LockIcon className="w-3.5 h-3.5 ml-auto text-slate-400" />}
        </button>
    );
  };

  return (
    <div className="bg-slate-50 min-h-screen py-6 lg:py-12">
        <div className="container mx-auto px-4 lg:px-8 animate-fade-in">
            <div className="mb-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                <div className="flex items-center gap-4">
                    <div className="bg-white p-3 rounded-2xl shadow-lg border border-slate-100">
                        <ShieldCheckIcon className="w-8 h-8 lg:w-10 lg:h-10 text-primary" />
                    </div>
                    <div>
                        <h1 className="text-2xl lg:text-3xl font-display font-black text-blue-900 leading-tight">
                            {activeTeam?.teamName || user.club}
                        </h1>
                        <div className="flex items-center gap-2 mt-1">
                            <span className="bg-blue-600 text-white px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-widest">{userTier} Hub</span>
                        </div>
                    </div>
                </div>

                {managedTeams.length > 1 && (
                    <div className="w-full md:w-64">
                        <select 
                            value={activeTeam?.teamName}
                            onChange={(e) => setActiveTeam(managedTeams.find(t => t.teamName === e.target.value) || null)}
                            className="block w-full bg-white border border-slate-200 rounded-xl py-3 px-4 text-sm font-bold shadow-sm outline-none focus:ring-2 focus:ring-primary appearance-none"
                        >
                            {managedTeams.map(t => <option key={t.teamName} value={t.teamName}>{t.teamName}</option>)}
                        </select>
                    </div>
                )}
            </div>

            <div className="flex flex-col lg:flex-row gap-8 items-start">
                <aside className="w-full lg:w-72 flex-shrink-0 lg:sticky lg:top-24">
                    <div className="bg-white lg:p-4 rounded-[1.5rem] lg:rounded-[2rem] shadow-sm lg:shadow-xl border border-slate-200 overflow-hidden">
                        <div className="flex lg:flex-col overflow-x-auto lg:overflow-visible scrollbar-hide p-2 lg:p-0 gap-2 lg:gap-1">
                            <TabButton tabName="scores" label="Match Scores" Icon={TrophyIcon} />
                            <TabButton tabName="squad" label="Squad List" Icon={UsersIcon} />
                            <TabButton tabName="staff" label="Technical Staff" Icon={BriefcaseIcon} />
                            <TabButton tabName="matchday" label="Matchday Prep" Icon={ClipboardListIcon} />
                            <div className="hidden lg:block my-3 h-px bg-slate-100 mx-4"></div>
                            <TabButton tabName="news" label="Club Press" Icon={NewspaperIcon} />
                            <TabButton tabName="gallery" label="Photo Stream" Icon={PhotoIcon} />
                            <TabButton tabName="videos" label="Official Video" Icon={FilmIcon} />
                            <TabButton tabName="polls" label="Fan Feedback" Icon={VoteIcon} />
                            <div className="hidden lg:block my-3 h-px bg-slate-100 mx-4"></div>
                            <TabButton tabName="analytics" label="Hub Metrics" Icon={BarChartIcon} />
                            <TabButton tabName="branding" label="Club Identity" Icon={PaintBucketIcon} />
                            <TabButton tabName="billing" label="Account & Billing" Icon={CreditCardIcon} />
                        </div>
                    </div>
                </aside>

                <main className="flex-grow w-full min-w-0">
                    <Suspense fallback={<SectionLoader />}>
                        {renderContent()}
                    </Suspense>
                </main>
            </div>
        </div>
    </div>
  );
};

export default ClubManagementPage;
