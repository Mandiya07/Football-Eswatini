
import React from 'react';
import { YouthArticle } from '../data/youth';
import { Card, CardContent } from './ui/Card';
import FileTextIcon from './icons/FileTextIcon';

interface YouthArticleSectionProps {
    articles: YouthArticle[];
}

const YouthArticleSection: React.FC<YouthArticleSectionProps> = ({ articles }) => {
    if (!articles || articles.length === 0) return null;

    return (
        <section className="mb-16">
            <div className="flex items-center gap-3 mb-6">
                <FileTextIcon className="w-7 h-7 text-blue-600" />
                <h3 className="text-2xl font-bold font-display text-blue-900">Latest News & Updates</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {articles.map(article => (
                    <Card key={article.id} className="flex flex-col h-full transition-shadow hover:shadow-lg">
                        {article.imageUrl && (
                            <div className="h-48 overflow-hidden">
                                <img src={article.imageUrl} alt={article.title} className="w-full h-full object-cover transition-transform hover:scale-105 duration-500" />
                            </div>
                        )}
                        <CardContent className="p-6 flex flex-col flex-grow">
                            <div className="mb-2 text-xs font-semibold text-gray-500 uppercase tracking-wide">{article.date}</div>
                            <h4 className="text-xl font-bold font-display mb-3 text-gray-800">{article.title}</h4>
                            <p className="text-gray-600 text-sm mb-4 line-clamp-3">{article.summary}</p>
                            <details className="mt-auto pt-4 border-t border-gray-100">
                                <summary className="text-blue-600 font-semibold text-sm cursor-pointer hover:underline">Read Full Story</summary>
                                <div className="mt-3 text-gray-700 text-sm whitespace-pre-wrap">
                                    {article.content}
                                </div>
                            </details>
                        </CardContent>
                    </Card>
                ))}
            </div>
        </section>
    );
};

export default YouthArticleSection;
