import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { CompetitionFixture, Team } from '../data/teams';
import { DirectoryEntity } from '../data/directory';
import { listenToAllCompetitions, fetchDirectoryEntries } from '../services/api';
import CountdownTimer from './CountdownTimer';
import { findInMap } from '../services/utils';

const Hero: React.FC = () => {
    const [nextMatch, setNextMatch] = useState<CompetitionFixture | null>(null);
    const [teams, setTeams] = useState<Team[]>([]);
    const [directoryMap, setDirectoryMap] = useState<Map<string, DirectoryEntity>>(new Map());
    const heroImageUrl = "https://images.unsplash.com/photo-1579952363873-27f3bade9f55?q=80&w=1935&auto=format&fit=crop";

    useEffect(() => {
        let unsubscribe: (() => void) | undefined;
        
        const startListening = async () => {
            const dirEntries = await fetchDirectoryEntries();
            const map = new Map<string, DirectoryEntity>();
            dirEntries.forEach(entry => map.set(entry.name.trim().toLowerCase(), entry));
            setDirectoryMap(map);

            unsubscribe = listenToAllCompetitions((allComps) => {
                const findUpcoming = (fixtures: CompetitionFixture[]) => {
                    return (fixtures || [])
                        .filter(f => f.status !== 'finished' && f.fullDate)
                        .sort((a, b) => {
                            // PRIORITY 1: Status (Live > Suspended > Abandoned > Postponed > Scheduled)
                            const statusOrder: Record<string, number> = {
                                'live': 0,
                                'suspended': 1,
                                'abandoned': 2,
                                'postponed': 3,
                                'scheduled': 4,
                                'cancelled': 5
                            };
                            
                            const priorityA = statusOrder[a.status || 'scheduled'] ?? 99;
                            const priorityB = statusOrder[b.status || 'scheduled'] ?? 99;
                            
                            if (priorityA !== priorityB) return priorityA - priorityB;

                            // PRIORITY 2: Closest time to now
                            const timeA = new Date(a.fullDate! + 'T' + (a.time || '15:00')).getTime();
                            const timeB = new Date(b.fullDate! + 'T' + (b.time || '15:00')).getTime();
                            const now = Date.now();

                            return Math.abs(timeA - now) - Math.abs(timeB - now);
                        });
                };

                let bestMatch: CompetitionFixture | null = null;
                let activeTeams: Team[] = [];

                // Priority to Premier League, then First Division, then others
                const priorityIds = ['mtn-premier-league', 'national-first-division'];
                const otherIds = Object.keys(allComps).filter(id => !priorityIds.includes(id));
                const allCheckOrder = [...priorityIds, ...otherIds];

                for (const id of allCheckOrder) {
                    const comp = allComps[id];
                    if (comp) {
                        const upcoming = findUpcoming(comp.fixtures || []);
                        if (upcoming.length > 0) {
                            // If we find a live match in a lower priority league, we might still prefer it over a scheduled one in a high priority league.
                            // But for this simple implementation, we take the first league that has any upcoming/live matches.
                            bestMatch = upcoming[0];
                            activeTeams = comp.teams || [];
                            break;
                        }
                    }
                }

                if (bestMatch) {
                    setNextMatch(bestMatch);
                    setTeams(activeTeams);
                }
            });
        };

        startListening();
        return () => unsubscribe?.();
    }, []);

    const teamADirectory = findInMap(nextMatch?.teamA || '', directoryMap);
    const teamBDirectory = findInMap(nextMatch?.teamB || '', directoryMap);

    const crestA = teamADirectory?.crestUrl || teams.find(t => t.name === nextMatch?.teamA)?.crestUrl;
    const crestB = teamBDirectory?.crestUrl || teams.find(t => t.name === nextMatch?.teamB)?.crestUrl;

    const targetDateStr = nextMatch?.fullDate ? `${nextMatch.fullDate}T${nextMatch.time || '15:00'}:00` : new Date().toISOString();

    const getStatusText = () => {
        if (!nextMatch) return null;
        switch (nextMatch.status) {
            case 'live': return 'Match In Progress';
            case 'suspended': return 'Match Suspended';
            case 'abandoned': return 'Match Abandoned';
            case 'postponed': return 'Match Postponed';
            case 'cancelled': return 'Match Cancelled';
            default: return 'Next Big Match';
        }
    };

    const isLiveMode = nextMatch?.status === 'live' || nextMatch?.status === 'suspended' || nextMatch?.status === 'abandoned';

  return (
    <section 
      className="relative h-[80vh] bg-cover bg-center flex items-center justify-center text-white overflow-hidden"
      style={{ backgroundImage: `url(${heroImageUrl})` }}
    >
      <div className="absolute inset-0 bg-black/50"></div>
      <div className="relative container mx-auto px-4 z-10">
        <div className="max-w-4xl mx-auto text-center">
            {nextMatch ? (
                <div className="animate-fade-in-slow">
                    <p className={`font-bold mb-4 tracking-widest uppercase text-sm ${isLiveMode ? 'text-accent' : 'text-yellow-400'}`}>
                        {getStatusText()}
                    </p>
                    <div className="flex items-center justify-center gap-6 md:gap-12 mb-6">
                        <div className="text-center w-32 md:w-48">
                            <div className="w-16 h-16 md:w-24 md:h-24 mx-auto mb-3 bg-white/10 backdrop-blur rounded-full p-3 flex items-center justify-center border border-white/20">
                                {crestA && <img src={crestA} alt="" className="max-w-full max-h-full object-contain"/>}
                            </div>
                            <h2 className="text-lg md:text-2xl font-black font-display uppercase leading-tight">{nextMatch.teamA}</h2>
                        </div>
                        <div className="flex flex-col items-center">
                            {isLiveMode || nextMatch.status === 'finished' ? (
                                <div className="bg-white/10 px-4 py-2 rounded-lg border border-white/20 shadow-2xl">
                                    <span className={`text-4xl md:text-6xl font-black ${nextMatch.status === 'live' ? 'animate-pulse' : ''}`}>
                                        {nextMatch.scoreA ?? 0} : {nextMatch.scoreB ?? 0}
                                    </span>
                                </div>
                            ) : <span className="text-4xl md:text-5xl font-black italic text-yellow-400 drop-shadow-lg">VS</span>}
                        </div>
                        <div className="text-center w-32 md:w-48">
                            <div className="w-16 h-16 md:w-24 md:h-24 mx-auto mb-3 bg-white/10 backdrop-blur rounded-full p-3 flex items-center justify-center border border-white/20">
                                {crestB && <img src={crestB} alt="" className="max-w-full max-h-full object-contain"/>}
                            </div>
                             <h2 className="text-lg md:text-2xl font-black font-display uppercase leading-tight">{nextMatch.teamB}</h2>
                        </div>
                    </div>

                    {nextMatch.status === 'live' ? (
                         <div className="flex flex-col items-center gap-2">
                             <div className="bg-red-600 px-3 py-1 rounded text-xs font-bold animate-pulse uppercase tracking-widest shadow-lg">Live Now</div>
                             <p className="text-2xl font-mono font-bold">{nextMatch.liveMinute || '0'}'</p>
                         </div>
                    ) : nextMatch.status === 'scheduled' ? (
                        <CountdownTimer targetDate={targetDateStr} />
                    ) : (
                        <div className="bg-white/10 px-6 py-3 rounded-full border border-white/20 backdrop-blur-md inline-block">
                             <p className="text-xl font-bold uppercase tracking-widest">{nextMatch.status}</p>
                        </div>
                    )}
                    
                    {nextMatch.venue && <p className="mt-6 text-[10px] text-gray-300 font-black uppercase tracking-[0.3em]">{nextMatch.venue}</p>}
                </div>
            ) : (
                <>
                    <h1 className="text-6xl md:text-8xl font-black font-display tracking-tighter leading-none mb-6">FOOTBALL <span className="text-accent">ESWATINI</span></h1>
                    <p className="text-xl text-neutral-light/80 max-w-2xl mx-auto font-medium">The heartbeat of the Kingdom's beautiful game. Real-time scores, news, and community.</p>
                </>
            )}
            <div className="mt-10 flex justify-center gap-4">
                <Link to="/fixtures" className="bg-accent text-primary-dark font-black py-4 px-8 rounded-lg hover:bg-yellow-300 transition-all hover:scale-105 shadow-xl uppercase text-sm tracking-widest">Fixtures</Link>
                <Link to="/live-updates" className="bg-white/10 backdrop-blur-md text-white border border-white/30 font-black py-4 px-8 rounded-lg hover:bg-white/20 transition-all hover:scale-105 uppercase text-sm tracking-widest">Match Center</Link>
            </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;