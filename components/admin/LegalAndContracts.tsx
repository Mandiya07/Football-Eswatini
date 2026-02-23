import React, { useState } from 'react';
import { Card, CardContent } from '../ui/Card';
import Button from '../ui/Button';
import DownloadIcon from '../icons/DownloadIcon';
import ScaleIcon from '../icons/ScaleIcon';
import FileTextIcon from '../icons/FileTextIcon';
import ShieldCheckIcon from '../icons/ShieldCheckIcon';
import MegaphoneIcon from '../icons/MegaphoneIcon';
import BriefcaseIcon from '../icons/BriefcaseIcon';
import Logo from '../Logo';
import BuildingIcon from '../icons/BuildingIcon';
import GlobeIcon from '../icons/GlobeIcon';
import CheckCircleIcon from '../icons/CheckCircleIcon';

type DocCategory = 'proposals' | 'contracts' | 'letters' | 'legal';

type DocType = 
    | 'NDA' 
    | 'PROPOSAL_TEAM' | 'PROPOSAL_ADVERTISER' | 'PROPOSAL_SPONSOR' | 'PROPOSAL_EU'
    | 'CONTRACT_TEAM' | 'CONTRACT_ADVERTISER' | 'CONTRACT_SPONSOR'
    | 'LETTER_SPONSORSHIP' | 'LETTER_INTRO' | 'LETTER_EWFA' | 'LETTER_FINANCE_SPON' | 'LETTER_RFA_COLLAB'
    | 'LETTER_DELTAPAY';

interface FormFields {
    recipientName: string;
    recipientTitle: string;
    organization: string;
    address: string;
    date: string;
    amount: string;
    duration: string;
    effectiveDate: string;
    scopeOfWork: string;
}

const LegalAndContracts: React.FC = () => {
    const [activeCategory, setActiveCategory] = useState<DocCategory>('letters');
    const [selectedDoc, setSelectedDoc] = useState<DocType>('LETTER_DELTAPAY');
    
    const [fields, setFields] = useState<FormFields>({
        recipientName: 'The Strategic Partnerships Director',
        recipientTitle: 'DeltaPay Eswatini',
        organization: 'DeltaPay Solutions',
        address: 'Mbabane, Eswatini',
        date: new Date().toISOString().split('T')[0],
        amount: '75,000.00',
        duration: '24 Months',
        effectiveDate: new Date().toISOString().split('T')[0],
        scopeOfWork: 'Exclusive Digital Payment Integration and Seed Infrastructure Support.'
    });

    const handlePrint = () => {
        window.print();
    };

    const updateField = (name: keyof FormFields, value: string) => {
        setFields(prev => ({ ...prev, [name]: value }));
    };

    const docItems: { type: DocType; label: string; category: DocCategory; icon: any }[] = [
        { type: 'LETTER_DELTAPAY', label: 'DeltaPay Seed Pitch', category: 'letters', icon: ShieldCheckIcon },
        { type: 'LETTER_RFA_COLLAB', label: 'RFA Collab Request', category: 'letters', icon: GlobeIcon },
        { type: 'LETTER_FINANCE_SPON', label: 'Finance Sponsorship', category: 'letters', icon: BuildingIcon },
        { type: 'LETTER_EWFA', label: 'EWFA Intro Letter', category: 'letters', icon: GlobeIcon },
        { type: 'LETTER_SPONSORSHIP', label: 'Sponsorship Request', category: 'letters', icon: BuildingIcon },
        { type: 'LETTER_INTRO', label: 'Introduction Letter', category: 'letters', icon: GlobeIcon },
        { type: 'PROPOSAL_TEAM', label: 'Team Onboarding Pitch', category: 'proposals', icon: ShieldCheckIcon },
        { type: 'PROPOSAL_ADVERTISER', label: 'Advertising Proposal', category: 'proposals', icon: MegaphoneIcon },
        { type: 'PROPOSAL_SPONSOR', label: 'Sponsorship Strategy', category: 'proposals', icon: BriefcaseIcon },
        { type: 'PROPOSAL_EU', label: 'EU Funding Proposal', category: 'proposals', icon: GlobeIcon },
        { type: 'CONTRACT_TEAM', label: 'Club Service Agreement', category: 'contracts', icon: FileTextIcon },
        { type: 'CONTRACT_ADVERTISER', label: 'Ad Placement Contract', category: 'contracts', icon: MegaphoneIcon },
        { type: 'CONTRACT_SPONSOR', label: 'Sponsorship Agreement', category: 'contracts', icon: BriefcaseIcon },
        { type: 'NDA', label: 'Mutual Non-Disclosure', category: 'legal', icon: ScaleIcon },
    ];

    const inputClass = "block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-primary focus:border-transparent sm:text-sm outline-none transition-all";

    return (
        <div className="space-y-6">
            <Card className="shadow-lg animate-fade-in no-print">
                <CardContent className="p-6">
                    <div className="flex flex-col md:flex-row justify-between items-center gap-4 mb-8">
                        <div className="flex items-center gap-3">
                            <div className="bg-blue-100 p-2 rounded-lg text-blue-700">
                                <ScaleIcon className="w-6 h-6" />
                            </div>
                            <div>
                                <h3 className="text-2xl font-bold font-display text-gray-900">Legal & Contracts Suite</h3>
                                <p className="text-sm text-gray-500">Professional documentation for the Football Eswatini network.</p>
                            </div>
                        </div>
                        <Button onClick={handlePrint} className="bg-primary text-white hover:bg-primary-dark flex items-center gap-2 h-11 px-6 shadow-md">
                            <DownloadIcon className="w-5 h-5" /> Export to PDF / Print
                        </Button>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                        <div className="lg:col-span-3 space-y-6">
                            <div className="flex bg-gray-100 p-1 rounded-xl w-full">
                                {(['proposals', 'contracts', 'letters', 'legal'] as DocCategory[]).map(cat => (
                                    <button 
                                        key={cat}
                                        onClick={() => {
                                            setActiveCategory(cat);
                                            const firstInCat = docItems.find(i => i.category === cat);
                                            if (firstInCat) setSelectedDoc(firstInCat.type);
                                        }}
                                        className={`flex-1 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${activeCategory === cat ? 'bg-white shadow text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
                                    >
                                        {cat}
                                    </button>
                                ))}
                            </div>
                            
                            <div className="space-y-1">
                                {docItems.filter(item => item.category === activeCategory).map(item => (
                                    <button
                                        key={item.type}
                                        onClick={() => setSelectedDoc(item.type)}
                                        className={`w-full text-left px-4 py-3 rounded-xl text-sm font-bold flex items-center justify-between transition-all ${selectedDoc === item.type ? 'bg-primary text-white shadow-lg' : 'text-gray-600 hover:bg-gray-50'}`}
                                    >
                                        <div className="flex items-center gap-3">
                                            <item.icon className={`w-4 h-4 ${selectedDoc === item.type ? 'text-white' : 'text-gray-400'}`} />
                                            {item.label}
                                        </div>
                                        {selectedDoc === item.type && <div className="w-1.5 h-1.5 bg-accent rounded-full animate-pulse"></div>}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="lg:col-span-9 bg-gray-50 p-6 rounded-2xl border border-gray-200">
                            <h4 className="font-bold text-gray-900 mb-6 flex items-center gap-2 uppercase text-xs tracking-[0.2em]">
                                Document Variables
                            </h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-[10px] font-black uppercase text-gray-400 mb-1">Recipient Name</label>
                                        <input value={fields.recipientName} onChange={e => updateField('recipientName', e.target.value)} className={inputClass} />
                                    </div>
                                    <div>
                                        <label className="block text-[10px] font-black uppercase text-gray-400 mb-1">Recipient Title</label>
                                        <input value={fields.recipientTitle} onChange={e => updateField('recipientTitle', e.target.value)} className={inputClass} />
                                    </div>
                                    <div>
                                        <label className="block text-[10px] font-black uppercase text-gray-400 mb-1">Organization</label>
                                        <input value={fields.organization} onChange={e => updateField('organization', e.target.value)} className={inputClass} />
                                    </div>
                                    <div>
                                        <label className="block text-[10px] font-black uppercase text-gray-400 mb-1">Address</label>
                                        <input value={fields.address} onChange={e => updateField('address', e.target.value)} className={inputClass} />
                                    </div>
                                </div>
                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-[10px] font-black uppercase text-gray-400 mb-1">Date of Issue</label>
                                        <input type="date" value={fields.effectiveDate} onChange={e => updateField('effectiveDate', e.target.value)} className={inputClass} />
                                    </div>
                                    <div>
                                        <label className="block text-[10px] font-black uppercase text-gray-400 mb-1">Amount (E) / Duration</label>
                                        <div className="flex gap-2">
                                            <input value={fields.amount} onChange={e => updateField('amount', e.target.value)} className={inputClass} placeholder="Amount" />
                                            <input value={fields.duration} onChange={e => updateField('duration', e.target.value)} className={inputClass} placeholder="Duration" />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-[10px] font-black uppercase text-gray-400 mb-1">Subject / Scope</label>
                                        <textarea value={fields.scopeOfWork} onChange={e => updateField('scopeOfWork', e.target.value)} className={inputClass} rows={2}></textarea>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>

            <div className="flex justify-center pb-20">
                <div className="bg-white shadow-2xl rounded-sm border border-gray-200 mx-auto w-full max-w-[8.5in] min-h-[11in] flex flex-col print:shadow-none print:border-0 print:m-0 animate-in fade-in zoom-in-95 duration-500">
                    <DocumentRenderer type={selectedDoc} fields={fields} />
                </div>
            </div>

            <style>{`
                @media print {
                    .no-print { display: none !important; }
                    body { background: white !important; padding: 0 !important; margin: 0 !important; }
                    main { padding: 0 !important; margin: 0 !important; }
                    header, footer, aside, nav { display: none !important; }
                    .bg-eswatini-pattern { background: white !important; }
                    .bg-eswatini-pattern::before { display: none !important; }
                    * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
                    @page { margin: 1.5cm; size: A4; }
                }
            `}</style>
        </div>
    );
};

const DocumentRenderer: React.FC<{ type: DocType; fields: FormFields }> = ({ type, fields }) => {
    const formattedDate = new Date(fields.effectiveDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });

    const Header = () => (
        <div className="p-12 pb-8 flex justify-between items-start border-b-2 border-primary/20">
            <div className="flex flex-col gap-2">
                <Logo className="h-14 w-auto" />
                <div className="text-[10px] font-black uppercase tracking-[0.2em] text-primary">
                    Digital Sports Infrastructure & Analytics
                </div>
            </div>
            <div className="text-right text-[10px] text-gray-500 font-bold uppercase tracking-tighter leading-tight">
                <p>Football Eswatini Operations Hub</p>
                <p>Sigwaca House, Mbabane</p>
                <p>Kingdom of Eswatini</p>
                <p>ops@footballeswatini.sz</p>
            </div>
        </div>
    );

    const Footer = ({ refCode }: { refCode: string }) => (
        <div className="p-12 pt-0 mt-auto">
            <div className="bg-primary h-1 w-full mb-4"></div>
            <div className="flex justify-between items-center text-[9px] font-black uppercase tracking-widest text-gray-400">
                <span className="flex items-center gap-2">
                    <CheckCircleIcon className="w-3 h-3"/> Official Document of Football Eswatini
                </span>
                <span>Serial: {refCode}-{new Date().getFullYear()}</span>
            </div>
        </div>
    );

    const bodyStyle = "space-y-6 text-[11pt] leading-relaxed text-gray-800 text-justify font-serif";
    const subTitle = "text-xl font-black uppercase underline decoration-primary decoration-2 underline-offset-4 mb-8 text-gray-900 leading-tight";

    switch (type) {
        case 'PROPOSAL_EU':
            return (
                <>
                    <Header />
                    <div className="p-12 flex-grow font-serif">
                        <div className="mb-10">
                            <p className="font-bold mb-4">{formattedDate}</p>
                            <p>To,</p>
                            <p className="font-black uppercase text-gray-900">The Delegation of the European Union to Eswatini</p>
                            <p className="font-bold text-gray-900">Mbabane Office Park</p>
                            <p className="text-gray-600">Mbabane, Eswatini</p>
                        </div>
                        
                        <h2 className={subTitle}>
                            SUBJECT: REQUEST FOR FINANCIAL ASSISTANCE FOR DIGITAL INFRASTRUCTURE AND STARTUP OPERATIONS OF "FOOTBALL ESWATINI"
                        </h2>
                        
                        <div className={bodyStyle}>
                            <p>Dear Sir/Madam,</p>
                            <p>I am writing to formally submit a proposal for financial assistance regarding the initial setup and operational sustainability of <strong>Football Eswatini</strong>, a comprehensive digital gateway dedicated to the growth and professionalization of football within the Kingdom of Eswatini.</p>
                            <p>Football Eswatini is designed to serve as the unified digital infrastructure for the nation's most beloved sport. Our platform provides real-time match tracking, league management, youth development spotlights, and a community hub that connects fans, players, and administrators across all four regions of the Kingdom.</p>
                            
                            <p className="font-bold uppercase text-sm tracking-widest mt-8">Funding Requirements</p>
                            <p>To ensure the long-term viability and official standing of this initiative, we are seeking support for the following critical areas:</p>
                            
                            <ul className="list-disc pl-8 space-y-3">
                                <li><strong>Business Registration & Legal Compliance:</strong> Formalizing the entity as a registered non-profit or social enterprise to ensure transparency and governance. (Est: €1,200)</li>
                                <li><strong>Domain Acquisition & Multi-year Hosting:</strong> Securing the official .sz domain and high-performance cloud hosting. (Est: €2,500 / 3 years)</li>
                                <li><strong>Cloud Infrastructure & Real-time Data Services:</strong> Implementation of robust database systems and API integrations for live score updates. (Est: €4,800 / year)</li>
                                <li><strong>Initial Operational Costs:</strong> Essential hardware, connectivity, and administrative expenses for the first 24 months. (Est: €12,000)</li>
                            </ul>

                            <div className="bg-gray-50 p-6 rounded-xl border border-gray-200 my-8">
                                <p className="text-xs font-black uppercase tracking-widest text-gray-400 mb-2">Total Funding Request (Initial Phase)</p>
                                <p className="text-3xl font-black text-primary">€20,500</p>
                            </div>

                            <p>The European Union's support would not only facilitate the birth of a technological tool but would actively contribute to the <strong>Digital Transformation</strong> of Eswatini's sports sector. By providing visibility to youth and women's leagues, we aim to foster talent discovery and community cohesion.</p>
                            
                            <p>We would welcome the opportunity to discuss this proposal in further detail or provide a live demonstration of the platform's current capabilities.</p>
                            
                            <p className="mt-12">Yours Faithfully,</p>
                            <div className="mt-2">
                                <p className="font-black text-primary">The Project Lead</p>
                                <p className="text-gray-500 font-medium italic">Football Eswatini Initiative</p>
                            </div>
                        </div>
                    </div>
                    <Footer refCode={`FE-EU-FUNDING-PROP`} />
                </>
            );

        case 'LETTER_DELTAPAY':
            return (
                <>
                    <Header />
                    <div className="p-12 flex-grow font-serif">
                        <div className="mb-10">
                            <p className="font-bold mb-4">{formattedDate}</p>
                            <p>To,</p>
                            <p className="font-black uppercase text-gray-900">{fields.recipientName}</p>
                            <p className="font-bold text-gray-900">{fields.organization}</p>
                            <p className="text-gray-600">{fields.address}</p>
                        </div>
                        
                        <h2 className={subTitle}>
                            SUBJECT: PROPOSAL FOR EXCLUSIVE SEED SPONSORSHIP & FINANCIAL TECHNOLOGY INTEGRATION
                        </h2>

                        <div className={bodyStyle}>
                            <p>Dear {fields.recipientName.split(' ').pop()},</p>
                            <p>At <strong>Football Eswatini</strong>, we believe that the beauty of the game lies in its precision and pace—values we know are shared by <strong>DeltaPay</strong>. I am writing to propose a landmark collaboration that would establish DeltaPay as the exclusive <strong>Strategic Seed Sponsor</strong> and the <strong>Official Digital Payment Partner</strong> of our national digital football ecosystem.</p>
                            <p>We are building a platform where transactions for tickets, merchandise, and premium scouting access are as seamless as a perfectly executed counter-attack. As a pioneer in secure and swift payment solutions, DeltaPay is the ideal partner to power the commercial heartbeat of Eswatini football.</p>
                            <p><strong>Strategic Benefits for DeltaPay:</strong></p>
                            <ul className="list-disc pl-8 space-y-3">
                                <li><strong>Contextual Market Dominance:</strong> DeltaPay will be integrated as the sole processing rail for our "Direct-to-Fan" marketplace, reaching 50,000+ monthly active users at the exact moment of purchase.</li>
                                <li><strong>Brand Alignment with Modernization:</strong> By serving as our Seed Sponsor, DeltaPay will be credited with the digitalization of the MTN Premier League and Regional Super Leagues, positioning the brand at the forefront of the Kingdom’s technological evolution.</li>
                                <li><strong>High-Frequency Visibility:</strong> DeltaPay branding will be hard-coded into our "Match Ticker" and "Live Commentary" zones—our highest traffic areas—ensuring millions of impressions during match weeks.</li>
                            </ul>
                            <p>We are seeking a seed commitment of <strong>E{fields.amount}</strong> to finalize the digitalization of our regional hubs. In return, we offer DeltaPay full branding rights within the "Merchant & Payouts" admin section and exclusive logo placement across all national fixtures.</p>
                            <p>We would value a meeting to demonstrate how our "Seamless Transaction" vision perfectly mirrors your own.</p>
                            <p className="mt-12">Yours Faithfully,</p>
                            <div className="mt-2">
                                <p className="font-black text-primary">Technical & Operations Lead</p>
                            </div>
                        </div>
                    </div>
                    <Footer refCode={`FE-DELTAPAY-SEED-REQ`} />
                </>
            );

        case 'LETTER_RFA_COLLAB':
            return (
                <>
                    <Header />
                    <div className="p-12 flex-grow font-serif">
                        <div className="mb-10">
                            <p className="font-bold mb-4">{formattedDate}</p>
                            <p>To,</p>
                            <p className="font-black uppercase text-gray-900">{fields.recipientName}</p>
                            <p className="font-bold text-gray-900">{fields.recipientTitle}</p>
                            <p className="text-gray-600">{fields.address}</p>
                        </div>
                        
                        <h2 className={subTitle}>
                            SUBJECT: PROPOSAL FOR COLLABORATION ON DIGITAL MATCH CENTER INTEGRATION
                        </h2>

                        <div className={bodyStyle}>
                            <p>Dear {fields.recipientName.split(' ').pop()},</p>
                            <p>I am writing on behalf of the <strong>Football Eswatini</strong> digital platform to formally introduce our comprehensive sports infrastructure and to propose a strategic collaboration with the <strong>{fields.recipientTitle}</strong> and its affiliated leagues.</p>
                            <p>Our platform has been developed as a world-class digital gateway for football in the Kingdom, centralizing data from the elite level down to grassroots development. We recognize the {fields.recipientTitle} as a vital pillar of our football landscape, overseeing high-stakes regional super leagues and promotional divisions.</p>
                            <p><strong>Proposed Collaboration Points:</strong></p>
                            <ul className="list-disc pl-8 space-y-3">
                                <li><strong>Real-Time Results & Standing Sync:</strong> We seek to establish a verified workflow where your association provides official results (via match sheets or digital feed), ensuring your regional leagues have live-updated logs accessible to fans and media 24/7.</li>
                                <li><strong>Affiliate Onboarding:</strong> We invite you to introduce the platform to your member clubs. Each club will be granted access to a <em>Professional Management Portal</em> where they can manage their own squad lists, publish club-specific news, and sell merchandise.</li>
                                <li><strong>Talent Visibility:</strong> By digitizing regional leagues, we provide local players with verified performance data, creating a transparent pipeline for national team selection and international scouting.</li>
                            </ul>
                            <p>We would value the opportunity to present a formal demonstration of these tools to your executive committee at your earliest convenience.</p>
                            <p className="mt-12">Yours Faithfully,</p>
                            <div className="mt-2">
                                <p className="font-black text-primary">Technical & Operations Lead</p>
                            </div>
                        </div>
                    </div>
                    <Footer refCode={`FE-RFA-COLLAB-REQ`} />
                </>
            );

        case 'LETTER_INTRO':
            return (
                <>
                    <Header />
                    <div className="p-12 flex-grow font-serif">
                        <div className="mb-10">
                            <p className="font-bold mb-4">{formattedDate}</p>
                            <p>To,</p>
                            <p className="font-black uppercase text-gray-900">{fields.recipientName}</p>
                            <p className="font-bold text-gray-900">{fields.organization}</p>
                            <p className="text-gray-600">{fields.address}</p>
                        </div>
                        <h2 className={subTitle}>SUBJECT: INTRODUCTION TO THE FOOTBALL ESWATINI DIGITAL ECOSYSTEM</h2>
                        <div className={bodyStyle}>
                            <p>Dear {fields.recipientName},</p>
                            <p>We are delighted to formally introduce <strong>Football Eswatini</strong>, the Kingdom's premiere digital sports infrastructure. Our platform is engineered to serve as the definitive "digital gateway" for the beautiful game, uniting fans, players, and officials through real-time data and immersive media coverage.</p>
                            <p>Our ecosystem encompasses the MTN Premier League, the National First Division, and regional super leagues, providing an unprecedented level of visibility for local talent. Key features include live match centers, verified player performance archives, and professional club management portals.</p>
                            <p>As a key stakeholder in Eswatini's sporting landscape, we recognize your pivotal role in the sport's development. We believe our platform offers significant value in tracking progress, identifying talent, and fostering community engagement.</p>
                            <p>We would welcome the opportunity to discuss how our digital infrastructure can support your objectives.</p>
                            <p className="mt-12">Yours Sincerely,</p>
                            <div className="mt-2">
                                <p className="font-black text-primary">Communications Department</p>
                                <p className="text-gray-500 font-medium italic">Football Eswatini Platform</p>
                            </div>
                        </div>
                    </div>
                    <Footer refCode={`FE-INTRO-GEN`} />
                </>
            );

        case 'LETTER_SPONSORSHIP':
            return (
                <>
                    <Header />
                    <div className="p-12 flex-grow font-serif">
                        <div className="mb-10">
                            <p className="font-bold mb-4">{formattedDate}</p>
                            <p>To,</p>
                            <p className="font-black uppercase text-gray-900">{fields.recipientName}</p>
                            <p className="font-bold text-gray-900">{fields.organization}</p>
                        </div>
                        <h2 className={subTitle}>SUBJECT: SUBJECT: STRATEGIC SPONSORSHIP INQUIRY – {fields.scopeOfWork.toUpperCase()}</h2>
                        <div className={bodyStyle}>
                            <p>Dear {fields.recipientName},</p>
                            <p>I am writing to invite <strong>{fields.organization}</strong> to partner with Football Eswatini as a strategic sponsor for our upcoming initiative: <em>{fields.scopeOfWork}</em>.</p>
                            <p>Football Eswatini is the Kingdom's fastest-growing digital sports platform, with an active monthly reach of over 50,000 passionate fans. By sponsoring this project, your brand will gain direct, high-frequency visibility in our high-traffic zones, including live match centers and regional hub landing pages.</p>
                            <p>We are specifically seeking a sponsorship commitment of <strong>E{fields.amount}</strong> for a duration of <strong>{fields.duration}</strong>. These funds will be strictly utilized to enhance the digital visibility of grassroots talent and improve real-time match reporting in the selected regions.</p>
                            <p>We are prepared to offer a customized branding package including title naming rights for the initiative and integrated advertising across all our digital touchpoints.</p>
                            <p>We look forward to discussing this opportunity in further detail.</p>
                            <p className="mt-12">Yours Faithfully,</p>
                            <div className="mt-2">
                                <p className="font-black text-primary">Technical & Operations Lead</p>
                            </div>
                        </div>
                    </div>
                    <Footer refCode={`FE-LTR-SPON`} />
                </>
            );

        case 'PROPOSAL_TEAM':
            return (
                <>
                    <Header />
                    <div className="p-12 flex-grow font-serif">
                        <div className="mb-10">
                            <p className="font-bold mb-4">{formattedDate}</p>
                            <p>To the Management of,</p>
                            <p className="font-black uppercase text-gray-900">{fields.organization}</p>
                        </div>
                        <h2 className={subTitle}>SUBJECT: ONBOARDING PROPOSAL FOR "ELITE TIER" DIGITAL MANAGEMENT</h2>
                        <div className={bodyStyle}>
                            <p>We are pleased to invite <strong>{fields.organization}</strong> to join our "Elite Tier" digital ecosystem. This premium partnership is designed to grant your club full control over its digital identity and commercial potential.</p>
                            <p><strong>Proposed Package Highlights:</strong></p>
                            <ul className="list-disc pl-8 space-y-3">
                                <li><strong>Branded Club Hub:</strong> A dedicated, ad-free microsite customized with your official colors and crest.</li>
                                <li><strong>Official Management Portal:</strong> Direct access for your media team to publish news, manage rosters, and post technical videos.</li>
                                <li><strong>Commercial Integration:</strong> Ability to list replicas, scarfs, and tickets for sale directly to fans within the app.</li>
                                <li><strong>Advanced Analytics:</strong> Monthly insights into fan engagement, player profile views, and demographic trends.</li>
                            </ul>
                            <p>The subscription for this tier is set at <strong>E{fields.amount}</strong> per month. We believe this represents an essential investment in the professionalization of your club's digital footprint.</p>
                            <p className="mt-12">Sincerely,</p>
                            <div className="mt-2">
                                <p className="font-black text-primary">Strategic Partnerships Manager</p>
                            </div>
                        </div>
                    </div>
                    <Footer refCode={`FE-PROP-TEAM`} />
                </>
            );

        case 'CONTRACT_TEAM':
            return (
                <>
                    <Header />
                    <div className="p-12 flex-grow font-serif">
                        <h1 className="text-2xl font-black text-center uppercase mb-12 tracking-tight">CLUB SERVICE LEVEL AGREEMENT (SLA)</h1>
                        <div className={bodyStyle}>
                            <p>This Agreement is made on <strong>{formattedDate}</strong> by and between <strong>Football Eswatini</strong> ("Provider") and <strong>{fields.organization}</strong> ("Club").</p>
                            <p><strong>1. SERVICES PROVIDED:</strong> Provider shall grant the Club access to the Management Portal for a duration of <strong>{fields.duration}</strong>. Services include match log management, squad profiles, news publication, and commercial store listing.</p>
                            <p><strong>2. FEES & PAYMENT:</strong> The Club agrees to a monthly subscription fee of <strong>E{fields.amount}</strong>, payable on the first day of each month. Late payments may result in temporary suspension of portal access.</p>
                            <p><strong>3. DATA OWNERSHIP:</strong> League-wide data (scores/standings) remains the property of the relevant association. Club-specific news, images, and merchandise data remain the property of the Club.</p>
                            <p><strong>4. TERMINATION:</strong> Either party may terminate this agreement with thirty (30) days written notice.</p>
                        </div>
                        <div className="mt-20 flex justify-between gap-10">
                            <div className="flex-1 border-t border-black pt-2 text-xs font-bold uppercase tracking-widest">Provider Authorized</div>
                            <div className="flex-1 border-t border-black pt-2 text-xs font-bold uppercase tracking-widest">Club Official Authorized</div>
                        </div>
                    </div>
                    <Footer refCode={`FE-SLA-CLUB`} />
                </>
            );

        case 'LETTER_FINANCE_SPON':
            return (
                <>
                    <Header />
                    <div className="p-12 flex-grow font-serif">
                        <div className="mb-10">
                            <p className="font-bold mb-4">{formattedDate}</p>
                            <p>To,</p>
                            <p className="font-black uppercase text-gray-900">{fields.recipientName}</p>
                            <p className="font-bold text-gray-900">{fields.organization}</p>
                            <p className="text-gray-600">{fields.address}</p>
                        </div>
                        
                        <h2 className={subTitle}>
                            SUBJECT: PROPOSAL FOR STRATEGIC SEED SPONSORSHIP OF THE FOOTBALL ESWATINI DIGITAL PLATFORM
                        </h2>

                        <div className={bodyStyle}>
                            <p>Dear Sir/Madam,</p>
                            <p>On behalf of the <strong>Football Eswatini</strong> development team, I am writing to propose a landmark partnership with <strong>{fields.organization}</strong> to become the official "Seed Sponsor" of our national digital football ecosystem.</p>
                            <p>Our platform serves as the Kingdom's centralized digital infrastructure for the beautiful game, reaching thousands of fans, players, and officials daily. As a leader in your sector, we believe you are uniquely positioned to align with our mission of empowering local communities through sports and technology.</p>
                            <p>We are seeking a seed sponsorship of <strong>E{fields.amount}</strong> for a duration of <strong>{fields.duration}</strong>. These funds will be strictly utilized for: <em>{fields.scopeOfWork}</em></p>
                            <p className="mt-12">Yours Faithfully,</p>
                            <div className="mt-2">
                                <p className="font-black text-primary">Technical & Operations Lead</p>
                            </div>
                        </div>
                    </div>
                    <Footer refCode={`FE-SPON-FINANCE-PRO`} />
                </>
            );

        case 'LETTER_EWFA':
            return (
                <>
                    <Header />
                    <div className="p-12 flex-grow">
                        <div className="mb-10 font-serif">
                            <p className="font-bold mb-4">{formattedDate}</p>
                            <p>To,</p>
                            <p className="font-black uppercase text-gray-900">{fields.recipientTitle}</p>
                            <p className="font-bold text-gray-900">{fields.organization}</p>
                            <p className="text-gray-600">{fields.address}</p>
                        </div>
                        
                        <h2 className={subTitle}>
                            SUBJECT: STRATEGIC PARTNERSHIP FOR THE DIGITAL TRANSFORMATION OF WOMEN'S FOOTBALL
                        </h2>

                        <div className={bodyStyle}>
                            <p>Dear {fields.recipientName},</p>
                            <p>On behalf of the <strong>Football Eswatini Digital Platform</strong>, I am writing to propose a strategic collaboration between our organizations aimed at elevating the professional status and digital visibility of women’s football in the Kingdom.</p>
                            <p>We recognize the immense talent within the MTN Women’s Football League and our national squad, <em>Sitsebe SaMhlekazi</em>. We propose the integration of a dedicated <strong>"Women’s Football Digital Hub"</strong> within our ecosystem.</p>
                            <p>Our objective is <strong>{fields.scopeOfWork}</strong>. We are prepared to commit our technical resources to ensure the EWFA has a world-class digital home.</p>
                            <p className="mt-12">Sincerely,</p>
                            <div className="mt-2">
                                <p className="font-black text-primary">Technical Director</p>
                            </div>
                        </div>
                    </div>
                    <Footer refCode={`FE-LTR-EWFA-STRAT`} />
                </>
            );

        case 'NDA':
            return (
                <>
                    <Header />
                    <div className="p-12 flex-grow font-serif">
                        <h1 className="text-2xl font-black text-center uppercase mb-12 tracking-tight">MUTUAL NON-DISCLOSURE AGREEMENT</h1>
                        <div className={bodyStyle}>
                            <p>This Mutual Non-Disclosure Agreement is entered into on <strong>{formattedDate}</strong> between <strong>Football Eswatini</strong> and <strong>{fields.organization || fields.recipientName}</strong>.</p>
                            <p><strong>1. PURPOSE:</strong> The parties wish to explore a potential business relationship involving sensitive technical data related to the Football Eswatini application.</p>
                            <p><strong>2. CONFIDENTIALITY:</strong> The Partner agrees to hold all "Confidential Information" in strict confidence and shall not disclose it to any third party.</p>
                            <p><strong>3. SCOPE:</strong> Confidential information includes user analytics, sponsorship structures, and source code proprietary to the Provider.</p>
                        </div>
                        <div className="mt-20 flex justify-between gap-10">
                            <div className="flex-1 border-t border-black pt-2 text-xs font-bold uppercase tracking-widest">Football Eswatini</div>
                            <div className="flex-1 border-t border-black pt-2 text-xs font-bold uppercase tracking-widest">Partner Representative</div>
                        </div>
                    </div>
                    <Footer refCode={`FE-NDA-CONF`} />
                </>
            );

        default:
            return <div className="p-20 text-center text-gray-400 italic font-display">Select a template to render preview...</div>;
    }
};

export default LegalAndContracts;