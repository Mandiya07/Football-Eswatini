
import React, { useState, useEffect } from 'react';
import { fetchSponsorRequests, fetchAdvertiserRequests, fetchContactInquiries, handleFirestoreError, SponsorRequest, AdvertiserRequest, ContactInquiry } from '../../services/api';
import { Card, CardContent } from '../ui/Card';
import Spinner from '../ui/Spinner';
import BriefcaseIcon from '../icons/BriefcaseIcon';
import MegaphoneIcon from '../icons/MegaphoneIcon';
import MailIcon from '../icons/MailIcon';
import PhoneIcon from '../icons/PhoneIcon';
import MessageSquareIcon from '../icons/MessageSquareIcon';
import UserIcon from '../icons/UserIcon';

const InquiryManagement: React.FC = () => {
    const [sponsors, setSponsors] = useState<SponsorRequest[]>([]);
    const [advertisers, setAdvertisers] = useState<AdvertiserRequest[]>([]);
    const [contacts, setContacts] = useState<ContactInquiry[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'sponsors' | 'advertisers' | 'general'>('sponsors');

    const loadData = async () => {
        setLoading(true);
        try {
            const [sponData, adData, contactData] = await Promise.all([
                fetchSponsorRequests(),
                fetchAdvertiserRequests(),
                fetchContactInquiries()
            ]);
            setSponsors(sponData.sort((a,b) => (b.submittedAt?.seconds || 0) - (a.submittedAt?.seconds || 0)));
            setAdvertisers(adData.sort((a,b) => (b.submittedAt?.seconds || 0) - (a.submittedAt?.seconds || 0)));
            setContacts(contactData);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadData();
    }, []);

    if (loading) return <div className="flex justify-center p-12"><Spinner /></div>;

    return (
        <Card className="shadow-lg animate-fade-in">
            <CardContent className="p-6">
                <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
                    <div>
                        <h3 className="text-2xl font-bold font-display">Inquiry Hub</h3>
                        <p className="text-sm text-gray-500">Track paid requests and general messages from the community.</p>
                    </div>
                    <div className="flex bg-gray-100 p-1 rounded-lg">
                        <button 
                            onClick={() => setActiveTab('sponsors')}
                            className={`px-4 py-2 text-[10px] font-black uppercase tracking-widest rounded-md transition-all ${activeTab === 'sponsors' ? 'bg-white shadow text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
                        >
                            Sponsors ({sponsors.length})
                        </button>
                        <button 
                            onClick={() => setActiveTab('advertisers')}
                            className={`px-4 py-2 text-[10px] font-black uppercase tracking-widest rounded-md transition-all ${activeTab === 'advertisers' ? 'bg-white shadow text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
                        >
                            Ads ({advertisers.length})
                        </button>
                        <button 
                            onClick={() => setActiveTab('general')}
                            className={`px-4 py-2 text-[10px] font-black uppercase tracking-widest rounded-md transition-all ${activeTab === 'general' ? 'bg-white shadow text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
                        >
                            General ({contacts.length})
                        </button>
                    </div>
                </div>

                <div className="space-y-4">
                    {activeTab === 'sponsors' && (
                        sponsors.length > 0 ? sponsors.map(s => (
                            <div key={s.id} className="p-5 border border-gray-100 bg-white rounded-2xl hover:shadow-md transition-shadow">
                                <div className="flex justify-between items-start mb-4">
                                    <div className="flex items-center gap-4">
                                        <div className="p-3 bg-blue-50 rounded-xl text-blue-600">
                                            <BriefcaseIcon className="w-6 h-6" />
                                        </div>
                                        <div>
                                            <h4 className="font-bold text-lg text-gray-900">{s.brandName}</h4>
                                            <p className="text-xs text-gray-500">{new Date(s.submittedAt?.seconds * 1000).toLocaleDateString()}</p>
                                        </div>
                                    </div>
                                    <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-widest ${s.status === 'paid' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                                        {s.status}
                                    </span>
                                </div>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm text-gray-600 mb-4">
                                    <div className="flex items-center gap-2 font-medium">
                                        <MailIcon className="w-4 h-4" /> {s.email}
                                    </div>
                                    <div className="flex items-center gap-2 font-medium">
                                        <PhoneIcon className="w-4 h-4" /> {s.phone}
                                    </div>
                                </div>
                                <div className="bg-gray-50 p-4 rounded-xl">
                                    <p className="text-xs font-black text-gray-400 uppercase mb-2 tracking-widest">Sponsorship Intent</p>
                                    <p className="text-sm font-bold text-gray-800">Tier: {s.sponsorshipTier}</p>
                                    <p className="text-sm text-gray-700 mt-1 italic">"{s.goals || 'No goals specified.'}"</p>
                                </div>
                                {s.paymentTransactionId && (
                                    <p className="mt-4 text-[10px] font-mono text-gray-400">Ref: {s.paymentTransactionId}</p>
                                )}
                            </div>
                        )) : <p className="text-center py-20 text-gray-400 italic">No sponsor inquiries yet.</p>
                    )}

                    {activeTab === 'advertisers' && (
                        advertisers.length > 0 ? advertisers.map(ad => (
                            <div key={ad.id} className="p-5 border border-gray-100 bg-white rounded-2xl hover:shadow-md transition-shadow">
                                <div className="flex justify-between items-start mb-4">
                                    <div className="flex items-center gap-4">
                                        <div className="p-3 bg-yellow-50 rounded-xl text-yellow-600">
                                            <MegaphoneIcon className="w-6 h-6" />
                                        </div>
                                        <div>
                                            <h4 className="font-bold text-lg text-gray-900">{ad.companyName}</h4>
                                            <p className="text-xs text-gray-500">{new Date(ad.submittedAt?.seconds * 1000).toLocaleDateString()}</p>
                                        </div>
                                    </div>
                                    <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-widest ${ad.status === 'paid' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                                        {ad.status}
                                    </span>
                                </div>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm text-gray-600 mb-4">
                                    <div className="flex items-center gap-2 font-medium">
                                        <MailIcon className="w-4 h-4" /> {ad.email}
                                    </div>
                                    <div className="flex items-center gap-2 font-medium">
                                        <PhoneIcon className="w-4 h-4" /> {ad.phone}
                                    </div>
                                </div>
                                <div className="bg-gray-50 p-4 rounded-xl">
                                    <p className="text-xs font-black text-gray-400 uppercase mb-2 tracking-widest">Ad Placement Request</p>
                                    <div className="flex flex-wrap gap-2">
                                        {ad.interestedPlacements?.map(p => (
                                            <span key={p} className="bg-white border px-2 py-0.5 rounded text-[10px] font-bold text-gray-700">{p}</span>
                                        ))}
                                    </div>
                                    <p className="text-sm text-gray-500 mt-2 font-medium">Budget: {ad.budgetRange}</p>
                                </div>
                            </div>
                        )) : <p className="text-center py-20 text-gray-400 italic">No advertiser inquiries yet.</p>
                    )}

                    {activeTab === 'general' && (
                        contacts.length > 0 ? contacts.map(c => (
                            <div key={c.id} className="p-5 border border-gray-100 bg-white rounded-2xl hover:shadow-md transition-shadow">
                                <div className="flex justify-between items-start mb-4">
                                    <div className="flex items-center gap-4">
                                        <div className="p-3 bg-indigo-50 rounded-xl text-indigo-600">
                                            <UserIcon className="w-6 h-6" />
                                        </div>
                                        <div>
                                            <h4 className="font-bold text-lg text-gray-900">{c.name}</h4>
                                            <p className="text-xs text-gray-500">{new Date(c.submittedAt?.seconds * 1000).toLocaleString()}</p>
                                        </div>
                                    </div>
                                    <span className="px-2 py-0.5 rounded bg-blue-100 text-blue-700 text-[9px] font-black uppercase tracking-widest">General</span>
                                </div>
                                <div className="mb-4">
                                    <p className="text-xs font-black text-gray-400 uppercase tracking-widest mb-1">Subject</p>
                                    <p className="font-bold text-gray-800">{c.subject}</p>
                                </div>
                                <div className="bg-gray-50 p-4 rounded-xl">
                                    <p className="text-xs font-black text-gray-400 uppercase mb-2 tracking-widest">Message</p>
                                    <p className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">"{c.message}"</p>
                                </div>
                                <div className="mt-4 pt-4 border-t border-gray-50 flex items-center gap-4">
                                    <a href={`mailto:${c.email}`} className="text-blue-600 text-xs font-bold hover:underline flex items-center gap-1.5">
                                        <MailIcon className="w-3.5 h-3.5"/> Reply to {c.email}
                                    </a>
                                </div>
                            </div>
                        )) : <p className="text-center py-20 text-gray-400 italic">No general inquiries found.</p>
                    )}
                </div>
            </CardContent>
        </Card>
    );
};

export default InquiryManagement;
