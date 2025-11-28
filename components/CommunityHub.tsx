
import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardContent } from './ui/Card';
import Button from './ui/Button';
import Spinner from './ui/Spinner';
import TrophyIcon from './icons/TrophyIcon';
import UsersIcon from './icons/UsersIcon';
import CalendarIcon from './icons/CalendarIcon';
import MapPinIcon from './icons/MapPinIcon';
import CheckCircleIcon from './icons/CheckCircleIcon';
import { CommunityEvent, fetchCommunityEvents, submitCommunityEvent, fetchNews } from '../services/api';
import StarIcon from './icons/StarIcon';
import PlusCircleIcon from './icons/PlusCircleIcon';
import InfoIcon from './icons/InfoIcon';
import { NewsItem } from '../data/news';
import { NewsCard } from './News';
import NewspaperIcon from './icons/NewspaperIcon';

const CommunityHub: React.FC = () => {
    const [activeTab, setActiveTab] = useState<'news' | 'results' | 'submit'>('news');
    const [events, setEvents] = useState<CommunityEvent[]>([]);
    const [communityNews, setCommunityNews] = useState<NewsItem[]>([]);
    const [loading, setLoading] = useState(true);
    
    // Form State
    const [formData, setFormData] = useState({
        title: '',
        eventType: 'Knockout' as CommunityEvent['eventType'],
        description: '',
        date: '',
        time: '',
        venue: '',
        organizer: '',
        contactName: '',
        contactPhone: '',
        contactEmail: '',
        prizes: '',
        fees: '',
        posterUrl: '' // In real app, this would be a file upload result
    });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitSuccess, setSubmitSuccess] = useState(false);

    useEffect(() => {
        const loadEvents = async () => {
            setLoading(true);
            try {
                const [eventsData, newsData] = await Promise.all([
                    fetchCommunityEvents(),
                    fetchNews()
                ]);
                setEvents(eventsData);

                // Filter news for Community Hub category
                const hubNews = newsData.filter(item => {
                    const cats = Array.isArray(item.category) ? item.category : [item.category];
                    return cats.includes('Community Football Hub');
                });
                setCommunityNews(hubNews);
            } catch (error) {
                console.error("Error loading community data:", error);
            } finally {
                setLoading(false);
            }
        };
        loadEvents();
    }, []);

    const featuredEvent = useMemo(() => {
        return events.find(e => e.isSpotlight) || events[0];
    }, [events]);

    const upcomingEvents = useMemo(() => {
        const today = new Date().toISOString().split('T')[0];
        return events.filter(e => e.date >= today && !e.resultsSummary).sort((a,b) => a.date.localeCompare(b.date));
    }, [events]);

    const pastEvents = useMemo(() => {
        return events.filter(e => e.resultsSummary).sort((a,b) => b.date.localeCompare(a.date));
    }, [events]);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            const reader = new FileReader();
            reader.onloadend = () => {
                if (typeof reader.result === 'string') {
                    setFormData(prev => ({ ...prev, posterUrl: reader.result as string }));
                }
            };
            reader.readAsDataURL(file);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            await submitCommunityEvent(formData);
            setSubmitSuccess(true);
            setFormData({
                title: '', eventType: 'Knockout', description: '', date: '', time: '', venue: '',
                organizer: '', contactName: '', contactPhone: '', contactEmail: '', prizes: '', fees: '', posterUrl: ''
            });
            setTimeout(() => setSubmitSuccess(false), 5000);
        } catch (error) {
            console.error(error);
            alert("Failed to submit event. Please try again.");
        } finally {
            setIsSubmitting(false);
        }
    };

    const inputClass = "block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm";

    return (
        <section className="mt-16 pt-12 border-t border-gray-200">
            <div className="text-center mb-10">
                <div className="inline-block p-3 bg-green-100 rounded-full mb-3">
                    <UsersIcon className="w-8 h-8 text-green-700" />
                </div>
                <h2 className="text-3xl md:text-4xl font-display font-extrabold text-green-900 mb-2">
                    Community Football Hub
                </h2>
                <p className="text-lg text-gray-600 max-w-3xl mx-auto">
                    Your Home for Local Tournaments, Knockouts, Festivals & Grassroots Football Activities Across Eswatini.
                </p>
            </div>

            {/* Navigation Tabs */}
            <div className="flex justify-center mb-8">
                <div className="bg-white p-1 rounded-lg shadow-sm border inline-flex">
                    <button onClick={() => setActiveTab('news')} className={`px-6 py-2 rounded-md text-sm font-bold transition-colors ${activeTab === 'news' ? 'bg-green-600 text-white shadow' : 'text-gray-600 hover:bg-gray-50'}`}>Latest News</button>
                    <button onClick={() => setActiveTab('results')} className={`px-6 py-2 rounded-md text-sm font-bold transition-colors ${activeTab === 'results' ? 'bg-green-600 text-white shadow' : 'text-gray-600 hover:bg-gray-50'}`}>Results & Scores</button>
                    <button onClick={() => setActiveTab('submit')} className={`px-6 py-2 rounded-md text-sm font-bold transition-colors ${activeTab === 'submit' ? 'bg-green-600 text-white shadow' : 'text-gray-600 hover:bg-gray-50'}`}>Submit Event</button>
                </div>
            </div>

            {/* CONTENT AREA */}
            <div className="max-w-6xl mx-auto">
                {activeTab === 'news' && (
                    <div className="space-y-12">
                        {/* Community News Articles */}
                        {communityNews.length > 0 && (
                            <div>
                                <h3 className="text-xl font-bold font-display mb-6 border-b pb-2 flex items-center gap-2">
                                    <NewspaperIcon className="w-5 h-5 text-green-600" /> Community Headlines
                                </h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                    {communityNews.map(item => (
                                        <NewsCard key={item.id} item={item} variant="compact" />
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Featured Spotlight */}
                        {featuredEvent && (
                            <Card className="shadow-lg border-l-4 border-green-500 overflow-hidden bg-gradient-to-r from-green-50 to-white">
                                <CardContent className="p-0 flex flex-col md:flex-row">
                                    <div className="md:w-1/3 bg-gray-200 h-64 md:h-auto relative">
                                        {featuredEvent.posterUrl ? (
                                            <img src={featuredEvent.posterUrl} alt={featuredEvent.title} className="w-full h-full object-cover" />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center text-gray-400">
                                                <TrophyIcon className="w-16 h-16" />
                                            </div>
                                        )}
                                        <div className="absolute top-2 left-2 bg-yellow-400 text-yellow-900 text-xs font-bold px-2 py-1 rounded shadow-sm flex items-center gap-1">
                                            <StarIcon className="w-3 h-3" /> SPOTLIGHT
                                        </div>
                                    </div>
                                    <div className="p-6 md:p-8 flex-1 flex flex-col justify-center">
                                        <div className="text-sm font-bold text-green-700 uppercase tracking-wide mb-1">{featuredEvent.eventType}</div>
                                        <h3 className="text-2xl md:text-3xl font-display font-bold text-gray-900 mb-3">{featuredEvent.title}</h3>
                                        <p className="text-gray-600 mb-4 line-clamp-3">{featuredEvent.description}</p>
                                        <div className="grid grid-cols-2 gap-4 text-sm text-gray-700 mb-6">
                                            <div className="flex items-center gap-2"><CalendarIcon className="w-4 h-4 text-gray-400" /> {featuredEvent.date} @ {featuredEvent.time}</div>
                                            <div className="flex items-center gap-2"><MapPinIcon className="w-4 h-4 text-gray-400" /> {featuredEvent.venue}</div>
                                        </div>
                                        {featuredEvent.contactPhone && (
                                            <div className="text-sm font-semibold text-gray-800">
                                                Organizer: <span className="text-green-600">{featuredEvent.organizer}</span> ({featuredEvent.contactPhone})
                                            </div>
                                        )}
                                    </div>
                                </CardContent>
                            </Card>
                        )}

                        {/* Upcoming Grid */}
                        <div>
                            <h3 className="text-xl font-bold font-display mb-6 border-b pb-2 flex items-center gap-2">
                                <CalendarIcon className="w-5 h-5 text-green-600" /> Upcoming Community Fixtures
                            </h3>
                            {loading ? <Spinner /> : upcomingEvents.length > 0 ? (
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                    {upcomingEvents.map(event => (
                                        <Card key={event.id} className="hover:shadow-md transition-all">
                                            <CardContent className="p-5">
                                                <div className="flex justify-between items-start mb-2">
                                                    <span className="bg-gray-100 text-gray-600 text-[10px] font-bold px-2 py-1 rounded uppercase">{event.eventType}</span>
                                                    <span className="text-xs text-gray-500">{event.date}</span>
                                                </div>
                                                <h4 className="font-bold text-lg mb-2 line-clamp-1">{event.title}</h4>
                                                <p className="text-sm text-gray-500 mb-3 flex items-center gap-1"><MapPinIcon className="w-3 h-3"/> {event.venue}</p>
                                                <p className="text-sm text-gray-600 line-clamp-2 mb-4">{event.description}</p>
                                                <div className="text-xs text-gray-500 border-t pt-2">
                                                    Contact: {event.contactName}
                                                </div>
                                            </CardContent>
                                        </Card>
                                    ))}
                                </div>
                            ) : (
                                <p className="text-center text-gray-500 py-8 bg-gray-50 rounded-lg">No upcoming events listed. Be the first to submit one!</p>
                            )}
                        </div>
                    </div>
                )}

                {activeTab === 'results' && (
                    <div className="space-y-6">
                        <div className="text-center mb-8">
                            <h3 className="text-2xl font-bold font-display text-gray-800">Community Results</h3>
                            <p className="text-gray-600">Scores and winners from recent local tournaments.</p>
                        </div>
                        {loading ? <Spinner /> : pastEvents.length > 0 ? (
                            <div className="space-y-4">
                                {pastEvents.map(event => (
                                    <Card key={event.id} className="border-l-4 border-green-600">
                                        <CardContent className="p-5">
                                            <div className="flex flex-col md:flex-row justify-between gap-4">
                                                <div>
                                                    <h4 className="font-bold text-lg text-gray-900">{event.title}</h4>
                                                    <div className="text-xs text-gray-500 mb-2">{event.date} &bull; {event.venue}</div>
                                                    <p className="text-gray-700 bg-gray-50 p-3 rounded text-sm">{event.resultsSummary}</p>
                                                </div>
                                                <div className="text-right flex-shrink-0">
                                                    <span className="bg-green-100 text-green-800 text-xs font-bold px-2 py-1 rounded">COMPLETED</span>
                                                </div>
                                            </div>
                                        </CardContent>
                                    </Card>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-12 bg-gray-50 rounded-lg border border-dashed border-gray-300">
                                <TrophyIcon className="w-12 h-12 mx-auto text-gray-300 mb-2" />
                                <p className="text-gray-500">No recent results available.</p>
                            </div>
                        )}
                    </div>
                )}

                {activeTab === 'submit' && (
                    <Card className="shadow-xl bg-white max-w-3xl mx-auto">
                        <CardContent className="p-8">
                            <div className="text-center mb-8">
                                <h3 className="text-2xl font-bold font-display text-green-800">Submit Your Event</h3>
                                <p className="text-gray-600">Give your tournament or activity national visibility. Submissions are reviewed before publishing.</p>
                            </div>

                            {submitSuccess ? (
                                <div className="bg-green-50 border border-green-200 rounded-lg p-6 text-center animate-fade-in">
                                    <CheckCircleIcon className="w-12 h-12 text-green-600 mx-auto mb-3" />
                                    <h4 className="text-lg font-bold text-green-800">Submission Received!</h4>
                                    <p className="text-green-700">Your event has been sent for review. Once approved, it will appear on the Community Hub.</p>
                                    <Button onClick={() => setSubmitSuccess(false)} className="mt-4 bg-green-600 text-white">Submit Another</Button>
                                </div>
                            ) : (
                                <form onSubmit={handleSubmit} className="space-y-6">
                                    <div className="bg-gray-50 p-4 rounded-lg border border-gray-100">
                                        <h4 className="font-bold text-sm text-gray-700 mb-3 uppercase tracking-wider">Event Details</h4>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div className="md:col-span-2">
                                                <label className="block text-xs font-bold text-gray-500 mb-1">Event Name *</label>
                                                <input name="title" value={formData.title} onChange={handleInputChange} required className={inputClass} placeholder="e.g. Mhlume Youth Cup" />
                                            </div>
                                            <div>
                                                <label className="block text-xs font-bold text-gray-500 mb-1">Event Type *</label>
                                                <select name="eventType" value={formData.eventType} onChange={handleInputChange} className={inputClass}>
                                                    <option>Knockout</option>
                                                    <option>League</option>
                                                    <option>Festival</option>
                                                    <option>Charity</option>
                                                    <option>Trial</option>
                                                    <option>Workshop</option>
                                                    <option>Other</option>
                                                </select>
                                            </div>
                                            <div>
                                                <label className="block text-xs font-bold text-gray-500 mb-1">Date *</label>
                                                <input type="date" name="date" value={formData.date} onChange={handleInputChange} required className={inputClass} />
                                            </div>
                                            <div>
                                                <label className="block text-xs font-bold text-gray-500 mb-1">Time *</label>
                                                <input type="time" name="time" value={formData.time} onChange={handleInputChange} required className={inputClass} />
                                            </div>
                                            <div>
                                                <label className="block text-xs font-bold text-gray-500 mb-1">Venue *</label>
                                                <input name="venue" value={formData.venue} onChange={handleInputChange} required className={inputClass} placeholder="e.g. Community Sports Ground" />
                                            </div>
                                            <div className="md:col-span-2">
                                                <label className="block text-xs font-bold text-gray-500 mb-1">Description *</label>
                                                <textarea name="description" value={formData.description} onChange={handleInputChange} required rows={3} className={inputClass} placeholder="Briefly describe the event format, teams involved, etc." />
                                            </div>
                                        </div>
                                    </div>

                                    <div className="bg-gray-50 p-4 rounded-lg border border-gray-100">
                                        <h4 className="font-bold text-sm text-gray-700 mb-3 uppercase tracking-wider">Organizer Contact</h4>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-xs font-bold text-gray-500 mb-1">Host Organization/Club</label>
                                                <input name="organizer" value={formData.organizer} onChange={handleInputChange} required className={inputClass} />
                                            </div>
                                            <div>
                                                <label className="block text-xs font-bold text-gray-500 mb-1">Contact Person Name</label>
                                                <input name="contactName" value={formData.contactName} onChange={handleInputChange} required className={inputClass} />
                                            </div>
                                            <div>
                                                <label className="block text-xs font-bold text-gray-500 mb-1">Phone Number</label>
                                                <input name="contactPhone" value={formData.contactPhone} onChange={handleInputChange} required className={inputClass} />
                                            </div>
                                            <div>
                                                <label className="block text-xs font-bold text-gray-500 mb-1">Email (Optional)</label>
                                                <input name="contactEmail" type="email" value={formData.contactEmail} onChange={handleInputChange} className={inputClass} />
                                            </div>
                                        </div>
                                    </div>

                                    <div className="bg-gray-50 p-4 rounded-lg border border-gray-100">
                                        <h4 className="font-bold text-sm text-gray-700 mb-3 uppercase tracking-wider">Extras</h4>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-xs font-bold text-gray-500 mb-1">Prizes / Awards</label>
                                                <input name="prizes" value={formData.prizes} onChange={handleInputChange} className={inputClass} placeholder="e.g. Trophy + E5000" />
                                            </div>
                                            <div>
                                                <label className="block text-xs font-bold text-gray-500 mb-1">Registration Fee</label>
                                                <input name="fees" value={formData.fees} onChange={handleInputChange} className={inputClass} placeholder="e.g. E500 per team" />
                                            </div>
                                            <div className="md:col-span-2">
                                                <label className="block text-xs font-bold text-gray-500 mb-1">Poster / Image Upload</label>
                                                <div className="flex items-center gap-3">
                                                    <input type="file" accept="image/*" onChange={handleFileChange} className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-green-50 file:text-green-700 hover:file:bg-green-100" />
                                                    {formData.posterUrl && <img src={formData.posterUrl} alt="Preview" className="h-12 w-12 object-cover rounded border" />}
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="text-right pt-2">
                                        <Button type="submit" disabled={isSubmitting} className="bg-green-600 text-white hover:bg-green-700 px-8 py-3 h-auto text-base shadow-md w-full sm:w-auto">
                                            {isSubmitting ? <Spinner className="w-5 h-5 border-2" /> : 'Submit Event for Review'}
                                        </Button>
                                    </div>
                                </form>
                            )}
                        </CardContent>
                    </Card>
                )}
            </div>
        </section>
    );
};

export default CommunityHub;
