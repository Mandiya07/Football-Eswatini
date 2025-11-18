


import React from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent } from './ui/Card';
import { Tournament, BracketMatch, BracketMatchTeam } from '../data/cups';

const MatchCard: React.FC<{ match: BracketMatch }> = ({ match }) => {
    const TeamDisplay: React.FC<{ team: BracketMatchTeam, isWinner?: boolean }> = ({ team, isWinner = false }) => {
        const content = (
            <div className={`flex items-center justify-between p-2 rounded ${isWinner ? 'font-bold' : ''}`}>
                <div className="flex items-center gap-2">
                    {team.crestUrl && <img src={team.crestUrl} alt={team.name} className="w-5 h-5 object-contain" />}
                    <span className="truncate">{team.name}</span>
                </div>
                {team.score !== undefined && <span className="font-bold">{team.score}</span>}
            </div>
        );
        // The data model for cups does not include competitionId, so linking is disabled to prevent errors.
        return <div>{content}</div>;
    };

    return (
        <div className="bg-white border rounded-md shadow-sm w-56 text-sm">
            <TeamDisplay team={match.team1} isWinner={match.winner === 'team1'} />
            <div className="border-t border-gray-200"></div>
            <TeamDisplay team={match.team2} isWinner={match.winner === 'team2'} />
        </div>
    );
};


const TournamentBracketDisplay: React.FC<{ tournament: Tournament }> = ({ tournament }) => {
    return (
        <Card className="shadow-lg animate-fade-in">
            <CardContent className="p-6">
                <div className="flex items-center justify-center gap-4 mb-6">
                    {tournament.logoUrl && <img src={tournament.logoUrl} alt={`${tournament.name} logo`} className="h-12 object-contain" />}
                    <h3 className="text-2xl font-bold font-display text-center">{tournament.name}</h3>
                </div>
                <div className="flex justify-center items-start gap-8 overflow-x-auto p-4 scrollbar-hide">
                    {tournament.rounds.map((round, roundIndex) => (
                        <div key={roundIndex} className="bracket-round flex-shrink-0">
                            <h4 className="font-bold text-center mb-6 uppercase tracking-wider text-gray-600">{round.title}</h4>
                            {round.matches.map((match) => (
                                <div key={match.id} className="bracket-match-container">
                                    <MatchCard match={match} />
                                    {roundIndex < tournament.rounds.length - 1 && <div className="bracket-connector"></div>}
                                </div>
                            ))}
                        </div>
                    ))}
                </div>
            </CardContent>
        </Card>
    );
};

export default TournamentBracketDisplay;