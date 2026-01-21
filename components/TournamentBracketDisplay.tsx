
import React, { useMemo } from 'react';
import { Tournament, BracketMatch } from '../data/cups';
import { Card, CardContent } from './ui/Card';
import TrophyIcon from './icons/TrophyIcon';
import ShareIcon from './icons/ShareIcon';

// Constants for layout
const CARD_WIDTH = 220;
const CARD_HEIGHT = 90; // Increased slightly for better spacing
const GAP_X = 60;
const GAP_Y = 25;

interface PositionedMatch extends BracketMatch {
    x: number;
    y: number;
    roundIndex: number;
    matchIndex: number;
    connectorPoint: { x: number; y: number }; 
    parentPoints: { x: number; y: number }[];
}

const MatchCard: React.FC<{ match: BracketMatch; style: React.CSSProperties }> = ({ match, style }) => {
    // Robust data extraction: handles nested (team1.name) and flat (team1Name) structures
    const mAny = match as any;
    
    const team1Name = match.team1?.name || mAny.team1Name || 'TBD';
    const team2Name = match.team2?.name || mAny.team2Name || 'TBD';
    
    const score1 = match.team1?.score ?? mAny.score1 ?? '-';
    const score2 = match.team2?.score ?? mAny.score2 ?? '-';
    
    const crest1 = match.team1?.crestUrl || mAny.team1Crest;
    const crest2 = match.team2?.crestUrl || mAny.team2Crest;

    const isWinner1 = match.winner === 'team1';
    const isWinner2 = match.winner === 'team2';

    return (
        <div 
            className={`absolute rounded-xl border-2 bg-white shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden flex flex-col justify-center ${match.winner ? 'border-gray-200' : 'border-gray-100'}`}
            style={{
                ...style,
                width: CARD_WIDTH,
                height: CARD_HEIGHT,
            }}
        >
            <div className="bg-gray-50 border-b border-gray-100 px-3 py-1 flex justify-between items-center text-[9px] font-black uppercase tracking-wider text-gray-400">
                <span className="truncate max-w-[110px]">{match.venue || 'TBD'}</span>
                <div className="flex gap-1.5">
                    <span>{match.date || ''}</span>
                    <span>{match.time || ''}</span>
                </div>
            </div>
            
            <div className="flex flex-col justify-center flex-grow px-3 py-1.5 gap-1.5">
                {/* Team 1 */}
                <div className={`flex justify-between items-center ${isWinner1 ? 'font-black text-blue-900' : 'text-gray-600 font-medium'}`}>
                    <div className="flex items-center gap-2 overflow-hidden">
                        {crest1 ? (
                            <img src={crest1} alt="" className="w-5 h-5 object-contain flex-shrink-0" />
                        ) : (
                            <div className="w-5 h-5 rounded-full bg-gray-100 border border-gray-200 flex-shrink-0"></div>
                        )}
                        <span className="truncate text-xs">{team1Name}</span>
                    </div>
                    <span className="text-xs font-mono bg-gray-50 px-1.5 rounded">{score1}</span>
                </div>

                {/* Team 2 */}
                <div className={`flex justify-between items-center ${isWinner2 ? 'font-black text-blue-900' : 'text-gray-600 font-medium'}`}>
                    <div className="flex items-center gap-2 overflow-hidden">
                        {crest2 ? (
                            <img src={crest2} alt="" className="w-5 h-5 object-contain flex-shrink-0" />
                        ) : (
                            <div className="w-5 h-5 rounded-full bg-gray-100 border border-gray-200 flex-shrink-0"></div>
                        )}
                        <span className="truncate text-xs">{team2Name}</span>
                    </div>
                    <span className="text-xs font-mono bg-gray-50 px-1.5 rounded">{score2}</span>
                </div>
            </div>
        </div>
    );
};

const TournamentBracketDisplay: React.FC<{ tournament: Tournament }> = ({ tournament }) => {
    const [copied, setCopied] = React.useState(false);

    const layoutData = useMemo(() => {
        const rounds = tournament.rounds;
        const positionedMatches: PositionedMatch[] = [];
        const connections: React.ReactElement[] = [];

        if (!rounds || rounds.length === 0) return { matches: [], connections: [], width: 0, height: 0 };

        const yCenterMap = new Map<string, number>();

        rounds.forEach((round, rIndex) => {
            const isFirstRound = rIndex === 0;
            
            round.matches.forEach((match, mIndex) => {
                const x = rIndex * (CARD_WIDTH + GAP_X) + 20;

                let y = 0;
                let yCenter = 0;

                if (isFirstRound) {
                    y = mIndex * (CARD_HEIGHT + GAP_Y) + 40; // +40 top padding for titles
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

                        connections.push(<path key={`conn-${rIndex}-${mIndex}-1`} d={path1} stroke="#CBD5E1" strokeWidth="2" fill="none" />);
                        connections.push(<path key={`conn-${rIndex}-${mIndex}-2`} d={path2} stroke="#CBD5E1" strokeWidth="2" fill="none" />);

                    } else if (child1Y !== undefined) {
                        yCenter = child1Y;
                        y = yCenter - CARD_HEIGHT / 2;
                        connections.push(<path key={`conn-${rIndex}-${mIndex}-1`} d={`M${x - GAP_X + CARD_WIDTH},${child1Y} L${x},${yCenter}`} stroke="#CBD5E1" strokeWidth="2" fill="none" />);
                    } else {
                        const estimatedSlots = Math.pow(2, rIndex);
                        const slotHeight = (CARD_HEIGHT + GAP_Y) * estimatedSlots;
                        y = (mIndex * slotHeight) + (slotHeight / 2) - (CARD_HEIGHT / 2) + 40;
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
        const containerHeight = Math.max(500, maxMatchY + CARD_HEIGHT + 60);

        return { matches: positionedMatches, connections, width: containerWidth, height: containerHeight };

    }, [tournament]);

    const handleShare = async () => {
        const shareData = {
            title: `${tournament.name} Bracket`,
            text: `Check out the ${tournament.name} bracket on Football Eswatini!`,
            url: window.location.href,
        };

        if (navigator.share) {
            try {
                await navigator.share(shareData);
            } catch (err) {
                console.error('Error sharing:', err);
            }
        } else {
            try {
                await navigator.clipboard.writeText(shareData.url);
                setCopied(true);
                setTimeout(() => setCopied(false), 2000);
            } catch (err) {
                console.error('Failed to copy to clipboard:', err);
            }
        }
    };

    return (
        <Card className="shadow-2xl animate-fade-in border-t-8 border-gray-900 rounded-3xl overflow-hidden">
            <CardContent className="p-0">
                <div className="p-6 md:p-8 flex flex-col sm:flex-row items-center justify-between gap-6 bg-white border-b border-gray-100">
                    <div className="flex items-center gap-6">
                        {tournament.logoUrl ? (
                            <img src={tournament.logoUrl} alt="" className="h-20 w-20 object-contain p-2 bg-gray-50 rounded-2xl border border-gray-100 shadow-sm" />
                        ) : (
                            <div className="h-20 w-20 bg-gray-100 rounded-2xl flex items-center justify-center border border-gray-200">
                                <TrophyIcon className="w-10 h-10 text-gray-300" />
                            </div>
                        )}
                        <div>
                            <h3 className="text-2xl md:text-3xl font-black font-display text-gray-900 leading-tight">{tournament.name}</h3>
                            <p className="text-xs font-black uppercase tracking-widest text-blue-600 mt-1">Official Tournament Bracket</p>
                        </div>
                    </div>
                    
                    <button
                        onClick={handleShare}
                        className="flex items-center gap-2 px-6 py-3 text-xs font-black uppercase tracking-widest rounded-xl bg-primary text-white hover:bg-primary-dark transition-all shadow-xl active:scale-95"
                    >
                        <ShareIcon className="w-4 h-4" />
                        {copied ? 'Link Copied!' : 'Share Bracket'}
                    </button>
                </div>

                {/* Bracket Container */}
                <div className="w-full overflow-auto bg-[#fdfdfd] relative scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
                    <div style={{ width: layoutData.width, height: layoutData.height, position: 'relative' }}>
                        
                        {/* Round Titles Background */}
                        {tournament.rounds.map((round, i) => (
                            <div 
                                key={i} 
                                className="absolute top-0 text-center border-b border-gray-200 bg-white/80 backdrop-blur-md z-20 py-3 font-black text-[10px] uppercase tracking-[0.2em] text-gray-400 shadow-sm"
                                style={{
                                    left: i * (CARD_WIDTH + GAP_X) + 20,
                                    width: CARD_WIDTH,
                                }}
                            >
                                {round.title}
                            </div>
                        ))}

                        {/* Connection Lines Layer (SVG) */}
                        <svg 
                            style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', pointerEvents: 'none', zIndex: 0 }}
                        >
                            {layoutData.connections}
                        </svg>

                        {/* Match Cards Layer */}
                        {layoutData.matches.map((match) => (
                            <MatchCard 
                                key={match.id} 
                                match={match} 
                                style={{
                                    left: match.x,
                                    top: match.y,
                                    zIndex: 10
                                }} 
                            />
                        ))}
                    </div>
                </div>
                
                <div className="bg-gray-50 px-8 py-4 border-t border-gray-100 flex items-center justify-between">
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">© Football Eswatini Bracket Engine</p>
                    <div className="flex gap-4">
                        <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-blue-600"></div><span className="text-[9px] font-bold text-gray-500 uppercase">Live Path</span></div>
                        <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-gray-300"></div><span className="text-[9px] font-bold text-gray-500 uppercase">Standard</span></div>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
};

export default TournamentBracketDisplay;
