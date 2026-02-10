
import React, { useState, useEffect } from 'react';
import { Card, CardContent } from './ui/Card';
import Button from './ui/Button';
import Spinner from './ui/Spinner';
import TrophyIcon from './icons/TrophyIcon';
import ArrowLeftIcon from './icons/ArrowLeftIcon';
import { Link } from 'react-router-dom';
import Fixtures from './Fixtures';
import Logs from './Logs';
import { useAuth } from '../contexts/AuthContext';

const NationalU17Page: React.FC = () => {
  const { isLoggedIn, openAuthModal } = useAuth();
  const COMPETITION_ID = 'u17-national-football';

  const handleCreateLeague = (e: React.MouseEvent) => {
      if (!isLoggedIn) {
          e.preventDefault();
          openAuthModal();
      }
  };

  return (
    <div className="bg-gray-50 py-12">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 animate-fade-in">
        <div className="mb-6">
            <Link to="/youth" className="inline-flex items-center gap-2 text-sm font-semibold text-gray-600 hover:text-gray-900 transition-colors">
                <ArrowLeftIcon className="w-4 h-4" />
                Back to Youth Hub
            </Link>
        </div>

        <div className="text-center mb-16">
          <div className="inline-block p-4 bg-blue-100 rounded-full mb-4 shadow-sm">
            <TrophyIcon className="w-12 h-12 text-blue-700" />
          </div>
          <h1 className="text-3xl md:text-5xl font-display font-black text-blue-900 mb-4 uppercase tracking-tight">
            U-17 National Football
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
            Developing tactical excellence in the Under-17 tier. Track national results or launch a regional juniors league.
          </p>
        </div>

        {/* Create New League CTA */}
        <div className="mb-16 max-w-4xl mx-auto">
            <Card className="bg-gradient-to-br from-blue-800 to-blue-950 text-white shadow-2xl border-0 overflow-hidden relative group">
                <CardContent className="p-10 text-center md:text-left md:flex items-center justify-between gap-8 relative z-10">
                    <div className="flex-1">
                        <h2 className="text-3xl font-display font-black mb-4 uppercase tracking-tight">Launch a Regional U-17 League</h2>
                        <p className="text-blue-50 mb-6 md:mb-0 leading-relaxed opacity-90">
                            Organizing an U-17 tournament? Use our professional digital hub to track scores, rosters, and standings live in your community.
                        </p>
                    </div>
                    <div className="flex-shrink-0">
                        <Link to={isLoggedIn ? "/league-registration" : "#"} onClick={handleCreateLeague}>
                            <Button className="bg-accent text-primary-dark font-black px-8 py-4 rounded-xl hover:bg-yellow-300 transition-all hover:scale-105 shadow-xl border-0 uppercase tracking-widest text-xs">
                                Create New League
                            </Button>
                        </Link>
                    </div>
                </CardContent>
            </Card>
        </div>

        <div className="space-y-16">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
                <div className="space-y-6">
                    <h2 className="text-2xl font-display font-black text-gray-800 uppercase tracking-tight border-b-4 border-primary pb-2">National Fixtures</h2>
                    <Fixtures showSelector={false} defaultCompetition={COMPETITION_ID} maxHeight="max-h-[600px]" />
                </div>
                <div className="space-y-6">
                    <h2 className="text-2xl font-display font-black text-gray-800 uppercase tracking-tight border-b-4 border-primary pb-2">National Standings</h2>
                    <Logs showSelector={false} defaultLeague={COMPETITION_ID} maxHeight="max-h-[600px]" />
                </div>
            </div>
        </div>
      </div>
    </div>
  );
};

export default NationalU17Page;
