import React, { useMemo } from 'react';
import { Tournament, BracketMatch } from '../data/cups';
import { Card, CardContent } from './ui/Card';
import TrophyIcon from './icons/TrophyIcon';
import ShareIcon from './icons/ShareIcon';
import Logo from './Logo';

const CARD_WIDTH = 220; 
const CARD_HEIGHT = 190; 
const GAP_X = 50;
const GAP_Y = 30; 

interface PositionedMatch extends BracketMatch {
    x: number;
    y: number;
    roundIndex: number;
    matchIndex: number;
    connectorPoint: { x: number; y: number }; 
    parentPoints: { x: number; y: number }[];
}

const MatchCard: React.FC<{ match: any; style: React.CSSProperties; customCrests?: Record<string, string> }> = ({ match, style, customCrests }) => {
    const team1 = match.team1;
    const team2 = match.team2;

    const team1Name = match.team1Name || team1?.name || 'TBD';
    const team2Name = match.team2Name || team2?.name || 'TBD';
    
    // Check match object first, then the deduplicated customCrests map, then the team object
    const crest1 = match.team1Crest || (customCrests && team1Name ? customCrests[team1Name] : undefined) || team1?.crestUrl;
    const crest2 = match.team2Crest || (customCrests && team2Name ? customCrests[team2Name] : undefined) || team2?.crestUrl;
    
    const score1Raw = match.score1 !== undefined ? match.score1 : team1?.score;
    const score2Raw = match.score2 !== undefined ? match.score2 : team2?.score;

    const score1 = (score1Raw !== undefined && score1Raw !== '') ? score1Raw : '-';
    const score2 = (score2Raw !== undefined && score2Raw !== '') ? score2Raw : '-';

    const isWinner1 = match.winner === 'team1';
    const isWinner2 = match.winner === 'team2';

    const isTBD = (name: string) => !name || name.trim().toUpperCase() === 'TBD';

    return (
        <div 
            className={`absolute rounded-xl border bg-white shadow-lg transition-all duration-300 overflow-hidden flex flex-col ${match.winner ? 'border-blue-200' : 'border-slate-100'}`}
            style={{
                ...style,
                width: CARD_WIDTH,
                height: CARD_HEIGHT,
            }}
        >
            {/* Metadata Header */}
            <div className="bg-slate-50 border-b border-slate-100 px-3 py-3 h-[55px] flex flex-col justify-center gap-0.5 flex-shrink-0">
                <div className="flex justify-between items-center w-full">
                    <span className="truncate max-w-[120px] font-black uppercase text-primary/70 tracking-tighter text-[9px]">
                        {match.venue || 'TBD Venue'}
                    </span>
                    <span className="font-mono font-black text-slate-500 bg-slate-200/50 px-1.5 rounded text-[9px]">
                        {match.time || 'TBD'}
                    </span>
                </div>
                <div className="font-bold text-slate-300 uppercase tracking-widest truncate text-[8px]">
                    {match.date || 'TBD'}
                </div>
            </div>
            
            {/* Match Teams Area */}
            <div className="flex flex-col justify-center flex-grow px-3 py-3 gap-3 bg-white">
                {/* Team 1 */}
                <div className={`flex justify-between items-center ${isWinner1 ? 'text-blue-900 font-black' : 'text-slate-500 font-bold'}`}>
                    <div className="flex items-center gap-2 overflow-hidden flex-1">
                        {!isTBD(team1Name) ? (
                            crest1 ? (
                                <img src={crest1} alt="" className="w-7 h-7 object-contain flex-shrink-0 bg-white p-0.5 rounded shadow-sm border border-slate-50" />
                            ) : (
                                <div className="w-7 h-7 rounded bg-slate-50 border border-slate-100 flex-shrink-0 flex items-center justify-center">
                                    <span className="text-slate-300 font-black text-[9px]">{team1Name.charAt(0)}</span>
                                </div>
                            )
                        ) : (
                            <div className="w-7 h-7 rounded-full border border-dashed border-slate-200 flex-shrink-0"></div>
                        )}
                        <span className={`truncate tracking-tight text-[11px] ${isTBD(team1Name) ? 'text-slate-300 font-medium italic' : ''}`}>{team1Name}</span>
                    </div>
                    <span className={`font-black font-mono px-1.5 py-0.5 rounded ml-1 min-w-[24px] text-center text-xs ${isWinner1 ? 'bg-green-600 text-white shadow-sm' : 'bg-slate-50 text-slate-400'}`}>
                        {score1}
                    </span>
                </div>

                {/* Team 2 */}
                <div className={`flex justify-between items-center ${isWinner2 ? 'text-blue-900 font-black' : 'text-slate-500 font-bold'}`}>
                    <div className="flex items-center gap-2 overflow-hidden flex-1">
                        {!isTBD(team2Name) ? (
                            crest2 ? (
                                <img src={crest2} alt="" className="w-7 h-7 object-contain flex-shrink-0 bg-white p-0.5 rounded shadow-sm border border-slate-50" />
                            ) : (
                                <div className="w-7 h-7 rounded bg-slate-50 border border-slate-100 flex-shrink-0 flex items-center justify-center">
                                    <span className="text-slate-300 font-black text-[9px]">{team2Name.charAt(0)}</span>
                                </div>
                            )
                        ) : (
                            <div className="w-7 h-7 rounded-full border border-dashed border-slate-200 flex-shrink-0"></div>
                        )}
                        <span className={`truncate tracking-tight text-[11px] ${isTBD(team2Name) ? 'text-slate-300 font-medium italic' : ''}`}>{team2Name}</span>
                    </div>
                    <span className={`font-black font-mono px-1.5 py-0.5 rounded ml-1 min-w-[24px] text-center text-xs ${isWinner2 ? 'bg-green-600 text-white shadow-sm' : 'bg-slate-50 text-slate-400'}`}>
                        {score2}
                    </span>
                </div>
            </div>
            
            <div className="h-1 w-full bg-slate-50"></div>
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
                    y = mIndex * (CARD_HEIGHT + GAP_Y) + 80; 
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

                        connections.push(<path key={`conn-${rIndex}-${mIndex}-1`} d={path1} stroke="#E2E8F0" strokeWidth="2" fill="none" />);
                        connections.push(<path key={`conn-${rIndex}-${mIndex}-2`} d={path2} stroke="#E2E8F0" strokeWidth="2" fill="none" />);

                    } else if (child1Y !== undefined) {
                        yCenter = child1Y;
                        y = yCenter - CARD_HEIGHT / 2;
                        connections.push(<path key={`conn-${rIndex}-${mIndex}-1`} d={`M${x - GAP_X + CARD_WIDTH},${child1Y} L${x},${yCenter}`} stroke="#E2E8F0" strokeWidth="2" fill="none" />);
                    } else {
                        const estimatedSlots = Math.pow(2, rIndex);
                        const slotHeight = (CARD_HEIGHT + GAP_Y) * estimatedSlots;
                        y = (mIndex * slotHeight) + (slotHeight / 2) - (CARD_HEIGHT / 2) + 80;
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
        const containerHeight = Math.max(800, maxMatchY + CARD_HEIGHT + 150);

        return { matches: positionedMatches, connections, width: containerWidth, height: containerHeight };

    }, [tournament]);

    const handleShare = async () => {
        const shareData = {
            title: `${tournament.name} Bracket`,
            text: `Follow the ${tournament.name} progress on Football Eswatini!`,
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
        <Card className="shadow-2xl border-0 rounded-[2.5rem] overflow-hidden bg-white">
            <CardContent className="p-0">
                <div className="p-8 md:p-10 flex flex-col sm:flex-row items-center justify-between gap-6 border-b border-slate-100 bg-slate-50/10">
                    <div className="flex items-center gap-6">
                        <div className="h-20 w-20 bg-white rounded-2xl flex items-center justify-center border shadow-xl">
                            {tournament.logoUrl ? (
                                <img src={tournament.logoUrl} alt="" className="h-16 w-16 object-contain p-1" />
                            ) : (
                                <TrophyIcon className="w-10 h-10 text-slate-200" />
                            )}
                        </div>
                        <div>
                            <h3 className="text-3xl md:text-5xl font-black font-display text-slate-900 leading-[0.9] uppercase tracking-tighter">{tournament.name}</h3>
                            <p className="text-[10px] font-black uppercase tracking-[0.4em] text-primary mt-3">Kingdom Tournament roadmap</p>
                        </div>
                    </div>
                    
                    <button
                        onClick={handleShare}
                        className="flex items-center gap-3 px-8 py-4 text-[10px] font-black uppercase tracking-widest rounded-xl bg-primary text-white hover:bg-primary-dark transition-all shadow-xl active:scale-95 transform hover:-translate-y-0.5"
                    >
                        <ShareIcon className="w-4 h-4" />
                        {copied ? 'Copied!' : 'Broadcast'}
                    </button>
                </div>

                <div className="w-full overflow-auto bg-[#f8fafc] relative scrollbar-hide">
                    <div style={{ width: layoutData.width, height: layoutData.height, position: 'relative' }}>
                        {tournament.rounds?.map((round, i) => (
                            <div 
                                key={i} 
                                className="absolute top-0 text-center py-6 font-black text-[11px] uppercase tracking-[0.3em] text-slate-400 border-b border-slate-100 bg-white/30 backdrop-blur-lg z-10"
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
                                customCrests={(tournament as any).customCrests}
                            />
                        ))}
                    </div>
                </div>
                
                <div className="bg-slate-950 p-6 flex flex-col md:flex-row items-center justify-between border-t border-white/5">
                    <p className="text-[9px] font-black text-white/20 uppercase tracking-[0.5em]">Digital Bracket Visualization v3.1</p>
                    <div className="flex gap-4 opacity-20 mt-4 md:mt-0">
                        <TrophyIcon className="w-4 h-4 text-white" />
                        <Logo className="h-3 w-auto grayscale invert" />
                    </div>
                </div>
            </CardContent>
        </Card>
    );
};

export default TournamentBracketDisplay;