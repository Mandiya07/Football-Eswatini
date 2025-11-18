

import React, { useState, useEffect } from 'react';
import { Navigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Card, CardContent } from './ui/Card';
import { Team } from '../data/teams';
// FIX: Import 'fetchTeamByIdGlobally' which is now correctly exported from the API service.
import { fetchTeamByIdGlobally } from '../services/api';
import Button from './ui/Button';
import PushNotificationsManager from './PushNotificationsManager';

const UserProfilePage: React.FC = () => {
  const { user, isLoggedIn, logout } = useAuth();
  const [favoriteTeams, setFavoriteTeams] = useState<{ team: Team, competitionId: string }[]>([]);
  const [loadingTeams, setLoadingTeams] = useState(true);
  
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
    if (isLoggedIn) {
        loadFavoriteTeams();
    }
  }, [isLoggedIn, user]);

  if (!isLoggedIn || !user) {
    return <Navigate to="/" replace />;
  }


  return (
    <div className="bg-gray-50 py-12">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 animate-fade-in">
            <header className="flex flex-col sm:flex-row items-center gap-6 mb-12">
                <img src={user.avatar} alt={user.name} className="w-24 h-24 sm:w-32 sm:h-32 rounded-full border-4 border-white shadow-lg" />
                <div>
                    <div className="flex flex-col sm:flex-row sm:items-center sm:gap-3">
                        <h1 className="text-3xl sm:text-4xl font-display font-bold">{user.name}</h1>
                        <span className="text-xs font-bold uppercase tracking-wider bg-blue-100 text-blue-800 px-2 py-1 rounded-full w-fit mt-1 sm:mt-0">{user.role.replace('_', ' ')}</span>
                    </div>
                    <p className="text-gray-600">{user.email}</p>
                    {user.role === 'club_admin' && user.club && (
                        <p className="text-sm font-semibold text-gray-700 mt-1">Manages: <span className="font-bold">{user.club}</span></p>
                    )}
                </div>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <div className="md:col-span-2 space-y-8">
                    <Card className="shadow-lg">
                        <CardContent className="p-6">
                            <h2 className="text-xl font-bold font-display mb-4">Favorite Teams</h2>
                            {loadingTeams ? (
                                <div className="flex space-x-4">
                                    <div className="h-10 bg-gray-200 rounded-lg w-32 animate-pulse"></div>
                                    <div className="h-10 bg-gray-200 rounded-lg w-32 animate-pulse"></div>
                                </div>
                            ) : (
                                <div className="flex flex-wrap gap-4">
                                    {favoriteTeams.length > 0 ? favoriteTeams.map(({ team, competitionId }) => (
                                        <Link 
                                            key={team.id} 
                                            to={`/competitions/${competitionId}/teams/${team.id}`}
                                            className="flex items-center gap-2 bg-gray-100 p-2 rounded-lg transition-colors hover:bg-gray-200"
                                        >
                                            <img src={team.crestUrl} alt={team.name} className="w-6 h-6 object-contain" />
                                            <span className="text-sm font-semibold">{team.name}</span>
                                        </Link>
                                    )) : <p className="text-sm text-gray-500">No favorite teams selected yet.</p>}
                                    <Link to="/profile/setup" className="text-sm font-semibold text-blue-600 bg-blue-100 p-2 rounded-lg hover:bg-blue-200 self-center">+ Manage Teams</Link>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                    
                    <PushNotificationsManager />
                </div>

                <div className="md:col-span-1">
                    <Card className="shadow-lg">
                        <CardContent className="p-6">
                             <h2 className="text-xl font-bold font-display mb-4">Account</h2>
                             <div className="space-y-4">
                                <Link to="/profile/setup" className="w-full">
                                    <Button className="w-full bg-gray-200 text-gray-800 hover:bg-gray-300">Edit Profile & Settings</Button>
                                </Link>
                                <Button onClick={logout} className="w-full bg-red-100 text-red-700 hover:bg-red-200">Log Out</Button>
                             </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    </div>
  );
};

export default UserProfilePage;