
import React, { useState, useEffect } from 'react';
import { Card, CardContent } from './ui/Card';
import Button from './ui/Button';
import { CompetitionFixture } from '../data/teams';
import { fetchCompetition } from '../services/api';
import VoteIcon from './icons/VoteIcon';
import CheckCircleIcon from './icons/CheckCircleIcon';
import XCircleIcon from './icons/XCircleIcon';
import Spinner from './ui/Spinner';

interface PredictableMatch extends CompetitionFixture {
    userPrediction?: 'teamA' | 'draw' | 'teamB';
    isFinished?: boolean;
    actualResult?: 'teamA' | 'draw' | 'teamB';
    isCorrect?: boolean;
    isSimulating?: boolean;
}

const PredictionResult: React.FC<{ match: PredictableMatch }> = ({ match }) => {
    const getPredictionText = () => {
        switch (match.userPrediction) {
            case 'teamA': return match.teamA;
            case 'teamB': return match.teamB;
            case 'draw': return 'Draw';
            default: return 'N/A';
        }
    };

    return (
        <div className="animate-fade-in flex flex-col items-center text-center">
            <p className="text-xs text-gray-500 font-medium">Final Score</p>
            <p className="font-bold text-2xl my-1">{match.scoreA} - {match.scoreB}</p>
            <div className={`flex items-center gap-2 text-sm font-semibold px-3 py-1.5 rounded-md w-full justify-center ${match.isCorrect ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                {match.isCorrect ? <CheckCircleIcon className="w-5 h-5" /> : <XCircleIcon className="w-5 h-5" />}
                <span className="truncate">
                    Your prediction: {getPredictionText()}
                </span>
            </div>
        </div>
    );
};

const PredictionButtons: React.FC<{ match: PredictableMatch; onPredict: (matchId: number, prediction: 'teamA' | 'draw' | 'teamB') => void }> = ({ match, onPredict }) => {
    return (
        <div className="grid grid-cols-3 gap-2 sm:gap-3">
            <Button 
                onClick={() => onPredict(match.id, 'teamA')} 
                className="bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500 font-bold w-full text-xs sm:text-sm truncate"
                aria-label={`Predict ${match.teamA} to win`}
            >
                {match.teamA}
            </Button>
            <Button 
                onClick={() => onPredict(match.id, 'draw')} 
                className="bg-yellow-500 text-white hover:bg-yellow-400 focus:ring-yellow-500 font-bold w-full text-xs sm:text-sm"
            >
                Draw
            </Button>
            <Button 
                onClick={() => onPredict(match.id, 'teamB')} 
                className="bg-red-600 text-white hover:bg-red-700 focus:ring-red-500 font-bold w-full text-xs sm:text-sm truncate"
                aria-label={`Predict ${match.teamB} to win`}
            >
                {match.teamB}
            </Button>
        </div>
    );
};

const MatchPredictor: React.FC = () => {
    const [matches, setMatches] = useState<PredictableMatch[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const loadMatches = async () => {
            const data = await fetchCompetition('mtn-premier-league');
            if (data?.fixtures) {
                // Show upcoming matches that don't have results yet
                const upcoming = data.fixtures
                    .filter(f => f.status === 'scheduled')
                    .slice(0, 5);
                setMatches(upcoming);
            }
            setLoading(false);
        };
        loadMatches();
    }, []);

    const handlePrediction = (matchId: number, prediction: 'teamA' | 'draw' | 'teamB') => {
        setMatches(prev => prev.map(m => 
            m.id === matchId ? { ...m, userPrediction: prediction, isSimulating: true } : m
        ));

        setTimeout(() => {
            const scoreA = Math.floor(Math.random() * 4);
            const scoreB = Math.floor(Math.random() * 4);
            let actualResult: 'teamA' | 'draw' | 'teamB';
            if (scoreA > scoreB) actualResult = 'teamA';
            else if (scoreB > scoreA) actualResult = 'teamB';
            else actualResult = 'draw';

            setMatches(prev => prev.map(m => 
                m.id === matchId ? { 
                    ...m, 
                    isFinished: true,
                    isSimulating: false,
                    scoreA,
                    scoreB,
                    actualResult,
                    isCorrect: prediction === actualResult
                } : m
            ));
        }, 2500);
    };
    
    const renderContent = () => {
        if (loading) {
            return (
                <div className="space-y-2">
                    {[...Array(3)].map((_, i) => <div key={i} className="h-24 bg-gray-100 rounded-lg animate-pulse"></div>)}
                </div>
            );
        }

        if (matches.length === 0) {
            return (
                <div className="text-center py-6 border-2 border-dashed rounded-xl">
                    <p className="text-gray-400 text-sm">No live fixtures available for prediction.</p>
                </div>
            );
        }

        return (
            <div className="space-y-4">
                {matches.map(match => (
                    <Card key={match.id} className="bg-gray-50/70 shadow-sm border border-gray-100">
                        <CardContent className="p-4">
                            <div className="text-center font-semibold mb-4 grid grid-cols-[1fr_auto_1fr] items-center gap-2">
                                <span className="truncate text-right text-gray-800">{match.teamA}</span>
                                <span className="text-gray-400 text-xs uppercase tracking-widest">vs</span>
                                <span className="truncate text-left text-gray-800">{match.teamB}</span>
                            </div>
                            
                            <div className="min-h-[68px] flex items-center justify-center">
                                {match.isFinished ? (
                                    <PredictionResult match={match} />
                                ) : match.isSimulating ? (
                                    <div className="flex justify-center items-center gap-2 text-sm font-semibold text-gray-500 animate-fade-in">
                                        <Spinner className="h-4 w-4 border-2" />
                                        Analyzing Match Result...
                                    </div>
                                ) : (
                                    <PredictionButtons match={match} onPredict={handlePrediction} />
                                )}
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>
        );
    };

    return (
        <Card className="shadow-lg h-full">
            <CardContent className="p-6">
                <div className="flex items-center gap-2 mb-4">
                    <VoteIcon className="w-6 h-6 text-blue-600" />
                    <h3 className="text-xl font-display font-bold text-gray-800">Match Predictor</h3>
                </div>
                <p className="text-sm text-gray-500 mb-6 leading-relaxed">Predict outcomes to earn XP and level up your Fan Status!</p>
                {renderContent()}
            </CardContent>
        </Card>
    );
};

export default MatchPredictor;
