
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from './ui/Card';
import Button from './ui/Button';
import Input from './ui/Input';
import { submitSponsorRequest, PromoCode } from '../services/api';
import BriefcaseIcon from './icons/BriefcaseIcon';
import UserIcon from './icons/UserIcon';
import MailIcon from './icons/MailIcon';
import PhoneIcon from './icons/PhoneIcon';
import Spinner from './ui/Spinner';
import CheckCircleIcon from './icons/CheckCircleIcon';
import BuildingIcon from './icons/BuildingIcon';
import PromoCodeInput from './ui/PromoCodeInput';
import { SponsorEcosystemInfographic } from './ui/Infographics';

const SponsorOnboardingPage: React.FC = () => {
    const navigate = useNavigate();
    const [brandName, setBrandName] = useState('');
    const [contactName, setContactName] = useState('');
    const [email, setEmail] = useState('');
    const [phone, setPhone] = useState('');
    const [sponsorshipTier, setSponsorshipTier] = useState('Silver (E20,000/yr)');
    const [goals, setGoals] = useState('');
    const [discount, setDiscount] = useState<PromoCode | null>(null);
    
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            await submitSponsorRequest({
                brandName,
                contactName,
                email,
                phone,
                sponsorshipTier,
                goals,
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
                    <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-blue-100 mb-6">
                        <CheckCircleIcon className="h-10 w-10 text-blue-600" />
                    </div>
                    <h2 className="text-3xl font-display font-bold text-gray-900 mb-4">Inquiry Received</h2>
                    <p className="text-gray-600 mb-8">
                        Thank you for your interest in partnering with Football Eswatini. We are excited about the possibility of building a legacy together. Our partnership director will reach out to you shortly.
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
            <div className="max-w-5xl mx-auto">
                <div className="text-center mb-12">
                    <BriefcaseIcon className="w-12 h-12 mx-auto text-green-700 mb-4" />
                    <h1 className="text-4xl font-display font-bold text-gray-900 mb-2">Become a Partner</h1>
                    <p className="text-lg text-gray-600">
                        Align your brand with the passion of Eswatini football. Let's create a tailored sponsorship package.
                    </p>
                </div>

                {/* Infographic Placement */}
                <div className="mb-12 animate-fade-in">
                    <SponsorEcosystemInfographic />
                </div>

                <Card className="shadow-xl max-w-3xl mx-auto">
                    <CardContent className="p-8">
                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Brand / Organization Name</label>
                                    <Input icon={<BuildingIcon className="w-5 h-5 text-gray-400"/>} value={brandName} onChange={e => setBrandName(e.target.value)} required />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Primary Interest Level</label>
                                    <select 
                                        value={sponsorshipTier} 
                                        onChange={e => setSponsorshipTier(e.target.value)} 
                                        className="block w-full pl-3 pr-10 py-2.5 text-base border-gray-300 focus:outline-none focus:ring-primary-light focus:border-primary-light sm:text-sm rounded-md shadow-sm border"
                                    >
                                        <option>Bronze (E10,000/yr)</option>
                                        <option>Silver (E20,000/yr)</option>
                                        <option>Gold (E35,000/yr)</option>
                                        <option>Platinum (E60,000/yr)</option>
                                        <option>Custom / Not Sure</option>
                                    </select>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Marketing Contact Name</label>
                                    <Input icon={<UserIcon className="w-5 h-5 text-gray-400"/>} value={contactName} onChange={e => setContactName(e.target.value)} required />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
                                    <Input icon={<MailIcon className="w-5 h-5 text-gray-400"/>} type="email" value={email} onChange={e => setEmail(e.target.value)} required />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
                                <Input icon={<PhoneIcon className="w-5 h-5 text-gray-400"/>} type="tel" value={phone} onChange={e => setPhone(e.target.value)} required />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Sponsorship Goals (Optional)</label>
                                <textarea 
                                    rows={4} 
                                    value={goals} 
                                    onChange={e => setGoals(e.target.value)} 
                                    className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm"
                                    placeholder="Tell us what you hope to achieve (e.g. Brand Awareness, Youth Development CSR, Product Sales...)"
                                />
                            </div>
                            
                            {/* Promo Code */}
                            <div>
                                <PromoCodeInput onApply={setDiscount} />
                                {discount && <p className="text-xs text-gray-500 mt-1">Code applied to sponsorship proposal.</p>}
                            </div>

                            <div className="pt-4 border-t border-gray-200">
                                <Button type="submit" disabled={isSubmitting} className="w-full bg-green-700 hover:bg-green-800 text-white font-bold h-11 text-base shadow-md">
                                    {isSubmitting ? <Spinner className="w-5 h-5 border-2" /> : 'Request Partnership Proposal'}
                                </Button>
                            </div>
                        </form>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
};

export default SponsorOnboardingPage;
