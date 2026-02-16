
import React from 'react';
import { Card, CardContent } from './ui/Card';
import Button from './ui/Button';
import ShieldIcon from './icons/ShieldIcon';
import MegaphoneIcon from './icons/MegaphoneIcon';
import BriefcaseIcon from './icons/BriefcaseIcon';
import CheckCircleIcon from './icons/CheckCircleIcon';
import { Link } from 'react-router-dom';

const PricingCard: React.FC<{
    title: string;
    price: string;
    features: string[];
    isPopular?: boolean;
    color: string;
    extraAction?: React.ReactNode;
}> = ({ title, price, features, isPopular, color, extraAction }) => (
    <div className={`relative flex flex-col p-6 bg-white border rounded-xl shadow-sm ${isPopular ? 'border-2 border-yellow-400 ring-4 ring-yellow-50 scale-105 z-10' : 'border-gray-200'}`}>
        {isPopular && (
            <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-yellow-400 text-yellow-900 text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wide">
                Most Popular
            </div>
        )}
        <div className="mb-4">
            <h3 className={`text-lg font-bold ${color} uppercase tracking-wider`}>{title}</h3>
            <div className="mt-2 flex items-baseline text-gray-900">
                <span className="text-3xl font-extrabold tracking-tight">{price}</span>
                {price !== 'Free' && <span className="ml-1 text-xl text-gray-500 font-medium">/mo</span>}
            </div>
        </div>
        <ul className="space-y-3 mb-6 flex-1">
            {features.map((feature, index) => (
                <li key={index} className="flex items-start">
                    <CheckCircleIcon className="w-5 h-5 text-green-500 flex-shrink-0 mr-2" />
                    <span className="text-sm text-gray-600">{feature}</span>
                </li>
            ))}
        </ul>
        {extraAction && <div className="mb-3">{extraAction}</div>}
        <div className="mt-auto">
            <Link to="/club-registration" className="block">
                <Button className={`w-full ${isPopular ? 'bg-primary text-white hover:bg-primary-dark' : 'bg-[#002B7F] text-white hover:bg-primary-dark'} h-11`}>
                    Get Started
                </Button>
            </Link>
        </div>
    </div>
);

const SectionHeader: React.FC<{ title: string; subtitle: string; Icon: any; color: string }> = ({ title, subtitle, Icon, color }) => (
    <div className="text-center mb-12">
        <div className={`inline-block p-4 rounded-full mb-4 ${color.replace('text-', 'bg-').replace('600', '100').replace('700', '100')}`}>
            <Icon className={`w-10 h-10 ${color}`} />
        </div>
        <h2 className="text-3xl md:text-4xl font-display font-extrabold text-gray-900 mb-4">{title}</h2>
        <p className="text-lg text-gray-600 max-w-3xl mx-auto">{subtitle}</p>
    </div>
);

const PartnershipPage: React.FC = () => {
    return (
        <div className="bg-gray-50 py-12">
            <div className="container mx-auto px-4 sm:px-6 lg:px-8 animate-fade-in mb-20">
                <div className="text-center max-w-4xl mx-auto">
                    <h1 className="text-4xl md:text-6xl font-display font-extrabold text-blue-900 mb-6">
                        Partnership & Opportunities Hub
                    </h1>
                    <p className="text-xl text-gray-600 leading-relaxed mb-8">
                        Welcome to the official partnership portal. Our digital ecosystem connects the entire Eswatini football community — from elite league clubs to grassroots communities.
                    </p>
                    <div className="flex flex-wrap justify-center gap-4">
                        <Button className="bg-primary text-white px-8 py-3 text-lg font-black uppercase tracking-tight shadow-xl" onClick={() => document.getElementById('clubs')?.scrollIntoView({ behavior: 'smooth' })}>
                            For Clubs
                        </Button>
                        <Button className="bg-[#002B7F] text-white px-8 py-3 text-lg font-black uppercase tracking-tight shadow-xl hover:bg-primary-dark" onClick={() => document.getElementById('advertisers')?.scrollIntoView({ behavior: 'smooth' })}>
                            For Advertisers
                        </Button>
                        <Button className="bg-[#002B7F] text-white px-8 py-3 text-lg font-black uppercase tracking-tight shadow-xl hover:bg-primary-dark" onClick={() => document.getElementById('sponsors')?.scrollIntoView({ behavior: 'smooth' })}>
                            For Sponsors
                        </Button>
                    </div>
                </div>
            </div>

            <div id="clubs" className="container mx-auto px-4 sm:px-6 lg:px-8 py-20 border-t border-gray-200">
                <SectionHeader 
                    title="For Teams & Clubs" 
                    subtitle="Your Club. Your Identity. Your Digital Home. Every club in Eswatini now has access to a professional digital footprint."
                    Icon={ShieldIcon}
                    color="text-blue-600"
                />
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <PricingCard 
                        title="Basic" 
                        price="Free" 
                        color="text-gray-700"
                        features={["Full Club Profile Page", "Automatic Fixtures & Logs", "Basic Squad List", "Standard Support"]} 
                    />
                    <PricingCard 
                        title="Professional" 
                        price="E120" 
                        color="text-blue-600"
                        isPopular={true}
                        features={["All Basic Features", "Club Admin Portal Access", "Submit Scores & News", "Photo Galleries", "Enhanced Player Stats"]} 
                    />
                    <PricingCard 
                        title="Elite" 
                        price="E250" 
                        color="text-purple-600"
                        features={["All Professional Features", "Merchandise Store Listing", "Video Hub Integration", "Sponsor Banner Spaces", "Priority Support"]} 
                    />
                    <PricingCard 
                        title="Enterprise" 
                        price="E350" 
                        color="text-gray-900"
                        features={["All Elite Features", "Branded Club Hub (Ad-free, Club Colors)", "Premium Analytics (Sponsorship & Scouting)", "Dedicated Account Manager"]} 
                        extraAction={
                            <Link to="/branded-example" className="block w-full text-center text-xs font-bold text-blue-600 hover:underline py-1">
                                View Live Example
                            </Link>
                        }
                    />
                </div>
            </div>

            <div id="advertisers" className="bg-white py-20 border-y border-gray-200">
                <div className="container mx-auto px-4 sm:px-6 lg:px-8">
                    <SectionHeader 
                        title="For Advertisers" 
                        subtitle="Reach the Most Passionate Audience. Football fans are active digital consumers. Place your ads in high-traffic zones."
                        Icon={MegaphoneIcon}
                        color="text-yellow-600"
                    />

                    <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-8">
                        <Card className="shadow-lg border-t-4 border-yellow-500">
                            <CardContent className="p-8">
                                <h3 className="text-xl font-bold mb-6 text-gray-900">Ad Placement Options</h3>
                                <ul className="space-y-3">
                                    {["Homepage Banner (High Visibility)", "Fixtures & Results Banner (Top Performing)", "Live Scoreboard Integration", "News Article Contextual Ads", "Community Hub & Directory Listings"].map((item, i) => (
                                        <li key={i} className="flex items-center gap-3">
                                            <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                                            <span className="text-gray-700">{item}</span>
                                        </li>
                                    ))}
                                </ul>
                            </CardContent>
                        </Card>

                        <Card className="shadow-lg border-t-4 border-yellow-500">
                            <CardContent className="p-8">
                                <h3 className="text-xl font-bold mb-6 text-gray-900">Rate Card</h3>
                                <div className="space-y-4">
                                    {[
                                        { loc: "Homepage Banner", price: "E1,200/month" },
                                        { loc: "Fixtures Page Banner", price: "E1,500/month" },
                                        { loc: "Article Banners", price: "E800/month" },
                                        { loc: "Community Hub Ads", price: "E600/month" },
                                        { loc: "Full Site Takeover", price: "E2,000/day" },
                                    ].map((rate, i) => (
                                        <div key={i} className="flex justify-between items-center border-b border-gray-100 pb-2 last:border-0">
                                            <span className="font-medium text-gray-600">{rate.loc}</span>
                                            <span className="font-bold text-gray-900">{rate.price}</span>
                                        </div>
                                    ))}
                                </div>
                                <div className="mt-6 pt-4 text-center">
                                    <Link to="/advertiser-onboarding">
                                        <Button className="w-full bg-[#002B7F] text-white hover:bg-primary-dark font-black uppercase h-12 shadow-lg">Request Rate Card</Button>
                                    </Link>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>

            <div id="sponsors" className="container mx-auto px-4 sm:px-6 lg:px-8 py-20">
                <SectionHeader 
                    title="For Sponsors" 
                    subtitle="Long-Term Brand Partnerships That Build Legacy. Gain full brand alignment with the football community."
                    Icon={BriefcaseIcon}
                    color="text-green-700"
                />

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
                    {[
                        { title: "Bronze", price: "E10,000", period: "/year", desc: "Branding within one major section.", color: "bg-orange-50 text-orange-900 border-orange-200" },
                        { title: "Silver", price: "E20,000", period: "/year", desc: "Section branding + naming rights.", color: "bg-gray-50 text-gray-900 border-gray-300" },
                        { title: "Gold", price: "E35,000", period: "/year", desc: "Title features + widespread visibility.", color: "bg-yellow-50 text-yellow-900 border-yellow-300" },
                        { title: "Platinum", price: "E60,000", period: "/year", desc: "Total ecosystem brand integration.", color: "bg-blue-50 text-blue-900 border-blue-200" },
                    ].map((pkg, i) => (
                        <Card key={i} className={`text-center transition-transform hover:-translate-y-1 ${pkg.color} border-2`}>
                            <CardContent className="p-8 flex flex-col h-full">
                                <h3 className="text-2xl font-bold font-display mb-2">{pkg.title}</h3>
                                <div className="text-3xl font-extrabold mb-4">{pkg.price}<span className="text-base font-normal opacity-75">{pkg.period}</span></div>
                                <p className="text-sm opacity-90 flex-grow">{pkg.desc}</p>
                                <Link to="/sponsor-onboarding" className="block w-full mt-auto">
                                    <Button className="w-full bg-[#002B7F] text-white hover:bg-primary-dark font-black uppercase h-10 mt-4 shadow-md">Inquire</Button>
                                </Link>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default PartnershipPage;
