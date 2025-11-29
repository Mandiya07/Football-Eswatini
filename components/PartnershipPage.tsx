
import React from 'react';
import { Card, CardContent } from './ui/Card';
import Button from './ui/Button';
import ShieldIcon from './icons/ShieldIcon';
import MegaphoneIcon from './icons/MegaphoneIcon';
import BriefcaseIcon from './icons/BriefcaseIcon';
import CheckCircleIcon from './icons/CheckCircleIcon';
import GlobeIcon from './icons/GlobeIcon';
import MailIcon from './icons/MailIcon';
import StarIcon from './icons/StarIcon';

const PricingCard: React.FC<{
    title: string;
    price: string;
    features: string[];
    isPopular?: boolean;
    color: string;
}> = ({ title, price, features, isPopular, color }) => (
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
        <Button className={`w-full ${isPopular ? 'bg-primary text-white hover:bg-primary-dark' : 'bg-gray-100 text-gray-800 hover:bg-gray-200'}`}>
            Get Started
        </Button>
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
            {/* Hero Section */}
            <div className="container mx-auto px-4 sm:px-6 lg:px-8 animate-fade-in mb-20">
                <div className="text-center max-w-4xl mx-auto">
                    <h1 className="text-4xl md:text-6xl font-display font-extrabold text-blue-900 mb-6">
                        Partnership & Opportunities Hub
                    </h1>
                    <p className="text-xl text-gray-600 leading-relaxed mb-8">
                        Welcome to the official partnership portal. Our digital ecosystem connects the entire Eswatini football community — from elite league clubs to grassroots communities — through live scores, media, data, and interactive features.
                    </p>
                    <div className="flex flex-wrap justify-center gap-4">
                        <Button className="bg-primary text-white px-8 py-3 text-lg" onClick={() => document.getElementById('clubs')?.scrollIntoView({ behavior: 'smooth' })}>
                            For Clubs
                        </Button>
                        <Button className="bg-white text-primary border border-gray-300 px-8 py-3 text-lg hover:bg-gray-50" onClick={() => document.getElementById('advertisers')?.scrollIntoView({ behavior: 'smooth' })}>
                            For Advertisers
                        </Button>
                        <Button className="bg-white text-primary border border-gray-300 px-8 py-3 text-lg hover:bg-gray-50" onClick={() => document.getElementById('sponsors')?.scrollIntoView({ behavior: 'smooth' })}>
                            For Sponsors
                        </Button>
                    </div>
                </div>
            </div>

            {/* Overview Section */}
            <section className="bg-white py-16 border-y border-gray-200">
                <div className="container mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
                        {[
                            { label: "Active Users", value: "50k+", icon: "👥" },
                            { label: "Matches Covered", value: "200+", icon: "⚽" },
                            { label: "Social Reach", value: "120k", icon: "📱" },
                            { label: "Clubs Registered", value: "30+", icon: "🛡️" },
                        ].map((stat, idx) => (
                            <div key={idx} className="p-4">
                                <div className="text-4xl mb-2">{stat.icon}</div>
                                <div className="text-3xl font-bold text-gray-900 font-display">{stat.value}</div>
                                <div className="text-sm text-gray-500 uppercase tracking-wide font-semibold">{stat.label}</div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Teams & Clubs Section */}
            <div id="clubs" className="container mx-auto px-4 sm:px-6 lg:px-8 py-20">
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
                        price="E500" 
                        color="text-gray-900"
                        features={["All Elite Features", "Custom Microsite Domain", "Premium Analytics Dashboard", "Direct API Access", "Dedicated Account Manager"]} 
                    />
                </div>
            </div>

            {/* Advertisers Section */}
            <div id="advertisers" className="bg-gray-900 text-white py-20">
                <div className="container mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center mb-12">
                        <div className="inline-block p-4 bg-yellow-500/20 rounded-full mb-4">
                            <MegaphoneIcon className="w-10 h-10 text-yellow-400" />
                        </div>
                        <h2 className="text-3xl md:text-4xl font-display font-extrabold mb-4">Reach the Most Passionate Audience</h2>
                        <p className="text-lg text-gray-300 max-w-3xl mx-auto">
                            Football fans are the most active digital consumers. Our platform provides high-visibility advertising zones with excellent repeat exposure.
                        </p>
                    </div>

                    <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-8">
                        <Card className="bg-gray-800 border-gray-700 text-white">
                            <CardContent className="p-8">
                                <h3 className="text-xl font-bold mb-6 text-yellow-400">Ad Placement Options</h3>
                                <ul className="space-y-3">
                                    {["Homepage Banner (High Visibility)", "Fixtures & Results Banner (Top Performing)", "Live Scoreboard Integration", "News Article Contextual Ads", "Community Hub & Directory Listings"].map((item, i) => (
                                        <li key={i} className="flex items-center gap-3">
                                            <div className="w-2 h-2 bg-yellow-400 rounded-full"></div>
                                            <span className="text-gray-300">{item}</span>
                                        </li>
                                    ))}
                                </ul>
                            </CardContent>
                        </Card>

                        <Card className="bg-gray-800 border-gray-700 text-white">
                            <CardContent className="p-8">
                                <h3 className="text-xl font-bold mb-6 text-yellow-400">Rate Card</h3>
                                <div className="space-y-4">
                                    {[
                                        { loc: "Homepage Banner", price: "E1,200/month" },
                                        { loc: "Fixtures Page Banner", price: "E1,500/month" },
                                        { loc: "Article Banners", price: "E800/month" },
                                        { loc: "Community Hub Ads", price: "E600/month" },
                                        { loc: "Full Site Takeover", price: "E2,000/day" },
                                    ].map((rate, i) => (
                                        <div key={i} className="flex justify-between items-center border-b border-gray-700 pb-2 last:border-0">
                                            <span className="font-medium text-gray-200">{rate.loc}</span>
                                            <span className="font-bold text-white">{rate.price}</span>
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>

            {/* Sponsors Section */}
            <div id="sponsors" className="container mx-auto px-4 sm:px-6 lg:px-8 py-20">
                <SectionHeader 
                    title="For Sponsors" 
                    subtitle="Long-Term Brand Partnerships That Build Legacy. Sponsors gain full brand alignment with the football community — from grassroots development to professional leagues."
                    Icon={BriefcaseIcon}
                    color="text-green-700"
                />

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
                    {[
                        { title: "Bronze", price: "E10,000", period: "/year", desc: "Branding within one major section (e.g., Youth or Women's).", color: "bg-orange-100 text-orange-800 border-orange-200" },
                        { title: "Silver", price: "E20,000", period: "/year", desc: "Section branding + naming rights for Monthly Awards.", color: "bg-gray-100 text-gray-800 border-gray-300" },
                        { title: "Gold", price: "E35,000", period: "/year", desc: "Title features + widespread visibility across Live Scores.", color: "bg-yellow-100 text-yellow-800 border-yellow-300" },
                        { title: "Platinum", price: "E60,000", period: "/year", desc: "Total ecosystem brand integration and Site Title Sponsor.", color: "bg-blue-100 text-blue-900 border-blue-200" },
                    ].map((pkg, i) => (
                        <Card key={i} className={`text-center transition-transform hover:-translate-y-1 ${pkg.color} border-2`}>
                            <CardContent className="p-8 flex flex-col h-full">
                                <h3 className="text-2xl font-bold font-display mb-2">{pkg.title}</h3>
                                <div className="text-3xl font-extrabold mb-4">{pkg.price}<span className="text-base font-normal opacity-75">{pkg.period}</span></div>
                                <p className="text-sm opacity-90 flex-grow">{pkg.desc}</p>
                                <Button className="mt-6 w-full bg-white/50 hover:bg-white/80 text-black border-0">Inquire</Button>
                            </CardContent>
                        </Card>
                    ))}
                </div>

                <div className="mt-16 bg-white p-8 rounded-xl shadow-sm border border-gray-200 max-w-4xl mx-auto text-center">
                    <h3 className="text-2xl font-bold font-display text-gray-900 mb-4">Why Partner With Us?</h3>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-6 text-left">
                        {[
                            "Digital accessibility for all fans",
                            "Grassroots visibility",
                            "Youth talent recognition",
                            "Professional standards",
                            "Business development",
                            "Community sports coverage"
                        ].map((reason, i) => (
                            <div key={i} className="flex items-center gap-2">
                                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                                <span className="text-gray-700 font-medium">{reason}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* CTA Section */}
            <div className="bg-primary py-16">
                <div className="container mx-auto px-4 sm:px-6 lg:px-8 text-center text-white">
                    <h2 className="text-3xl font-bold font-display mb-8">Ready to Get Started?</h2>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
                        <div className="bg-white/10 p-6 rounded-lg backdrop-blur-sm">
                            <h4 className="font-bold text-xl mb-2">Teams & Clubs</h4>
                            <p className="text-sm text-blue-100 mb-4">Activate your official club profile today.</p>
                            <a href="mailto:clubs@eswatini.football" className="inline-block bg-white text-primary font-bold py-2 px-6 rounded-full hover:bg-gray-100 transition-colors">Onboard Club</a>
                        </div>
                        <div className="bg-white/10 p-6 rounded-lg backdrop-blur-sm">
                            <h4 className="font-bold text-xl mb-2">Advertisers</h4>
                            <p className="text-sm text-blue-100 mb-4">Grow your brand in high-traffic zones.</p>
                            <a href="mailto:ads@eswatini.football" className="inline-block bg-yellow-400 text-yellow-900 font-bold py-2 px-6 rounded-full hover:bg-yellow-300 transition-colors">Request Rate Card</a>
                        </div>
                        <div className="bg-white/10 p-6 rounded-lg backdrop-blur-sm">
                            <h4 className="font-bold text-xl mb-2">Sponsors</h4>
                            <p className="text-sm text-blue-100 mb-4">Deep engagement and long-term value.</p>
                            <a href="mailto:partners@eswatini.football" className="inline-block bg-white text-primary font-bold py-2 px-6 rounded-full hover:bg-gray-100 transition-colors">Contact Us</a>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PartnershipPage;
