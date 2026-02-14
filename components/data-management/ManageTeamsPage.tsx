
import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import ManageTeams from '../management/ManageTeams';
import ArrowLeftIcon from '../icons/ArrowLeftIcon';
import { useAuth } from '../../contexts/AuthContext';
import ClubLoginPrompt from '../management/ClubLoginPrompt';

const ManageTeamsPage: React.FC = () => {
    const { isLoggedIn, user } = useAuth();
    const navigate = useNavigate();

    const isAuthorized = user?.role === 'super_admin' || user?.role === 'league_admin';

    if (!isLoggedIn || !isAuthorized) {
        return (
            <div className="bg-gray-50 py-12 min-h-screen">
                <div className="container mx-auto px-4 sm:px-6 lg:px-8">
                    <ClubLoginPrompt />
                </div>
            </div>
        );
    }

    return (
        <div className="bg-gray-50 py-12 min-h-screen">
            <div className="container mx-auto px-4 sm:px-6 lg:px-8 animate-fade-in max-w-6xl">
                <div className="mb-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                    <div>
                        <button 
                            onClick={() => navigate('/data-management')}
                            className="inline-flex items-center gap-2 text-sm font-semibold text-gray-600 hover:text-gray-900 transition-colors mb-4"
                        >
                            <ArrowLeftIcon className="w-4 h-4" />
                            Back to Control Center
                        </button>
                        <h1 className="text-3xl md:text-4xl font-display font-black text-blue-900 leading-tight">
                            League Team Management
                        </h1>
                        <p className="text-gray-600 mt-1">Add clubs, manage rosters, and configure official league members.</p>
                    </div>
                </div>

                <div className="mt-8">
                    <ManageTeams />
                </div>
            </div>
        </div>
    );
};

export default ManageTeamsPage;
