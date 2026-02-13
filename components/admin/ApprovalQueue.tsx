
import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '../ui/Card';
import Button from '../ui/Button';
import CheckIcon from '../icons/CheckIcon';
import XIcon from '../icons/XIcon';
import { 
    fetchPendingChanges, 
    deletePendingChange, 
    PendingChange, 
    ClubRegistrationRequest, 
    fetchClubRequests, 
    approveClubRequest, 
    rejectClubRequest, 
    handleFirestoreError,
    LeagueRegistrationRequest,
    fetchLeagueRequests,
    approveLeagueRequest,
    rejectLeagueRequest
} from '../../services/api';
import Spinner from '../ui/Spinner';
import UsersIcon from '../icons/UsersIcon';
import ClipboardListIcon from '../icons/ClipboardListIcon';
import TrophyIcon from '../icons/TrophyIcon';
import ShieldCheckIcon from '../icons/ShieldCheckIcon';

const ApprovalQueue: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'data' | 'clubs' | 'leagues'>('clubs');
  const [changes, setChanges] = useState<PendingChange[]>([]);
  const [clubRequests, setClubRequests] = useState<ClubRegistrationRequest[]>([]);
  const [leagueRequests, setLeagueRequests] = useState<LeagueRegistrationRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [processedIds, setProcessedIds] = useState<string[]>([]);

  const loadData = async () => {
    setLoading(true);
    try {
        const [changesData, requestsData, leaguesData] = await Promise.all([
            fetchPendingChanges(),
            fetchClubRequests(),
            fetchLeagueRequests()
        ]);
        setChanges(changesData);
        setClubRequests(requestsData);
        setLeagueRequests(leaguesData);
    } catch (e) {
        console.error("Failed to load approval queue data", e);
    } finally {
        setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleDataDecision = async (id: string, decision: 'approved' | 'rejected') => {
    setProcessedIds(prev => [...prev, id]);
    try {
        await deletePendingChange(id);
        setChanges(prev => prev.filter(change => change.id !== id));
    } catch (error) {
        setProcessedIds(prev => prev.filter(processedId => processedId !== id)); 
    }
  };

  const handleClubDecision = async (request: ClubRegistrationRequest, decision: 'approved' | 'rejected') => {
      if (!window.confirm(`Are you sure you want to ${decision} the registration for ${request.clubName}?`)) return;
      
      setProcessedIds(prev => [...prev, request.id]);
      try {
          if (decision === 'approved') {
              await approveClubRequest(request);
          } else {
              await rejectClubRequest(request.id);
          }
          setClubRequests(prev => prev.filter(req => req.id !== request.id));
      } catch (error) {
          handleFirestoreError(error, `process club request`);
          setProcessedIds(prev => prev.filter(processedId => processedId !== request.id));
      }
  };

  const handleLeagueDecision = async (request: LeagueRegistrationRequest, decision: 'approved' | 'rejected') => {
      if (!window.confirm(`Are you sure you want to ${decision} the request for ${request.leagueName}?`)) return;
      
      setProcessedIds(prev => [...prev, request.id]);
      try {
          if (decision === 'approved') {
              await approveLeagueRequest(request);
          } else {
              await rejectLeagueRequest(request.id);
          }
          setLeagueRequests(prev => prev.filter(req => req.id !== request.id));
      } catch (error) {
          handleFirestoreError(error, `process league request`);
          setProcessedIds(prev => prev.filter(processedId => processedId !== request.id));
      }
  };

  return (
    <Card className="shadow-lg animate-fade-in">
      <CardContent className="p-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
            <div>
                <h3 className="text-2xl font-bold font-display mb-1">Approval Queue</h3>
                <p className="text-sm text-gray-600">Review pending data changes and registration requests.</p>
            </div>
            <div className="flex bg-gray-100 p-1 rounded-lg overflow-x-auto">
                <button 
                    onClick={() => setActiveTab('clubs')}
                    className={`px-4 py-2 text-sm font-semibold rounded-md transition-all whitespace-nowrap ${activeTab === 'clubs' ? 'bg-white shadow text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
                >
                    Clubs <span className="ml-2 bg-gray-200 text-gray-700 px-1.5 py-0.5 rounded-full text-xs">{clubRequests.length}</span>
                </button>
                <button 
                    onClick={() => setActiveTab('leagues')}
                    className={`px-4 py-2 text-sm font-semibold rounded-md transition-all whitespace-nowrap ${activeTab === 'leagues' ? 'bg-white shadow text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
                >
                    Leagues <span className="ml-2 bg-gray-200 text-gray-700 px-1.5 py-0.5 rounded-full text-xs">{leagueRequests.length}</span>
                </button>
                <button 
                    onClick={() => setActiveTab('data')}
                    className={`px-4 py-2 text-sm font-semibold rounded-md transition-all whitespace-nowrap ${activeTab === 'data' ? 'bg-white shadow text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
                >
                    Data <span className="ml-2 bg-gray-200 text-gray-700 px-1.5 py-0.5 rounded-full text-xs">{changes.length}</span>
                </button>
            </div>
        </div>
        
        {loading ? <div className="flex justify-center py-8"><Spinner /></div> : (
            <>
                {activeTab === 'clubs' && (
                    clubRequests.length > 0 ? (
                        <div className="space-y-4">
                            {clubRequests.map(req => (
                                <div 
                                    key={req.id} 
                                    className={`p-4 bg-blue-50 border border-blue-100 rounded-lg flex flex-col md:flex-row justify-between gap-4 transition-all duration-300 ${processedIds.includes(req.id) ? 'opacity-50 grayscale' : 'opacity-100'}`}
                                >
                                    <div>
                                        <div className="flex items-center gap-2 mb-1">
                                            <UsersIcon className="w-5 h-5 text-blue-600"/>
                                            <span className="font-bold text-lg text-gray-900">{req.clubName}</span>
                                        </div>
                                        <div className="text-sm text-gray-600 space-y-1">
                                            <p><span className="font-semibold">Applicant:</span> {req.repName}</p>
                                            <p><span className="font-semibold">Email:</span> {req.email}</p>
                                            <p><span className="font-semibold">Phone:</span> {req.phone}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2 self-start md:self-center">
                                        {processedIds.includes(req.id) ? <Spinner className="w-6 h-6 border-blue-600"/> : (
                                            <>
                                                <Button onClick={() => handleClubDecision(req, 'rejected')} className="bg-white border border-red-200 text-red-600 hover:bg-red-50 focus:ring-red-500 h-9 px-3 flex items-center gap-1">
                                                    <XIcon className="w-4 h-4" /> Reject
                                                </Button>
                                                <Button onClick={() => handleClubDecision(req, 'approved')} className="bg-green-600 text-white hover:bg-green-700 focus:ring-green-500 h-9 px-3 flex items-center gap-1">
                                                    <CheckIcon className="w-4 h-4" /> Approve
                                                </Button>
                                            </>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-12 bg-gray-50 rounded-lg border border-dashed border-gray-300">
                            <UsersIcon className="w-12 h-12 mx-auto text-gray-300 mb-2"/>
                            <p className="text-gray-500">No pending club registrations.</p>
                        </div>
                    )
                )}

                {activeTab === 'leagues' && (
                    leagueRequests.length > 0 ? (
                        <div className="space-y-4">
                            {leagueRequests.map(req => (
                                <div 
                                    key={req.id} 
                                    className={`p-4 bg-green-50 border border-green-100 rounded-lg flex flex-col md:flex-row justify-between gap-4 transition-all duration-300 ${processedIds.includes(req.id) ? 'opacity-50 grayscale' : 'opacity-100'}`}
                                >
                                    <div>
                                        <div className="flex items-center gap-2 mb-1">
                                            {req.requestType === 'manage' ? <ShieldCheckIcon className="w-5 h-5 text-blue-600"/> : <TrophyIcon className="w-5 h-5 text-green-600"/>}
                                            <span className="font-bold text-lg text-gray-900">{req.leagueName}</span>
                                            {req.requestType === 'manage' && <span className="bg-blue-600 text-white text-[9px] px-1.5 py-0.5 rounded font-black uppercase tracking-tighter">Manage Existing</span>}
                                        </div>
                                        <div className="text-sm text-gray-600 space-y-1">
                                            <p><span className="font-semibold">Region:</span> {req.region}</p>
                                            <p><span className="font-semibold">Manager:</span> {req.managerName}</p>
                                            <p className="line-clamp-2"><span className="font-semibold">Context:</span> {req.description}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2 self-start md:self-center">
                                        {processedIds.includes(req.id) ? <Spinner className="w-6 h-6 border-green-600"/> : (
                                            <>
                                                <Button onClick={() => handleLeagueDecision(req, 'rejected')} className="bg-white border border-red-200 text-red-600 hover:bg-red-50 focus:ring-red-500 h-9 px-3 flex items-center gap-1">
                                                    <XIcon className="w-4 h-4" /> Reject
                                                </Button>
                                                <Button onClick={() => handleLeagueDecision(req, 'approved')} className="bg-green-600 text-white hover:bg-green-700 focus:ring-green-500 h-9 px-3 flex items-center gap-1">
                                                    <CheckIcon className="w-4 h-4" /> Approve
                                                </Button>
                                            </>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-12 bg-gray-50 rounded-lg border border-dashed border-gray-300">
                            <TrophyIcon className="w-12 h-12 mx-auto text-gray-300 mb-2"/>
                            <p className="text-gray-500">No pending league creation requests.</p>
                        </div>
                    )
                )}

                {activeTab === 'data' && (
                    changes.length > 0 ? (
                    <div className="space-y-3">
                        {changes.map(change => (
                        <div 
                            key={change.id} 
                            className={`p-3 bg-white border rounded-lg flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 transition-all duration-300 ${processedIds.includes(change.id) ? 'opacity-50 grayscale' : 'opacity-100'}`}
                        >
                            <div>
                                <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${change.type === 'Score Update' ? 'bg-blue-100 text-blue-800' : 'bg-yellow-100 text-yellow-800'}`}>
                                    {change.type}
                                </span>
                                <p className="font-semibold mt-1">{change.description}</p>
                                <p className="text-xs text-gray-500">Submitted by: {change.author}</p>
                            </div>
                            <div className="flex-shrink-0 flex items-center gap-2">
                                {processedIds.includes(change.id) ? <Spinner className="w-6 h-6 border-blue-600"/> : (
                                    <>
                                        <Button onClick={() => handleDataDecision(change.id, 'rejected')} className="bg-red-100 text-red-700 hover:bg-red-200 focus:ring-red-500 h-9 w-9 p-0 flex items-center justify-center">
                                            <XIcon className="w-5 h-5" />
                                        </Button>
                                        <Button onClick={() => handleDataDecision(change.id, 'approved')} className="bg-green-100 text-green-700 hover:bg-green-200 focus:ring-green-500 h-9 w-9 p-0 flex items-center justify-center">
                                            <CheckIcon className="w-5 h-5" />
                                        </Button>
                                    </>
                                )}
                            </div>
                        </div>
                        ))}
                    </div>
                    ) : (
                    <div className="text-center py-12 bg-gray-50 rounded-lg border border-dashed border-gray-300">
                        <ClipboardListIcon className="w-12 h-12 mx-auto text-gray-300 mb-2"/>
                        <p className="text-gray-500">No pending data updates.</p>
                    </div>
                    )
                )}
            </>
        )}
      </CardContent>
    </Card>
  );
};

export default ApprovalQueue;
