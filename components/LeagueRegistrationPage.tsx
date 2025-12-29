
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from './ui/Card';
import Button from './ui/Button';
import Input from './ui/Input';
import { useAuth } from '../contexts/AuthContext';
import { db } from '../services/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import TrophyIcon from './icons/TrophyIcon';
import UserIcon from './icons/UserIcon';
import MailIcon from './icons/MailIcon';
import GlobeIcon from './icons/GlobeIcon';
import Spinner from './ui/Spinner';
import CheckCircleIcon from './icons/CheckCircleIcon';

const LeagueRegistrationPage: React.FC = () => {
    const { user, isLoggedIn, openAuthModal, signup } = useAuth();
    const navigate = useNavigate();
    
    const [leagueName, setLeagueName] = useState('');
    const [region, setRegion] = useState('Hhohho');
    const [managerName, setManagerName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [description, setDescription] = useState('');
    
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setIsSubmitting(true);

        try {
            let userId = user?.id;
            
            // 1. Handle Account Creation if not logged in
            if (!isLoggedIn) {
                if (!password) {
                    throw new Error("Password is required to create a manager account.");
                }
                try {
                    // This is a simplified signup for the manager
                    // In real app, we might want a specific signup flow
                    const userCredential = await signup({ name: managerName, email, password });
                    // signup automatically updates context and returns void usually
                    // we need to wait for the user to be available
                } catch (err: any) {
                    throw new Error(err.message || "Failed to create account.");
                }
            }

            // 2. Submit League Request
            await addDoc(collection(db, 'leagueRequests'), {
                leagueName,
                region,
                managerName: isLoggedIn ? user?.name : managerName,
                managerEmail: isLoggedIn ? user?.email : email,
                managerId: user?.id || 'new_user',
                description,
                status: 'pending',
                submittedAt: serverTimestamp()
            });

            setIsSuccess(true);
        } catch (err: any) {
            setError(err.message || "An error occurred.");
        } finally {
            setIsSubmitting(false);
        }
    };

    if (isSuccess) {
        return (
            <div className="bg-gray-50 min-h-screen flex items-center justify-center py-12 px-4">
                <Card className="max-w-md w-full text-center p-8">
                    <CheckCircleIcon className="h-16 w-16 text-green-500 mx-auto mb-6" />
                    <h2 className="text-3xl font-display font-bold text-gray-900 mb-4">League Request Sent!</h2>
                    <p className="text-gray-600 mb-8">
                        Your request to create the <strong>{leagueName}</strong> has been submitted. Our administrators will verify your details and setup your management portal.
                    </p>
                    <Button onClick={() => navigate('/regional')} className="w-full bg-primary text-white">
                        Back to Regional Hub
                    </Button>
                </Card>
            </div>
        );
    }

    return (
        <div className="bg-gray-50 min-h-screen py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-3xl mx-auto">
                <div className="text-center mb-12">
                    <TrophyIcon className="w-12 h-12 mx-auto text-primary mb-4" />
                    <h1 className="text-4xl font-display font-bold text-gray-900 mb-2">Register New League</h1>
                    <p className="text-lg text-gray-600">
                        Become a League Manager and digitize your local football competition.
                    </p>
                </div>

                <Card className="shadow-xl">
                    <CardContent className="p-8">
                        <form onSubmit={handleSubmit} className="space-y-6">
                            {error && <div className="p-3 bg-red-100 text-red-700 rounded-md text-sm">{error}</div>}
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-1">League Name</label>
                                    <Input value={leagueName} onChange={e => setLeagueName(e.target.value)} required placeholder="e.g. Malkerns Under-15 League" />
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-1">Region</label>
                                    <select 
                                        value={region} 
                                        onChange={e => setRegion(e.target.value)}
                                        className="block w-full border border-gray-300 rounded-md shadow-sm py-2.5 px-3 focus:ring-blue-500 focus:border-blue-500 sm:text-sm h-[42px]"
                                    >
                                        <option>Hhohho</option>
                                        <option>Manzini</option>
                                        <option>Lubombo</option>
                                        <option>Shiselweni</option>
                                    </select>
                                </div>
                            </div>

                            {!isLoggedIn && (
                                <div className="space-y-6 pt-4 border-t border-gray-100">
                                    <h3 className="font-bold text-gray-800">Manager Account Info</h3>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div>
                                            <label className="block text-sm font-bold text-gray-700 mb-1">Full Name</label>
                                            <Input icon={<UserIcon className="w-5 h-5 text-gray-400"/>} value={managerName} onChange={e => setManagerName(e.target.value)} required />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-bold text-gray-700 mb-1">Email Address</label>
                                            <Input icon={<MailIcon className="w-5 h-5 text-gray-400"/>} type="email" value={email} onChange={e => setEmail(e.target.value)} required />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-bold text-gray-700 mb-1">Set Password</label>
                                        <Input type="password" value={password} onChange={e => setPassword(e.target.value)} required />
                                        <p className="text-xs text-gray-400 mt-1">This will be your login for the League Management Portal.</p>
                                    </div>
                                </div>
                            )}

                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-1">League Description / Purpose</label>
                                <textarea 
                                    rows={4} 
                                    value={description} 
                                    onChange={e => setDescription(e.target.value)} 
                                    className="block w-full border border-gray-300 rounded-md shadow-sm py-2.5 px-3 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                                    placeholder="Briefly describe the competition format and teams involved..."
                                    required
                                />
                            </div>

                            <div className="pt-4">
                                <Button type="submit" disabled={isSubmitting} className="w-full bg-primary text-white h-12 text-lg shadow-lg font-bold">
                                    {isSubmitting ? <Spinner className="w-6 h-6 border-2" /> : 'Submit Request'}
                                </Button>
                                <p className="text-xs text-center text-gray-400 mt-4">
                                    Our team will review your application and create the digital competition structure for you.
                                </p>
                            </div>
                        </form>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
};

export default LeagueRegistrationPage;
