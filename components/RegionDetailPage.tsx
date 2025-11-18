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
      const competition = await fetchCompetition(regionId);
      setCompetitionName(competition?.name || 'Regional League');
      setLoading(false);
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
                    <h1 className="text-4xl md:text-5xl font-display font-extrabold text-blue-800 mb-2">
                        {competitionName}
                    </h1>
                    <p className="text-lg text-gray-600">
                        Fixtures, results, and standings for the region.
                    </p>
                </>
            )}
        </div>
        <div className="space-y-16">
            <Fixtures showSelector={false} defaultCompetition={regionId} />
            <Logs showSelector={false} defaultLeague={regionId} />
        </div>
      </div>
    </div>
  );
};

export default RegionDetailPage;