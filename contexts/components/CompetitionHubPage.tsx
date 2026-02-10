import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { fetchCompetition } from '../services/api';
import { Competition } from '../data/teams';
import Spinner from './ui/Spinner';
import ArrowLeftIcon from './icons/ArrowLeftIcon';
import Fixtures from './Fixtures';
import Logs from './Logs';

const CompetitionHubPage: React.FC = () => {
  const { compId } = useParams<{ compId: string }>();
  const [competition, setCompetition] = useState<Competition | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadComp = async () => {
      if (!compId) return;
      setLoading(true);
      try {
        const data = await fetchCompetition(compId);
        setCompetition(data || null);
      } catch (error) {
        console.error("Failed to load competition hub", error);
      } finally {
        setLoading(false);
      }
    };
    loadComp();
  }, [compId]);

  if (loading) return <div className="flex justify-center py-20 min-h-screen"><Spinner /></div>;

  if (!competition) {
    return (
      <div className="container mx-auto px-4 py-20 text-center min-h-screen">
        <h1 className="text-2xl font-bold mb-4">Competition Not Found</h1>
        <p className="text-gray-600 mb-6">The league center you are looking for does not exist or has not been initialized.</p>
        <Link to="/regional" className="bg-primary text-white px-6 py-2 rounded-lg hover:bg-primary-dark shadow-lg font-bold">Back to Regional Hub</Link>
      </div>
    );
  }

  return (
    <div className="bg-gray-50 py-12 min-h-screen">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 animate-fade-in">
        <div className="mb-8">
            <button 
                onClick={() => window.history.back()} 
                className="inline-flex items-center gap-2 text-sm font-semibold text-gray-600 hover:text-gray-900 transition-colors"
            >
                <ArrowLeftIcon className="w-4 h-4" />
                Back
            </button>
        </div>
        
        <div className="text-center mb-12">
            {competition.logoUrl && (
                <img src={competition.logoUrl} alt="" className="h-24 mx-auto mb-4 object-contain" />
            )}
            <h1 className="text-4xl md:text-5xl font-display font-extrabold text-blue-900 mb-2">
                {competition.displayName || competition.name}
            </h1>
            <p className="text-gray-600 text-lg uppercase tracking-widest font-bold">Official Match Center</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
            <div className="space-y-6">
                <h2 className="text-2xl font-display font-bold text-gray-800 border-b-4 border-primary/20 pb-2">Fixtures & Results</h2>
                <Fixtures showSelector={false} defaultCompetition={compId} />
            </div>
            <div className="space-y-6">
                <h2 className="text-2xl font-display font-bold text-gray-800 border-b-4 border-primary/20 pb-2">League Standings</h2>
                <Logs showSelector={false} defaultLeague={compId} />
            </div>
        </div>
      </div>
    </div>
  );
};

export default CompetitionHubPage;