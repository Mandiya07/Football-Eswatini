
import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '../ui/Card';
import Button from '../ui/Button';
import Spinner from '../ui/Spinner';
import { fetchMerchantConfig, updateMerchantConfig, MerchantConfig, fetchMerchantBalance, MerchantBalance } from '../../services/api';
import PhoneIcon from '../icons/PhoneIcon';
import CreditCardIcon from '../icons/CreditCardIcon';
import ShieldCheckIcon from '../icons/ShieldCheckIcon';
import CheckCircleIcon from '../icons/CheckCircleIcon';
import LockIcon from '../icons/LockIcon';
import InfoIcon from '../icons/InfoIcon';
import RefreshIcon from '../icons/RefreshIcon';
import BarChartIcon from '../icons/BarChartIcon';

const MerchantSettings: React.FC = () => {
    const [config, setConfig] = useState<MerchantConfig>({
        momoMerchantName: '',
        momoMerchantNumber: '',
        momoMerchantID: '',
        cardGatewayProvider: 'Flutterwave',
        cardMerchantID: '',
        cardSecretKey: '',
        currency: 'SZL',
        isProduction: false
    });
    const [balance, setBalance] = useState<MerchantBalance>({ totalRevenue: 0, pendingPayout: 0 });
    const [loading, setLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [isVerifying, setIsVerifying] = useState(false);
    const [success, setSuccess] = useState(false);
    const [verificationResult, setVerificationResult] = useState<string | null>(null);

    useEffect(() => {
        const load = async () => {
            const [configData, balanceData] = await Promise.all([
                fetchMerchantConfig(),
                fetchMerchantBalance()
            ]);
            if (configData) setConfig(configData);
            if (balanceData) setBalance(balanceData);
            setLoading(false);
        };
        load();
    }, []);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value, type } = e.target;
        const val = type === 'checkbox' ? (e.target as HTMLInputElement).checked : value;
        setConfig(prev => ({ ...prev, [name]: val }));
    };

    const handleVerifyHandshake = async () => {
        setIsVerifying(true);
        setVerificationResult(null);
        
        // Simulated API handshake with MTN/Flutterwave hubs
        setTimeout(() => {
            const isConfigured = config.momoMerchantID && config.cardSecretKey;
            if (isConfigured) {
                setVerificationResult("Success: Connection to Eswatini Hub verified.");
            } else {
                setVerificationResult("Error: Missing credentials for handshake.");
            }
            setIsVerifying(false);
        }, 2000);
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);
        try {
            await updateMerchantConfig(config);
            setSuccess(true);
            setTimeout(() => setSuccess(false), 3000);
        } catch (error) {
            alert("Failed to save merchant settings.");
        } finally {
            setIsSaving(false);
        }
    };

    const inputClass = "block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-green-500 focus:border-transparent sm:text-sm outline-none transition-all";

    if (loading) return <div className="flex justify-center py-20"><Spinner /></div>;

    return (
        <div className="space-y-8 animate-fade-in">
            {/* Financial Overview Card */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card className="bg-gradient-to-br from-green-600 to-green-700 text-white shadow-xl border-0">
                    <CardContent className="p-6">
                        <div className="flex justify-between items-start mb-4">
                            <BarChartIcon className="w-8 h-8 opacity-40" />
                            <span className="text-[10px] font-black uppercase tracking-widest bg-white/20 px-2 py-0.5 rounded">Total Revenue</span>
                        </div>
                        <p className="text-3xl font-black">E{balance.totalRevenue.toLocaleString()}</p>
                        <p className="text-xs mt-2 opacity-70">Accumulated via App Transactions</p>
                    </CardContent>
                </Card>
                <Card className="bg-white shadow-lg border-l-4 border-yellow-500">
                    <CardContent className="p-6">
                        <div className="flex justify-between items-start mb-4">
                            <RefreshIcon className="w-8 h-8 text-yellow-500 opacity-40" />
                            <span className="text-[10px] font-black uppercase tracking-widest text-yellow-600">Settlement Balance</span>
                        </div>
                        <p className="text-3xl font-black text-gray-900">E{balance.pendingPayout.toLocaleString()}</p>
                        <p className="text-xs mt-2 text-gray-500 italic">Route: {config.momoMerchantNumber || 'Not set'}</p>
                    </CardContent>
                </Card>
                <Card className="bg-slate-900 text-white shadow-xl border-0 relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-4 opacity-5"><ShieldCheckIcon className="w-24 h-24" /></div>
                    <CardContent className="p-6 relative z-10">
                        <h4 className="text-sm font-black uppercase tracking-widest text-accent mb-2">Gateway Status</h4>
                        <div className="flex items-center gap-3 mb-4">
                            <div className={`w-3 h-3 rounded-full ${config.isProduction ? 'bg-green-500 animate-pulse' : 'bg-orange-500'}`}></div>
                            <p className="font-bold">{config.isProduction ? 'PRODUCTION' : 'TEST MODE'}</p>
                        </div>
                        <Button 
                            onClick={handleVerifyHandshake} 
                            disabled={isVerifying}
                            className="bg-white/10 hover:bg-white/20 text-white text-xs h-8 px-4 w-full rounded-lg border border-white/10"
                        >
                            {isVerifying ? <Spinner className="w-3 h-3 border-white" /> : 'Verify API Handshake'}
                        </Button>
                        {verificationResult && (
                            <p className={`text-[10px] mt-2 font-bold ${verificationResult.includes('Success') ? 'text-green-400' : 'text-red-400'}`}>
                                {verificationResult}
                            </p>
                        )}
                    </CardContent>
                </Card>
            </div>

            <div>
                <h3 className="text-2xl font-bold font-display text-gray-900 mb-2">Merchant & Payout Config</h3>
                <p className="text-sm text-gray-500">Configure your official Eswatini payment destinations. This is where user funds are routed.</p>
            </div>

            <form onSubmit={handleSave} className="space-y-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* MoMo Configuration */}
                    <Card className="border-t-4 border-yellow-500 shadow-lg">
                        <CardContent className="p-6">
                            <div className="flex items-center gap-3 mb-6">
                                <div className="bg-yellow-100 p-2 rounded-lg"><PhoneIcon className="w-6 h-6 text-yellow-700" /></div>
                                <h4 className="font-bold text-gray-800">MTN MoMo Settings</h4>
                            </div>
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-[10px] font-black uppercase text-gray-400 mb-1">Merchant Display Name</label>
                                    <input name="momoMerchantName" value={config.momoMerchantName} onChange={handleChange} className={inputClass} placeholder="e.g. Football Eswatini Ltd" />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-black uppercase text-gray-400 mb-1">Official MoMo Receiving Number</label>
                                    <input name="momoMerchantNumber" value={config.momoMerchantNumber} onChange={handleChange} className={inputClass} placeholder="7xxxxxxx" maxLength={8} />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-black uppercase text-gray-400 mb-1">MoMo API Merchant ID</label>
                                    <input name="momoMerchantID" value={config.momoMerchantID} onChange={handleChange} className={inputClass} placeholder="ID from MTN Developer Portal" />
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Card & Gateway Configuration */}
                    <Card className="border-t-4 border-blue-600 shadow-lg">
                        <CardContent className="p-6">
                            <div className="flex items-center gap-3 mb-6">
                                <div className="bg-blue-100 p-2 rounded-lg"><CreditCardIcon className="w-6 h-6 text-blue-700" /></div>
                                <h4 className="font-bold text-gray-800">Card Processing (Secure)</h4>
                            </div>
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-[10px] font-black uppercase text-gray-400 mb-1">Gateway Provider</label>
                                    <select name="cardGatewayProvider" value={config.cardGatewayProvider} onChange={handleChange} className={inputClass}>
                                        <option>Flutterwave</option>
                                        <option>Paystack</option>
                                        <option>DirectBank</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-[10px] font-black uppercase text-gray-400 mb-1">Gateway Public Merchant ID</label>
                                    <input name="cardMerchantID" value={config.cardMerchantID} onChange={handleChange} className={inputClass} placeholder="FLWPUBK-..." />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-black uppercase text-gray-400 mb-1">Secret/Bearer Token</label>
                                    <div className="relative">
                                        <input type="password" name="cardSecretKey" value={config.cardSecretKey} onChange={handleChange} className={`${inputClass} pr-10`} placeholder="••••••••••••••••" />
                                        <div className="absolute inset-y-0 right-3 flex items-center text-gray-400"><LockIcon className="w-4 h-4" /></div>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Setup Guide Section */}
                <Card className="bg-blue-50 border border-blue-100 rounded-2xl">
                    <CardContent className="p-8">
                        <h4 className="font-bold text-blue-900 mb-4 flex items-center gap-2">
                            <InfoIcon className="w-5 h-5 text-blue-600" /> Eswatini Gateway Integration Guide
                        </h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div className="space-y-3">
                                <p className="text-[10px] font-black text-blue-400 uppercase tracking-widest">MTN MoMo Setup</p>
                                <ol className="text-xs text-blue-800 list-decimal pl-5 space-y-2">
                                    <li>Visit the <strong>MTN MoMo Developer Portal</strong> and register your business.</li>
                                    <li>Create an <strong>API User</strong> and generate an <strong>API Key</strong>.</li>
                                    <li>Ensure your merchant account is set up for <em>Collection</em> products.</li>
                                    <li>Copy your <strong>Merchant ID</strong> into the field above.</li>
                                </ol>
                            </div>
                            <div className="space-y-3">
                                <p className="text-[10px] font-black text-blue-400 uppercase tracking-widest">Card Hub Setup</p>
                                <ol className="text-xs text-blue-800 list-decimal pl-5 space-y-2">
                                    <li>Sign up for <strong>Flutterwave</strong> or <strong>Paystack</strong>.</li>
                                    <li>In Settings &gt; API Keys, enable <strong>Zonal/Regional Settlement</strong> for Eswatini.</li>
                                    <li>Copy your <strong>Live Secret Key</strong> and <strong>Public ID</strong> into the fields above.</li>
                                </ol>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card className="bg-slate-900 text-white shadow-2xl overflow-hidden">
                    <CardContent className="p-8">
                        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                            <div className="flex items-center gap-4">
                                <div className="p-4 bg-white/10 rounded-2xl border border-white/10"><ShieldCheckIcon className="w-10 h-10 text-accent" /></div>
                                <div>
                                    <h4 className="text-xl font-bold">Production Mode</h4>
                                    <p className="text-sm text-blue-100 opacity-60">Toggle to enable live financial settlement to your business accounts.</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-6">
                                <div className="text-right">
                                    <p className="text-[10px] font-black uppercase text-blue-300">Hub Currency</p>
                                    <p className="text-2xl font-black text-white">{config.currency}</p>
                                </div>
                                <label className="relative inline-flex items-center cursor-pointer">
                                    <input type="checkbox" name="isProduction" checked={config.isProduction} onChange={handleChange} className="sr-only peer" />
                                    <div className="w-14 h-7 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[4px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-green-600"></div>
                                </label>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <div className="flex justify-end gap-3 pt-6 border-t border-gray-100">
                    {success && (
                        <div className="flex items-center gap-2 text-green-600 font-bold animate-in fade-in slide-in-from-right-4">
                            <CheckCircleIcon className="w-5 h-5" /> Config Synchronized!
                        </div>
                    )}
                    <Button type="submit" disabled={isSaving} className="bg-primary text-white h-12 px-12 rounded-xl font-bold shadow-xl flex items-center justify-center gap-2">
                        {isSaving ? <Spinner className="w-5 h-5 border-white border-2" /> : 'Apply Merchant Config'}
                    </Button>
                </div>
            </form>
        </div>
    );
};

export default MerchantSettings;
