
import React, { useMemo } from 'react';
import { Tournament, BracketMatch } from '../data/cups';
import { Card, CardContent } from './ui/Card';
import TrophyIcon from './icons/TrophyIcon';
import ShareIcon from './icons/ShareIcon';

// Constants for layout
const CARD_WIDTH = 220;
const CARD_HEIGHT = 80; // Fixed height for calculation consistency
const GAP_X = 60; // Horizontal space between rounds
const GAP_Y = 20; // Vertical space between matches in the densest round

interface PositionedMatch extends BracketMatch {
    x: number;
    y: number;
    roundIndex: number;
    matchIndex: number;
    // Coordinates for connector lines
    connectorPoint: { x: number; y: number }; 
    parentPoints: { x: number; y: number }[]; // Points to connect FROM (previous round)
}

const MatchCard: React.FC<{ match: BracketMatch; style: React.CSSProperties }> = ({ match, style }) => {
    // Neutral styling: White bg, gray border, black text
    const isWinner1 = match.winner === 'team1';
    const isWinner2 = match.winner === 'team2';

    return (
        <div 
            className="absolute rounded-lg border border-gray-300 bg-white shadow-sm hover:shadow-md transition-shadow duration-200 overflow-hidden flex flex-col justify-center"
            style={{
                ...style,
                width: CARD_WIDTH,
                height: CARD_HEIGHT,
            }}
        >
            <div className="bg-gray-50 border-b border-gray-100 px-2 py-1 flex justify-between items-center text-[10px] text-gray-500">
                <span className="truncate max-w-[100px]">{match.venue || 'Match ' + match.id}</span>
                <div className="flex gap-1">
                    <span>{match.date}</span>
                    <span>{match.time}</span>
                </div>
            </div>
            
            <div className="flex flex-col justify-center flex-grow px-2 py-1 gap-1">
                {/* Team 1 */}
                <div className={`flex justify-between items-center ${isWinner1 ? 'font-bold text-black' : 'text-gray-600'}`}>
                    <div className="flex items-center gap-2 overflow-hidden">
                        {match.team1.crestUrl ? (
                            <img src={match.team1.crestUrl} alt="crest" className="w-4 h-4 object-contain" />
                        ) : (
                            <div className="w-4 h-4 rounded-full bg-gray-200"></div>
                        )}
                        <span className="truncate text-xs">{match.team1.name}</span>
                    </div>
                    <span className="text-xs font-mono">{match.team1.score ?? '-'}</span>
                </div>

                {/* Team 2 */}
                <div className={`flex justify-between items-center ${isWinner2 ? 'font-bold text-black' : 'text-gray-600'}`}>
                    <div className="flex items-center gap-2 overflow-hidden">
                        {match.team2.crestUrl ? (
                            <img src={match.team2.crestUrl} alt="crest" className="w-4 h-4 object-contain" />
                        ) : (
                            <div className="w-4 h-4 rounded-full bg-gray-200"></div>
                        )}
                        <span className="truncate text-xs">{match.team2.name}</span>
                    </div>
                    <span className="text-xs font-mono">{match.team2.score ?? '-'}</span>
                </div>
            </div>
        </div>
    );
};

const TournamentBracketDisplay: React.FC<{ tournament: Tournament }> = ({ tournament }) => {
    const [copied, setCopied] = React.useState(false);

    // This hook calculates the absolute X/Y positions of every match card and connection line
    const layoutData = useMemo(() => {
        const rounds = tournament.rounds;
        const positionedMatches: PositionedMatch[] = [];
        const connections: React.ReactElement[] = [];

        if (!rounds || rounds.length === 0) return { matches: [], connections: [], width: 0, height: 0 };

        // 1. Determine tree depth (max rounds) to estimate spacing
        // We assume the bracket is a single elimination tree converging to the right.
        
        // We need to map matches to logical "slots".
        // If data doesn't have matchInRound, we assume array index is the slot.
        // We process rounds from first (left) to last (right).
        
        // Map to store Y-center of matches from previous rounds to calculate current round positions
        // Key: `${roundIndex}-${matchIndex}` -> yCenter
        const yCenterMap = new Map<string, number>();

        // Calculate positions
        rounds.forEach((round, rIndex) => {
            const isFirstRound = rIndex === 0;
            
            // Expected matches in this round if it were a full tree.
            // However, we rely on the actual matches provided.
            // If the structure is strictly power-of-2, Round 0 has N matches, Round 1 has N/2...
            
            round.matches.forEach((match, mIndex) => {
                // X Position is simple: Round index * (Card Width + Gap)
                const x = rIndex * (CARD_WIDTH + GAP_X) + 20; // +20 padding

                // Y Position is trickier.
                let y = 0;
                let yCenter = 0;

                if (isFirstRound) {
                    // Simple stack
                    y = mIndex * (CARD_HEIGHT + GAP_Y) + 20; // +20 padding
                    yCenter = y + CARD_HEIGHT / 2;
                } else {
                    // Center based on "children" (previous round matches feeding into this one)
                    // Logic: Match M in Round R connects to Matches (2*M) and (2*M + 1) in Round R-1
                    const child1Key = `${rIndex - 1}-${mIndex * 2}`;
                    const child2Key = `${rIndex - 1}-${mIndex * 2 + 1}`;
                    
                    const child1Y = yCenterMap.get(child1Key);
                    const child2Y = yCenterMap.get(child2Key);

                    if (child1Y !== undefined && child2Y !== undefined) {
                        yCenter = (child1Y + child2Y) / 2;
                        y = yCenter - CARD_HEIGHT / 2;
                        
                        // Create Connection Lines
                        // Line from Child 1 to Parent
                        const path1 = `M${x - GAP_X + CARD_WIDTH},${child1Y} L${x - GAP_X/2},${child1Y} L${x - GAP_X/2},${yCenter} L${x},${yCenter}`;
                        // Line from Child 2 to Parent
                        const path2 = `M${x - GAP_X + CARD_WIDTH},${child2Y} L${x - GAP_X/2},${child2Y} L${x - GAP_X/2},${yCenter} L${x},${yCenter}`;

                        connections.push(<path key={`conn-${rIndex}-${mIndex}-1`} d={path1} stroke="#CBD5E1" strokeWidth="2" fill="none" />);
                        connections.push(<path key={`conn-${rIndex}-${mIndex}-2`} d={path2} stroke="#CBD5E1" strokeWidth="2" fill="none" />);

                    } else if (child1Y !== undefined) {
                        // Only 1 child (maybe bye round?), align with it
                        yCenter = child1Y;
                        y = yCenter - CARD_HEIGHT / 2;
                        connections.push(<path key={`conn-${rIndex}-${mIndex}-1`} d={`M${x - GAP_X + CARD_WIDTH},${child1Y} L${x},${yCenter}`} stroke="#CBD5E1" strokeWidth="2" fill="none" />);
                    } else {
                        // Orphan match (shouldn't happen in valid tree, but fallback to stacked)
                        // Calculate implied position based on previous gaps
                        const estimatedSlots = Math.pow(2, rIndex);
                        const slotHeight = (CARD_HEIGHT + GAP_Y) * estimatedSlots;
                        y = (mIndex * slotHeight) + (slotHeight / 2) - (CARD_HEIGHT / 2) + 20;
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
                    parentPoints: [] // Not used in this pass
                });
            });
        });

        // Calculate container dimensions
        const maxMatchY = Array.from(yCenterMap.values()).reduce((max, y) => Math.max(max, y), 0);
        const containerWidth = (rounds.length * (CARD_WIDTH + GAP_X)) + 40;
        const containerHeight = Math.max(500, maxMatchY + CARD_HEIGHT + 40);

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
        <Card className="shadow-lg animate-fade-in border-t-4 border-gray-800">
            <CardContent className="p-6">
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-6">
                    <div className="flex items-center gap-4">
                        {tournament.logoUrl ? (
                            <img src={tournament.logoUrl} alt={`${tournament.name} logo`} className="h-16 w-16 object-contain p-1 bg-gray-50 rounded-lg border border-gray-200" />
                        ) : (
                            <div className="h-16 w-16 bg-gray-100 rounded-lg flex items-center justify-center border border-gray-200">
                                <TrophyIcon className="w-8 h-8 text-gray-400" />
                            </div>
                        )}
                        <div>
                            <h3 className="text-2xl font-bold font-display text-gray-900 text-center sm:text-left">{tournament.name}</h3>
                            <p className="text-sm text-gray-500">Knockout Stage</p>
                        </div>
                    </div>
                    
                    <button
                        onClick={handleShare}
                        className="flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-md bg-blue-50 text-blue-700 hover:bg-blue-100 transition-colors border border-blue-200"
                    >
                        <ShareIcon className="w-4 h-4" />
                        {copied ? 'Link Copied!' : 'Share Bracket'}
                    </button>
                </div>

                {/* Bracket Container */}
                <div className="w-full overflow-auto border border-gray-200 rounded-xl bg-gray-50 relative scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
                    <div style={{ width: layoutData.width, height: layoutData.height, position: 'relative' }}>
                        
                        {/* Round Titles Background */}
                        {tournament.rounds.map((round, i) => (
                            <div 
                                key={i} 
                                className="absolute top-0 text-center border-b border-gray-200 bg-white/80 backdrop-blur-sm z-20 py-2 font-bold text-xs uppercase tracking-widest text-gray-500 shadow-sm"
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
            </CardContent>
        </Card>
    );
};

export default TournamentBracketDisplay;
