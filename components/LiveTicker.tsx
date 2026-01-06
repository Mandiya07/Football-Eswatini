
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { listenToAllCompetitions, fetchNews, fetchCommunityEvents } from '../services/api';
import { CompetitionFixture } from '../data/teams';
import { NewsItem } from '../data/news';
import { CommunityEvent } from '../services/api';

type TickerItem = 
    | { type: 'match'; data: CompetitionFixture }
    | { type: 'news'; data: NewsItem }
    | { type: 'community'; data: CommunityEvent }
    | { type: 'cta'; text: string; link: string };

const LiveTicker: React.FC = () => {
    const [items, setItems] = useState<TickerItem[]>([]);

    useEffect(() => {
        let matches: CompetitionFixture[] = [];
        let news: NewsItem[] = [];
        let community: CommunityEvent[] = [];

        const updateTicker = () => {
            const combined: TickerItem[] = [];
            const now = new Date();
            const todayStr = now.toISOString().split('T')[0];
            
            const last48h = new Date(now.getTime() - (48 * 60 * 60 * 1000));
            const next7d = new Date(now.getTime() + (7 * 24 * 60 * 60 * 1000));

            // 1. Live/Suspended Matches (All Competitions)
            const activeMatches = matches.filter(m => m.status === 'live' || m.status === 'suspended' || m.status === 'abandoned');
            activeMatches.forEach(m => combined.push({ type: 'match', data: m }));

            // 2. Breaking News
            news.slice(0, 5).forEach(n => combined.push({ type: 'news', data: n }));

            // 3. Recent Results (Last 48 hours, All Competitions)
            const recentResults = matches.filter(m => 
                m.status === 'finished' && 
                m.fullDate && 
                new Date(m.fullDate).getTime() >= last48h.getTime()
            ).sort((a, b) => new Date(b.fullDate!).getTime() - new Date(a.fullDate!).getTime());
            recentResults.forEach(m => combined.push({ type: 'match', data: m }));

            // 4. Important Match Alerts
            const alerts = matches.filter(m => 
                (m.status === 'postponed' || m.status === 'cancelled') &&
                m.fullDate && 
                new Date(m.fullDate).getTime() >= last48h.getTime()
            );
            alerts.forEach(m => combined.push({ type: 'match', data: m }));

            // 5. Upcoming Fixtures (Next 7 days, All Competitions)
            const upcoming = matches.filter(m => 
                m.status === 'scheduled' && 
                m.fullDate && 
                new Date(m.fullDate).getTime() > now.getTime() &&
                new Date(m.fullDate).getTime() <= next7d.getTime()
            ).sort((a, b) => new Date(a.fullDate!).getTime() - new Date(b.fullDate!).getTime());
            
            upcoming.slice(0, 15).forEach(m => combined.push({ type: 'match', data: m }));

            // 6. Upcoming Local Events
            community.filter(c => c.date >= todayStr).slice(0, 3).forEach(c => combined.push({ type: 'community', data: c }));

            // 7. CTA
            combined.push({ type: 'cta', text: "⚽ Predict match outcomes & win!", link: "/interactive" });

            setItems(combined);
        };

        const unsubscribeMatches = listenToAllCompetitions((allComps) => {
            const allMatches: CompetitionFixture[] = [];
            Object.entries(allComps).forEach(([compId, comp]) => {
                const compLabel = comp.displayName || comp.name;
                if (comp.fixtures) {
                    comp.fixtures.forEach(f => {
                        allMatches.push({ ...f, competition: compLabel });
                    });
                }
                if (comp.results) {
                    comp.results.forEach(r => {
                        allMatches.push({ ...r, competition: compLabel });
                    });
                }
            });
            matches = allMatches;
            updateTicker();
        });

        fetchNews().then(data => { news = data; updateTicker(); });
        fetchCommunityEvents().then(data => { community = data; updateTicker(); });

        return () => unsubscribeMatches();
    }, []);

    if (items.length === 0) return null;

    const getStatusLabel = (m: CompetitionFixture) => {
        if (m.status === 'live') return `LIVE ${m.liveMinute || 0}'`;
        if (m.status === 'suspended') return `SUSPENDED`;
        if (m.status === 'abandoned') return `ABANDONED`;
        if (m.status === 'postponed') return `POSTPONED`;
        if (m.status === 'cancelled') return `CANCELLED`;
        if (m.status === 'finished') return `FINAL`;
        return m.time || 'TBD';
    };

    const getStatusColor = (m: CompetitionFixture) => {
        if (m.status === 'live') return 'bg-red-600 text-white animate-pulse';
        if (m.status === 'suspended' || m.status === 'abandoned') return 'bg-orange-600 text-white';
        if (m.status === 'postponed' || m.status === 'cancelled') return 'bg-slate-700 text-white';
        if (m.status === 'finished') return 'bg-green-600 text-white';
        return 'bg-blue-600 text-white';
    };

    return (
        <div className="bg-primary-dark border-y border-white/5 h-10 flex items-center overflow-hidden relative z-[90] shadow-inner">
            <div className="flex-shrink-0 bg-secondary px-4 h-full flex items-center z-20 shadow-[8px_0_15px_rgba(0,0,0,0.5)]">
                <div className="w-1.5 h-1.5 bg-white rounded-full animate-pulse mr-2"></div>
                <span className="text-white text-[10px] font-black uppercase tracking-widest">Pulse</span>
            </div>
            
            <div className="flex whitespace-nowrap animate-marquee hover:pause-animation items-center">
                {[...items, ...items].map((item, idx) => (
                    <div key={`${idx}`} className="inline-flex items-center px-10 border-r border-white/5">
                        {item.type === 'match' && (
                            <>
                                <span className={`text-[8px] font-black mr-3 px-2 py-0.5 rounded shadow-sm ${getStatusColor(item.data)}`}>
                                    {getStatusLabel(item.data)}
                                </span>
                                <span className="text-white text-xs font-bold tracking-tight">
                                    <span className="opacity-40 font-black mr-2 text-[9px] uppercase">{item.data.competition}</span>
                                    {item.data.teamA} 
                                    <span className="mx-2 text-accent">
                                        {item.data.status === 'scheduled' || item.data.status === 'postponed' || item.data.status === 'cancelled' 
                                            ? 'vs' 
                                            : `${item.data.scoreA ?? 0}-${item.data.scoreB ?? 0}`}
                                    </span>
                                    {item.data.teamB}
                                </span>
                            </>
                        )}

                        {item.type === 'news' && (
                            <>
                                <span className="text-[8px] font-black mr-3 px-2 py-0.5 rounded bg-blue-500 text-white uppercase shadow-sm">News</span>
                                <Link to={item.data.url} className="text-white text-xs font-medium hover:text-accent transition-colors">
                                    {item.data.title}
                                </Link>
                            </>
                        )}

                        {item.type === 'community' && (
                            <>
                                <span className="text-[8px] font-black mr-3 px-2 py-0.5 rounded bg-green-600 text-white uppercase shadow-sm">Local</span>
                                <span className="text-white text-xs font-medium italic opacity-90">
                                    {item.data.title} • {item.data.venue}
                                </span>
                            </>
                        )}

                        {item.type === 'cta' && (
                            <Link to={item.link} className="text-accent text-[10px] font-black uppercase tracking-widest hover:underline">
                                {item.text}
                            </Link>
                        )}
                    </div>
                ))}
            </div>

            <style>{`
                .pause-animation { animation-play-state: paused; }
            `}</style>
        </div>
    );
};

export default LiveTicker;
