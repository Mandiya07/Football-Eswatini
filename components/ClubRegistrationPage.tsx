
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from './ui/Card';
import Button from './ui/Button';
import Input from './ui/Input';
import { useAuth } from '../contexts/AuthContext';
import { fetchAllCompetitions, fetchCategories, submitClubRequest } from '../services/api';
import ShieldIcon from './icons/ShieldIcon';
import UserIcon from './icons/UserIcon';
import MailIcon from './icons/MailIcon';
import PhoneIcon from './icons/PhoneIcon';
import LockIcon from './icons/LockIcon';
import Spinner from './ui/Spinner';
import CheckCircleIcon from './icons/CheckCircleIcon';

const ClubRegistrationPage: React.FC = () => {
    const { signup, user } = useAuth();
    const navigate = useNavigate();
    const [allTeams, setAllTeams] = useState<string[]>([]);
    
    // Form State
    const [clubName, setClubName] = useState('');
    const [repName, setRepName] = useState('');
    const [email, setEmail] = useState('');
    const [phone, setPhone] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    
    const [error, setError] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);

    const tiers = [
        { name: 'Basic', price: 'Free', features: 'Public Profile, Squad List, Fixtures & Results' },
        { name: 'Professional', price: 'E120/mo', features: 'Admin Portal Access, Post News, Update Scores' },
        { name: 'Elite', price: 'E250/mo', features: 'Merchandise Store, Video Hub Embedding, Sponsor Slots' },
        { name: 'Enterprise', price: 'E500/mo', features: 'Branded Club Hub (Ad-free), Sponsorship Analytics, Dedicated Manager' },
    ];

    useEffect(() => {
        const loadTeams = async () => {
            try {
                // Fetch Competitions and Categories to filter local teams
                const [competitionsData, categoriesData] = await Promise.all([
                    fetchAllCompetitions(),
                    fetchCategories()
                ]);

                // Helper to identify International categories
                const isIntlCategory = (catId: string) => {
                    const cat = categoriesData.find(c => c.id === catId);
                    const name = cat ? cat.name.toLowerCase() : catId.toLowerCase();
                    return name.includes('international') || name.includes('caf') || name.includes('uefa') || name.includes('fifa');
                };

                const localTeamNames = new Set<string>();
                const intlTeamNames = new Set<string>();

                Object.entries(competitionsData).forEach(([id, comp]) => {
                    const isIntl = comp.categoryId ? isIntlCategory(comp.categoryId) : false;
                    
                    if (isIntl) {
                        comp.teams?.forEach(t => intlTeamNames.add(t.name.trim()));
                    } else {
                        // Classify as Local: Premier, NFD, Regional, Women, Youth, Cups
                        comp.teams?.forEach(t => localTeamNames.add(t.name.trim()));
                    }
                });

                // Construct final list:
                // Include ALL local teams.
                // Exclude teams that are ONLY in international competitions (e.g. Manchester United, Cameroon)
                // but KEEP teams that are in both (e.g. Mbabane Swallows if they play CAF + Premier League)
                
                const filteredList = Array.from(localTeamNames).sort();
                
                setAllTeams(filteredList);
            } catch (err) {
                console.error("Error loading team list:", err);
            }
        };
        loadTeams();
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (password !== confirmPassword) {
            setError("Passwords do not match.");
            return;
        }
        if (password.length < 6) {
            setError("Password must be at least 6 characters.");
            return;
        }

        setIsSubmitting(true);

        try {
            // 1. Create User Account (if not logged in)
            if (!user) {
                try {
                    await signup({ name: repName, email, password });
                } catch (err: any) {
                    throw new Error(err.message || "Failed to create account.");
                }
            }

            await submitClubRequest({
                userId: user?.id || 'pending-auth', 
                clubName,
                repName,
                email,
                phone,
            });

            setIsSuccess(true);
            
        } catch (err: any) {
            console.error(err);
            setError(err.message || "An error occurred. Please try again.");
        } finally {
            setIsSubmitting(false);
        }
    };

    if (isSuccess) {
        return (
            <div className="bg-gray-50 min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
                <Card className="max-w-md w-full text-center p-8">
                    <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-green-100 mb-6">
                        <CheckCircleIcon className="h-10 w-10 text-green-600" />
                    </div>
                    <h2 className="text-3xl font-display font-bold text-gray-900 mb-4">Registration Received!</h2>
                    <p className="text-gray-600 mb-8">
                        Your request to manage <strong>{clubName}</strong> has been submitted successfully. 
                        Our administrators will review your details and verify your affiliation.
                        You will receive an email confirmation once your account is upgraded.
                    </p>
                    <Button onClick={() => navigate('/')} className="w-full bg-primary text-white">
                        Return to Home
                    </Button>
                </Card>
            </div>
        );
    }

    return (
        <div className="bg-gray-50 min-h-screen py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-4xl mx-auto">
                <div className="text-center mb-12">
                    <ShieldIcon className="w-12 h-12 mx-auto text-blue-600 mb-4" />
                    <h1 className="text-4xl font-display font-bold text-gray-900 mb-2">Club Official Registration</h1>
                    <p className="text-lg text-gray-600">
                        Join the platform to manage your club's profile, squad, and match data.
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {/* Benefits & Pricing Section */}
                    <div className="space-y-6">
                        <Card className="bg-blue-600 text-white border-none shadow-xl">
                            <CardContent className="p-8">
                                <h3 className="text-xl font-bold mb-4">Membership Tiers</h3>
                                <div className="space-y-4">
                                    {tiers.map((tier) => (
                                        <div key={tier.name} className="flex justify-between items-center border-b border-blue-500 pb-2 last:border-0">
                                            <div>
                                                <p className="font-bold text-base">{tier.name}</p>
                                                <p className="text-blue-100 text-xs">{tier.features}</p>
                                            </div>
                                            <div className="text-right pl-2">
                                                <span className="bg-white/20 px-2 py-1 rounded text-sm font-bold whitespace-nowrap">{tier.price}</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                                <p className="mt-6 text-xs text-blue-200">
                                    * You will be able to select your plan after your account is verified.
                                </p>
                            </CardContent>
                        </Card>
                        
                        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                            <h4 className="font-bold text-gray-800 mb-2">Verification Process</h4>
                            <p className="text-sm text-gray-600">
                                To maintain integrity, all club registrations are manually verified. We may contact you at the provided number to confirm your position within the club. Approval typically takes 24-48 hours.
                            </p>
                        </div>
                    </div>

                    {/* Registration Form */}
                    <Card className="shadow-lg">
                        <CardContent className="p-8">
                            <form onSubmit={handleSubmit} className="space-y-5">
                                {error && <div className="p-3 bg-red-100 text-red-700 rounded-md text-sm">{error}</div>}
                                
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Club Name</label>
                                    <div className="relative">
                                        <input 
                                            type="text" 
                                            list="team-names" 
                                            value={clubName} 
                                            onChange={e => setClubName(e.target.value)} 
                                            className="block w-full border border-gray-300 rounded-md shadow-sm py-2.5 px-3 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                                            placeholder="Select or type new club name..."
                                            required
                                        />
                                        <datalist id="team-names">
                                            {allTeams.map(name => <option key={name} value={name} />)}
                                        </datalist>
                                    </div>
                                    <p className="text-xs text-gray-500 mt-1">If your team is not listed, simply type the name above to register it.</p>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Representative Full Name</label>
                                    <Input icon={<UserIcon className="w-5 h-5 text-gray-400"/>} value={repName} onChange={e => setRepName(e.target.value)} required placeholder="e.g. John Dlamini (Chairman)" />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Official Email</label>
                                    <Input icon={<MailIcon className="w-5 h-5 text-gray-400"/>} type="email" value={email} onChange={e => setEmail(e.target.value)} required placeholder="admin@clubname.sz" />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Contact Phone</label>
                                    <Input icon={<PhoneIcon className="w-5 h-5 text-gray-400"/>} type="tel" value={phone} onChange={e => setPhone(e.target.value)} required placeholder="+268 7xxx xxxx" />
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                                        <Input icon={<LockIcon className="w-5 h-5 text-gray-400"/>} type="password" value={password} onChange={e => setPassword(e.target.value)} required placeholder="******" />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Confirm Password</label>
                                        <Input icon={<LockIcon className="w-5 h-5 text-gray-400"/>} type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} required placeholder="******" />
                                    </div>
                                </div>

                                <div className="pt-4">
                                    <Button type="submit" disabled={isSubmitting} className="w-full bg-blue-600 hover:bg-blue-700 text-white h-11 text-base shadow-md">
                                        {isSubmitting ? <Spinner className="w-5 h-5 border-2" /> : 'Submit Registration'}
                                    </Button>
                                    <p className="text-xs text-center text-gray-500 mt-4">
                                        By registering, you agree to our Terms of Service.
                                    </p>
                                </div>
                            </form>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
};

export default ClubRegistrationPage;
