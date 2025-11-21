
import React, { useState, useEffect } from 'react';
import { Card, CardContent } from './ui/Card';
import { ExclusiveItem, fetchExclusiveContent } from '../services/api';
import FileTextIcon from './icons/FileTextIcon';
import Spinner from './ui/Spinner';

const ExclusivePage: React.FC = () => {
    const [articles, setArticles] = useState<ExclusiveItem[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const loadData = async () => {
            setLoading(true);
            const data = await fetchExclusiveContent();
            setArticles(data);
            setLoading(false);
        };
        loadData();
    }, []);

    return (
        <div className="bg-gray-50 py-12">
            <div className="container mx-auto px-4 sm:px-6 lg:px-8 animate-fade-in">
                <div className="text-center mb-12">
                    <FileTextIcon className="w-12 h-12 mx-auto text-yellow-600 mb-2" />
                    <h1 className="text-4xl md:text-5xl font-display font-extrabold text-yellow-800 mb-2">
                        Exclusive Features
                    </h1>
                    <p className="text-lg text-gray-600 max-w-3xl mx-auto">
                        In-depth interviews with football officials, administrators, and key figures shaping the game in Eswatini.
                    </p>
                </div>

                {loading ? <div className="flex justify-center"><Spinner /></div> : 
                articles.length > 0 ? (
                    <div className="grid grid-cols-1 gap-8 max-w-4xl mx-auto">
                        {articles.map(article => (
                            <Card key={article.id} className="shadow-md hover:shadow-xl transition-shadow duration-300 overflow-hidden">
                                <div className="flex flex-col md:flex-row">
                                    <div className="md:w-1/3 h-64 md:h-auto relative">
                                        <img src={article.imageUrl} alt={article.title} className="w-full h-full object-cover" />
                                    </div>
                                    <CardContent className="md:w-2/3 p-8 flex flex-col justify-center">
                                        <div className="mb-2">
                                            <span className="bg-yellow-100 text-yellow-800 text-xs font-bold px-2 py-1 rounded uppercase tracking-wide">
                                                {article.role}
                                            </span>
                                            <span className="text-gray-500 text-xs ml-3">{article.date}</span>
                                        </div>
                                        <h3 className="text-2xl font-bold font-display text-gray-900 mb-3">{article.title}</h3>
                                        <p className="text-gray-600 mb-4 flex-grow">{article.summary}</p>
                                        <div className="text-sm font-semibold text-gray-800">
                                            Featuring: <span className="text-yellow-700">{article.author}</span>
                                        </div>
                                        {/* In a real app, this would link to a full article detail page */}
                                        {/* <Link to={`/exclusive/${article.id}`} className="mt-4 text-blue-600 font-semibold hover:underline">Read Full Interview</Link> */}
                                    </CardContent>
                                </div>
                            </Card>
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-12">
                        <p className="text-gray-500">No exclusive content available at the moment.</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ExclusivePage;
