import React, { useMemo } from 'react';
import { Tournament, BracketMatch } from '../data/cups';
import { Card, CardContent } from './ui/Card';
import TrophyIcon from './icons/TrophyIcon';
import ShareIcon from './icons/ShareIcon';
// Fix: Added missing import for Logo component
import Logo from './Logo';

const CARD_WIDTH = 230; 
const CARD_HEIGHT = 210; // Maximized height to prevent any possible clipping from font scaling
const GAP_X = 60;
const GAP_Y = 40; 

interface PositionedMatch extends BracketMatch {
    x: number;
    y: number;
    roundIndex: number;
    matchIndex: number;
    connectorPoint: { x: number; y: number }; 
    parentPoints: { x: number; y: number }[];
}

const MatchCard: React.FC<{ match: BracketMatch; style: React.CSSProperties }> = ({ match, style }) => {
    const team1 = match.team1;
    const team2 = match.team2;

    const team1Name = team1?.name || 'TBD';
    const team2Name = team2?.name || 'TBD';
    
    const crest1 = team1?.crestUrl;
    const crest2 = team2?.crestUrl;
    
    const score1 = (team1?.score !== undefined && team1.score !== '') ? team1.score : '-';
    const score2 = (team2?.score !== undefined && team2.score !== '') ? team2.score : '-';

    const isWinner1 = match.winner === 'team1';
    const isWinner2 = match.winner === 'team2';

    const isTBD = (name: string) => !name || name.trim().toUpperCase() === 'TBD';

    return (
        <div 
            className={`absolute rounded-2xl border-2 bg-white shadow-xl transition-all duration-300 overflow-hidden flex flex-col ${match.winner ? 'border-blue-200' : 'border-slate-100'}`}
            style={{
                ...style,
                width: CARD_WIDTH,
                height: CARD_HEIGHT,
            }}
        >
            {/* Metadata Header - Explicit padding and height to prevent squashing */}
            <div className="bg-slate-50 border-b border-slate-100 px-4 py-4 h-[65px] flex flex-col justify-center gap-1 flex-shrink-0">
                <div className="flex justify-between items-center w-full">
                    <span className="truncate max-w-[130px] font-black uppercase text-primary/80 tracking-tighter" style={{ fontSize: '10px' }}>
                        {match.venue || 'TBD Venue'}
                    </span>
                    <span className="font-mono font-black text-slate-600 bg-slate-200/50 px-1.5 rounded" style={{ fontSize: '10px' }}>
                        {match.time || 'TBD'}
                    </span>
                </div>
                <div className="font-bold text-slate-400 uppercase tracking-widest truncate" style={{ fontSize: '8px' }}>
                    {match.date || 'TBD'}
                </div>
            </div>
            
            {/* Match Teams Area - Larger gap for cleaner separation */}
            <div className="flex flex-col justify-center flex-grow px-4 py-4 gap-5 bg-white">
                {/* Team 1 */}
                <div className={`flex justify-between items-center ${isWinner1 ? 'text-blue-950 font-black scale-105' : 'text-slate-600 font-bold'} transition-transform`}>
                    <div className="flex items-center gap-3 overflow-hidden flex-1">
                        {!isTBD(team1Name) ? (
                            crest1 ? (
                                <img src={crest1} alt="" className="w-9 h-9 object-contain flex-shrink-0 bg-white p-1 rounded shadow-sm border border-slate-100" />
                            ) : (
                                <div className="w-9 h-9 rounded bg-slate-50 border border-slate-100 flex-shrink-0 flex items-center justify-center">
                                    <span className="text-slate-300 font-black" style={{ fontSize: '10px' }}>{team1Name.charAt(0)}</span>
                                </div>
                            )
                        ) : (
                            <div className="w-9 h-9 rounded-full border-2 border-dashed border-slate-100 flex-shrink-0"></div>
                        )}
                        <span className={`truncate tracking-tight ${isTBD(team1Name) ? 'text-slate-300 font-medium italic' : ''}`} style={{ fontSize: '12px' }}>{team1Name}</span>
                    </div>
                    <span className={`font-black font-mono px-2 py-1 rounded ml-2 min-w-[32px] text-center shadow-md ${isWinner1 ? 'bg-green-600 text-white' : 'bg-slate-100 text-slate-400'}`} style={{ fontSize: '14px' }}>
                        {score1}
                    </span>
                </div>

                {/* Team 2 */}
                <div className={`flex justify-between items-center ${isWinner2 ? 'text-blue-950 font-black scale-105' : 'text-slate-600 font-bold'} transition-transform`}>
                    <div className="flex items-center gap-3 overflow-hidden flex-1">
                        {!isTBD(team2Name) ? (
                            crest2 ? (
                                <img src={crest2} alt="" className="w-9 h-9 object-contain flex-shrink-0 bg-white p-1 rounded shadow-sm border border-slate-100" />
                            ) : (
                                <div className="w-9 h-9 rounded bg-slate-50 border border-slate-100 flex-shrink-0 flex items-center justify-center">
                                    <span className="text-slate-300 font-black" style={{ fontSize: '10px' }}>{team2Name.charAt(0)}</span>
                                </div>
                            )
                        ) : (
                            <div className="w-9 h-9 rounded-full border-2 border-dashed border-slate-100 flex-shrink-0"></div>
                        )}
                        <span className={`truncate tracking-tight ${isTBD(team2Name) ? 'text-slate-300 font-medium italic' : ''}`} style={{ fontSize: '12px' }}>{team2Name}</span>
                    </div>
                    <span className={`font-black font-mono px-2 py-1 rounded ml-2 min-w-[32px] text-center shadow-md ${isWinner2 ? 'bg-green-600 text-white' : 'bg-slate-100 text-slate-400'}`} style={{ fontSize: '14px' }}>
                        {score2}
                    </span>
                </div>
            </div>
            
            {/* Action Bar - Decorative */}
            <div className="h-1.5 w-full bg-gradient-to-r from-transparent via-slate-100 to-transparent"></div>
        </div>
    );
};

const TournamentBracketDisplay: React.FC<{ tournament: Tournament }> = ({ tournament }) => {
    const [copied, setCopied] = React.useState(false);

    const layoutData = useMemo(() => {
        const rounds = tournament.rounds || [];
        const positionedMatches: PositionedMatch[] = [];
        const connections: React.ReactElement[] = [];

        if (rounds.length === 0) return { matches: [], connections: [], width: 0, height: 0 };

        const yCenterMap = new Map<string, number>();

        rounds.forEach((round, rIndex) => {
            const isFirstRound = rIndex === 0;
            
            round.matches.forEach((match, mIndex) => {
                const x = rIndex * (CARD_WIDTH + GAP_X) + 20;

                let y = 0;
                let yCenter = 0;

                if (isFirstRound) {
                    y = mIndex * (CARD_HEIGHT + GAP_Y) + 100; 
                    yCenter = y + CARD_HEIGHT / 2;
                } else {
                    const child1Key = `${rIndex - 1}-${mIndex * 2}`;
                    const child2Key = `${rIndex - 1}-${mIndex * 2 + 1}`;
                    
                    const child1Y = yCenterMap.get(child1Key);
                    const child2Y = yCenterMap.get(child2Key);

                    if (child1Y !== undefined && child2Y !== undefined) {
                        yCenter = (child1Y + child2Y) / 2;
                        y = yCenter - CARD_HEIGHT / 2;
                        
                        const path1 = `M${x - GAP_X + CARD_WIDTH},${child1Y} L${x - GAP_X/2},${child1Y} L${x - GAP_X/2},${yCenter} L${x},${yCenter}`;
                        const path2 = `M${x - GAP_X + CARD_WIDTH},${child2Y} L${x - GAP_X/2},${child2Y} L${x - GAP_X/2},${yCenter} L${x},${yCenter}`;

                        connections.push(<path key={`conn-${rIndex}-${mIndex}-1`} d={path1} stroke="#E2E8F0" strokeWidth="2.5" fill="none" />);
                        connections.push(<path key={`conn-${rIndex}-${mIndex}-2`} d={path2} stroke="#E2E8F0" strokeWidth="2.5" fill="none" />);

                    } else if (child1Y !== undefined) {
                        yCenter = child1Y;
                        y = yCenter - CARD_HEIGHT / 2;
                        connections.push(<path key={`conn-${rIndex}-${mIndex}-1`} d={`M${x - GAP_X + CARD_WIDTH},${child1Y} L${x},${yCenter}`} stroke="#E2E8F0" strokeWidth="2.5" fill="none" />);
                    } else {
                        const estimatedSlots = Math.pow(2, rIndex);
                        const slotHeight = (CARD_HEIGHT + GAP_Y) * estimatedSlots;
                        y = (mIndex * slotHeight) + (slotHeight / 2) - (CARD_HEIGHT / 2) + 100;
                        yCenter = y + CARD_HEIGHT / 2;
                    }
                }

                yCenterMap.set(`${rIndex}-${mIndex}`, yCenter);

                positionedMatches.push({
                    ...match,
                    x,
                    y,
                    roundIndex: rIndex,
                    matchIndex: mIndex,
                    connectorPoint: { x, y: y + CARD_HEIGHT / 2 },
                    parentPoints: []
                });
            });
        });

        const maxMatchY = Array.from(yCenterMap.values()).reduce((max, y) => Math.max(max, y), 0);
        const containerWidth = (rounds.length * (CARD_WIDTH + GAP_X)) + 40;
        const containerHeight = Math.max(900, maxMatchY + CARD_HEIGHT + 200);

        return { matches: positionedMatches, connections, width: containerWidth, height: containerHeight };

    }, [tournament]);

    const handleShare = async () => {
        const shareData = {
            title: `${tournament.name} Bracket`,
            text: `Follow the ${tournament.name} progress live on Football Eswatini!`,
            url: window.location.href,
        };

        if (navigator.share) {
            try { await navigator.share(shareData); } catch (err) {}
        } else {
            try {
                await navigator.clipboard.writeText(shareData.url);
                setCopied(true);
                setTimeout(() => setCopied(false), 2000);
            } catch (err) {}
        }
    };

    return (
        <Card className="shadow-2xl border-0 rounded-[3.5rem] overflow-hidden bg-white">
            <CardContent className="p-0">
                <div className="p-10 md:p-14 flex flex-col sm:flex-row items-center justify-between gap-8 border-b border-slate-100 bg-slate-50/20">
                    <div className="flex items-center gap-8">
                        <div className="h-28 w-28 bg-white rounded-[2rem] flex items-center justify-center border shadow-2xl">
                            {tournament.logoUrl ? (
                                <img src={tournament.logoUrl} alt="" className="h-24 w-24 object-contain p-2" />
                            ) : (
                                <TrophyIcon className="w-14 h-14 text-slate-200" />
                            )}
                        </div>
                        <div>
                            <h3 className="text-4xl md:text-6xl font-black font-display text-slate-900 leading-[0.9] uppercase tracking-tighter">{tournament.name}</h3>
                            <p className="text-[12px] font-black uppercase tracking-[0.5em] text-primary mt-4">Official Tournament Roadmap</p>
                        </div>
                    </div>
                    
                    <button
                        onClick={handleShare}
                        className="flex items-center gap-3 px-12 py-5 text-[11px] font-black uppercase tracking-[0.2em] rounded-2xl bg-primary text-white hover:bg-primary-dark transition-all shadow-2xl active:scale-95 transform hover:-translate-y-1"
                    >
                        <ShareIcon className="w-4 h-4" />
                        {copied ? 'Link Copied!' : 'Broadcast Hub'}
                    </button>
                </div>

                <div className="w-full overflow-auto bg-[#f8fafc] relative scrollbar-hide">
                    <div style={{ width: layoutData.width, height: layoutData.height, position: 'relative' }}>
                        {tournament.rounds?.map((round, i) => (
                            <div 
                                key={i} 
                                className="absolute top-0 text-center py-8 font-black text-[13px] uppercase tracking-[0.4em] text-slate-400 border-b-2 border-slate-200 bg-white/40 backdrop-blur-xl z-10"
                                style={{
                                    left: i * (CARD_WIDTH + GAP_X) + 20,
                                    width: CARD_WIDTH,
                                }}
                            >
                                {round.title}
                            </div>
                        ))}
                        <svg style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', pointerEvents: 'none', zIndex: 0 }}>
                            {layoutData.connections}
                        </svg>
                        {layoutData.matches.map((match) => (
                            <MatchCard 
                                key={match.id} 
                                match={match} 
                                style={{ left: match.x, top: match.y }} 
                            />
                        ))}
                    </div>
                </div>
                
                <div className="bg-slate-950 p-8 flex flex-col md:flex-row items-center justify-between border-t border-white/5">
                    <p className="text-[10px] font-black text-white/20 uppercase tracking-[0.6em]">Digital Bracket Visualization v3.0</p>
                    <div className="flex gap-4 opacity-30 mt-4 md:mt-0">
                        <TrophyIcon className="w-5 h-5 text-white" />
                        <Logo className="h-4 w-auto grayscale invert" />
                    </div>
                </div>
            </CardContent>
        </Card>
    );
};

export default TournamentBracketDisplay;