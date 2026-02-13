import React, { useMemo } from 'react';
import { Tournament, BracketMatch } from '../data/cups';
import { Card, CardContent } from './ui/Card';
import TrophyIcon from './icons/TrophyIcon';
import ShareIcon from './icons/ShareIcon';

const CARD_WIDTH = 230; 
const CARD_HEIGHT = 110; 
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
            className={`absolute rounded-xl border-2 bg-white shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden flex flex-col justify-center ${match.winner ? 'border-gray-300' : 'border-gray-100'}`}
            style={{
                ...style,
                width: CARD_WIDTH,
                height: CARD_HEIGHT,
            }}
        >
            <div className="bg-gray-50 border-b border-gray-100 px-3 py-1.5 flex flex-col gap-0.5 text-[9px] font-black uppercase tracking-wider text-gray-400">
                <div className="flex justify-between items-center">
                    <span className="truncate max-w-[140px] text-primary/70">{match.venue || 'TBD Venue'}</span>
                    <span className="text-gray-500">{match.time || ''}</span>
                </div>
                <div className="text-[8px] opacity-70">
                    {match.date || 'TBD Date'}
                </div>
            </div>
            
            <div className="flex flex-col justify-center flex-grow px-3 py-2 gap-2">
                {/* Team 1 */}
                <div className={`flex justify-between items-center ${isWinner1 ? 'text-blue-900 font-black' : 'text-gray-600 font-bold'}`}>
                    <div className="flex items-center gap-2 overflow-hidden flex-1">
                        {!isTBD(team1Name) ? (
                            crest1 ? (
                                <img src={crest1} alt="" className="w-8 h-8 object-contain flex-shrink-0 bg-white p-0.5 rounded shadow-sm border border-gray-100" />
                            ) : (
                                <div className="w-8 h-8 rounded bg-gray-50 border border-gray-100 flex-shrink-0 flex items-center justify-center">
                                    <span className="text-[10px] text-gray-300 font-black">{team1Name.charAt(0)}</span>
                                </div>
                            )
                        ) : (
                            <div className="w-8 h-8 rounded-full border border-dashed border-gray-200 flex-shrink-0"></div>
                        )}
                        <span className={`truncate text-xs tracking-tight ${isTBD(team1Name) ? 'text-gray-300 font-medium italic' : ''}`}>{team1Name}</span>
                    </div>
                    <span className={`text-sm font-black font-mono px-2 py-0.5 rounded ml-2 min-w-[28px] text-center shadow-sm ${isWinner1 ? 'bg-green-600 text-white' : 'bg-gray-100 text-gray-500'}`}>
                        {score1}
                    </span>
                </div>

                {/* Team 2 */}
                <div className={`flex justify-between items-center ${isWinner2 ? 'text-blue-900 font-black' : 'text-gray-600 font-bold'}`}>
                    <div className="flex items-center gap-2 overflow-hidden flex-1">
                        {!isTBD(team2Name) ? (
                            crest2 ? (
                                <img src={crest2} alt="" className="w-8 h-8 object-contain flex-shrink-0 bg-white p-0.5 rounded shadow-sm border border-gray-100" />
                            ) : (
                                <div className="w-8 h-8 rounded bg-gray-50 border border-gray-100 flex-shrink-0 flex items-center justify-center">
                                    <span className="text-[10px] text-gray-300 font-black">{team2Name.charAt(0)}</span>
                                </div>
                            )
                        ) : (
                            <div className="w-8 h-8 rounded-full border border-dashed border-gray-200 flex-shrink-0"></div>
                        )}
                        <span className={`truncate text-xs tracking-tight ${isTBD(team2Name) ? 'text-gray-300 font-medium italic' : ''}`}>{team2Name}</span>
                    </div>
                    <span className={`text-sm font-black font-mono px-2 py-0.5 rounded ml-2 min-w-[28px] text-center shadow-sm ${isWinner2 ? 'bg-green-600 text-white' : 'bg-gray-100 text-gray-500'}`}>
                        {score2}
                    </span>
                </div>
            </div>
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
                    y = mIndex * (CARD_HEIGHT + GAP_Y) + 50; 
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
                        y = (mIndex * slotHeight) + (slotHeight / 2) - (CARD_HEIGHT / 2) + 50;
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
        const containerHeight = Math.max(600, maxMatchY + CARD_HEIGHT + 100);

        return { matches: positionedMatches, connections, width: containerWidth, height: containerHeight };

    }, [tournament]);

    const handleShare = async () => {
        const shareData = {
            title: `${tournament.name} Bracket`,
            text: `Check out the ${tournament.name} results on Football Eswatini!`,
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
        <Card className="shadow-2xl border-0 rounded-3xl overflow-hidden bg-white">
            <CardContent className="p-0">
                <div className="p-6 md:p-10 flex flex-col sm:flex-row items-center justify-between gap-6 border-b border-gray-100">
                    <div className="flex items-center gap-6">
                        <div className="h-20 w-20 bg-gray-50 rounded-2xl flex items-center justify-center border shadow-inner">
                            {tournament.logoUrl ? (
                                <img src={tournament.logoUrl} alt="" className="h-16 w-16 object-contain" />
                            ) : (
                                <TrophyIcon className="w-10 h-10 text-gray-200" />
                            )}
                        </div>
                        <div>
                            <h3 className="text-2xl md:text-4xl font-black font-display text-gray-900 leading-tight uppercase tracking-tighter">{tournament.name}</h3>
                            <p className="text-xs font-black uppercase tracking-widest text-primary mt-1">Official Knockout Phase</p>
                        </div>
                    </div>
                    
                    <button
                        onClick={handleShare}
                        className="flex items-center gap-2 px-8 py-3 text-xs font-black uppercase tracking-widest rounded-xl bg-primary text-white hover:bg-primary-dark transition-all shadow-xl active:scale-95"
                    >
                        <ShareIcon className="w-4 h-4" />
                        {copied ? 'Link Copied!' : 'Share'}
                    </button>
                </div>

                <div className="w-full overflow-auto bg-[#f8fafc] relative scrollbar-hide">
                    <div style={{ width: layoutData.width, height: layoutData.height, position: 'relative' }}>
                        {tournament.rounds?.map((round, i) => (
                            <div 
                                key={i} 
                                className="absolute top-0 text-center py-4 font-black text-[11px] uppercase tracking-[0.2em] text-gray-400 border-b border-gray-100 bg-white/50 backdrop-blur-sm z-10"
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
            </CardContent>
        </Card>
    );
};

export default TournamentBracketDisplay;