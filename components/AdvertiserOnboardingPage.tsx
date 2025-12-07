
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from './ui/Card';
import Button from './ui/Button';
import Input from './ui/Input';
import { submitAdvertiserRequest, PromoCode } from '../services/api';
import MegaphoneIcon from './icons/MegaphoneIcon';
import UserIcon from './icons/UserIcon';
import MailIcon from './icons/MailIcon';
import PhoneIcon from './icons/PhoneIcon';
import Spinner from './ui/Spinner';
import CheckCircleIcon from './icons/CheckCircleIcon';
import BuildingIcon from './icons/BuildingIcon';
import PromoCodeInput from './ui/PromoCodeInput';
import { AdvertiserValueInfographic } from './ui/Infographics';

const AdvertiserOnboardingPage: React.FC = () => {
    const navigate = useNavigate();
    const [companyName, setCompanyName] = useState('');
    const [contactName, setContactName] = useState('');
    const [email, setEmail] = useState('');
    const [phone, setPhone] = useState('');
    const [industry, setIndustry] = useState('');
    const [budgetRange, setBudgetRange] = useState('E1,000 - E5,000');
    const [interestedPlacements, setInterestedPlacements] = useState<string[]>([]);
    const [discount, setDiscount] = useState<PromoCode | null>(null);
    
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);

    const placementOptions = [
        'Homepage Banner',
        'Fixtures & Results',
        'Live Scoreboard',
        'News Articles',
        'Community Hub',
        'Full Site Takeover'
    ];

    const handleCheckboxChange = (option: string) => {
        setInterestedPlacements(prev => 
            prev.includes(option) ? prev.filter(item => item !== option) : [...prev, option]
        );
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            await submitAdvertiserRequest({
                companyName,
                contactName,
                email,
                phone,
                industry,
                budgetRange,
                interestedPlacements,
                promoCode: discount ? discount.code : undefined
            });
            setIsSuccess(true);
        } catch (error) {
            console.error(error);
            alert("Failed to submit request. Please try again.");
        } finally {
            setIsSubmitting(false);
        }
    };

    if (isSuccess) {
        return (
            <div className="bg-gray-50 min-h-screen flex items-center justify-center py-12 px-4">
                <Card className="max-w-md w-full text-center p-8">
                    <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-green-100 mb-6">
                        <CheckCircleIcon className="h-10 w-10 text-green-600" />
                    </div>
                    <h2 className="text-3xl font-display font-bold text-gray-900 mb-4">Request Sent!</h2>
                    <p className="text-gray-600 mb-8">
                        Thank you for your interest in advertising with Football Eswatini. Our sales team will review your request and contact you at <strong>{email}</strong> shortly with our media kit and availability.
                    </p>
                    <Button onClick={() => navigate('/')} className="w-full bg-primary text-white">
                        Back to Home
                    </Button>
                </Card>
            </div>
        );
    }

    return (
        <div className="bg-gray-50 min-h-screen py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-4xl mx-auto">
                <div className="text-center mb-12">
                    <MegaphoneIcon className="w-12 h-12 mx-auto text-yellow-600 mb-4" />
                    <h1 className="text-4xl font-display font-bold text-gray-900 mb-2">Advertiser Registration</h1>
                    <p className="text-lg text-gray-600">
                        Connect with thousands of passionate football fans. Tell us about your business goals.
                    </p>
                </div>

                {/* Infographic Placement */}
                <div className="mb-12 animate-fade-in">
                    <AdvertiserValueInfographic />
                </div>

                <Card className="shadow-xl">
                    <CardContent className="p-8">
                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Company Name</label>
                                    <Input icon={<BuildingIcon className="w-5 h-5 text-gray-400"/>} value={companyName} onChange={e => setCompanyName(e.target.value)} required placeholder="Business Name" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Industry</label>
                                    <Input value={industry} onChange={e => setIndustry(e.target.value)} required placeholder="e.g. Retail, Finance, Tech" />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Contact Person</label>
                                    <Input icon={<UserIcon className="w-5 h-5 text-gray-400"/>} value={contactName} onChange={e => setContactName(e.target.value)} required />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Monthly Budget Range</label>
                                    <select 
                                        value={budgetRange} 
                                        onChange={e => setBudgetRange(e.target.value)} 
                                        className="block w-full pl-3 pr-10 py-2.5 text-base border-gray-300 focus:outline-none focus:ring-primary-light focus:border-primary-light sm:text-sm rounded-md shadow-sm border"
                                    >
                                        <option>E500 - E1,000</option>
                                        <option>E1,000 - E5,000</option>
                                        <option>E5,000 - E10,000</option>
                                        <option>E10,000+</option>
                                    </select>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
                                    <Input icon={<MailIcon className="w-5 h-5 text-gray-400"/>} type="email" value={email} onChange={e => setEmail(e.target.value)} required />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
                                    <Input icon={<PhoneIcon className="w-5 h-5 text-gray-400"/>} type="tel" value={phone} onChange={e => setPhone(e.target.value)} required />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-3">Interested Placements (Select all that apply)</label>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    {placementOptions.map(option => (
                                        <label key={option} className={`flex items-center p-3 border rounded-md cursor-pointer transition-colors ${interestedPlacements.includes(option) ? 'bg-yellow-50 border-yellow-400' : 'hover:bg-gray-50'}`}>
                                            <input 
                                                type="checkbox" 
                                                checked={interestedPlacements.includes(option)} 
                                                onChange={() => handleCheckboxChange(option)}
                                                className="h-4 w-4 text-yellow-600 focus:ring-yellow-500 border-gray-300 rounded"
                                            />
                                            <span className="ml-3 text-sm font-medium text-gray-900">{option}</span>
                                        </label>
                                    ))}
                                </div>
                            </div>
                            
                            {/* Promo Code */}
                            <div>
                                <PromoCodeInput onApply={setDiscount} />
                                {discount && <p className="text-xs text-gray-500 mt-1">This discount will be applied to your quote.</p>}
                            </div>

                            <div className="pt-4 border-t border-gray-200">
                                <Button type="submit" disabled={isSubmitting} className="w-full bg-yellow-500 hover:bg-yellow-600 text-black font-bold h-11 text-base shadow-md">
                                    {isSubmitting ? <Spinner className="w-5 h-5 border-2 border-black" /> : 'Submit Inquiry'}
                                </Button>
                                <p className="text-xs text-center text-gray-500 mt-4">
                                    No payment required now. Submitting this form starts the consultation process.
                                </p>
                            </div>
                        </form>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
};

export default AdvertiserOnboardingPage;
