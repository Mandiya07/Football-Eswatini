
import React, { useState } from 'react';
import Merchandise from './Merchandise';
import Ticketing from './Ticketing';
import StoreIcon from './icons/StoreIcon';
import TicketIcon from './icons/TicketIcon';
import TagIcon from './icons/TagIcon';

type ShopTab = 'merch' | 'tickets';

const ShopPage: React.FC = () => {
    const [activeTab, setActiveTab] = useState<ShopTab>('merch');

    const TabButton: React.FC<{tabName: ShopTab; label: string; Icon: React.FC<React.SVGProps<SVGSVGElement>>}> = ({ tabName, label, Icon }) => (
        <button
            onClick={() => setActiveTab(tabName)}
            className={`flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-t-lg transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${
                activeTab === tabName 
                ? 'border-b-2 border-blue-600 text-blue-600'
                : 'text-gray-500 hover:text-gray-800'
            }`}
            role="tab"
            aria-selected={activeTab === tabName}
        >
            <Icon className="w-5 h-5" />
            <span>{label}</span>
        </button>
    );

    return (
        <div className="bg-gray-50 py-12">
            <div className="container mx-auto px-4 sm:px-6 lg:px-8 animate-fade-in">
                <div className="text-center mb-8">
                    <h1 className="text-4xl md:text-5xl font-display font-extrabold text-blue-800 mb-2">
                        Official Shop
                    </h1>
                    <p className="text-lg text-gray-600 max-w-3xl mx-auto">
                        Get your official team gear and secure your tickets for the next big match.
                    </p>
                </div>

                {/* Promo Banner */}
                <div className="bg-red-600 text-white p-4 rounded-lg shadow-md mb-8 flex flex-col sm:flex-row items-center justify-center gap-2 text-center animate-pulse">
                    <TagIcon className="w-6 h-6 text-yellow-300" />
                    <span className="font-bold text-lg">Flash Sale! Use code <span className="bg-white text-red-600 px-2 py-0.5 rounded mx-1 border-2 border-yellow-300">SAVE10</span> for 10% off your order!</span>
                </div>
                
                <div className="border-b border-gray-200 mb-8">
                    <div className="-mb-px flex justify-center space-x-2 md:space-x-8" role="tablist" aria-label="Shop">
                        <TabButton tabName="merch" label="Merchandise" Icon={StoreIcon} />
                        <TabButton tabName="tickets" label="Match Tickets" Icon={TicketIcon} />
                    </div>
                </div>

                <div>
                    {activeTab === 'merch' && <Merchandise />}
                    {activeTab === 'tickets' && <Ticketing />}
                </div>
            </div>
        </div>
    );
};

export default ShopPage;
