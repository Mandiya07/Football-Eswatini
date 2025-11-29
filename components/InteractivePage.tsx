
import React from 'react';
import MatchPredictor from './MatchPredictor';
import MiniFantasy from './MiniFantasy';
import Logs from './Logs';
import PlayerOfTheMonth from './PlayerOfTheMonth';
import FanOfTheWeek from './FanOfTheWeek';
import AdBanner from './AdBanner';

const InteractivePage: React.FC = () => {
  return (
    <div className="py-12">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 animate-fade-in">
            <div className="text-center mb-12">
                <h1 className="text-4xl md:text-5xl font-display font-extrabold text-blue-800 mb-2">
                    Interactive Zone
                </h1>
                <p className="text-lg text-gray-600 max-w-3xl mx-auto">
                    Get involved! Predict match outcomes, build your fantasy team, vote for Player of the Month, and explore league stats.
                </p>
            </div>

            <AdBanner placement="interactive-zone-banner" className="mb-12" />
            
            <div className="space-y-8 mb-12">
                <MatchPredictor />
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-stretch">
                    <MiniFantasy />
                    <PlayerOfTheMonth />
                    <FanOfTheWeek />
                </div>
            </div>

            <div>
                <Logs showSelector={true} />
            </div>

        </div>
    </div>
  );
};

export default InteractivePage;
