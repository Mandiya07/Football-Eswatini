import React, { useState, useEffect } from 'react';
import { Card, CardContent } from './ui/Card';
import UsersIcon from './icons/UsersIcon';
import WhistleIcon from './icons/WhistleIcon';
import TrophyIcon from './icons/TrophyIcon';
import BarChartIcon from './icons/BarChartIcon';
import { fetchAllTeams } from '../services/api';

const EFAStatsSection: React.FC = () => {
    const [stats, setStats] = useState({ players: 0, coaches: 0, clubs: 0 });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const loadStats = async () => {
            try {
                const teams = await fetchAllTeams();
                const players = teams.reduce((acc, team) => acc + (team.players?.length || 0), 0);
                const coaches = teams.reduce((acc, team) => acc + (team.staff?.length || 0), 0);
                setStats({ players, coaches, clubs: teams.length });
            } catch (error) {
                console.error("Failed to load EFA stats", error);
            } finally {
                setLoading(false);
            }
        };
        loadStats();
    }, []);

    if (loading) return null;

    const statItems = [
        { label: "Registered Players", value: stats.players.toLocaleString(), icon: <UsersIcon className="w-8 h-8" /> },
        { label: "Active Staff", value: stats.coaches.toLocaleString(), icon: <WhistleIcon className="w-8 h-8" /> },
        { label: "Registered Clubs", value: stats.clubs.toLocaleString(), icon: <TrophyIcon className="w-8 h-8" /> },
        { label: "National Trends", value: "+12%", icon: <BarChartIcon className="w-8 h-8" /> },
    ];

    return (
        <section className="container mx-auto max-w-6xl px-4 -mt-8 md:-mt-16 relative z-20">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {statItems.map((stat, i) => (
                    <Card key={i} className="border-0 shadow-lg rounded-3xl p-6 hover:shadow-xl transition-shadow flex flex-col items-center text-center">
                        <div className="bg-blue-50 text-blue-600 p-4 rounded-full mb-4">
                            {stat.icon}
                        </div>
                        <h4 className="text-3xl font-black text-gray-900 mb-1">{stat.value}</h4>
                        <p className="text-xs font-bold text-gray-500 uppercase tracking-widest">{stat.label}</p>
                    </Card>
                ))}
            </div>
        </section>
    );
};

export default EFAStatsSection;
