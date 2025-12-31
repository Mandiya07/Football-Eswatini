
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

            // 1. Live Matches (Priority)
            const liveMatches = matches.filter(m => m.status === 'live');
            liveMatches.forEach(m => combined.push({ type: 'match', data: m }));

            // 2. Breaking News
            news.slice(0, 3).forEach(n => combined.push({ type: 'news', data: n }));

            // 3. Match CTA
            combined.push({ type: 'cta', text: "⚽ Predict match outcomes & level up!", link: "/interactive" });

            // 4. Upcoming Fixtures (Shortlist)
            const upcoming = matches.filter(m => m.status === 'scheduled').slice(0, 4);
            upcoming.forEach(m => combined.push({ type: 'match', data: m }));

            // 5. Local Events
            community.slice(0, 2).forEach(c => combined.push({ type: 'community', data: c }));

            // Ensure we have enough items for a smooth marquee loop (min 6-8)
            if (combined.length > 0 && combined.length < 8) {
                // Repeat CTA or items if data is thin
                combined.push({ type: 'cta', text: "🏆 Support your local clubs via the Directory", link: "/directory" });
            }

            setItems(combined);
        };

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

        fetchNews().then(data => { news = data; updateTicker(); });
        fetchCommunityEvents().then(data => { community = data; updateTicker(); });

        return () => unsubscribeMatches();
    }, []);

    if (items.length === 0) return null;

    return (
        <div className="bg-primary-dark border-y border-white/5 h-10 flex items-center overflow-hidden relative z-[90] shadow-inner">
            <div className="flex-shrink-0 bg-secondary px-4 h-full flex items-center z-20 shadow-[8px_0_15px_rgba(0,0,0,0.5)]">
                <div className="w-2 h-2 bg-white rounded-full animate-pulse mr-2"></div>
                <span className="text-white text-[10px] font-black uppercase tracking-tighter">Live Updates</span>
            </div>
            
            <div className="flex whitespace-nowrap animate-marquee hover:pause-animation items-center">
                {/* Render four times to guarantee a seamless loop on 4K/ultra-wide screens */}
                {[...items, ...items, ...items, ...items].map((item, idx) => (
                    <div key={`${idx}`} className="inline-flex items-center px-10 border-r border-white/5">
                        {item.type === 'match' && (
                            <>
                                <span className={`text-[9px] font-black mr-3 px-2 py-0.5 rounded shadow-sm ${
                                    item.data.status === 'live' ? 'bg-accent text-primary-dark animate-pulse' : 
                                    item.data.status === 'finished' ? 'bg-white/10 text-white/50' : 'bg-blue-600 text-white'
                                }`}>
                                    {item.data.status === 'live' ? `LIVE ${item.data.liveMinute || 0}'` : 
                                     item.data.status === 'finished' ? 'FINAL' : item.data.time || 'TBD'}
                                </span>
                                <span className="text-white text-xs font-bold tracking-tight">
                                    {item.data.teamA} 
                                    <span className="mx-2 text-accent">
                                        {item.data.status === 'scheduled' ? 'vs' : `${item.data.scoreA ?? 0}-${item.data.scoreB ?? 0}`}
                                    </span>
                                    {item.data.teamB}
                                </span>
                            </>
                        )}

                        {item.type === 'news' && (
                            <>
                                <span className="text-[9px] font-black mr-3 px-2 py-0.5 rounded bg-blue-500 text-white uppercase shadow-sm">News</span>
                                <Link to={item.data.url} className="text-white text-xs font-medium hover:text-accent transition-colors">
                                    {item.data.title}
                                </Link>
                            </>
                        )}

                        {item.type === 'community' && (
                            <>
                                <span className="text-[9px] font-black mr-3 px-2 py-0.5 rounded bg-green-600 text-white uppercase shadow-sm">Events</span>
                                <span className="text-white text-xs font-medium italic opacity-90">
                                    {item.data.title} @ {item.data.venue}
                                </span>
                            </>
                        )}

                        {item.type === 'cta' && (
                            <Link to={item.link} className="text-accent text-[11px] font-black uppercase tracking-widest hover:underline decoration-2 underline-offset-4 decoration-white/20">
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
