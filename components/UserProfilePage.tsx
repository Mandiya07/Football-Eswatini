
import React, { useState, useEffect } from 'react';
import { Navigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Card, CardContent } from './ui/Card';
import { Team } from '../data/teams';
import { fetchTeamByIdGlobally, listenToNotifications, InAppNotification, markNotificationRead } from '../services/api';
import Button from './ui/Button';
import PushNotificationsManager from './PushNotificationsManager';
import StarIcon from './icons/StarIcon';
import TrophyIcon from './icons/TrophyIcon';
import MessageSquareIcon from './icons/MessageSquareIcon';
import CheckCircleIcon from './icons/CheckCircleIcon';
import Spinner from './ui/Spinner';
import ArrowRightIcon from './icons/ArrowRightIcon';
import BriefcaseIcon from './icons/BriefcaseIcon';
import ShieldIcon from './icons/ShieldIcon';
import SparklesIcon from './icons/SparklesIcon';
import CreditCardIcon from './icons/CreditCardIcon';
import BellIcon from './icons/BellIcon';
import AlertTriangleIcon from './icons/AlertTriangleIcon';
import InfoIcon from './icons/InfoIcon';
import { Download as DownloadIcon, Smartphone as SmartphoneIcon, Laptop as LaptopIcon, CheckCircle as CheckCircleLucide } from 'lucide-react';


const NotificationItem: React.FC<{ notification: InAppNotification }> = ({ notification }) => {
    const iconMap = {
        success: <CheckCircleIcon className="w-5 h-5 text-green-500" />,
        warning: <AlertTriangleIcon className="w-5 h-5 text-yellow-500" />,
        error: <AlertTriangleIcon className="w-5 h-5 text-red-500" />,
        info: <InfoIcon className="w-5 h-5 text-blue-500" />
    };

    const handleRead = () => {
        if (!notification.read) markNotificationRead(notification.id);
    };

    return (
        <div 
            onClick={handleRead}
            className={`p-4 rounded-xl border transition-all mb-2 cursor-pointer ${notification.read ? 'bg-white border-gray-100 opacity-60' : 'bg-blue-50/50 border-blue-100 shadow-sm'}`}
        >
            <div className="flex items-start gap-4">
                <div className="mt-0.5">{iconMap[notification.type]}</div>
                <div className="flex-grow">
                    <h5 className={`text-sm font-bold ${notification.read ? 'text-gray-600' : 'text-gray-900'}`}>{notification.title}</h5>
                    <p className="text-xs text-gray-500 mt-1 leading-relaxed">{notification.message}</p>
                </div>
                {!notification.read && <div className="w-2 h-2 bg-blue-600 rounded-full mt-2"></div>}
            </div>
        </div>
    );
};

const UserProfilePage: React.FC = () => {
  const { user, isLoggedIn, logout } = useAuth();
  const [favoriteTeams, setFavoriteTeams] = useState<{ team: Team, competitionId: string }[]>([]);
  const [notifications, setNotifications] = useState<InAppNotification[]>([]);
  const [loadingTeams, setLoadingTeams] = useState(true);
  
  const [isInstallable, setIsInstallable] = useState((window as any).isPWAInstallable?.() || false);
  const [isStandalone, setIsStandalone] = useState(false);

  useEffect(() => {
    setIsStandalone(window.matchMedia('(display-mode: standalone)').matches);

    const handlePromptAvailable = () => {
      setIsInstallable(true);
    };

    const handlePromptUsed = () => {
      setIsInstallable(false);
    };

    window.addEventListener('pwa-prompt-available', handlePromptAvailable);
    window.addEventListener('pwa-prompt-used', handlePromptUsed);

    return () => {
      window.removeEventListener('pwa-prompt-available', handlePromptAvailable);
      window.removeEventListener('pwa-prompt-used', handlePromptUsed);
    };
  }, []);

  const handleInstallClick = async () => {
    const success = await (window as any).installPWA?.();
    if (success) {
      setIsStandalone(true);
    }
  };
  
  useEffect(() => {
    const loadFavoriteTeams = async () => {
        if (!user || user.favoriteTeamIds.length === 0) {
            setLoadingTeams(false);
            return;
        }
        setLoadingTeams(true);
        const teamPromises = user.favoriteTeamIds.map(id => fetchTeamByIdGlobally(id));
        const teamResults = await Promise.all(teamPromises);
        const validTeams = teamResults.filter(result => result !== null) as { team: Team, competitionId: string }[];
        setFavoriteTeams(validTeams);
        setLoadingTeams(false);
    };
    
    if (isLoggedIn && user) {
        loadFavoriteTeams();
        const unsub = listenToNotifications(user.id, setNotifications);
        return () => unsub();
    }
  }, [isLoggedIn, user]);

  if (!isLoggedIn || !user) {
    return <Navigate to="/" replace />;
  }

  const xpProgress = (user.xp || 0) % 100;
  const levelTitle = user.level! > 10 ? 'Elite Supporter' : user.level! > 5 ? 'Seasoned Fan' : 'Rookie Fan';
  const isSuperAdmin = user.role === 'super_admin';
  const isClubAdmin = user.role === 'club_admin';
  const isLeagueAdmin = user.role === 'league_admin';
  const isAdmin = isSuperAdmin || isClubAdmin || isLeagueAdmin;

  return (
    <div className="bg-gray-50 py-12 min-h-screen">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 animate-fade-in max-w-6xl">
            
            {/* MANAGEMENT HUB */}
            {isAdmin && (
                <div className="mb-10">
                    <Card className="shadow-2xl border-0 bg-gradient-to-br from-blue-800 to-indigo-950 text-white relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-8 opacity-10"><BriefcaseIcon className="w-48 h-48" /></div>
                        <CardContent className="p-8 relative z-10">
                            <div className="flex flex-col md:flex-row items-center justify-between mb-8 gap-4">
                                <div className="flex items-center gap-4">
                                    <div className="bg-accent/20 p-3 rounded-xl border border-accent/30 shadow-inner"><BriefcaseIcon className="w-10 h-10 text-accent" /></div>
                                    <div>
                                        <h2 className="text-3xl font-display font-bold">Portal Management Hub</h2>
                                        <p className="text-blue-100 text-sm opacity-80">
                                            {isSuperAdmin ? 'Global Platform Control' : isLeagueAdmin ? 'Official League Center' : `Club Admin: ${user.club}`}
                                        </p>
                                    </div>
                                </div>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                                {(isLeagueAdmin || isSuperAdmin) && (
                                    <Link to="/data-management" className="group">
                                        <div className="bg-accent text-primary-dark p-6 rounded-2xl shadow-xl transition-all hover:shadow-accent/20 hover:-translate-y-1 h-full flex flex-col justify-between">
                                            <div>
                                                <div className="flex items-center justify-between mb-3">
                                                    <h3 className="font-black text-xl">League Hub</h3>
                                                    <div className="bg-primary-dark/10 p-2 rounded-lg"><TrophyIcon className="w-5 h-5" /></div>
                                                </div>
                                                <p className="text-primary-dark/70 text-sm font-semibold">Manage match schedules, results, and AI data synchronization.</p>
                                            </div>
                                            <div className="mt-6 flex items-center gap-2 font-black text-xs uppercase tracking-wider group-hover:gap-3 transition-all">Open Match Center <ArrowRightIcon className="w-4 h-4" /></div>
                                        </div>
                                    </Link>
                                )}
                                {(isClubAdmin || isSuperAdmin) && (
                                    <Link to="/club-management" className="group">
                                        <div className="bg-white/10 hover:bg-white/20 p-6 rounded-2xl border border-white/20 transition-all h-full flex flex-col justify-between">
                                            <div>
                                                <div className="flex items-center justify-between mb-3">
                                                    <h3 className="font-bold text-xl">Club Portal</h3>
                                                    <div className="bg-blue-500/30 p-2 rounded-lg"><ShieldIcon className="w-5 h-5" /></div>
                                                </div>
                                                <p className="text-blue-100 text-sm leading-relaxed">Publish club news, manage rosters, and list merchandise.</p>
                                            </div>
                                            <div className="mt-6 flex items-center gap-2 text-accent font-bold text-xs uppercase tracking-wider group-hover:gap-3 transition-all">Manage Club <ArrowRightIcon className="w-4 h-4" /></div>
                                        </div>
                                    </Link>
                                )}
                                {isSuperAdmin && (
                                    <Link to="/admin" className="group">
                                        <div className="bg-white/10 hover:bg-white/20 p-6 rounded-2xl border border-white/20 transition-all h-full flex flex-col justify-between">
                                            <div><div className="flex items-center justify-between mb-3"><h3 className="font-bold text-xl">Admin Panel</h3><div className="bg-red-500/30 p-2 rounded-lg"><ShieldIcon className="w-5 h-5" /></div></div><p className="text-blue-100 text-sm">System approvals, user roles, and global configuration.</p></div>
                                            <div className="mt-6 flex items-center gap-2 text-accent font-bold text-xs uppercase tracking-wider group-hover:gap-3 transition-all">Control Center <ArrowRightIcon className="w-4 h-4" /></div>
                                        </div>
                                    </Link>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                </div>
            )}

            {/* HEADER */}
            <header className="flex flex-col md:flex-row items-center gap-8 mb-12 bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
                <div className="relative">
                    <img src={user.avatar || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(user.name || 'User')}`} alt={user.name} className="w-32 h-32 rounded-full border-4 border-primary shadow-xl" />
                    <div className="absolute -bottom-2 -right-2 bg-yellow-400 text-yellow-900 w-10 h-10 rounded-full flex items-center justify-center font-bold border-2 border-white shadow-md">{user.level}</div>
                </div>
                <div className="flex-grow text-center md:text-left">
                    <div className="flex flex-col md:flex-row md:items-center md:gap-4 mb-2">
                        <h1 className="text-4xl font-display font-extrabold text-gray-900">{user.name}</h1>
                        <span className="text-xs font-bold uppercase tracking-widest bg-primary text-white px-3 py-1 rounded-full w-fit mx-auto md:mx-0">{levelTitle}</span>
                    </div>
                    <p className="text-gray-500 font-medium">{user.email}</p>
                    <div className="mt-6 max-w-md mx-auto md:mx-0">
                        <div className="flex justify-between text-xs font-bold text-gray-400 uppercase mb-1"><span>Level {user.level}</span><span>{xpProgress}% to next level</span></div>
                        <div className="w-full bg-gray-100 rounded-full h-3 border border-gray-200 overflow-hidden"><div className="bg-primary h-full rounded-full transition-all duration-1000" style={{ width: `${xpProgress}%` }}></div></div>
                    </div>
                </div>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 space-y-8">
                    {/* NOTIFICATIONS FEED */}
                    <Card className="shadow-lg border-0">
                        <CardContent className="p-6">
                            <h2 className="text-xl font-bold font-display mb-6 flex items-center gap-2 text-gray-800">
                                <BellIcon className="w-5 h-5 text-blue-600" /> Notifications Feed
                            </h2>
                            <div className="space-y-1">
                                {notifications.length > 0 ? notifications.map(n => (
                                    <NotificationItem key={n.id} notification={n} />
                                )) : (
                                    <div className="py-10 text-center text-gray-400 border border-dashed rounded-xl">
                                        <InfoIcon className="w-8 h-8 mx-auto mb-2 opacity-20" />
                                        <p className="text-sm font-bold uppercase tracking-widest">No recent updates</p>
                                    </div>
                                )}
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="shadow-lg border-0">
                        <CardContent className="p-6">
                            <h2 className="text-xl font-bold font-display mb-4 text-gray-800">Following</h2>
                            {loadingTeams ? <Spinner /> : (
                                <div className="flex flex-wrap gap-4">
                                    {favoriteTeams.length > 0 ? favoriteTeams.map(({ team, competitionId }) => (
                                        <Link key={team.id} to={`/competitions/${competitionId}/teams/${team.id}`} className="flex items-center gap-2 bg-white border border-gray-200 p-2 pr-4 rounded-xl transition-all hover:shadow-md hover:border-primary group">
                                            {team.crestUrl ? (
                                                <img src={team.crestUrl} alt={team.name} className="w-8 h-8 object-contain" />
                                            ) : (
                                                <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-[10px] font-black text-slate-400 select-none">
                                                    {team.name.charAt(0)}
                                                </div>
                                            )}
                                            <span className="text-sm font-bold text-gray-800 group-hover:text-primary">{team.name}</span>
                                        </Link>
                                    )) : <p className="text-sm text-gray-500">No favorite teams selected yet.</p>}
                                    <Link to="/profile/setup" className="text-sm font-bold text-primary bg-primary/5 px-4 py-2 rounded-xl hover:bg-primary/10 self-center">+ Manage Teams</Link>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                    
                    <PushNotificationsManager />
                </div>

                <div className="lg:col-span-1 space-y-8">
                    <Card className="shadow-lg border-0 bg-primary text-white">
                        <CardContent className="p-6 text-center">
                             <h2 className="text-xl font-bold font-display mb-6">Fan Stats</h2>
                             <div className="grid grid-cols-2 gap-4">
                                <div className="bg-white/10 p-4 rounded-xl backdrop-blur-sm border border-white/10"><p className="text-3xl font-black">{user.xp || 0}</p><p className="text-[10px] uppercase font-bold opacity-70">Total XP</p></div>
                                <div className="bg-white/10 p-4 rounded-xl backdrop-blur-sm border border-white/10"><p className="text-3xl font-black">12</p><p className="text-[10px] uppercase font-bold opacity-70">Live Shouts</p></div>
                             </div>
                        </CardContent>
                    </Card>
                    <Card className="shadow-lg border-0">
                        <CardContent className="p-6">
                             <h2 className="text-xl font-bold font-display mb-4 text-gray-800">Account Settings</h2>
                             <div className="space-y-3">
                                <Link to="/profile/setup" className="block w-full"><Button className="w-full bg-gray-100 text-gray-800 hover:bg-gray-200 text-left px-4 flex justify-between items-center transition-all h-11"><span className="font-bold">Edit Fan Profile</span><ArrowRightIcon className="w-4 h-4" /></Button></Link>
                                <Button onClick={logout} className="w-full bg-red-50 text-red-600 hover:bg-red-100 text-left px-4 font-black transition-all h-11 border border-red-100">Sign Out</Button>
                             </div>
                        </CardContent>
                    </Card>

                    <Card className="shadow-lg border-0 bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-100">
                        <CardContent className="p-6">
                            <h2 className="text-xl font-bold font-display mb-3 text-primary flex items-center gap-2">
                                <SmartphoneIcon className="w-5 h-5 text-blue-600" /> Device App
                            </h2>
                            
                            {isStandalone ? (
                                <div className="space-y-3">
                                    <div className="flex items-center gap-2 bg-green-50 text-green-800 text-xs font-bold px-3 py-2 rounded-xl border border-green-100">
                                        <CheckCircleLucide className="w-4 h-4 text-green-600 shrink-0" />
                                        <span>Installed & Running Natively</span>
                                    </div>
                                    <p className="text-xs text-gray-600 leading-relaxed">
                                        You are running the official Football Eswatini app directly from your home screen. Enjoy complete fullscreen view and fast offline access!
                                    </p>
                                </div>
                            ) : isInstallable ? (
                                <div className="space-y-4">
                                    <p className="text-xs text-gray-600 leading-relaxed">
                                        Download the app to your phone, tablet, or desktop. Launch directly from your home screen with fast loading and offline support.
                                    </p>
                                    <Button 
                                        onClick={handleInstallClick} 
                                        className="w-full bg-blue-600 hover:bg-blue-700 text-white font-black flex items-center justify-center gap-2 shadow-lg hover:shadow-blue-200 transition-all h-11 rounded-xl text-xs uppercase tracking-wider"
                                    >
                                        <DownloadIcon className="w-4 h-4" /> Install Application
                                    </Button>
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    <p className="text-xs text-gray-600 leading-relaxed">
                                        To install on your mobile device (iOS/Android) or Desktop:
                                    </p>
                                    <div className="text-xs text-gray-700 space-y-2 bg-white/60 p-3 rounded-xl border border-blue-100">
                                        <div className="flex gap-2">
                                            <span className="font-black text-blue-600">1.</span>
                                            <span>Tap the browser's <strong>Share</strong> or <strong>Menu</strong> button (usually <span className="font-mono">⋮</span> or the share icon).</span>
                                        </div>
                                        <div className="flex gap-2">
                                            <span className="font-black text-blue-600">2.</span>
                                            <span>Select <strong>"Add to Home Screen"</strong> or <strong>"Install App"</strong>.</span>
                                        </div>
                                        <div className="flex gap-2">
                                            <span className="font-black text-blue-600">3.</span>
                                            <span>Open the app icon directly from your home screen!</span>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    </div>
  );
};

export default UserProfilePage;
