
import React, { useState, useEffect, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import { fetchYouthData, fetchAllCompetitions, fetchNews } from '../services/api';
import { YouthLeague, YouthArticle } from '../data/youth';
import { NewsItem } from '../data/news';
import Spinner from './ui/Spinner';
import RisingStars from './RisingStars';
import YouthArticleSection from './YouthArticleSection';
import Fixtures from './Fixtures';
import Logs from './Logs';
import { Card, CardContent } from './ui/Card';
import ArrowLeftIcon from './icons/ArrowLeftIcon';
import UsersIcon from './icons/UsersIcon';
import ShieldIcon from './icons/ShieldIcon';

const YouthCompetitionHubPage: React.FC = () => {
    const { compId } = useParams<{ compId: string }>();
    const [leagueData, setLeagueData] = useState<YouthLeague | null>(null);
    const [globalNews, setGlobalNews] = useState<NewsItem[]>([]);
    const [actualCompId, setActualCompId] = useState<string>('');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const load = async () => {
            if (!compId) return;
            setLoading(true);
            try {
                const [youthData, newsData, allCompetitions] = await Promise.all([
                    fetchYouthData(),
                    fetchNews(),
                    fetchAllCompetitions()
                ]);

                const target = youthData.find(l => l.id === compId);
                setLeagueData(target || null);
                setGlobalNews(newsData);

                // Try to find a standard competition doc that matches this youth ID for match data
                const compMatch = Object.keys(allCompetitions).find(id => 
                    id === compId || id.includes(compId)
                );
                if (compMatch) setActualCompId(compMatch);

            } catch (e) {
                console.error("Failed to load youth hub", e);
            } finally {
                setLoading(false);
            }
        };
        load();
    }, [compId]);

    const combinedArticles = useMemo(() => {
        if (!leagueData) return [];
        const specificArticles = leagueData.articles || [];
        const nameKeywords = leagueData.name.toLowerCase().split(' ');

        const relevantGlobalNews = globalNews.filter(n => {
            const title = n.title.toLowerCase();
            const cats = Array.isArray(n.category) ? n.category : [n.category];
            return cats.includes('Youth') && nameKeywords.some(kw => kw.length > 3 && title.includes(kw));
        }).map(n => ({
            id: n.id, title: n.title, summary: n.summary, content: n.content, imageUrl: n.image, date: n.date
        } as YouthArticle));

        return [...specificArticles, ...relevantGlobalNews].sort((a, b) => 
            new Date(b.date).getTime() - new Date(a.date).getTime()
        );
    }, [leagueData, globalNews]);

    if (loading) return <div className="flex justify-center py-20 min-h-screen"><Spinner /></div>;
    if (!leagueData) return <div className="container mx-auto py-20 text-center">Hub not found.</div>;

    return (
        <div className="bg-gray-50 py-12 min-h-screen">
            <div className="container mx-auto px-4 sm:px-6 lg:px-8 animate-fade-in">
                <div className="mb-6">
                    <Link to="/youth" className="inline-flex items-center gap-2 text-sm font-semibold text-gray-600 hover:text-gray-900 transition-colors">
                        <ArrowLeftIcon className="w-4 h-4" /> Back to Youth Hub
                    </Link>
                </div>

                <div className="text-center mb-12">
                    {leagueData.logoUrl ? (
                        <img src={leagueData.logoUrl} className="w-24 h-24 object-contain mx-auto mb-4" />
                    ) : (
                        <ShieldIcon className="w-12 h-12 mx-auto text-blue-600 mb-4" />
                    )}
                    <h1 className="text-4xl md:text-5xl font-display font-extrabold text-blue-800 mb-2">{leagueData.name}</h1>
                    <p className="text-lg text-gray-600 max-w-3xl mx-auto">{leagueData.description}</p>
                </div>

                <div className="space-y-16">
                    {combinedArticles.length > 0 && (
                        <div className="border-t pt-8">
                            <h2 className="text-2xl font-display font-bold mb-6 text-gray-800">League News</h2>
                            <YouthArticleSection articles={combinedArticles} />
                        </div>
                    )}

                    {actualCompId && (
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
                            <div className="w-full">
                                <h2 className="text-2xl font-display font-bold mb-4 text-gray-800">Fixtures & Results</h2>
                                <Fixtures showSelector={false} defaultCompetition={actualCompId} maxHeight="max-h-[800px]" />
                            </div>
                            <div className="w-full">
                                <h2 className="text-2xl font-display font-bold mb-4 text-gray-800">League Standings</h2>
                                <Logs showSelector={false} defaultLeague={actualCompId} maxHeight="max-h-[800px]" />
                            </div>
                        </div>
                    )}

                    {leagueData.risingStars && leagueData.risingStars.length > 0 && (
                        <section>
                            <h2 className="text-3xl font-display font-bold mb-8 border-b pb-4">Rising Stars</h2>
                            <RisingStars players={leagueData.risingStars} />
                        </section>
                    )}

                    {leagueData.teams && leagueData.teams.length > 0 && (
                        <section>
                            <Card className="bg-blue-50/50 border border-blue-100">
                                <CardContent className="p-8">
                                    <h3 className="text-2xl font-bold font-display text-gray-800 mb-6 flex items-center gap-2">
                                        <UsersIcon className="w-6 h-6 text-blue-600" /> Participating Teams
                                    </h3>
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                        {leagueData.teams.map(team => (
                                            <div key={team.id} className="flex items-center gap-3 bg-white py-3 px-4 rounded-lg shadow-sm border">
                                                <img src={team.crestUrl} className="w-10 h-10 object-contain" />
                                                <span className="text-sm font-bold">{team.name}</span>
                                            </div>
                                        ))}
                                    </div>
                                </CardContent>
                            </Card>
                        </section>
                    )}
                </div>
            </div>
        </div>
    );
};

export default YouthCompetitionHubPage;
