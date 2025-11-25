
import React, { useState, useEffect } from 'react';
import Logs from './Logs';
import Fixtures from './Fixtures';
import NewsSection from './News';
import { fetchAllCompetitions } from '../services/api';
import Spinner from './ui/Spinner';
import AdBanner from './AdBanner';

const LogsPage: React.FC = () => {
  const [competitions, setCompetitions] = useState<{ id: string, name: string }[]>([]);
  const [selectedLeague, setSelectedLeague] = useState('mtn-premier-league');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadCompetitions = async () => {
      setLoading(true);
      try {
        const allComps = await fetchAllCompetitions();
        // Filter mainly for leagues that have teams/logs
        const leagueList = Object.entries(allComps)
            .filter(([_, comp]) => comp.teams && comp.teams.length > 0)
            .map(([id, comp]) => ({ id, name: comp.name }))
            .sort((a, b) => a.name.localeCompare(b.name));
        
        setCompetitions(leagueList);
      } catch (error) {
        console.error("Failed to load competitions:", error);
      } finally {
        setLoading(false);
      }
    };

    loadCompetitions();
  }, []);

  return (
    <div className="py-12 bg-gray-50">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 animate-fade-in">
            {/* Header & News */}
            <div className="mb-12 text-center md:text-left">
                <h1 className="text-4xl md:text-5xl font-display font-extrabold text-blue-800 mb-2">
                    Leagues Hub
                </h1>
                <p className="text-lg text-gray-600 mb-8">
                    Comprehensive coverage of the MTN Premier League, National First Division, and more.
                </p>
                
                <NewsSection category="National" />
            </div>

            <div className="mb-8">
                <AdBanner placement="news-listing-top-banner" />
            </div>
            
            {/* League Selector */}
            <div className="mb-8 flex flex-col sm:flex-row items-center justify-between gap-4 bg-white p-4 rounded-xl shadow-sm border border-gray-100">
                <label htmlFor="league-select" className="font-bold text-gray-700 text-lg whitespace-nowrap">
                    Select Competition:
                </label>
                {loading ? <Spinner className="w-6 h-6 border-2" /> : (
                    <select
                        id="league-select"
                        value={selectedLeague}
                        onChange={(e) => setSelectedLeague(e.target.value)}
                        className="block w-full sm:max-w-md pl-4 pr-10 py-2.5 text-base border-gray-300 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm rounded-lg shadow-sm transition-shadow bg-gray-50 hover:bg-white"
                    >
                        {competitions.map(comp => (
                            <option key={comp.id} value={comp.id}>{comp.name}</option>
                        ))}
                    </select>
                )}
            </div>
            
            {/* Main Content Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
                <div className="w-full space-y-4">
                    <h2 className="text-2xl font-display font-bold text-gray-800 flex items-center gap-2">
                        <span className="bg-primary w-2 h-8 rounded-full"></span>
                        Fixtures & Results
                    </h2>
                    <Fixtures 
                      showSelector={false} 
                      defaultCompetition={selectedLeague}
                      maxHeight="max-h-[800px]"
                    />
                </div>
                <div className="w-full space-y-4">
                    <h2 className="text-2xl font-display font-bold text-gray-800 flex items-center gap-2">
                        <span className="bg-secondary w-2 h-8 rounded-full"></span>
                        League Standings
                    </h2>
                    <Logs 
                      showSelector={false} 
                      defaultLeague={selectedLeague}
                      maxHeight="max-h-[800px]"
                    />
                </div>
            </div>
        </div>
    </div>
  );
};

export default LogsPage;
