
import React, { useState, useRef } from 'react';
import { Card, CardContent } from '../ui/Card';
import Button from '../ui/Button';
import DownloadIcon from '../icons/DownloadIcon';
import PrinterIcon from '../icons/BriefcaseIcon'; // Using Briefcase as generic if Printer not available, or just standard window.print

const NDAGenerator: React.FC = () => {
    const [recipientName, setRecipientName] = useState('');
    const [recipientType, setRecipientType] = useState('Company'); // Company or Individual
    const [address, setAddress] = useState('');
    const [effectiveDate, setEffectiveDate] = useState(new Date().toISOString().split('T')[0]);
    
    const printRef = useRef<HTMLDivElement>(null);

    const handlePrint = () => {
        const content = printRef.current;
        if (!content) return;

        // Create a hidden iframe to print just the document
        const printWindow = window.open('', '', 'height=800,width=800');
        if (!printWindow) return;

        printWindow.document.write('<html><head><title>Non-Disclosure Agreement</title>');
        printWindow.document.write(`
            <style>
                body { font-family: 'Times New Roman', serif; padding: 40px; line-height: 1.6; color: #000; }
                h1 { text-align: center; font-size: 18pt; text-transform: uppercase; margin-bottom: 30px; text-decoration: underline; }
                h2 { font-size: 12pt; font-weight: bold; margin-top: 20px; text-transform: uppercase; }
                p { margin-bottom: 12px; text-align: justify; font-size: 11pt; }
                ul { margin-bottom: 12px; }
                li { margin-bottom: 8px; font-size: 11pt; }
                .signature-block { margin-top: 50px; display: flex; justify-content: space-between; page-break-inside: avoid; }
                .party { width: 45%; }
                .line { border-bottom: 1px solid #000; margin-top: 40px; margin-bottom: 5px; }
                .label { font-size: 10pt; font-weight: bold; }
                @media print {
                    @page { margin: 2cm; }
                }
            </style>
        `);
        printWindow.document.write('</head><body>');
        printWindow.document.write(content.innerHTML);
        printWindow.document.write('</body></html>');
        printWindow.document.close();
        printWindow.focus();
        printWindow.print();
        printWindow.close();
    };

    const inputClass = "block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm";

    return (
        <div className="space-y-6">
            <Card className="shadow-lg animate-fade-in no-print">
                <CardContent className="p-6">
                    <div className="flex justify-between items-center mb-6">
                        <div>
                            <h3 className="text-2xl font-bold font-display text-gray-900">NDA Generator</h3>
                            <p className="text-sm text-gray-600">Generate a Non-Disclosure Agreement for potential sponsors, advertisers, or club partners.</p>
                        </div>
                        <Button onClick={handlePrint} className="bg-blue-600 text-white hover:bg-blue-700 flex items-center gap-2">
                            <DownloadIcon className="w-4 h-4" /> Print / Save as PDF
                        </Button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-gray-50 p-4 rounded-lg border border-gray-200">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Recipient Name (Company/Club/Person)</label>
                            <input 
                                type="text" 
                                value={recipientName} 
                                onChange={e => setRecipientName(e.target.value)} 
                                className={inputClass} 
                                placeholder="e.g. Mbabane Swallows FC / MTN Eswatini" 
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Recipient Address (City/Region)</label>
                            <input 
                                type="text" 
                                value={address} 
                                onChange={e => setAddress(e.target.value)} 
                                className={inputClass} 
                                placeholder="e.g. Mbabane, Eswatini" 
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Effective Date</label>
                            <input 
                                type="date" 
                                value={effectiveDate} 
                                onChange={e => setEffectiveDate(e.target.value)} 
                                className={inputClass} 
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Entity Type</label>
                            <select 
                                value={recipientType} 
                                onChange={e => setRecipientType(e.target.value)} 
                                className={inputClass}
                            >
                                <option value="Company">Corporate Entity / Company</option>
                                <option value="Club">Football Club</option>
                                <option value="Individual">Individual</option>
                            </select>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Document Preview */}
            <div className="bg-gray-200 p-8 rounded-lg overflow-auto">
                <div 
                    ref={printRef}
                    className="bg-white mx-auto shadow-2xl p-[1in] max-w-[8.5in] min-h-[11in] text-black font-serif text-sm leading-relaxed"
                >
                    <h1>MUTUAL NON-DISCLOSURE AGREEMENT</h1>

                    <p>
                        This Mutual Non-Disclosure Agreement (the "Agreement") is entered into on <strong>{new Date(effectiveDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}</strong> (the "Effective Date"), by and between:
                    </p>

                    <p>
                        <strong>Football Eswatini (App)</strong>, represented by its administration/owners, with its principal place of business in Eswatini (hereinafter referred to as the "Disclosing Party");
                    </p>

                    <p style={{ textAlign: 'center', fontWeight: 'bold', margin: '10px 0' }}>AND</p>

                    <p>
                        <strong>{recipientName || '[RECIPIENT NAME]'}</strong>, a {recipientType} with its principal address at {address || '[ADDRESS]'} (hereinafter referred to as the "Receiving Party").
                    </p>

                    <p>
                        The Disclosing Party and the Receiving Party may be referred to individually as a "Party" and collectively as the "Parties."
                    </p>

                    <h2>1. Purpose</h2>
                    <p>
                        The Parties wish to explore a potential business relationship regarding sponsorship, advertising, club management integration, or strategic partnership (the "Purpose"). In connection with the Purpose, the Disclosing Party may disclose certain confidential technical and business information to the Receiving Party.
                    </p>

                    <h2>2. Confidential Information</h2>
                    <p>
                        "Confidential Information" means all information disclosed by the Disclosing Party to the Receiving Party, whether orally or in writing, that is designated as confidential or that reasonably should be understood to be confidential given the nature of the information and the circumstances of disclosure. This includes, but is not limited to:
                    </p>
                    <ul>
                        <li>User data, analytics, traffic statistics, and demographic insights regarding the Football Eswatini App.</li>
                        <li>Sponsorship rate cards, financial models, and strategic advertising plans.</li>
                        <li>Unreleased features, software code, algorithms, designs, and technical documentation.</li>
                        <li>Business strategies, marketing plans, and operational methods.</li>
                    </ul>

                    <h2>3. Obligations of Receiving Party</h2>
                    <p>The Receiving Party agrees to:</p>
                    <ul>
                        <li>Hold the Confidential Information in strict confidence and take reasonable precautions to protect it.</li>
                        <li>Not disclose any Confidential Information to any third party without the prior written consent of the Disclosing Party.</li>
                        <li>Use the Confidential Information solely for the Purpose of evaluating the potential business relationship.</li>
                    </ul>

                    <h2>4. Exclusions</h2>
                    <p>Confidential Information does not include information that:</p>
                    <ul>
                        <li>Is or becomes generally known to the public without breach of this Agreement.</li>
                        <li>Was known to the Receiving Party prior to its disclosure by the Disclosing Party.</li>
                        <li>Is independently developed by the Receiving Party without use of the Confidential Information.</li>
                    </ul>

                    <h2>5. Term</h2>
                    <p>
                        The obligations of this Agreement shall survive for a period of two (2) years from the Effective Date.
                    </p>

                    <h2>6. Governing Law</h2>
                    <p>
                        This Agreement shall be governed by and construed in accordance with the laws of the Kingdom of Eswatini. Any disputes arising from this Agreement shall be subject to the exclusive jurisdiction of the courts of Eswatini.
                    </p>

                    <div className="signature-block" style={{ display: 'flex', justifyContent: 'space-between', marginTop: '60px' }}>
                        <div className="party" style={{ width: '45%' }}>
                            <p><strong>Signed for: Football Eswatini</strong></p>
                            <div className="line" style={{ borderBottom: '1px solid black', marginTop: '40px', marginBottom: '5px' }}></div>
                            <div className="label">Authorized Signature</div>
                            <div className="line" style={{ borderBottom: '1px solid black', marginTop: '30px', marginBottom: '5px' }}></div>
                            <div className="label">Name & Title</div>
                        </div>

                        <div className="party" style={{ width: '45%' }}>
                            <p><strong>Signed for: {recipientName || '[RECIPIENT NAME]'}</strong></p>
                            <div className="line" style={{ borderBottom: '1px solid black', marginTop: '40px', marginBottom: '5px' }}></div>
                            <div className="label">Authorized Signature</div>
                            <div className="line" style={{ borderBottom: '1px solid black', marginTop: '30px', marginBottom: '5px' }}></div>
                            <div className="label">Name & Title</div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default NDAGenerator;
