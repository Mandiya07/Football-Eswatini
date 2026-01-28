
import React, { useState, useEffect } from 'react';
import { db } from '../../services/firebase';
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc, query, orderBy } from 'firebase/firestore';
import { NewsItem } from '../../data/news';
import { Card, CardContent } from '../ui/Card';
import Button from '../ui/Button';
import Spinner from '../ui/Spinner';
import PlusCircleIcon from '../icons/PlusCircleIcon';
import TrashIcon from '../icons/TrashIcon';
import PencilIcon from '../icons/PencilIcon';
import NewsFormModal from './NewsFormModal';

const NewsManagement: React.FC = () => {
    const [news, setNews] = useState<NewsItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingArticle, setEditingArticle] = useState<NewsItem | null>(null);

    const fetchNews = async () => {
        setLoading(true);
        const newsCollection = collection(db, "news");
        const q = query(newsCollection);
        const querySnapshot = await getDocs(q);
        const newsItems: NewsItem[] = [];
        querySnapshot.forEach((doc) => {
            newsItems.push({ id: doc.id, ...doc.data() } as NewsItem);
        });
        // Sort on the client to avoid needing a Firestore index
        newsItems.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        setNews(newsItems);
        setLoading(false);
    };

    useEffect(() => {
        fetchNews();
    }, []);

    const handleAddNew = () => {
        setEditingArticle(null);
        setIsModalOpen(true);
    };

    const handleEdit = (article: NewsItem) => {
        setEditingArticle(article);
        setIsModalOpen(true);
    };

    const handleDelete = async (articleId: string) => {
        if (window.confirm("Are you sure you want to delete this article? This action cannot be undone.")) {
            try {
                await deleteDoc(doc(db, "news", articleId));
                fetchNews(); // Refresh list
            } catch (error) {
                console.error("Error deleting article: ", error);
                alert("Failed to delete article.");
            }
        }
    };

    const handleSave = async (articleData: Omit<NewsItem, 'id'>, id?: string) => {
        try {
            if (id) {
                // Update existing article
                const articleDoc = doc(db, "news", id);
                await updateDoc(articleDoc, articleData);
            } else {
                // Create new article
                await addDoc(collection(db, "news"), {
                    ...articleData,
                });
            }
            setIsModalOpen(false);
            fetchNews(); // Refresh list
        } catch (error) {
            console.error("Error saving article: ", error);
            alert("Failed to save article.");
        }
    };

    return (
        <>
            <Card className="shadow-lg animate-fade-in">
                <CardContent className="p-6">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="text-2xl font-bold font-display">News Management</h3>
                        <Button onClick={handleAddNew} className="bg-primary text-white hover:bg-primary-dark focus:ring-primary-light inline-flex items-center gap-2">
                            <PlusCircleIcon className="w-5 h-5" /> Add Article
                        </Button>
                    </div>
                    
                    {loading ? <div className="flex justify-center py-8"><Spinner /></div> : (
                        <div className="space-y-3">
                            {news.length > 0 ? news.map(article => (
                                <div key={article.id} className="p-3 bg-white border rounded-lg flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                                    <div className="flex items-center gap-4">
                                        <img src={article.image} alt="" className="w-16 h-12 object-cover rounded-md hidden sm:block" />
                                        <div>
                                            <p className="font-semibold">{article.title}</p>
                                            <p className="text-xs text-gray-500">{new Date(article.date).toLocaleDateString()} &bull; {article.category}</p>
                                        </div>
                                    </div>
                                    <div className="flex-shrink-0 flex items-center gap-2 self-end sm:self-center">
                                        <Button onClick={() => handleEdit(article)} className="bg-blue-600 text-white h-8 w-8 p-0 flex items-center justify-center shadow-sm" aria-label={`Edit ${article.title}`}>
                                            <PencilIcon className="w-4 h-4 text-white" />
                                        </Button>
                                        <Button onClick={() => handleDelete(article.id)} className="bg-red-600 text-white h-8 w-8 p-0 flex items-center justify-center shadow-sm" aria-label={`Remove ${article.title}`}>
                                            <TrashIcon className="w-4 h-4 text-white" />
                                        </Button>
                                    </div>
                                </div>
                            )) : (
                                <p className="text-center text-gray-500 py-8">No news articles found. Add one to get started.</p>
                            )}
                        </div>
                    )}
                </CardContent>
            </Card>
            {isModalOpen && (
                <NewsFormModal
                    isOpen={isModalOpen}
                    onClose={() => setIsModalOpen(false)}
                    onSave={handleSave}
                    article={editingArticle}
                />
            )}
        </>
    );
};

export default NewsManagement;
