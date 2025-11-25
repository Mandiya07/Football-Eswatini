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
}

const LiveMatchCard: React.FC<{ match: LiveMatch, directoryMap: Map<string, DirectoryEntity>, competitionId: string }> = ({ match, directoryMap, competitionId }) => {
    
    const TeamLink: React.FC<{ teamName: string, teamId?: number, crestUrl?: string, justification: 'start' | 'end' }> = ({ teamName, teamId, crestUrl, justification }) => {
        // HYBRID LINKING LOGIC
        // 1. Prioritize direct ID from the match data.
        let linkProps = {
            isLinkable: !!teamId,
            competitionId: competitionId,
            teamId: teamId
        };
        // 2. Fallback to directory if direct ID is missing.
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

    return (
        <div className="bg-white rounded-lg shadow-md p-3 snap-center h-full flex flex-col justify-center min-w-[280px]">
            <div className="flex justify-between items-center mb-2">
                <p className="text-xs text-gray-500 truncate max-w-[150px]">{match.venue || 'Premier League'}</p>
                <div className={`flex items-center space-x-1.5 ${match.status === 'suspended' ? 'text-orange-600' : 'text-secondary'} font-bold text-xs animate-pulse`}>
                    <span className={`w-2 h-2 ${match.status === 'suspended' ? 'bg-orange-600' : 'bg-secondary'} rounded-full`}></span>
                    <span>{match.status === 'suspended' ? 'SUSP' : 'LIVE'}</span>
                    <span className="font-mono">{match.liveMinute ? `${match.liveMinute}'` : ''}</span>
                </div>
            </div>
            <div className="grid grid-cols-[1fr_auto_1fr] items-center text-center gap-2">
                <TeamLink teamName={match.teamA} teamId={match.teamAId} crestUrl={match.teamACrest} justification="start" />
                <p className="font-bold text-2xl tracking-wider text-primary px-2">{match.scoreA ?? 0} - {match.scoreB ?? 0}</p>
                <TeamLink teamName={match.teamB} teamId={match.teamBId} crestUrl={match.teamBCrest} justification="end" />
            </div>
        </div>
    );
};


const LiveScoreboard: React.FC = () => {
    const [liveMatches, setLiveMatches] = useState<LiveMatch[]>([]);
    const [directoryMap, setDirectoryMap] = useState<Map<string, DirectoryEntity>>(new Map());
    const competitionId = 'mtn-premier-league';
    
    // Use a ref to access the latest directoryMap inside the interval closure without re-running the effect
    const directoryMapRef = useRef<Map<string, DirectoryEntity>>(new Map());

    const fetchLiveMatches = useCallback(async () => {
        try {
            const data = await fetchCompetition(competitionId);
            if (data) {
                const live = data.fixtures?.filter(f => f.status === 'live' || f.status === 'suspended') || [];
                const allTeams = data.teams || [];
                
                const matchesWithCrests = live.map(match => {
                    const teamA = allTeams.find(t => t.name.trim() === match.teamA.trim());
                    const teamB = allTeams.find(t => t.name.trim() === match.teamB.trim());
                    
                    // Resolve via directory if team object missing or missing crest
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
                setLiveMatches(matchesWithCrests);
            }
        } catch (error) {
            console.error("Failed to fetch live matches:", error);
        }
    }, []);

    useEffect(() => {
        const loadInitialData = async () => {
            // 1. Load Directory first
            const directoryEntries = await fetchDirectoryEntries();
            const map = new Map<string, DirectoryEntity>();
            directoryEntries.forEach(entry => map.set(entry.name.trim().toLowerCase(), entry));
            setDirectoryMap(map);
            directoryMapRef.current = map;

            // 2. Initial Match Fetch
            await fetchLiveMatches();
        };
        
        loadInitialData();

        // 3. Set up polling every 30 seconds for live updates
        const interval = setInterval(fetchLiveMatches, 30000);

        return () => clearInterval(interval);
    }, [fetchLiveMatches]);


    if (liveMatches.length === 0) {
        return null;
    }

    return (
        <section className="py-8 bg-primary/5">
            <div className="container mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex items-center gap-3 mb-4">
                    <div className="w-3 h-3 bg-red-600 rounded-full animate-pulse"></div>
                    <h2 className="text-xl font-display font-bold text-gray-800">Live Matches</h2>
                </div>
                <div className="grid grid-flow-col auto-cols-max gap-4 overflow-x-auto snap-x snap-mandatory scroll-smooth -mx-4 px-4 pb-4 scrollbar-hide">
                    {liveMatches.map(match => (
                        <LiveMatchCard key={match.id} match={match} directoryMap={directoryMap} competitionId={competitionId} />
                    ))}
                </div>
            </div>
        </section>
    );
};

export default LiveScoreboard;