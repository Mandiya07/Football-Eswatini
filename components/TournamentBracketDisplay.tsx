
import React, { useState } from 'react';
import { Tournament, BracketMatch, BracketMatchTeam } from '../data/cups';
import { Card, CardContent } from './ui/Card';
import TrophyIcon from './icons/TrophyIcon';
import ShareIcon from './icons/ShareIcon';

// Reusable Match Card Component
const MatchCard: React.FC<{ match: BracketMatch }> = ({ match }) => {
    // Neutral styling: White bg, gray border, black text
    const bgColor = 'bg-white border border-gray-300 text-gray-900';
    const shadow = 'shadow-sm hover:shadow-md';
    const scoreColor = 'text-gray-900'; 

    const TeamDisplay: React.FC<{ team: BracketMatchTeam, isWinner?: boolean, align?: 'left' | 'right' }> = ({ team, isWinner = false, align = 'left' }) => {
        const content = (
            <div className={`flex items-center gap-1.5 w-full ${align === 'right' ? 'flex-row-reverse' : 'flex-row'} ${isWinner ? 'font-bold' : ''}`}>
                {team.crestUrl ? (
                    <img src={team.crestUrl} alt={team.name} className="w-5 h-5 object-contain bg-white rounded-full p-0.5 border border-gray-100" />
                ) : (
                    <div className="w-5 h-5 bg-gray-200 rounded-full border border-gray-300"></div>
                )}
                <span className={`truncate text-xs ${isWinner ? 'text-black' : 'text-gray-600'}`}>{team.name}</span>
            </div>
        );
        
        return (
            <div className="flex justify-between items-center w-full">
                {align === 'left' ? content : <span className={`${scoreColor} font-bold font-mono text-xs`}>{team.score !== undefined ? team.score : '-'}</span>}
                {align === 'left' ? <span className={`${scoreColor} font-bold font-mono text-xs`}>{team.score !== undefined ? team.score : '-'}</span> : content}
            </div>
        );
    };

    return (
        <div className={`rounded-lg w-40 transition-all duration-200 ${bgColor} ${shadow} p-2 flex flex-col justify-center gap-1 relative z-10`}>
            {(match.date || match.time || match.venue) && (
                <div className="flex flex-col justify-center items-center text-[9px] text-gray-500 mb-1 border-b border-gray-100 pb-1">
                    <div className="flex gap-1">
                        {match.date && <span>{match.date}</span>}
                        {match.time && <span>{match.time}</span>}
                    </div>
                    {match.venue && <span className="italic text-gray-400 font-medium mt-0.5">{match.venue}</span>}
                </div>
            )}
            <TeamDisplay team={match.team1} isWinner={match.winner === 'team1'} />
            <div className="border-t border-gray-200"></div>
            <TeamDisplay team={match.team2} isWinner={match.winner === 'team2'} />
        </div>
    );
};

// Split Bracket Layout (Tree View)
const SplitBracketView: React.FC<{ tournament: Tournament }> = ({ tournament }) => {
    const rounds = tournament.rounds;
    if (rounds.length < 2) return <div className="text-gray-500 text-center py-4">Not enough rounds to display tree view.</div>;

    const finalRound = rounds[rounds.length - 1];
    const finalMatch = finalRound.matches[0];
    
    // Logic for splitting previous rounds.
    // We assume a standard single-elimination bracket structure.
    const leftSideRounds = rounds.slice(0, -1).map(r => ({
        title: r.title,
        matches: r.matches.slice(0, Math.ceil(r.matches.length / 2))
    }));
    
    const rightSideRounds = rounds.slice(0, -1).map(r => ({
        title: r.title,
        matches: r.matches.slice(Math.ceil(r.matches.length / 2))
    }));

    return (
        <div className="bg-gray-100 p-2 sm:p-4 rounded-xl overflow-x-auto scrollbar-hide border border-gray-200 shadow-inner">
            <div className="min-w-fit flex justify-center items-center gap-6 py-4">
                
                {/* LEFT SIDE */}
                <div className="flex gap-6">
                    {leftSideRounds.map((round, rIdx) => (
                        <div key={`left-${rIdx}`} className="flex flex-col justify-around gap-6">
                            <h5 className="text-center text-[10px] font-bold uppercase tracking-widest text-gray-500 bg-white/50 py-0.5 rounded">{round.title}</h5>
                            {round.matches.map((match, mIdx) => (
                                <div key={`left-${rIdx}-${mIdx}`} className="flex items-center relative my-2">
                                    <MatchCard match={match} />
                                    {/* Connector Line Horizontal */}
                                    <div className="w-3 border-b-2 border-gray-300 h-0 absolute -right-3 top-1/2"></div>
                                    
                                    {/* Vertical Connector Logic */}
                                    {mIdx % 2 === 0 && (
                                         <div className="absolute -right-3 top-1/2 h-[calc(100%+1.5rem+8px)] border-r-2 border-gray-300 translate-y-[50%] z-0"></div>
                                    )}
                                </div>
                            ))}
                        </div>
                    ))}
                </div>

                {/* CENTER - FINAL */}
                <div className="flex flex-col items-center justify-center gap-4 z-20 relative px-2">
                    {/* Incoming lines to center */}
                    <div className="absolute left-0 top-1/2 w-3 border-b-2 border-gray-300"></div>
                    <div className="absolute right-0 top-1/2 w-3 border-b-2 border-gray-300"></div>

                    <div className="absolute -top-12">
                        <h5 className="text-center text-[10px] font-bold uppercase tracking-widest text-yellow-600 mb-2 px-2 py-0.5 bg-yellow-50 rounded border border-yellow-200">{finalRound.title}</h5>
                    </div>
                    
                    <div className="bg-gradient-to-b from-yellow-300 to-yellow-500 p-3 rounded-full shadow-lg relative z-10 ring-4 ring-white">
                        <TrophyIcon className="w-8 h-8 text-white" />
                    </div>
                    
                    <div className="transform scale-105 shadow-xl">
                        <MatchCard match={finalMatch} />
                    </div>
                    
                    {(finalMatch.winner === 'team1' || finalMatch.winner === 'team2') && (
                        <div className="mt-2 bg-gray-900 text-white px-3 py-1 rounded-lg font-display font-bold text-sm tracking-widest uppercase shadow-lg animate-fade-in-up">
                            Winner: {finalMatch.winner === 'team1' ? finalMatch.team1.name : finalMatch.team2.name}
                        </div>
                    )}
                </div>

                {/* RIGHT SIDE (Mirrored) */}
                <div className="flex gap-6 flex-row-reverse">
                    {rightSideRounds.map((round, rIdx) => (
                        <div key={`right-${rIdx}`} className="flex flex-col justify-around gap-6">
                            <h5 className="text-center text-[10px] font-bold uppercase tracking-widest text-gray-500 bg-white/50 py-0.5 rounded">{round.title}</h5>
                            {round.matches.map((match, mIdx) => (
                                <div key={`right-${rIdx}-${mIdx}`} className="flex items-center flex-row-reverse relative my-2">
                                    <MatchCard match={match} />
                                    {/* Connector Line Horizontal */}
                                    <div className="w-3 border-b-2 border-gray-300 h-0 absolute -left-3 top-1/2"></div>
                                     {/* Vertical Connector Logic */}
                                     {mIdx % 2 === 0 && (
                                         <div className="absolute -left-3 top-1/2 h-[calc(100%+1.5rem+8px)] border-l-2 border-gray-300 translate-y-[50%] z-0"></div>
                                    )}
                                </div>
                            ))}
                        </div>
                    ))}
                </div>

            </div>
        </div>
    );
};

const TournamentBracketDisplay: React.FC<{ tournament: Tournament }> = ({ tournament }) => {
    // Check if structure supports tree view (at least 2 rounds, even number of matches in first round)
    const supportsTree = tournament.rounds.length > 1 && tournament.rounds[0].matches.length % 2 === 0;
    const [view, setView] = useState<'list' | 'bracket'>(supportsTree ? 'bracket' : 'list');
    const [copied, setCopied] = useState(false);

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
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-8">
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
                    
                    <div className="flex gap-3">
                        <button
                            onClick={handleShare}
                            className="flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-md bg-blue-50 text-blue-700 hover:bg-blue-100 transition-colors border border-blue-200"
                        >
                            <ShareIcon className="w-4 h-4" />
                            {copied ? 'Link Copied!' : 'Share Bracket'}
                        </button>

                        {supportsTree && (
                            <div className="flex bg-gray-100 p-1.5 rounded-lg border border-gray-200">
                                <button 
                                    onClick={() => setView('list')}
                                    className={`px-4 py-2 text-xs font-bold rounded-md transition-all duration-200 ${view === 'list' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}
                                >
                                    List
                                </button>
                                <button 
                                    onClick={() => setView('bracket')}
                                    className={`px-4 py-2 text-xs font-bold rounded-md transition-all duration-200 ${view === 'bracket' ? 'bg-gray-800 text-white shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                                >
                                    Tree
                                </button>
                            </div>
                        )}
                    </div>
                </div>

                {view === 'bracket' && supportsTree ? (
                    <SplitBracketView tournament={tournament} />
                ) : (
                    <div className="flex flex-nowrap overflow-x-auto gap-8 pb-4 scrollbar-hide">
                        {tournament.rounds.map((round, roundIndex) => (
                            <div key={roundIndex} className="min-w-[200px] flex-shrink-0">
                                <h4 className="font-bold text-center mb-4 uppercase tracking-wider text-white text-xs bg-gray-800 py-2 rounded shadow-sm">{round.title}</h4>
                                <div className="space-y-4 relative">
                                    {/* Connecting line for list view visuals */}
                                    {roundIndex < tournament.rounds.length - 1 && (
                                        <div className="absolute top-1/2 -right-4 w-4 border-t-2 border-gray-300 border-dashed hidden md:block"></div>
                                    )}
                                    {round.matches.map((match) => (
                                        <div key={match.id} className="relative flex justify-center">
                                            <MatchCard match={match} />
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </CardContent>
        </Card>
    );
};

export default TournamentBracketDisplay;
