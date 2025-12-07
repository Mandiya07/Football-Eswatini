import React, { useRef, useState } from 'react';
import html2canvas from 'html2canvas';
import ShieldIcon from '../icons/ShieldIcon';
import UsersIcon from '../icons/UsersIcon';
import TrophyIcon from '../icons/TrophyIcon';
import BarChartIcon from '../icons/BarChartIcon';
import MegaphoneIcon from '../icons/MegaphoneIcon';
import PhoneIcon from '../icons/PhoneIcon';
import GlobeIcon from '../icons/GlobeIcon';
import CheckCircleIcon from '../icons/CheckCircleIcon';
import DownloadIcon from '../icons/DownloadIcon';
import Spinner from '../ui/Spinner';

// --- Download Wrapper Component ---
const DownloadWrapper: React.FC<{ children: React.ReactNode; fileName: string }> = ({ children, fileName }) => {
    const ref = useRef<HTMLDivElement>(null);
    const [downloading, setDownloading] = useState(false);

    const handleDownload = async () => {
        if (!ref.current) return;
        setDownloading(true);
        try {
            // Wait a moment for any fonts/images to settle
            await new Promise(resolve => setTimeout(resolve, 100));
            
            const canvas = await html2canvas(ref.current, {
                scale: 2, // High resolution
                backgroundColor: null, // Transparent background if set on element
                useCORS: true, // Allow cross-origin images
                logging: false
            });
            
            const image = canvas.toDataURL("image/png");
            const link = document.createElement("a");
            link.href = image;
            link.download = `${fileName}.png`;
            link.click();
        } catch (error) {
            console.error("Infographic download failed:", error);
            alert("Could not generate image. Please try again.");
        } finally {
            setDownloading(false);
        }
    };

    return (
        <div className="relative group">
            <div ref={ref} className="h-full">
                {children}
            </div>
            {/* Floating Download Button */}
            <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-20">
                <button 
                    onClick={handleDownload}
                    disabled={downloading}
                    className="bg-white text-gray-800 hover:bg-gray-100 shadow-xl font-bold py-2 px-4 rounded-lg inline-flex items-center gap-2 text-sm border border-gray-200 transition-transform hover:scale-105"
                    title="Download as Image"
                >
                    {downloading ? <Spinner className="w-4 h-4 border-2 border-gray-600" /> : <DownloadIcon className="w-4 h-4 text-blue-600" />}
                    {downloading ? 'Generating...' : 'Download Image'}
                </button>
            </div>
        </div>
    );
};

// --- 1. CLUB INFOGRAPHIC: The Digital Hub ---
export const ClubBenefitsInfographic: React.FC = () => {
  return (
    <DownloadWrapper fileName="Club_Benefits_Infographic">
        <div className="bg-gradient-to-br from-blue-900 via-blue-800 to-blue-900 text-white rounded-2xl p-8 shadow-2xl overflow-hidden relative">
        {/* Background Decor */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-blue-600 rounded-full opacity-20 filter blur-3xl"></div>
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-red-600 rounded-full opacity-20 filter blur-3xl"></div>

        <div className="relative z-10">
            <div className="text-center mb-10">
                <h2 className="text-3xl font-display font-bold mb-2">Your Club's Digital Transformation</h2>
                <p className="text-blue-200">One Platform. Four Pillars of Growth.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
                {/* Central Phone Mockup */}
                <div className="relative mx-auto md:order-2">
                    <div className="w-48 h-96 bg-gray-900 rounded-[2.5rem] border-4 border-gray-700 shadow-2xl overflow-hidden relative z-10">
                        {/* Fake Screen */}
                        <div className="bg-white h-full w-full flex flex-col">
                            <div className="bg-red-600 h-16 flex items-center justify-center">
                                <ShieldIcon className="w-8 h-8 text-white" />
                            </div>
                            <div className="p-4 space-y-2">
                                <div className="h-24 bg-gray-100 rounded-lg mb-2"></div>
                                <div className="h-8 bg-blue-50 rounded w-3/4"></div>
                                <div className="h-2 bg-gray-200 rounded w-full"></div>
                                <div className="h-2 bg-gray-200 rounded w-5/6"></div>
                                <div className="mt-4 flex gap-2">
                                    <div className="h-12 w-12 bg-yellow-400 rounded-full"></div>
                                    <div className="h-12 w-12 bg-gray-200 rounded-full"></div>
                                </div>
                            </div>
                            <div className="mt-auto bg-gray-100 h-12 border-t"></div>
                        </div>
                    </div>
                    {/* Connecting Lines */}
                    <div className="absolute top-1/4 -left-12 w-12 h-0.5 bg-blue-400 hidden md:block"></div>
                    <div className="absolute bottom-1/4 -left-12 w-12 h-0.5 bg-yellow-400 hidden md:block"></div>
                </div>

                {/* Feature Nodes */}
                <div className="space-y-8 md:order-1">
                    <div className="flex items-start gap-4 p-4 bg-white/10 rounded-xl backdrop-blur-sm border border-white/10 hover:bg-white/20 transition-colors">
                        <div className="p-3 bg-blue-600 rounded-lg">
                            <ShieldIcon className="w-6 h-6 text-white" />
                        </div>
                        <div>
                            <h3 className="font-bold text-lg">1. Brand Identity</h3>
                            <p className="text-sm text-blue-100">A fully branded hub with your colors, crest, and official statements. No distractions.</p>
                        </div>
                    </div>

                    <div className="flex items-start gap-4 p-4 bg-white/10 rounded-xl backdrop-blur-sm border border-white/10 hover:bg-white/20 transition-colors">
                        <div className="p-3 bg-green-600 rounded-lg">
                            <UsersIcon className="w-6 h-6 text-white" />
                        </div>
                        <div>
                            <h3 className="font-bold text-lg">2. Scouting & Exposure</h3>
                            <p className="text-sm text-blue-100">Digital player profiles with stats and video highlights, accessible to international scouts.</p>
                        </div>
                    </div>

                    <div className="flex items-start gap-4 p-4 bg-white/10 rounded-xl backdrop-blur-sm border border-white/10 hover:bg-white/20 transition-colors">
                        <div className="p-3 bg-yellow-500 rounded-lg">
                            <MegaphoneIcon className="w-6 h-6 text-white" />
                        </div>
                        <div>
                            <h3 className="font-bold text-lg">3. Fan Engagement</h3>
                            <p className="text-sm text-blue-100">Interactive polls, "Man of the Match" voting, and direct news feeds to mobile devices.</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
        </div>
    </DownloadWrapper>
  );
};

// --- 2. ADVERTISER INFOGRAPHIC: The Engagement Funnel ---
export const AdvertiserValueInfographic: React.FC = () => {
  return (
    <DownloadWrapper fileName="Advertiser_Value_Infographic">
        <div className="bg-white border rounded-2xl p-8 shadow-xl overflow-hidden relative">
        <div className="text-center mb-8">
            <h2 className="text-3xl font-display font-bold text-gray-900">Capture The Moment</h2>
            <p className="text-gray-500">Why static ads fail and contextual ads win.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Stat 1 */}
            <div className="bg-gray-50 rounded-xl p-6 text-center border border-gray-200 hover:border-blue-500 transition-colors group">
                <div className="mx-auto w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4 group-hover:bg-blue-600 transition-colors">
                    <PhoneIcon className="w-8 h-8 text-blue-600 group-hover:text-white" />
                </div>
                <h3 className="text-4xl font-extrabold text-gray-900 mb-1">95%</h3>
                <p className="font-bold text-blue-800">Mobile Traffic</p>
                <p className="text-xs text-gray-500 mt-2">Your brand in the palm of their hand, optimized for low-data usage.</p>
            </div>

            {/* Stat 2 */}
            <div className="bg-gray-50 rounded-xl p-6 text-center border border-gray-200 hover:border-red-500 transition-colors group">
                <div className="mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4 group-hover:bg-red-600 transition-colors">
                    <BarChartIcon className="w-8 h-8 text-red-600 group-hover:text-white" />
                </div>
                <h3 className="text-4xl font-extrabold text-gray-900 mb-1">90m+</h3>
                <p className="font-bold text-red-800">Attention Span</p>
                <p className="text-xs text-gray-500 mt-2">Fans check live scores every 5 minutes during match days.</p>
            </div>

            {/* Stat 3 */}
            <div className="bg-gray-50 rounded-xl p-6 text-center border border-gray-200 hover:border-yellow-500 transition-colors group">
                <div className="mx-auto w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mb-4 group-hover:bg-yellow-500 transition-colors">
                    <MegaphoneIcon className="w-8 h-8 text-yellow-700 group-hover:text-white" />
                </div>
                <h3 className="text-4xl font-extrabold text-gray-900 mb-1">100%</h3>
                <p className="font-bold text-yellow-700">Ad Visibility</p>
                <p className="text-xs text-gray-500 mt-2">Hard-coded native placements bypass traditional ad-blockers.</p>
            </div>
        </div>

        {/* Visual Representation of Placements */}
        <div className="mt-10 border-t pt-8">
            <p className="text-center font-bold text-gray-700 mb-6 uppercase tracking-widest text-sm">Premium Placements</p>
            <div className="flex flex-col md:flex-row gap-4 justify-center opacity-80">
                <div className="w-full md:w-1/3 border-2 border-dashed border-blue-300 bg-blue-50 h-24 rounded-lg flex items-center justify-center text-blue-700 font-bold text-sm">Homepage Hero</div>
                <div className="w-full md:w-1/3 border-2 border-dashed border-green-300 bg-green-50 h-24 rounded-lg flex items-center justify-center text-green-700 font-bold text-sm">Live Scoreboard</div>
                <div className="w-full md:w-1/3 border-2 border-dashed border-orange-300 bg-orange-50 h-24 rounded-lg flex items-center justify-center text-orange-700 font-bold text-sm">News Contextual</div>
            </div>
        </div>
        </div>
    </DownloadWrapper>
  );
};

// --- 3. SPONSOR INFOGRAPHIC: The Ecosystem Pyramid ---
export const SponsorEcosystemInfographic: React.FC = () => {
    return (
      <DownloadWrapper fileName="Sponsor_Ecosystem_Infographic">
        <div className="bg-gray-900 text-white rounded-2xl p-8 shadow-2xl relative overflow-hidden">
            {/* Grid Background */}
            <div className="absolute inset-0 opacity-10" 
                style={{ backgroundImage: 'linear-gradient(#333 1px, transparent 1px), linear-gradient(90deg, #333 1px, transparent 1px)', backgroundSize: '20px 20px' }}>
            </div>

            <div className="relative z-10 flex flex-col md:flex-row gap-10 items-center">
                <div className="md:w-1/2">
                    <h2 className="text-3xl font-display font-bold mb-4 text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-orange-500">
                        Power the Entire Ecosystem
                    </h2>
                    <p className="text-gray-400 mb-6 leading-relaxed">
                        Your brand doesn't just buy a banner; it fuels the development of football in Eswatini from the ground up.
                    </p>
                    <ul className="space-y-4">
                        <li className="flex items-center gap-3">
                            <div className="p-1 bg-green-500 rounded-full"><CheckCircleIcon className="w-4 h-4 text-white"/></div>
                            <span className="font-medium">Associate with National Pride (Sihlangu)</span>
                        </li>
                        <li className="flex items-center gap-3">
                            <div className="p-1 bg-blue-500 rounded-full"><CheckCircleIcon className="w-4 h-4 text-white"/></div>
                            <span className="font-medium">Support Grassroots Development (Schools)</span>
                        </li>
                        <li className="flex items-center gap-3">
                            <div className="p-1 bg-purple-500 rounded-full"><CheckCircleIcon className="w-4 h-4 text-white"/></div>
                            <span className="font-medium">Drive Women's Football Growth</span>
                        </li>
                    </ul>
                </div>

                {/* Pyramid Graphic */}
                <div className="md:w-1/2 flex flex-col items-center justify-center space-y-2 w-full">
                    <div className="w-4/5 bg-gradient-to-r from-yellow-500 to-yellow-600 p-4 rounded-t-xl shadow-lg text-center transform hover:scale-105 transition-transform cursor-default relative group">
                        <TrophyIcon className="w-8 h-8 mx-auto mb-1 text-yellow-900" />
                        <span className="font-black text-yellow-900 uppercase tracking-wide">Elite</span>
                        <div className="text-[10px] text-yellow-900 font-semibold">Premier League & National Team</div>
                    </div>
                    <div className="w-5/6 bg-gradient-to-r from-blue-500 to-blue-600 p-4 shadow-lg text-center transform hover:scale-105 transition-transform cursor-default relative">
                        <GlobeIcon className="w-6 h-6 mx-auto mb-1 text-blue-100" />
                        <span className="font-bold text-white uppercase tracking-wide">Regional</span>
                        <div className="text-[10px] text-blue-100">Super Leagues & First Division</div>
                    </div>
                    <div className="w-full bg-gradient-to-r from-green-600 to-green-700 p-4 rounded-b-xl shadow-lg text-center transform hover:scale-105 transition-transform cursor-default relative">
                        <UsersIcon className="w-6 h-6 mx-auto mb-1 text-green-100" />
                        <span className="font-bold text-white uppercase tracking-wide">Grassroots</span>
                        <div className="text-[10px] text-green-100">Schools, Youth & Community</div>
                    </div>
                </div>
            </div>
        </div>
      </DownloadWrapper>
    );
};