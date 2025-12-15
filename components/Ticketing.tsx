
import React, { useState, useEffect } from 'react';
import { Card, CardContent } from './ui/Card';
import { fetchMatchTickets, MatchTicket } from '../services/api';
import Button from './ui/Button';
import { useCart } from '../contexts/CartContext';
import { Product } from '../data/shop';
import CheckCircleIcon from './icons/CheckCircleIcon';
import Spinner from './ui/Spinner';

const Ticketing: React.FC = () => {
    const [addedTicketId, setAddedTicketId] = useState<string | null>(null);
    const { addToCart } = useCart();
    const [tickets, setTickets] = useState<MatchTicket[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const loadTickets = async () => {
            setLoading(true);
            try {
                const data = await fetchMatchTickets();
                // Filter out past matches automatically
                const validTickets = data.filter(t => {
                    const matchDate = new Date(`${t.date}T${t.time}`);
                    return matchDate > new Date();
                }).sort((a,b) => new Date(a.date).getTime() - new Date(b.date).getTime());
                
                setTickets(validTickets);
            } catch (error) {
                console.error("Error loading tickets", error);
            } finally {
                setLoading(false);
            }
        };
        loadTickets();
    }, []);

    const handleBuyTicket = (ticket: MatchTicket) => {
        const ticketProduct: Product = {
            id: `ticket-${ticket.id}`,
            name: `Ticket: ${ticket.teamA} vs ${ticket.teamB}`,
            price: ticket.price,
            imageUrl: 'https://via.placeholder.com/300/CCCCCC/FFFFFF?text=MATCH+TICKET',
            category: 'Match Ticket',
        };
        addToCart(ticketProduct);
        setAddedTicketId(ticket.id);
        setTimeout(() => {
            setAddedTicketId(null);
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
            {tickets.length > 0 ? tickets.map(ticket => {
                const day = new Date(ticket.date).toLocaleDateString('en-US', { weekday: 'short' }).toUpperCase();
                const dateNum = new Date(ticket.date).getDate();

                return (
                    <Card key={ticket.id} className="shadow-lg overflow-hidden animate-fade-in hover:shadow-xl transition-shadow">
                        <CardContent className="p-0">
                            <div className="flex flex-col sm:flex-row items-center">
                                <div className="bg-blue-600 text-white p-4 text-center w-full sm:w-28 flex-shrink-0">
                                    <p className="font-bold text-3xl">{dateNum}</p>
                                    <p className="text-sm uppercase">{day}</p>
                                </div>
                                <div className="flex-grow p-4 text-center sm:text-left">
                                    <h3 className="font-bold text-lg text-gray-900">{ticket.teamA} vs {ticket.teamB}</h3>
                                    <p className="text-sm text-gray-500 mt-1">{ticket.venue} &bull; {ticket.time}</p>
                                </div>
                                <div className="p-4 w-full sm:w-auto flex-shrink-0">
                                    <Button 
                                        onClick={() => handleBuyTicket(ticket)}
                                        className={`w-full sm:w-auto font-bold transition-all duration-300 min-w-[160px] ${
                                            addedTicketId === ticket.id
                                            ? 'bg-green-600 text-white focus:ring-green-500'
                                            : 'bg-yellow-500 text-blue-900 hover:bg-yellow-400 focus:ring-yellow-500'
                                        }`}
                                    >
                                    {addedTicketId === ticket.id ? (
                                        <span className="flex items-center justify-center gap-2">
                                            <CheckCircleIcon className="w-5 h-5" /> Added!
                                        </span>
                                    ) : (
                                        `Buy Ticket (E${ticket.price})`
                                    )}
                                    </Button>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                );
            }) : (
                <Card>
                    <CardContent className="p-8 text-center">
                        <p className="text-gray-500 text-lg">No tickets currently available for upcoming matches.</p>
                        <p className="text-sm text-gray-400 mt-2">Check back soon for new fixtures.</p>
                    </CardContent>
                </Card>
            )}
        </div>
    );
};

export default Ticketing;
