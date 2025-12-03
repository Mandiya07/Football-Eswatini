
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Team } from '../data/teams';
import { Card, CardContent } from './ui/Card';
import ArrowLeftIcon from './icons/ArrowLeftIcon';
import UsersIcon from './icons/UsersIcon';
import UserIcon from './icons/UserIcon';
import BarChartIcon from './icons/BarChartIcon';
import CalendarIcon from './icons/CalendarIcon';
import CheckCircleIcon from './icons/CheckCircleIcon';
import NewspaperIcon from './icons/NewspaperIcon';
import PhotoIcon from './icons/PhotoIcon';
import VoteIcon from './icons/VoteIcon';
import BriefcaseIcon from './icons/BriefcaseIcon';
import MedalIcon from './icons/MedalIcon';
import FormGuide from './ui/FormGuide';
import FacebookIcon from './icons/FacebookIcon';
import InstagramIcon from './icons/InstagramIcon';
import YouTubeIcon from './icons/YouTubeIcon';
import TwitterIcon from './icons/TwitterIcon';
import GlobeIcon from './icons/GlobeIcon';

// Mock Data for the Example
const MOCK_BRANDED_TEAM: Team = {
    id: 999,
    name: 'Mbabane Swallows',
    crestUrl: 'https://via.placeholder.com/128/D22730/FFFFFF?text=MS',
    stats: { p: 15, w: 10, d: 3, l: 2, gs: 34, gc: 12, gd: 22, pts: 33, form: 'W W D W L' },
    players: [
        { id: 101, name: 'Sandile "Nkomishi" Ginindza', position: 'Goalkeeper', number: 1, photoUrl: '', bio: { age: 28, height: '1.82m', nationality: 'Eswatini' }, stats: { appearances: 15, goals: 0, assists: 1 }, transferHistory: [] },
        { id: 102, name: 'Wonder "Samba Jive" Nhleko', position: 'Midfielder', number: 10, photoUrl: '', bio: { age: 32, height: '1.70m', nationality: 'Eswatini' }, stats: { appearances: 14, goals: 5, assists: 8 }, transferHistory: [] },
        { id: 103, name: 'Felix Badenhorst', position: 'Forward', number: 20, photoUrl: '', bio: { age: 30, height: '1.85m', nationality: 'Eswatini' }, stats: { appearances: 15, goals: 12, assists: 3 }, transferHistory: [] },
        { id: 104, name: 'Sanele Mkhweli', position: 'Defender', number: 3, photoUrl: '', bio: { age: 26, height: '1.78m', nationality: 'Eswatini' }, stats: { appearances: 15, goals: 1, assists: 4 }, transferHistory: [] },
    ],
    fixtures: [
        { opponent: 'Green Mamba', date: '2023-11-04' },
        { opponent: 'Royal Leopards', date: '2023-11-11' },
    ],
    results: [
        { opponent: 'Manzini Wanderers', score: 'W 2-0' },
        { opponent: 'Young Buffaloes', score: 'D 1-1' },
        { opponent: 'Moneni Pirates', score: 'W 3-1' },
    ],
    staff: [
        { id: 1, name: 'Caleb Ngwenya', role: 'Head Coach', email: '', phone: '' },
        { id: 2, name: 'Siyabonga Bhembe', role: 'Assistant Coach', email: '', phone: '' },
        { id: 3, name: 'Dr. Samkelo Dlamini', role: 'Team Doctor', email: '', phone: '' },
        { id: 4, name: 'Musa Mamba', role: 'Kit Manager', email: '', phone: '' }
    ],
    branding: {
        primaryColor: '#D22730', // Swallows Red
        secondaryColor: '#FFFFFF',
        bannerUrl: 'https://images.unsplash.com/photo-1518091043644-c1d4457512c6?auto=format&fit=crop&w=1600&q=80', // Generic stadium/crowd
        welcomeMessage: "Welcome to the official digital home of the Beautiful Birds. Here you will find exclusive updates direct from the technical bench."
    },
    socialMedia: {
        facebook: '#',
        twitter: '#',
        instagram: '#',
        youtube: '#',
        website: '#'
    },
    kitSponsor: {
        name: 'Moneni',
        logoUrl: 'https://via.placeholder.com/100x50?text=Sponsor'
    }
};

// Additional Mock Content for Features
const MOCK_NEWS = [
    { id: 1, title: 'Club Statement: New Training Facility Groundbreaking', date: '15 Nov 2023', summary: 'We are proud to announce the start of construction for our new state-of-the-art training complex in Ezulwini.', image: 'https://images.unsplash.com/photo-1577223625816-7546f13df25d?auto=format&fit=crop&w=800&q=80' },
    { id: 2, title: 'Match Preview: The Big Derby awaits this Sunday', date: '10 Nov 2023', summary: 'Everything you need to know before we face our city rivals. Coach Vilakati calls for "maximum focus".', image: 'https://images.unsplash.com/photo-1522778119026-d647f0565c79?auto=format&fit=crop&w=800&q=80' },
    { id: 3, title: 'Academy Update: U-17s Reach Cup Final', date: '08 Nov 2023', summary: 'Our future stars continue to shine as they book their place in the regional final with a 3-0 victory.', image: 'https://images.unsplash.com/photo-1431324155629-1a6deb1dec8d?auto=format&fit=crop&w=800&q=80' }
];

const MOCK_GALLERY = [
    'https://images.unsplash.com/photo-1517466787929-bc90951d64b8?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1599058945522-28d584b6f0ff?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1560272564-c83b66b1ad12?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1504305593268-ed3e0f41a4c9?auto=format&fit=crop&w=800&q=80'
];

const MOCK_POLL = {
    question: "Who was your Man of the Match vs Wanderers?",
    totalVotes: 1250,
    options: [
        { label: "Felix Badenhorst", percent: 45 },
        { label: "Sandile Ginindza", percent: 30 },
        { label: "Wonder Nhleko", percent: 25 }
    ]
};

const MOCK_POTM_POLL = {
    question: "Vote: Player of the Month (October)",
    totalVotes: 3400,
    options: [
        { label: "Felix Badenhorst", percent: 60 },
        { label: "Kingsley Gent", percent: 25 },
        { label: "Banele Sikhondze", percent: 15 }
    ]
};

const BrandedClubExample: React.FC = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('overview');
  const team = MOCK_BRANDED_TEAM;
  
  // Branding Constants
  const primaryColor = team.branding!.primaryColor;
  const secondaryColor = team.branding!.secondaryColor;
  const bannerUrl = team.branding!.bannerUrl;

  const TabButton: React.FC<{name: string, label: string, Icon: any}> = ({ name, label, Icon }) => {
      const isActive = activeTab === name;
      return (
        <button
          onClick={() => setActiveTab(name)}
          style={isActive ? { color: primaryColor, borderColor: primaryColor } : {}}
          className={`
            ${isActive ? 'border-b-2' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}
            whitespace-nowrap py-4 px-1 font-medium text-sm inline-flex items-center gap-2 transition-colors duration-200 focus:outline-none
          `}
        >
          <Icon className="w-5 h-5" />
          {label}
        </button>
      );
  };

  return (
    <div className="py-12 min-h-screen" style={{ backgroundColor: `${primaryColor}08` }}> {/* Very light tint of club color */}
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Navigation / Context Bar */}
        <div className="flex justify-between items-center mb-6">
             <button onClick={() => navigate(-1)} className="inline-flex items-center gap-2 text-sm font-semibold text-gray-600 hover:text-gray-900 transition-colors">
                <ArrowLeftIcon className="w-4 h-4" /> Back
            </button>
            <div className="bg-yellow-100 text-yellow-800 px-3 py-1 rounded-full text-xs font-bold border border-yellow-200">
                PREVIEW: Enterprise Tier Experience
            </div>
        </div>

        <Card className="shadow-xl overflow-hidden border-0" style={{ borderTop: `5px solid ${primaryColor}` }}>
            
            {/* BRANDED HEADER */}
            <header 
                className="bg-cover bg-center p-8 relative h-[300px] flex items-end" 
                style={{ backgroundImage: `url('${bannerUrl}')` }}
            >
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent"></div>

                <div className="relative z-10 flex flex-col sm:flex-row items-end sm:items-center gap-6 w-full">
                    <div className="relative">
                        <img 
                            src={team.crestUrl} 
                            alt={`${team.name} crest`} 
                            className="w-32 h-32 object-contain bg-white rounded-full p-2 border-4 shadow-lg"
                            style={{ borderColor: primaryColor }} 
                        />
                        <div className="absolute -bottom-2 -right-2 bg-blue-500 text-white text-[10px] font-bold px-2 py-1 rounded-full border-2 border-white flex items-center gap-1">
                            <CheckCircleIcon className="w-3 h-3" /> OFFICIAL
                        </div>
                    </div>
                    <div className="mb-2 flex-grow">
                        <h1 className="text-4xl sm:text-6xl font-display font-extrabold tracking-tight text-white drop-shadow-md">
                            {team.name}
                        </h1>
                        <div className="flex flex-wrap gap-3 mt-3">
                             <button 
                                className="px-6 py-2 rounded-full font-bold text-white shadow-lg transform transition-transform hover:scale-105"
                                style={{ backgroundColor: primaryColor }}
                            >
                                Follow Club
                            </button>
                            
                            {/* Mock Social Icons */}
                            <div className="flex items-center gap-2 ml-2">
                                <a href="#" className="text-white/80 hover:text-white p-1 bg-white/10 rounded-full hover:bg-white/20 transition-colors"><FacebookIcon className="w-5 h-5"/></a>
                                <a href="#" className="text-white/80 hover:text-white p-1 bg-white/10 rounded-full hover:bg-white/20 transition-colors"><TwitterIcon className="w-5 h-5"/></a>
                                <a href="#" className="text-white/80 hover:text-white p-1 bg-white/10 rounded-full hover:bg-white/20 transition-colors"><InstagramIcon className="w-5 h-5"/></a>
                                <a href="#" className="text-white/80 hover:text-white p-1 bg-white/10 rounded-full hover:bg-white/20 transition-colors"><YouTubeIcon className="w-5 h-5"/></a>
                            </div>
                        </div>
                    </div>
                </div>
            </header>
            
            {/* TABS */}
            <div className="border-b border-gray-200 bg-white overflow-x-auto">
                <nav className="-mb-px flex space-x-6 px-8" aria-label="Tabs">
                    <TabButton name="overview" label="Overview" Icon={BarChartIcon} />
                    <TabButton name="news" label="News" Icon={NewspaperIcon} />
                    <TabButton name="squad" label="Squad" Icon={UsersIcon} />
                    <TabButton name="staff" label="Staff" Icon={BriefcaseIcon} />
                    <TabButton name="fixtures" label="Fixtures" Icon={CalendarIcon} />
                    <TabButton name="gallery" label="Gallery" Icon={PhotoIcon} />
                    <TabButton name="fans" label="Fan Zone" Icon={VoteIcon} />
                </nav>
            </div>

            <CardContent className="p-8 bg-white min-h-[400px]">
                
                {/* WELCOME MESSAGE (Enterprise Feature) */}
                {team.branding?.welcomeMessage && activeTab === 'overview' && (
                    <div className="mb-8 flex gap-4 bg-gray-50 p-6 rounded-xl border-l-4" style={{ borderColor: primaryColor }}>
                         <div className="flex-shrink-0">
                            <div className="w-12 h-12 rounded-full bg-gray-200 flex items-center justify-center">
                                <UserIcon className="w-6 h-6 text-gray-500" />
                            </div>
                         </div>
                         <div>
                             <h3 className="font-bold text-lg mb-1" style={{ color: primaryColor }}>Official Club Statement</h3>
                             <p className="text-gray-700 italic leading-relaxed">"{team.branding.welcomeMessage}"</p>
                             <p className="text-xs text-gray-500 mt-2 font-bold uppercase">- Chairman's Office</p>
                         </div>
                    </div>
                )}

                {activeTab === 'overview' && (
                    <div className="space-y-8">
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                            <div className="bg-gray-50 p-4 rounded-lg border border-gray-100">
                                <p className="text-3xl font-bold text-gray-800">{team.stats.p}</p>
                                <p className="text-xs uppercase text-gray-500 font-semibold">Played</p>
                            </div>
                            <div className="bg-green-50 p-4 rounded-lg border border-green-100">
                                <p className="text-3xl font-bold text-green-700">{team.stats.w}</p>
                                <p className="text-xs uppercase text-green-600 font-semibold">Won</p>
                            </div>
                             <div className="bg-gray-50 p-4 rounded-lg border border-gray-100">
                                <p className="text-3xl font-bold text-gray-800">{team.stats.gd}</p>
                                <p className="text-xs uppercase text-gray-500 font-semibold">Goal Diff</p>
                            </div>
                            <div className="p-4 rounded-lg text-white" style={{ backgroundColor: primaryColor }}>
                                <p className="text-3xl font-bold">{team.stats.pts}</p>
                                <p className="text-xs uppercase opacity-90 font-semibold">Points</p>
                            </div>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div>
                                <h3 className="text-xl font-bold font-display mb-4 border-b pb-2">Recent Form</h3>
                                <div className="bg-gray-50 p-6 rounded-lg flex items-center justify-center h-32">
                                    <FormGuide form={team.stats.form} />
                                </div>
                            </div>
                            <div>
                                <h3 className="text-xl font-bold font-display mb-4 border-b pb-2">Next Match</h3>
                                <div className="bg-gray-900 text-white p-6 rounded-lg flex justify-between items-center">
                                    <div className="text-center">
                                        <img src={team.crestUrl} className="w-12 h-12 mx-auto mb-2 object-contain"/>
                                        <span className="font-bold">{team.name}</span>
                                    </div>
                                    <div className="text-center px-4">
                                        <p className="text-xs text-gray-400 uppercase mb-1">VS</p>
                                        <p className="text-2xl font-bold text-yellow-400">15:00</p>
                                        <p className="text-xs text-gray-400">Sat, Nov 18</p>
                                    </div>
                                     <div className="text-center">
                                        <div className="w-12 h-12 bg-gray-700 rounded-full mx-auto mb-2 flex items-center justify-center font-bold">?</div>
                                        <span className="font-bold">Highlanders</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'news' && (
                    <div className="space-y-6">
                        <h3 className="text-xl font-bold font-display mb-4 text-gray-800">Latest Club Announcements</h3>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            {MOCK_NEWS.map(news => (
                                <div key={news.id} className="border rounded-lg overflow-hidden hover:shadow-lg transition-shadow group">
                                    <div className="h-40 overflow-hidden">
                                        <img src={news.image} className="w-full h-full object-cover transition-transform group-hover:scale-105 duration-500" alt="" />
                                    </div>
                                    <div className="p-4">
                                        <p className="text-xs text-gray-500 mb-1">{news.date}</p>
                                        <h4 className="font-bold text-gray-800 mb-2 line-clamp-2">{news.title}</h4>
                                        <p className="text-sm text-gray-600 line-clamp-3 mb-3">{news.summary}</p>
                                        <button className="text-xs font-bold uppercase tracking-wide" style={{ color: primaryColor }}>Read More &rarr;</button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {activeTab === 'squad' && (
                     <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
                        {team.players.map(player => (
                            <div key={player.id} className="group text-center cursor-pointer">
                                <div className="relative mb-3 overflow-hidden rounded-lg bg-gray-100 border border-gray-200">
                                    <div className="h-40 flex items-end justify-center bg-gradient-to-t from-gray-900 to-transparent">
                                         <UserIcon className="w-24 h-24 text-gray-400 mb-4" />
                                    </div>
                                    <div className="absolute bottom-0 left-0 right-0 p-2 text-white" style={{ backgroundColor: primaryColor }}>
                                        <span className="font-bold">#{player.number}</span>
                                    </div>
                                </div>
                                <p className="font-bold text-gray-900">{player.name}</p>
                                <p className="text-xs text-gray-500 uppercase">{player.position}</p>
                            </div>
                        ))}
                    </div>
                )}

                {activeTab === 'staff' && (
                     <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
                        {team.staff.map(member => (
                            <div key={member.id} className="flex items-center gap-4 p-4 bg-white rounded-lg border hover:shadow-md transition-shadow">
                                <div className="w-14 h-14 rounded-full bg-gray-100 flex-shrink-0 overflow-hidden border">
                                    {member.photoUrl ? (
                                        <img src={member.photoUrl} alt={member.name} className="w-full h-full object-cover" />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center">
                                            <UserIcon className="w-8 h-8 text-gray-400" />
                                        </div>
                                    )}
                                </div>
                                <div>
                                    <p className="font-bold text-gray-900">{member.name}</p>
                                    <p className="text-sm text-gray-500 font-semibold uppercase tracking-wide" style={{ color: primaryColor }}>{member.role}</p>
                                </div>
                            </div>
                        ))}
                        {team.staff.length === 0 && <p className="text-gray-500 col-span-full text-center">No staff information available.</p>}
                    </div>
                )}

                {activeTab === 'fixtures' && (
                    <div className="space-y-3">
                        {team.fixtures.map((fixture, i) => (
                            <div key={i} className="flex justify-between items-center p-4 bg-gray-50 rounded-lg border border-gray-100 hover:border-gray-300 transition-colors">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center border text-xs font-bold text-gray-400">VS</div>
                                    <span className="font-bold text-gray-700 text-lg">{fixture.opponent}</span>
                                </div>
                                <span className="text-sm font-semibold text-gray-500 bg-white px-3 py-1 rounded border">{fixture.date}</span>
                            </div>
                        ))}
                         <div className="mt-8 pt-6 border-t">
                            <h4 className="font-bold text-gray-700 mb-4">Recent Results</h4>
                            <div className="space-y-3">
                                {team.results.map((result, i) => (
                                    <div key={i} className="flex justify-between items-center p-4 bg-white rounded-lg border border-gray-100">
                                        <div className="flex items-center gap-3">
                                            <span className={`text-xs font-bold px-2 py-1 rounded ${result.score.includes('W') ? 'bg-green-100 text-green-700' : result.score.includes('D') ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'}`}>
                                                {result.score.split(' ')[0]}
                                            </span>
                                            <span className="font-semibold text-gray-800">{result.opponent}</span>
                                        </div>
                                        <span className="font-bold text-gray-900">{result.score.split(' ')[1]}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'gallery' && (
                    <div>
                        <h3 className="text-xl font-bold font-display mb-4 text-gray-800">Matchday Gallery</h3>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            {MOCK_GALLERY.map((img, i) => (
                                <div key={i} className="relative aspect-square rounded-lg overflow-hidden group cursor-pointer">
                                    <img src={img} alt="" className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
                                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                        <PhotoIcon className="w-8 h-8 text-white" />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {activeTab === 'fans' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto">
                        {/* Man of the Match Poll */}
                        <Card className="border-2" style={{ borderColor: primaryColor }}>
                            <CardContent className="p-6">
                                <div className="flex items-center justify-between mb-6">
                                    <h3 className="text-xl font-bold font-display text-gray-900">{MOCK_POLL.question}</h3>
                                    <div className="bg-gray-100 px-3 py-1 rounded-full text-xs font-bold text-gray-500">Live Poll</div>
                                </div>
                                <div className="space-y-4">
                                    {MOCK_POLL.options.map((opt, i) => (
                                        <div key={i}>
                                            <div className="flex justify-between text-sm mb-1">
                                                <span className="font-semibold">{opt.label}</span>
                                                <span className="font-bold" style={{ color: primaryColor }}>{opt.percent}%</span>
                                            </div>
                                            <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                                                <div 
                                                    className="h-full rounded-full transition-all duration-1000 ease-out" 
                                                    style={{ width: `${opt.percent}%`, backgroundColor: primaryColor }}
                                                ></div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                                <div className="mt-6 pt-4 border-t text-center text-sm text-gray-500">
                                    Total Votes: <strong>{MOCK_POLL.totalVotes}</strong>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Player of the Month Poll */}
                        <Card className="border-2 border-yellow-400 bg-yellow-50">
                            <CardContent className="p-6">
                                <div className="flex items-center justify-between mb-6">
                                    <div className="flex items-center gap-2">
                                        <MedalIcon className="w-6 h-6 text-yellow-600" />
                                        <h3 className="text-xl font-bold font-display text-gray-900">{MOCK_POTM_POLL.question}</h3>
                                    </div>
                                    <div className="bg-yellow-200 text-yellow-900 px-3 py-1 rounded-full text-xs font-bold">Featured</div>
                                </div>
                                <div className="space-y-4">
                                    {MOCK_POTM_POLL.options.map((opt, i) => (
                                        <div key={i}>
                                            <div className="flex justify-between text-sm mb-1">
                                                <span className="font-semibold text-gray-800">{opt.label}</span>
                                                <span className="font-bold text-yellow-700">{opt.percent}%</span>
                                            </div>
                                            <div className="w-full bg-yellow-200 rounded-full h-3 overflow-hidden">
                                                <div 
                                                    className="h-full rounded-full transition-all duration-1000 ease-out bg-yellow-500" 
                                                    style={{ width: `${opt.percent}%` }}
                                                ></div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                                <div className="mt-6 pt-4 border-t border-yellow-200 text-center text-sm text-gray-600">
                                    Total Votes: <strong>{MOCK_POTM_POLL.totalVotes}</strong>
                                </div>
                            </CardContent>
                        </Card>
                        
                        <div className="mt-8 text-center col-span-full">
                            <p className="text-gray-600 mb-4">Want exclusive wallpapers and ringtones?</p>
                            <button className="bg-gray-900 text-white px-6 py-2 rounded-full text-sm font-bold">Join the Fan Club</button>
                        </div>
                    </div>
                )}

            </CardContent>
        </Card>
        
        <div className="mt-8 text-center">
            <p className="text-gray-500 text-sm mb-4">This is a demonstration of the Enterprise Tier "Branded Club Hub".</p>
            <button 
                onClick={() => navigate('/club-registration')}
                className="bg-gray-900 text-white px-6 py-3 rounded-lg font-bold hover:bg-black transition-colors"
            >
                Get This For Your Club
            </button>
        </div>

      </div>
    </div>
  );
};

export default BrandedClubExample;
