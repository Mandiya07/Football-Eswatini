

import React, { useState, useEffect } from 'react';
import { Card, CardContent } from './ui/Card';
import { CompetitionFixture } from '../data/teams';
// FIX: Import 'fetchCompetition' which is now correctly exported from the API service.
import { fetchCompetition } from '../services/api';
import Button from './ui/Button';
import { useCart } from '../contexts/CartContext';
import { Product } from '../data/shop';
import CheckCircleIcon from './icons/CheckCircleIcon';
import Spinner from './ui/Spinner';

const Ticketing: React.FC = () => {
    const [addedMatchId, setAddedMatchId] = useState<number | null>(null);
    const { addToCart } = useCart();
    const [upcomingMatches, setUpcomingMatches] = useState<CompetitionFixture[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const loadMatches = async () => {
            const data = await fetchCompetition('mtn-premier-league');
            if (data?.fixtures) {
                const scheduled = data.fixtures
                    .filter(f => f.status === 'scheduled')
                    .slice(0, 4);
                setUpcomingMatches(scheduled);
            }
            setLoading(false);
        };
        loadMatches();
    }, []);

    const handleBuyTicket = (match: CompetitionFixture) => {
        const ticketProduct: Product = {
            id: (1000 + match.id).toString(), // Create a unique ID for the ticket product
            name: `Ticket: ${match.teamA} vs ${match.teamB}`,
            price: 75.00, // Example ticket price
            imageUrl: 'https://via.placeholder.com/300/CCCCCC/FFFFFF?text=TICKET',
            category: 'Match Ticket',
        };
        addToCart(ticketProduct);
        setAddedMatchId(match.id);
        setTimeout(() => {
            setAddedMatchId(null);
        }, 1500);
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center py-12">
                <Spinner />
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            {upcomingMatches.length > 0 ? upcomingMatches.map(match => (
                <Card key={match.id} className="shadow-lg overflow-hidden animate-fade-in">
                    <CardContent className="p-0">
                        <div className="flex flex-col sm:flex-row items-center">
                            <div className="bg-blue-600 text-white p-4 text-center w-full sm:w-28">
                                <p className="font-bold text-3xl">{match.date}</p>
                                <p className="text-sm uppercase">{match.day}</p>
                            </div>
                            <div className="flex-grow p-4 text-center sm:text-left">
                                <h3 className="font-bold text-lg">{match.teamA} vs {match.teamB}</h3>
                                <p className="text-sm text-gray-500">{match.venue} &bull; {match.time}</p>
                            </div>
                            <div className="p-4 w-full sm:w-auto">
                                <Button 
                                    onClick={() => handleBuyTicket(match)}
                                    className={`w-full sm:w-auto font-bold transition-all duration-300 ${
                                        addedMatchId === match.id
                                        ? 'bg-green-600 text-white focus:ring-green-500'
                                        : 'bg-yellow-500 text-blue-900 hover:bg-yellow-400 focus:ring-yellow-500'
                                    }`}
                                >
                                {addedMatchId === match.id ? (
                                    <span className="flex items-center justify-center gap-2">
                                        <CheckCircleIcon className="w-5 h-5" /> Added!
                                    </span>
                                ) : (
                                    'Buy Tickets (E75.00)'
                                )}
                                </Button>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            )) : (
                <Card><CardContent className="p-6 text-center text-gray-500">No upcoming matches available for ticketing right now.</CardContent></Card>
            )}
        </div>
    );
};

export default Ticketing;