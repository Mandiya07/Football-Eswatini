
import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import Fixtures from './Fixtures';
import Logs from './Logs';
import { fetchCompetition } from '../services/api';
import Spinner from './ui/Spinner';
import ArrowLeftIcon from './icons/ArrowLeftIcon';

const RegionDetailPage: React.FC = () => {
  const { regionId } = useParams<{ regionId: string }>();
  const [competitionName, setCompetitionName] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const getCompName = async () => {
      if (!regionId) return;
      setLoading(true);
      
      // Improved fallback: Use the ID directly if it contains spaces (likely a name-based ID),
      // otherwise try to slug-decode it.
      const fallbackName = regionId.includes(' ') 
        ? regionId 
        : regionId
            .split('-')
            .map(word => word.charAt(0).toUpperCase() + word.slice(1))
            .join(' ')
            .replace(/\(/g, '')
            .replace(/\)/g, '');

      try {
        const competition = await fetchCompetition(regionId);
        // Prefer DB name, but if it's generically "Regional League" or missing, prefer the specific fallback derived from ID
        let displayName = competition?.name;
        if (!displayName || displayName.trim() === 'Regional League' || displayName.trim() === 'Regional Leagues') {
            displayName = fallbackName;
        }
        setCompetitionName(displayName);
      } catch (error) {
        console.warn("Failed to fetch competition details, using fallback name.", error);
        setCompetitionName(fallbackName);
      } finally {
        setLoading(false);
      }
    };
    getCompName();
  }, [regionId]);

  if (!regionId) {
    return (
        <div className="p-8 text-center">
            <p>Invalid region specified.</p>
             <Link to="/regional" className="text-blue-600 hover:underline mt-4 inline-block">
                Back to Regional Leagues
            </Link>
        </div>
    );
  }

  return (
    <div className="bg-gray-50 py-12">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 animate-fade-in">
        <div className="mb-6">
            <Link to="/regional" className="inline-flex items-center gap-2 text-sm font-semibold text-gray-600 hover:text-gray-900 transition-colors">
                <ArrowLeftIcon className="w-4 h-4" />
                Back to All Regions
            </Link>
        </div>
        <div className="text-center md:text-left mb-8">
            {loading ? <Spinner /> : (
                <>
                    <h1 className="text-3xl md:text-5xl font-display font-extrabold text-blue-800 mb-2">
                        {competitionName}
                    </h1>
                    <p className="text-lg text-gray-600">
                        Fixtures, results, and standings for the region.
                    </p>
                </>
            )}
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
            <div className="w-full">
                <h2 className="text-xl font-display font-bold mb-4 text-gray-800">Fixtures & Results</h2>
                <Fixtures showSelector={false} defaultCompetition={regionId} maxHeight="max-h-[800px]" />
            </div>
            <div className="w-full">
                <h2 className="text-xl font-display font-bold mb-4 text-gray-800">League Standings</h2>
                <Logs showSelector={false} defaultLeague={regionId} maxHeight="max-h-[800px]" />
            </div>
        </div>
      </div>
    </div>
  );
};

export default RegionDetailPage;
