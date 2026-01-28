
import React, { useState, useEffect } from 'react';
import { fetchSponsorRequests, fetchAdvertiserRequests, handleFirestoreError, SponsorRequest, AdvertiserRequest } from '../../services/api';
import { Card, CardContent } from '../ui/Card';
import Spinner from '../ui/Spinner';
import BriefcaseIcon from '../icons/BriefcaseIcon';
import MegaphoneIcon from '../icons/MegaphoneIcon';
import MailIcon from '../icons/MailIcon';
import PhoneIcon from '../icons/PhoneIcon';
import CheckCircleIcon from '../icons/CheckCircleIcon';

const InquiryManagement: React.FC = () => {
    const [sponsors, setSponsors] = useState<SponsorRequest[]>([]);
    const [advertisers, setAdvertisers] = useState<AdvertiserRequest[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'sponsors' | 'advertisers'>('sponsors');

    const loadData = async () => {
        setLoading(true);
        try {
            const [sponData, adData] = await Promise.all([
                fetchSponsorRequests(),
                fetchAdvertiserRequests()
            ]);
            setSponsors(sponData.sort((a,b) => (b.submittedAt?.seconds || 0) - (a.submittedAt?.seconds || 0)));
            setAdvertisers(adData.sort((a,b) => (b.submittedAt?.seconds || 0) - (a.submittedAt?.seconds || 0)));
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
                <div className="flex justify-between items-center mb-6">
                    <div>
                        <h3 className="text-2xl font-bold font-display">Partnership Inquiries</h3>
                        <p className="text-sm text-gray-500">Track paid and pending requests from corporate partners.</p>
                    </div>
                    <div className="flex bg-gray-100 p-1 rounded-lg">
                        <button 
                            onClick={() => setActiveTab('sponsors')}
                            className={`px-4 py-2 text-xs font-black uppercase tracking-widest rounded-md transition-all ${activeTab === 'sponsors' ? 'bg-white shadow text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
                        >
                            Sponsors ({sponsors.length})
                        </button>
                        <button 
                            onClick={() => setActiveTab('advertisers')}
                            className={`px-4 py-2 text-xs font-black uppercase tracking-widest rounded-md transition-all ${activeTab === 'advertisers' ? 'bg-white shadow text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
                        >
                            Ads ({advertisers.length})
                        </button>
                    </div>
                </div>

                <div className="space-y-4">
                    {activeTab === 'sponsors' ? (
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
                    ) : (
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
                </div>
            </CardContent>
        </Card>
    );
};

export default InquiryManagement;
