
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { CompetitionFixture, Team } from '../data/teams';
import { DirectoryEntity } from '../data/directory';
import { listenToAllCompetitions, fetchDirectoryEntries } from '../services/api';
import CountdownTimer from './CountdownTimer';
import { findInMap } from '../services/utils';
import ArrowRightIcon from './icons/ArrowRightIcon';

const Hero: React.FC = () => {
    const [nextMatch, setNextMatch] = useState<CompetitionFixture | null>(null);
    const [teams, setTeams] = useState<Team[]>([]);
    const [directoryMap, setDirectoryMap] = useState<Map<string, DirectoryEntity>>(new Map());
    
    // High-quality stadium crowd image for cinematic effect
    const heroImageUrl = "https://images.unsplash.com/photo-1508098682722-e99c43a406b2?q=80&w=2070&auto=format&fit=crop";

    useEffect(() => {
        let unsubscribe: (() => void) | undefined;
        
        const startListening = async () => {
            const dirEntries = await fetchDirectoryEntries();
            const map = new Map<string, DirectoryEntity>();
            dirEntries.forEach(entry => map.set(entry.name.trim().toLowerCase(), entry));
            setDirectoryMap(map);

            unsubscribe = listenToAllCompetitions((allComps) => {
                const findUpcoming = (fixtures: CompetitionFixture[]) => {
                    const now = Date.now();
                    return (fixtures || [])
                        .filter(f => f.status !== 'finished' && f.fullDate)
                        .sort((a, b) => {
                            const statusOrder: Record<string, number> = {
                                'live': 0, 'suspended': 1, 'abandoned': 2, 'postponed': 3, 'scheduled': 4
                            };
                            const priorityA = statusOrder[a.status || 'scheduled'] ?? 99;
                            const priorityB = statusOrder[b.status || 'scheduled'] ?? 99;
                            if (priorityA !== priorityB) return priorityA - priorityB;

                            const timeA = new Date(a.fullDate! + 'T' + (a.time || '15:00')).getTime();
                            const timeB = new Date(b.fullDate! + 'T' + (b.time || '15:00')).getTime();
                            return Math.abs(timeA - now) - Math.abs(timeB - now);
                        });
                };

                let bestMatch: CompetitionFixture | null = null;
                let activeTeams: Team[] = [];
                
                // Prioritization: 1. Live games anywhere, 2. Premier League upcoming, 3. International upcoming
                const priorityIds = ['mtn-premier-league', 'national-first-division', 'uefa-champions-league', 'world-cup-qualifiers-men'];
                const otherIds = Object.keys(allComps).filter(id => !priorityIds.includes(id));
                const allCheckOrder = [...priorityIds, ...otherIds];

                for (const id of allCheckOrder) {
                    const comp = allComps[id];
                    if (comp) {
                        const upcoming = findUpcoming(comp.fixtures || []);
                        if (upcoming.length > 0) {
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

    const isLiveMode = nextMatch?.status === 'live' || nextMatch?.status === 'suspended' || nextMatch?.status === 'abandoned';

  return (
    <section className="relative h-[90vh] min-h-[750px] flex items-center justify-center text-white overflow-hidden bg-slate-950">
      {/* Background with subtle zoom effect */}
      <div 
        className="absolute inset-0 bg-cover bg-center transition-transform duration-[30000ms] scale-100 hover:scale-110"
        style={{ backgroundImage: `url(${heroImageUrl})`, zIndex: 0 }}
      ></div>
      
      {/* Cinematic Overlays: Heavy vignettes and deep blue gradients */}
      <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-900/40 to-transparent" style={{ zIndex: 1 }}></div>
      <div className="absolute inset-0 bg-gradient-to-r from-slate-950 via-transparent to-slate-950" style={{ zIndex: 1 }}></div>
      
      <div className="relative container mx-auto px-4 z-10">
        <div className="max-w-6xl mx-auto text-center">
            {nextMatch ? (
                <div className="animate-in fade-in zoom-in duration-1000">
                    <div className="inline-flex items-center gap-2 mb-10 px-8 py-3 rounded-full bg-white/5 backdrop-blur-xl border border-white/10 shadow-2xl ring-1 ring-white/20">
                        <div className={`w-2.5 h-2.5 rounded-full ${isLiveMode ? 'bg-red-500 animate-ping' : 'bg-accent shadow-[0_0_15px_rgba(253,185,19,0.5)]'}`}></div>
                        <p className="font-black tracking-[0.4em] uppercase text-[11px] text-white/90">
                            {isLiveMode ? 'MATCH CURRENTLY LIVE' : 'THE BIG MATCHUP'}
                        </p>
                    </div>

                    <div className="flex flex-col lg:flex-row items-center justify-center gap-8 lg:gap-20 mb-16 px-4">
                        {/* Team A */}
                        <div className="flex flex-col items-center group flex-1">
                            <div className="w-40 h-40 md:w-56 md:h-56 mb-8 bg-white/5 backdrop-blur-sm rounded-[2.5rem] p-8 flex items-center justify-center shadow-2xl border border-white/10 transition-all duration-700 group-hover:scale-110 group-hover:rotate-2 group-hover:border-white/30">
                                {crestA ? (
                                    <img src={crestA} alt="" className="max-w-full max-h-full object-contain drop-shadow-[0_10px_30px_rgba(255,255,255,0.2)]"/>
                                ) : (
                                    <div className="text-6xl font-black text-white/10">{nextMatch.teamA.charAt(0)}</div>
                                )}
                            </div>
                            <h2 className="text-4xl md:text-6xl font-display font-black uppercase leading-none tracking-tighter drop-shadow-2xl text-transparent bg-clip-text bg-gradient-to-b from-white to-white/60">
                                {nextMatch.teamA}
                            </h2>
                        </div>

                        {/* Versus / Score Center */}
                        <div className="flex flex-col items-center justify-center py-8">
                            {isLiveMode ? (
                                <div className="relative group">
                                    <div className="absolute -inset-10 bg-red-600/20 rounded-full blur-[80px] animate-pulse"></div>
                                    <div className="relative bg-white/10 backdrop-blur-3xl px-12 py-6 rounded-[2rem] border border-white/20 shadow-[0_20px_50px_rgba(0,0,0,0.5)] ring-1 ring-white/30">
                                        <div className="text-7xl md:text-[8rem] font-black tracking-tighter leading-none flex items-center">
                                            <span>{nextMatch.scoreA ?? 0}</span>
                                            <span className="text-red-600 mx-4 animate-pulse">:</span>
                                            <span>{nextMatch.scoreB ?? 0}</span>
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <div className="flex flex-col items-center">
                                    <div className="text-6xl md:text-[9rem] font-black italic text-transparent bg-clip-text bg-gradient-to-b from-accent via-yellow-400 to-yellow-700 drop-shadow-2xl leading-none scale-90 lg:scale-100">VS</div>
                                    <div className="mt-4 h-1.5 w-32 bg-gradient-to-r from-transparent via-accent to-transparent rounded-full opacity-50 shadow-[0_0_20px_rgba(253,185,19,0.4)]"></div>
                                </div>
                            )}
                        </div>

                        {/* Team B */}
                        <div className="flex flex-col items-center group flex-1">
                            <div className="w-40 h-40 md:w-56 md:h-56 mb-8 bg-white/5 backdrop-blur-sm rounded-[2.5rem] p-8 flex items-center justify-center shadow-2xl border border-white/10 transition-all duration-700 group-hover:scale-110 group-hover:-rotate-2 group-hover:border-white/30">
                                {crestB ? (
                                    <img src={crestB} alt="" className="max-w-full max-h-full object-contain drop-shadow-[0_10px_30px_rgba(255,255,255,0.2)]"/>
                                ) : (
                                    <div className="text-6xl font-black text-white/10">{nextMatch.teamB.charAt(0)}</div>
                                )}
                            </div>
                            <h2 className="text-4xl md:text-6xl font-display font-black uppercase leading-none tracking-tighter drop-shadow-2xl text-transparent bg-clip-text bg-gradient-to-b from-white to-white/60">
                                {nextMatch.teamB}
                            </h2>
                        </div>
                    </div>

                    <div className="space-y-10">
                        {nextMatch.status === 'live' ? (
                            <div className="flex flex-col items-center gap-4">
                                <div className="bg-red-600 px-8 py-2 rounded-2xl text-[10px] font-black uppercase tracking-[0.3em] animate-pulse shadow-[0_0_40px_rgba(220,38,38,0.4)] border border-white/20">
                                    Match in Progress
                                </div>
                                <p className="text-5xl font-mono font-black text-white/90 drop-shadow-lg">{nextMatch.liveMinute || '0'}'</p>
                            </div>
                        ) : nextMatch.status === 'scheduled' ? (
                            <div className="scale-110">
                                <CountdownTimer targetDate={targetDateStr} />
                            </div>
                        ) : (
                            <div className="bg-white/5 px-12 py-5 rounded-[2rem] border border-white/10 backdrop-blur-2xl inline-block shadow-2xl">
                                <p className="text-3xl font-black uppercase tracking-[0.3em] text-white/70">{nextMatch.status}</p>
                            </div>
                        )}
                        
                        <div className="flex flex-col items-center gap-4 mt-12 opacity-80">
                            {nextMatch.venue && (
                                <div className="flex items-center justify-center gap-4">
                                    <div className="h-[1px] w-16 bg-gradient-to-r from-transparent to-white/20"></div>
                                    <p className="text-[12px] font-black uppercase tracking-[0.5em] text-white/60">{nextMatch.venue}</p>
                                    <div className="h-[1px] w-16 bg-gradient-to-l from-transparent to-white/20"></div>
                                </div>
                            )}
                            <p className="text-[10px] font-bold uppercase tracking-widest text-accent">{nextMatch.competition}</p>
                        </div>
                    </div>
                </div>
            ) : (
                <div className="animate-in fade-in slide-in-from-bottom-12 duration-1000">
                    <h1 className="text-7xl md:text-[11rem] font-black font-display tracking-tighter leading-[0.8] mb-10 select-none">
                        THE GAME <br/> <span className="text-transparent bg-clip-text bg-gradient-to-r from-accent via-yellow-400 to-accent bg-[length:200%_auto] animate-marquee drop-shadow-[0_0_30px_rgba(253,185,19,0.3)]">LIVES HERE</span>
                    </h1>
                    <p className="text-xl md:text-2xl text-white/60 max-w-3xl mx-auto font-medium leading-relaxed tracking-wide italic">
                        "Uniting the Kingdom through the pulse of Eswatini football."
                    </p>
                </div>
            )}
            
            <div className="mt-20 flex flex-wrap justify-center gap-6">
                <Link to="/fixtures" className="group bg-accent text-primary-dark font-black py-5 px-12 rounded-2xl hover:bg-yellow-300 transition-all hover:scale-105 shadow-[0_20px_60px_rgba(253,185,19,0.3)] uppercase text-[10px] tracking-[0.2em] flex items-center gap-3">
                    MATCH SCHEDULE <ArrowRightIcon className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                </Link>
                <Link to="/live-updates" className="group bg-white/5 backdrop-blur-3xl text-white border border-white/10 font-black py-5 px-12 rounded-2xl hover:bg-white/10 transition-all hover:scale-105 uppercase text-[10px] tracking-[0.2em] shadow-2xl flex items-center gap-3">
                    MATCH CENTER <RadioIcon className="w-4 h-4 text-accent" />
                </Link>
            </div>
        </div>
      </div>
      
      {/* Texture Overlays & Bottom Vignette */}
      <div className="absolute inset-0 pointer-events-none opacity-5 mix-blend-overlay bg-[url('https://www.transparenttextures.com/patterns/stardust.png')]" style={{ zIndex: 2 }}></div>
      <div className="absolute bottom-0 left-0 w-full h-48 bg-gradient-to-t from-slate-950 to-transparent" style={{ zIndex: 2 }}></div>

      <style>{`
        @keyframes sweep {
            0% { transform: translateX(-100%) skewX(-12deg); }
            100% { transform: translateX(300%) skewX(-12deg); }
        }
      `}</style>
    </section>
  );
};

const RadioIcon: React.FC<{className?: string}> = ({className}) => (
    <svg className={className} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="2"></circle>
        <path d="M16.24 7.76a6 6 0 0 1 0 8.49"></path>
        <path d="M19.07 4.93a10 10 0 0 1 0 14.14"></path>
        <path d="M7.76 16.24a6 6 0 0 1 0-8.49"></path>
        <path d="M4.93 19.07a10 10 0 0 1 0-14.14"></path>
    </svg>
);

export default Hero;
