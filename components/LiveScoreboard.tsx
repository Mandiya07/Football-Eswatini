
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Link } from 'react-router-dom';
import { fetchCompetition, fetchDirectoryEntries } from '../services/api';
import { CompetitionFixture } from '../data/teams';
import { DirectoryEntity } from '../data/directory';
import { findInMap } from '../services/utils';

interface LiveMatch extends CompetitionFixture {
    teamACrest?: string;
    teamBCrest?: string;
    teamAId?: number;
    teamBId?: number;
    isScheduled?: boolean;
}

const LiveMatchCard: React.FC<{ match: LiveMatch, directoryMap: Map<string, DirectoryEntity>, competitionId: string }> = ({ match, directoryMap, competitionId }) => {
    const [timeLeft, setTimeLeft] = useState<string>('');

    useEffect(() => {
        if (match.status === 'scheduled' && match.fullDate) {
            const target = new Date(`${match.fullDate}T${match.time || '00:00'}`);
            const timer = setInterval(() => {
                const now = new Date();
                const diff = target.getTime() - now.getTime();
                if (diff <= 0) {
                    setTimeLeft('Starting...');
                } else if (diff < 3600000) { // Less than 1 hour
                    const mins = Math.floor(diff / 60000);
                    setTimeLeft(`Starts in ${mins}m`);
                } else {
                    setTimeLeft(match.time || '');
                }
            }, 60000);
            return () => clearInterval(timer);
        }
    }, [match]);

    const TeamLink: React.FC<{ teamName: string, teamId?: number, crestUrl?: string, justification: 'start' | 'end' }> = ({ teamName, teamId, crestUrl, justification }) => {
        let linkProps = {
            isLinkable: !!teamId,
            competitionId: competitionId,
            teamId: teamId
        };
        if (!linkProps.isLinkable) {
            const teamEntity = findInMap(teamName, directoryMap);
            if (teamEntity && teamEntity.teamId && teamEntity.competitionId) {
                linkProps = {
                    isLinkable: true,
                    competitionId: teamEntity.competitionId,
                    teamId: teamEntity.teamId
                };
            }
        }

        const content = (
            <div className={`flex items-center gap-2 ${justification === 'end' ? 'justify-end' : ''}`}>
                {justification === 'start' && crestUrl && <img src={crestUrl} alt={teamName} className="w-6 h-6 object-contain" />}
                <p className="font-semibold text-sm truncate">{teamName}</p>
                {justification === 'end' && crestUrl && <img src={crestUrl} alt={teamName} className="w-6 h-6 object-contain" />}
            </div>
        );

        if (linkProps.isLinkable) {
            return <Link to={`/competitions/${linkProps.competitionId}/teams/${linkProps.teamId}`} className="hover:underline">{content}</Link>;
        }
        return <div>{content}</div>;
    };
    
    const statusColor = match.status === 'live' ? 'text-secondary' : match.status === 'suspended' ? 'text-orange-600' : 'text-blue-600';
    const statusText = match.status === 'live' ? 'LIVE' : match.status === 'suspended' ? 'SUSP' : 'UPCOMING';

    return (
        <div className="bg-white rounded-lg shadow-md p-3 snap-center h-full flex flex-col justify-center min-w-[280px]">
            <div className="flex justify-between items-center mb-2">
                <p className="text-xs text-gray-500 truncate max-w-[150px]">{match.venue || 'Premier League'}</p>
                <div className={`flex items-center space-x-1.5 ${statusColor} font-bold text-xs ${match.status === 'live' ? 'animate-pulse' : ''}`}>
                    {match.status === 'live' && <span className="w-2 h-2 bg-secondary rounded-full"></span>}
                    <span>{statusText}</span>
                    {match.liveMinute && match.status === 'live' && <span className="font-mono">{match.liveMinute}'</span>}
                </div>
            </div>
            <div className="grid grid-cols-[1fr_auto_1fr] items-center text-center gap-2">
                <TeamLink teamName={match.teamA} teamId={match.teamAId} crestUrl={match.teamACrest} justification="start" />
                
                {match.status === 'scheduled' ? (
                    <div className="bg-gray-100 px-2 py-1 rounded">
                         <p className="font-bold text-sm text-gray-700">{timeLeft || match.time}</p>
                         <p className="text-[10px] text-gray-500 font-bold">VS</p>
                    </div>
                ) : (
                    <p className="font-bold text-2xl tracking-wider text-primary px-2">{match.scoreA ?? 0} - {match.scoreB ?? 0}</p>
                )}
                
                <TeamLink teamName={match.teamB} teamId={match.teamBId} crestUrl={match.teamBCrest} justification="end" />
            </div>
        </div>
    );
};


const LiveScoreboard: React.FC = () => {
    const [matches, setMatches] = useState<LiveMatch[]>([]);
    const [directoryMap, setDirectoryMap] = useState<Map<string, DirectoryEntity>>(new Map());
    const competitionId = 'mtn-premier-league';
    const directoryMapRef = useRef<Map<string, DirectoryEntity>>(new Map());

    const fetchMatches = useCallback(async () => {
        try {
            const data = await fetchCompetition(competitionId);
            if (data) {
                // 1. Live Matches
                const live = data.fixtures?.filter(f => f.status === 'live' || f.status === 'suspended') || [];
                
                // 2. Upcoming Matches (Next 24 hours)
                const now = new Date();
                const scheduled = data.fixtures?.filter(f => {
                    if (f.status !== 'scheduled' || !f.fullDate) return false;
                    const matchTime = new Date(`${f.fullDate}T${f.time || '00:00'}`);
                    return matchTime > now;
                }) || [];
                
                // Sort scheduled by time
                scheduled.sort((a, b) => new Date(`${a.fullDate}T${a.time}`).getTime() - new Date(`${b.fullDate}T${b.time}`).getTime());

                // Take top 5 scheduled
                const upcoming = scheduled.slice(0, 5);

                const combined = [...live, ...upcoming];
                const allTeams = data.teams || [];
                
                const processedMatches = combined.map(match => {
                    const teamA = allTeams.find(t => t.name.trim() === match.teamA.trim());
                    const teamB = allTeams.find(t => t.name.trim() === match.teamB.trim());
                    const dirA = findInMap(match.teamA, directoryMapRef.current);
                    const dirB = findInMap(match.teamB, directoryMapRef.current);

                    return {
                        ...match,
                        teamACrest: teamA?.crestUrl || dirA?.crestUrl,
                        teamBCrest: teamB?.crestUrl || dirB?.crestUrl,
                        teamAId: teamA?.id || dirA?.teamId,
                        teamBId: teamB?.id || dirB?.teamId,
                    };
                });
                setMatches(processedMatches);
            }
        } catch (error) {
            console.error("Failed to fetch matches:", error);
        }
    }, []);

    useEffect(() => {
        const loadInitialData = async () => {
            const directoryEntries = await fetchDirectoryEntries();
            const map = new Map<string, DirectoryEntity>();
            directoryEntries.forEach(entry => map.set(entry.name.trim().toLowerCase(), entry));
            setDirectoryMap(map);
            directoryMapRef.current = map;
            await fetchMatches();
        };
        loadInitialData();
        const interval = setInterval(fetchMatches, 30000);
        return () => clearInterval(interval);
    }, [fetchMatches]);


    if (matches.length === 0) {
        return null;
    }

    return (
        <section className="py-8 bg-primary/5">
            <div className="container mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex items-center gap-3 mb-4">
                    <div className="w-3 h-3 bg-red-600 rounded-full animate-pulse"></div>
                    <h2 className="text-xl font-display font-bold text-gray-800">Match Center</h2>
                </div>
                <div className="grid grid-flow-col auto-cols-max gap-4 overflow-x-auto snap-x snap-mandatory scroll-smooth -mx-4 px-4 pb-4 scrollbar-hide">
                    {matches.map(match => (
                        <LiveMatchCard key={match.id} match={match} directoryMap={directoryMap} competitionId={competitionId} />
                    ))}
                </div>
            </div>
        </section>
    );
};

export default LiveScoreboard;
