
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
    | 'PROPOSAL_TEAM' | 'PROPOSAL_ADVERTISER' | 'PROPOSAL_SPONSOR' 
    | 'CONTRACT_TEAM' | 'CONTRACT_ADVERTISER' | 'CONTRACT_SPONSOR'
    | 'LETTER_SPONSORSHIP' | 'LETTER_INTRO' | 'LETTER_EWFA' | 'LETTER_FINANCE_SPON';

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
    const [selectedDoc, setSelectedDoc] = useState<DocType>('LETTER_FINANCE_SPON');
    
    const [fields, setFields] = useState<FormFields>({
        recipientName: 'The Marketing Manager',
        recipientTitle: 'Strategic Partnerships Division',
        organization: 'First Finance Company',
        address: 'Mbabane / Manzini / Nhlangano Branches',
        date: new Date().toISOString().split('T')[0],
        amount: '50,000.00',
        duration: '12 Months',
        effectiveDate: new Date().toISOString().split('T')[0],
        scopeOfWork: 'Seed Sponsorship for the Digital Transformation of Eswatini Football and Regional Talent Development.'
    });

    const handlePrint = () => {
        window.print();
    };

    const updateField = (name: keyof FormFields, value: string) => {
        setFields(prev => ({ ...prev, [name]: value }));
    };

    const docItems: { type: DocType; label: string; category: DocCategory; icon: any }[] = [
        { type: 'LETTER_FINANCE_SPON', label: 'Finance Sponsorship', category: 'letters', icon: BuildingIcon },
        { type: 'LETTER_EWFA', label: 'EWFA Intro Letter', category: 'letters', icon: GlobeIcon },
        { type: 'LETTER_SPONSORSHIP', label: 'Sponsorship Request', category: 'letters', icon: BuildingIcon },
        { type: 'LETTER_INTRO', label: 'Introduction Letter', category: 'letters', icon: GlobeIcon },
        { type: 'PROPOSAL_TEAM', label: 'Team Onboarding Pitch', category: 'proposals', icon: ShieldCheckIcon },
        { type: 'PROPOSAL_ADVERTISER', label: 'Advertising Proposal', category: 'proposals', icon: MegaphoneIcon },
        { type: 'PROPOSAL_SPONSOR', label: 'Sponsorship Strategy', category: 'proposals', icon: BriefcaseIcon },
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
                                        <label className="block text-[10px] font-black uppercase text-gray-400 mb-1">Recipient/Official Name</label>
                                        <input value={fields.recipientName} onChange={e => updateField('recipientName', e.target.value)} className={inputClass} />
                                    </div>
                                    <div>
                                        <label className="block text-[10px] font-black uppercase text-gray-400 mb-1">Recipient Title</label>
                                        <input value={fields.recipientTitle} onChange={e => updateField('recipientTitle', e.target.value)} className={inputClass} />
                                    </div>
                                    <div>
                                        <label className="block text-[10px] font-black uppercase text-gray-400 mb-1">Target Association</label>
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
                                        <label className="block text-[10px] font-black uppercase text-gray-400 mb-1">Sponsorship Amount (E)</label>
                                        <input type="text" value={fields.amount} onChange={e => updateField('amount', e.target.value)} className={inputClass} />
                                    </div>
                                    <div>
                                        <label className="block text-[10px] font-black uppercase text-gray-400 mb-1">Subject / Objective</label>
                                        <textarea value={fields.scopeOfWork} onChange={e => updateField('scopeOfWork', e.target.value)} className={inputClass} rows={4}></textarea>
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
                <p>legal@footballeswatini.sz</p>
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

    switch (type) {
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
                        
                        <h2 className="text-xl font-black uppercase underline decoration-primary decoration-2 underline-offset-4 mb-8 text-gray-900 leading-tight">
                            SUBJECT: PROPOSAL FOR STRATEGIC SEED SPONSORSHIP OF THE FOOTBALL ESWATINI DIGITAL PLATFORM
                        </h2>

                        <div className={bodyStyle}>
                            <p>Dear Sir/Madam,</p>
                            <p>On behalf of the <strong>Football Eswatini</strong> development team, I am writing to propose a landmark partnership with <strong>First Finance Company</strong> to become the official "Seed Sponsor" of our national digital football ecosystem.</p>
                            <p>Our platform serves as the Kingdom's centralized digital infrastructure for the beautiful game, reaching thousands of fans, players, and officials daily across your key operational hubs in <strong>Mbabane, Manzini, and Nhlangano</strong>. As a leader in financial services, we believe First Finance is uniquely positioned to align with our mission of empowering local communities through sports and technology.</p>
                            <p><strong>Why Partner with Football Eswatini?</strong></p>
                            <ul className="list-disc pl-8 space-y-3">
                                <li><strong>Dominant Local Reach:</strong> Our app is the primary source for MTN Premier League, NFD, and Regional League data, offering First Finance unparalleled visibility in high-traffic digital zones.</li>
                                <li><strong>Community Synergy:</strong> By supporting our regional hubs in Manzini and Nhlangano, your brand will be directly associated with the growth of grassroots football and youth development.</li>
                                <li><strong>Digital Innovation:</strong> Align your brand with the first Eswatini sports platform to utilize Artificial Intelligence for match summaries and scout-ready player analytics.</li>
                                <li><strong>Direct Commercial Integration:</strong> We offer "Contextual Financial Advertising," allowing you to place lending and savings product banners directly within match centers and news feeds.</li>
                            </ul>
                            <p>We are seeking a seed sponsorship of <strong>E{fields.amount}</strong> for a duration of <strong>{fields.duration}</strong>. These funds will be strictly utilized for: <em>{fields.scopeOfWork}</em></p>
                            <p>We would welcome the opportunity to meet with your marketing team at your convenience to demonstrate the platform's capabilities and discuss how we can tailor this partnership to meet First Finance’s strategic objectives.</p>
                            <p className="mt-12">Yours Faithfully,</p>
                            <div className="mt-2">
                                <div className="h-12 w-48 border-b border-gray-400 mb-2"></div>
                                <p className="font-black text-primary">Technical & Operations Lead</p>
                                <p className="text-gray-500 font-medium italic">Football Eswatini News Platform</p>
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
                        
                        <h2 className="text-xl font-black uppercase underline decoration-primary decoration-2 underline-offset-4 mb-8 text-gray-900 leading-tight">
                            SUBJECT: STRATEGIC PARTNERSHIP FOR THE DIGITAL TRANSFORMATION OF WOMEN'S FOOTBALL
                        </h2>

                        <div className={bodyStyle}>
                            <p>Dear {fields.recipientName},</p>
                            <p>On behalf of the <strong>Football Eswatini Digital Platform</strong>, I am writing to propose a strategic collaboration between our organizations aimed at elevating the professional status and digital visibility of women’s football in the Kingdom.</p>
                            <p>We recognize the immense talent within the MTN Women’s Football League and our national squad, <em>Sitsebe SaMhlekazi</em>. However, digital accessibility for fans, scouts, and sponsors remains a critical infrastructure gap. To address this, we propose the integration of a dedicated <strong>"Women’s Football Digital Hub"</strong> within our ecosystem.</p>
                            <p>The proposed benefits to the EWFA and its member clubs include:</p>
                            <ul className="list-disc pl-8 space-y-3">
                                <li><strong>Professional Data Management:</strong> Real-time match centers for the league, including live scorers, updated logs, and player disciplinary records.</li>
                                <li><strong>Global Talent Visibility:</strong> Verified digital profiles for national team players, including statistics and video highlights accessible to international scouts.</li>
                                <li><strong>Commercial Empowerment:</strong> Integrated storefronts for clubs to sell replicas and tickets, and dedicated ad-inventory for EWFA partners.</li>
                                <li><strong>Fan Engagement:</strong> Interactive "Woman of the Match" voting and community forums to build a sustainable local fan base.</li>
                            </ul>
                            <p>Our objective is <strong>{fields.scopeOfWork}</strong>. We are prepared to commit our technical resources to ensure the EWFA has a world-class digital home that reflects the prestige of the beautiful game.</p>
                            <p>We would value the opportunity to present a formal technical demonstration to your executive committee at your earliest convenience.</p>
                            <p className="mt-12">Sincerely,</p>
                            <div className="mt-2">
                                <p className="font-black text-primary">Technical Director</p>
                                <p className="text-gray-500 font-medium italic">Football Eswatini Digital Hub</p>
                            </div>
                        </div>
                    </div>
                    <Footer refCode={`FE-LTR-EWFA-STRAT`} />
                </>
            );

        case 'LETTER_SPONSORSHIP':
            return (
                <>
                    <Header />
                    <div className="p-12 flex-grow">
                        <div className="mb-10 font-serif">
                            <p className="font-bold mb-4">{formattedDate}</p>
                            <p>To,</p>
                            <p className="font-black uppercase text-gray-900">{fields.recipientTitle}</p>
                            <p className="font-bold text-gray-900">{fields.organization}</p>
                        </div>
                        <div className={bodyStyle}>
                            <p>Dear {fields.recipientName},</p>
                            <p>I am writing to invite <strong>{fields.organization}</strong> to become an official strategic sponsor of the Kingdom’s most advanced digital sports infrastructure project.</p>
                            <p>Our mission is to digitize grassroots and regional football, providing a platform for local talent to be seen globally. We are specifically seeking a partnership to support: <strong>{fields.scopeOfWork}</strong>.</p>
                            <p>We are requesting a seed sponsorship of <strong>E{fields.amount}</strong> to facilitate our regional expansion.</p>
                        </div>
                    </div>
                    <Footer refCode={`FE-LTR-SPON`} />
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
