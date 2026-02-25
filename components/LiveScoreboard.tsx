
import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { listenToAllCompetitions, fetchDirectoryEntries } from '../services/api';
import { CompetitionFixture } from '../data/teams';
import { DirectoryEntity } from '../data/directory';
import { findInMap } from '../services/utils';
import ChevronLeftIcon from './icons/ChevronLeftIcon';
import ChevronRightIcon from './icons/ChevronRightIcon';

interface LiveMatch extends CompetitionFixture {
    teamACrest?: string;
    teamBCrest?: string;
    teamAId?: number;
    teamBId?: number;
}

const LiveMatchCard: React.FC<{ match: LiveMatch, directoryMap: Map<string, DirectoryEntity>, competitionId: string }> = ({ match, directoryMap, competitionId }) => {
    const [timeLeft, setTimeLeft] = useState<string>('');

    useEffect(() => {
        if (match.status === 'scheduled' && match.fullDate) {
            const target = new Date(`${match.fullDate}T${match.time || '00:00'}`);
            const timer = setInterval(() => {
                const now = new Date();
                const diff = target.getTime() - now.getTime();
                if (diff <= 0) setTimeLeft('Starting...');
                else if (diff < 3600000) setTimeLeft(`Starts in ${Math.floor(diff / 60000)}m`);
                else setTimeLeft(match.time || '');
            }, 60000);
            return () => clearInterval(timer);
        }
    }, [match]);

    const TeamLink: React.FC<{ teamName: string, teamId?: number, crestUrl?: string, justification: 'start' | 'end' }> = ({ teamName, teamId, crestUrl, justification }) => {
        let linkProps = { isLinkable: !!teamId, competitionId: competitionId, teamId: teamId };
        if (!linkProps.isLinkable) {
            const teamEntity = findInMap(teamName, directoryMap);
            if (teamEntity?.teamId) linkProps = { isLinkable: true, competitionId: teamEntity.competitionId || competitionId, teamId: teamEntity.teamId };
        }
        const content = (
            <div className={`flex items-center gap-2 overflow-hidden ${justification === 'end' ? 'justify-end text-right' : 'justify-start text-left'}`}>
                {justification === 'start' && crestUrl && <img src={crestUrl} alt="" className="w-5 h-5 object-contain flex-shrink-0" />}
                <p className="font-bold text-[11px] sm:text-xs truncate leading-tight flex-grow">{teamName}</p>
                {justification === 'end' && crestUrl && <img src={crestUrl} alt="" className="w-5 h-5 object-contain flex-shrink-0" />}
            </div>
        );
        return linkProps.isLinkable ? <Link to={`/competitions/${linkProps.competitionId}/teams/${linkProps.teamId}`} className="hover:underline flex-grow min-w-0">{content}</Link> : <div className="flex-grow min-w-0">{content}</div>;
    };
    
    const statusColor = match.status === 'live' ? 'text-secondary' : match.status === 'suspended' ? 'text-orange-600' : 'text-blue-600';

    return (
        <div className="bg-white rounded-xl shadow-md p-3.5 h-full flex flex-col justify-center w-full hover:shadow-lg transition-all duration-300 border border-slate-100 hover:border-primary/20">
            <div className="flex justify-between items-center mb-2.5">
                <p className="text-[9px] text-gray-400 truncate max-w-[140px] uppercase font-black tracking-widest">{match.venue || 'Match Center'}</p>
                <div className={`flex items-center space-x-1.5 ${statusColor} font-black text-[9px] tracking-tight ${match.status === 'live' ? 'animate-pulse' : ''}`}>
                    {match.status === 'live' && <span className="w-1.5 h-1.5 bg-secondary rounded-full"></span>}
                    <span>{match.status?.toUpperCase() || 'UPCOMING'}</span>
                    {match.liveMinute && match.status === 'live' && <span className="font-mono">{match.liveMinute}'</span>}
                </div>
            </div>
            <div className="grid grid-cols-[1fr_auto_1fr] items-center text-center gap-3">
                <TeamLink teamName={match.teamA} teamId={match.teamAId} crestUrl={match.teamACrest} justification="end" />
                <div className="bg-slate-50 px-2.5 py-1.5 rounded-lg min-w-[65px] border border-slate-100 shadow-inner">
                    {match.status === 'scheduled' ? <p className="font-black text-[10px] text-slate-700">{timeLeft || match.time}</p> : <p className="font-black text-xl text-primary tabular-nums tracking-tighter">{match.scoreA ?? 0} - {match.scoreB ?? 0}</p>}
                </div>
                <TeamLink teamName={match.teamB} teamId={match.teamBId} crestUrl={match.teamBCrest} justification="start" />
            </div>
        </div>
    );
};

const LiveScoreboard: React.FC = () => {
    const [matches, setMatches] = useState<LiveMatch[]>([]);
    const [directoryMap, setDirectoryMap] = useState<Map<string, DirectoryEntity>>(new Map());
    const scrollContainerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        let unsubscribe: (() => void) | undefined;
        
        const startListening = async () => {
            const dirEntries = await fetchDirectoryEntries();
            const map = new Map<string, DirectoryEntity>();
            dirEntries.forEach(entry => map.set(entry.name.trim().toLowerCase(), entry));
            setDirectoryMap(map);

            unsubscribe = listenToAllCompetitions((allComps) => {
                const combined: LiveMatch[] = [];
                const now = new Date();
                Object.entries(allComps).forEach(([compId, comp]) => {
                    if (comp.fixtures) {
                        comp.fixtures.forEach(f => {
                            const matchTime = new Date(`${f.fullDate}T${f.time || '15:00'}`);
                            const isLive = f.status === 'live' || f.status === 'suspended';
                            const isStartingSoon = matchTime > now && (matchTime.getTime() - now.getTime() < 7200000);
                            const justStarted = f.status === 'scheduled' && now >= matchTime && (now.getTime() - matchTime.getTime() < 10800000);
                            
                            if (isLive || isStartingSoon || justStarted) {
                                const teamA = comp.teams?.find(t => t.name === f.teamA);
                                const teamB = comp.teams?.find(t => t.name === f.teamB);
                                const dirA = findInMap(f.teamA, map);
                                const dirB = findInMap(f.teamB, map);
                                combined.push({ ...f, teamACrest: teamA?.crestUrl || dirA?.crestUrl, teamBCrest: teamB?.crestUrl || dirB?.crestUrl, teamAId: teamA?.id || dirA?.teamId, teamBId: teamB?.id || dirB?.teamId });
                            }
                        });
                    }
                });
                combined.sort((a, b) => {
                    if (a.status === 'live' && b.status !== 'live') return -1;
                    if (b.status === 'live' && a.status !== 'live') return 1;
                    return 0;
                });
                setMatches(combined);
            });
        };
        
        startListening();
        return () => unsubscribe?.();
    }, []);

    if (matches.length === 0) return null;

    return (
        <section className="py-4 bg-gray-100/50 border-b">
            <div className="container mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-red-600 rounded-full animate-pulse"></div>
                        <h2 className="text-xs font-black uppercase tracking-widest text-gray-600">Match Ticker</h2>
                    </div>
                    <div className="flex gap-1">
                        <button onClick={() => scrollContainerRef.current?.scrollBy({ left: -240, behavior: 'smooth' })} className="p-1 rounded-full bg-white shadow-sm border hover:bg-slate-50 transition-colors"><ChevronLeftIcon className="w-4 h-4" /></button>
                        <button onClick={() => scrollContainerRef.current?.scrollBy({ left: 240, behavior: 'smooth' })} className="p-1 rounded-full bg-white shadow-sm border hover:bg-slate-50 transition-colors"><ChevronRightIcon className="w-4 h-4" /></button>
                    </div>
                </div>
                <div ref={scrollContainerRef} className="flex overflow-x-auto gap-5 pb-3 scrollbar-hide snap-x snap-mandatory">
                    {matches.map(match => (
                        <div key={match.id} className="flex-shrink-0 w-[280px] sm:w-[320px] snap-center">
                            <LiveMatchCard match={match} directoryMap={directoryMap} competitionId="multi" />
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
};

export default LiveScoreboard;
