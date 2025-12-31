
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

            // 1. Prioritize Live Matches
            const liveMatches = matches.filter(m => m.status === 'live');
            liveMatches.forEach(m => combined.push({ type: 'match', data: m }));

            // 2. Mix in Latest News (Top 3)
            news.slice(0, 3).forEach(n => combined.push({ type: 'news', data: n }));

            // 3. Add Fixed CTA for Interactive Zone
            combined.push({ type: 'cta', text: "⚽ Predict match outcomes & earn XP!", link: "/interactive" });

            // 4. Add Upcoming Matches
            const upcoming = matches.filter(m => m.status === 'scheduled').slice(0, 5);
            upcoming.forEach(m => combined.push({ type: 'match', data: m }));

            // 5. Community Events (Top 2)
            community.slice(0, 2).forEach(c => combined.push({ type: 'community', data: c }));

            // 6. Another CTA
            combined.push({ type: 'cta', text: "🏆 Vote for Player of the Month", link: "/interactive" });

            // 7. Recent Results (Top 3)
            const results = matches.filter(m => m.status === 'finished').slice(0, 3);
            results.forEach(m => combined.push({ type: 'match', data: m }));

            setItems(combined);
        };

        // Listen for match changes
        const unsubscribeMatches = listenToAllCompetitions((allComps) => {
            const allMatches: CompetitionFixture[] = [];
            Object.values(allComps).forEach(comp => {
                if (comp.fixtures) allMatches.push(...comp.fixtures);
                if (comp.results) allMatches.push(...comp.results);
            });
            matches = allMatches.sort((a, b) => {
                if (a.status === 'live' && b.status !== 'live') return -1;
                if (b.status === 'live' && a.status !== 'live') return 1;
                return new Date(b.fullDate || 0).getTime() - new Date(a.fullDate || 0).getTime();
            });
            updateTicker();
        });

        // Fetch News once
        fetchNews().then(data => {
            news = data;
            updateTicker();
        });

        // Fetch Community once
        fetchCommunityEvents().then(data => {
            community = data;
            updateTicker();
        });

        return () => unsubscribeMatches();
    }, []);

    if (items.length === 0) return null;

    return (
        <div className="bg-primary-dark border-y border-white/10 h-10 flex items-center overflow-hidden relative z-[90] shadow-lg">
            <div className="flex-shrink-0 bg-secondary px-4 h-full flex items-center z-20 shadow-[5px_0_15px_rgba(0,0,0,0.3)]">
                <div className="w-2 h-2 bg-white rounded-full animate-pulse mr-2"></div>
                <span className="text-white text-[10px] font-black uppercase tracking-tighter whitespace-nowrap">Live Feed</span>
            </div>
            
            <div className="flex whitespace-nowrap animate-marquee hover:pause-animation items-center">
                {/* Render twice for seamless loop */}
                {[...items, ...items].map((item, idx) => (
                    <div key={`${idx}`} className="inline-flex items-center px-8 border-r border-white/5">
                        {item.type === 'match' && (
                            <>
                                <span className={`text-[9px] font-black mr-3 px-1.5 py-0.5 rounded ${
                                    item.data.status === 'live' ? 'bg-accent text-primary-dark animate-pulse' : 
                                    item.data.status === 'finished' ? 'bg-white/10 text-white/40' : 'bg-blue-600 text-white'
                                }`}>
                                    {item.data.status === 'live' ? `LIVE ${item.data.liveMinute || 0}'` : 
                                     item.data.status === 'finished' ? 'FINAL' : item.data.time || 'TBD'}
                                </span>
                                <span className="text-white text-xs font-bold tracking-tight">
                                    {item.data.teamA} 
                                    <span className="mx-2 text-accent">
                                        {item.data.status === 'scheduled' ? 'vs' : `${item.data.scoreA ?? 0} - ${item.data.scoreB ?? 0}`}
                                    </span>
                                    {item.data.teamB}
                                </span>
                            </>
                        )}

                        {item.type === 'news' && (
                            <>
                                <span className="text-[9px] font-black mr-3 px-1.5 py-0.5 rounded bg-blue-500 text-white uppercase">Headlines</span>
                                <Link to={item.data.url} className="text-white text-xs font-medium hover:text-accent transition-colors">
                                    {item.data.title}
                                </Link>
                            </>
                        )}

                        {item.type === 'community' && (
                            <>
                                <span className="text-[9px] font-black mr-3 px-1.5 py-0.5 rounded bg-green-600 text-white uppercase">Community</span>
                                <span className="text-white text-xs font-medium italic">
                                    {item.data.title} @ {item.data.venue}
                                </span>
                            </>
                        )}

                        {item.type === 'cta' && (
                            <Link to={item.link} className="text-accent text-xs font-black uppercase tracking-wider hover:underline decoration-2 underline-offset-4">
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
