import React, { useState, useEffect } from 'react';
import { db } from '../../services/firebase';
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc, query } from 'firebase/firestore';
import { NewsItem } from '../../data/news';
import { handleFirestoreError, OperationType } from '../../services/api';
import { Card, CardContent } from '../ui/Card';
import Button from '../ui/Button';
import Spinner from '../ui/Spinner';
import ConfirmationModal from '../ui/ConfirmationModal';
import PlusCircleIcon from '../icons/PlusCircleIcon';
import TrashIcon from '../icons/TrashIcon';
import PencilIcon from '../icons/PencilIcon';
import NewsFormModal from './NewsFormModal';

const NationalNewsManagement: React.FC = () => {
    const [news, setNews] = useState<NewsItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingArticle, setEditingArticle] = useState<NewsItem | null>(null);
    const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const fetchNews = async () => {
        setLoading(true);
        try {
            const newsCollection = collection(db, "news");
            const q = query(newsCollection);
            const querySnapshot = await getDocs(q);
            const newsItems: NewsItem[] = [];
            querySnapshot.forEach((doc) => {
                const data = doc.data();
                const cats = Array.isArray(data.category) ? data.category : [data.category];
                if (cats.includes('National')) {
                    newsItems.push({ id: doc.id, ...data } as NewsItem);
                }
            });
            // Sort on the client to avoid needing a Firestore index
            newsItems.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
            setNews(newsItems);
        } catch (error) {
            handleFirestoreError(error, OperationType.GET, 'news');
        } finally {
            setLoading(false);
        }
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

    const handleDelete = async () => {
        if (!confirmDeleteId) return;
        setIsSubmitting(true);
        try {
            await deleteDoc(doc(db, "news", confirmDeleteId));
            setConfirmDeleteId(null);
            fetchNews(); // Refresh list
        } catch (error) {
            handleFirestoreError(error, OperationType.DELETE, `news/${confirmDeleteId}`);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleSave = async (articleData: Omit<NewsItem, 'id'>, id?: string) => {
        setIsSubmitting(true);
        try {
            // Ensure category array contains 'National'
            const cats = Array.isArray(articleData.category) ? articleData.category : [articleData.category];
            if (!cats.includes('National')) {
                cats.push('National');
            }
            
            const updatedData = {
                ...articleData,
                category: cats
            };

            if (id) {
                // Update existing article
                const articleDoc = doc(db, "news", id);
                await updateDoc(articleDoc, updatedData);
            } else {
                // Create new article
                await addDoc(collection(db, "news"), updatedData);
            }
            setIsModalOpen(false);
            fetchNews(); // Refresh list
        } catch (error) {
            handleFirestoreError(error, OperationType.WRITE, id ? `news/${id}` : 'news');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <>
            <Card className="shadow-lg border border-slate-100 rounded-3xl overflow-hidden bg-white">
                <CardContent className="p-6">
                    <div className="flex justify-between items-center mb-6">
                        <div>
                            <h3 className="text-xl font-black text-slate-800">National Intel News</h3>
                            <p className="text-slate-500 text-xs">Articles here will display on the National page News panel.</p>
                        </div>
                        <Button onClick={handleAddNew} className="bg-primary text-white hover:bg-primary-dark inline-flex items-center gap-2">
                            <PlusCircleIcon className="w-4 h-4 text-white" /> Create Article
                        </Button>
                    </div>
                    
                    {loading ? <div className="flex justify-center py-8"><Spinner /></div> : (
                        <div className="space-y-3">
                            {news.length > 0 ? news.map(article => (
                                <div key={article.id} className="p-3 bg-white border border-slate-100 rounded-2xl flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 hover:shadow-sm transition-shadow">
                                    <div className="flex items-center gap-4">
                                        <img src={article.image || 'https://via.placeholder.com/150'} alt="" className="w-16 h-12 object-cover rounded-xl hidden sm:block border" />
                                        <div>
                                            <p className="font-bold text-slate-800 text-sm">{article.title}</p>
                                            <p className="text-[10px] text-gray-500 font-medium">{new Date(article.date).toLocaleDateString()} &bull; Categories: {Array.isArray(article.category) ? article.category.join(', ') : article.category}</p>
                                        </div>
                                    </div>
                                    <div className="flex-shrink-0 flex items-center gap-2 self-end sm:self-center">
                                        <Button onClick={() => handleEdit(article)} className="bg-blue-600 text-white h-8 w-8 p-0 flex items-center justify-center rounded-lg shadow-sm hover:bg-blue-700" aria-label={`Edit ${article.title}`}>
                                            <PencilIcon className="w-3.5 h-3.5 text-white" />
                                        </Button>
                                        <Button onClick={() => setConfirmDeleteId(article.id)} disabled={isSubmitting && confirmDeleteId === article.id} className="bg-red-600 text-white h-8 w-8 p-0 flex items-center justify-center rounded-lg shadow-sm hover:bg-red-700" aria-label={`Remove ${article.title}`}>
                                            {isSubmitting && confirmDeleteId === article.id ? <Spinner className="w-3 h-3 border-white border-2" /> : <TrashIcon className="w-3.5 h-3.5 text-white" />}
                                        </Button>
                                    </div>
                                </div>
                            )) : (
                                <p className="text-center text-gray-500 py-12 italic border-2 border-dashed rounded-2xl">No national news articles found. Create one to get started.</p>
                            )}
                        </div>
                    )}
                </CardContent>
            </Card>

            <ConfirmationModal 
                isOpen={!!confirmDeleteId}
                onClose={() => setConfirmDeleteId(null)}
                onConfirm={handleDelete}
                title="Delete Article"
                message="Are you sure you want to delete this national article? This action cannot be undone."
                confirmText="Delete"
                variant="danger"
            />

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

export default NationalNewsManagement;
