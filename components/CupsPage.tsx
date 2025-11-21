
import React, { useState, useEffect, useMemo } from 'react';
import TournamentBracketDisplay from './TournamentBracketDisplay';
import { Tournament, cupData as localCupData } from '../data/cups';
import { fetchCups } from '../services/api';
import SectionLoader from './SectionLoader';

const CupsPage: React.FC = () => {
  const [cups, setCups] = useState<Tournament[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
          // Try fetching from API
          const data = await fetchCups();
          if (data.length > 0) {
              setCups(data);
          } else {
              // Fallback to local static data if API returns empty (so the UI is never empty for the user)
              console.log("No API data found, using local fallback for Cups.");
              setCups(localCupData);
          }
      } catch (e) {
          console.error("Failed to load cups, using fallback.", e);
          setCups(localCupData);
      } finally {
          setLoading(false);
      }
    };
    loadData();
  }, []);

  const ingwenyamaCup = useMemo(() => cups.find(c => c.id === 'ingwenyama-cup'), [cups]);
  const tradeFairCup = useMemo(() => cups.find(c => c.id === 'trade-fair-cup'), [cups]);

  return (
    <div className="bg-gray-50 py-12">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 animate-fade-in">
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-display font-extrabold text-blue-800 mb-2">
            Domestic Cups
          </h1>
          <p className="text-lg text-gray-600 max-w-3xl mx-auto">
            Follow the knockout stages of Eswatini's prestigious cup competitions.
          </p>
        </div>
        
        {loading ? <SectionLoader /> : (
            <div className="space-y-12">
                {ingwenyamaCup && (
                    <div className="animate-slide-up">
                        <TournamentBracketDisplay tournament={ingwenyamaCup} />
                    </div>
                )}
                
                {tradeFairCup && (
                    <div className="animate-slide-up" style={{ animationDelay: '0.2s' }}>
                        <TournamentBracketDisplay tournament={tradeFairCup} />
                    </div>
                )}

                {!ingwenyamaCup && !tradeFairCup && !loading && (
                    <p className="text-center text-gray-500">No cup competitions are currently active.</p>
                )}
            </div>
        )}
      </div>
    </div>
  );
};

export default CupsPage;
