import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import Logs from './Logs';
import Fixtures from './Fixtures';
import { fetchCompetition, Competition } from '../services/api';
import Spinner from './ui/Spinner';
import ArrowLeftIcon from './icons/ArrowLeftIcon';
import NationalTeamIcon from './icons/NationalTeamIcon';

const NationalTeamDetailPage: React.FC = () => {
  const { teamId } = useParams<{ teamId: string }>();
  const [competition, setCompetition] = useState<Competition | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const getComp = async () => {
      if (!teamId) return;
      setLoading(true);
      const compData = await fetchCompetition(teamId);
      setCompetition(compData);
      setLoading(false);
    };
    getComp();
  }, [teamId]);

  if (!teamId) {
    return (
        <div className="p-8 text-center">
            <p>Invalid team specified.</p>
             <Link to="/national-team" className="text-blue-600 hover:underline mt-4 inline-block">
                Back to National Teams
            </Link>
        </div>
    );
  }
  
  return (
    <div className="bg-gray-50 py-12">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 animate-fade-in">
         <div className="mb-6">
            <Link to="/national-team" className="inline-flex items-center gap-2 text-sm font-semibold text-gray-600 hover:text-gray-900 transition-colors">
                <ArrowLeftIcon className="w-4 h-4" />
                Back to All National Teams
            </Link>
        </div>

        {loading ? <div className="flex justify-center"><Spinner /></div> : (
            <>
                 <div className="text-center mb-12">
                    {competition?.logoUrl ? (
                        <img src={competition.logoUrl} alt={competition.name} className="w-24 h-24 object-contain mx-auto mb-4" />
                    ) : (
                        <NationalTeamIcon className="w-12 h-12 mx-auto text-primary mb-2" />
                    )}
                    <h1 className="text-4xl md:text-5xl font-display font-extrabold text-blue-800 mb-2">
                        {competition?.displayName || competition?.name || 'National Team'}
                    </h1>
                </div>
                <div className="space-y-16">
                    <Fixtures showSelector={false} defaultCompetition={teamId} />
                    <Logs showSelector={false} defaultLeague={teamId} />
                </div>
            </>
        )}
      </div>
    </div>
  );
};

export default NationalTeamDetailPage;