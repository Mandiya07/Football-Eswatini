
import React, { useState } from 'react';
import { validatePromoCode, PromoCode } from '../../services/api';
import Button from './Button';
import Spinner from './Spinner';
import CheckCircleIcon from '../icons/CheckCircleIcon';
import TagIcon from '../icons/TagIcon';

interface PromoCodeInputProps {
    onApply: (discount: PromoCode | null) => void;
    label?: string;
}

const PromoCodeInput: React.FC<PromoCodeInputProps> = ({ onApply, label = "Have a Promo Code?" }) => {
    const [code, setCode] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [appliedCode, setAppliedCode] = useState<PromoCode | null>(null);

    const handleApply = async () => {
        if (!code.trim()) return;
        
        setLoading(true);
        setError('');
        
        try {
            const discount = await validatePromoCode(code.trim().toUpperCase());
            if (discount) {
                setAppliedCode(discount);
                onApply(discount);
                setCode('');
            } else {
                setError('Invalid or expired code.');
                onApply(null);
            }
        } catch (err) {
            setError('Error checking code.');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleRemove = () => {
        setAppliedCode(null);
        onApply(null);
        setCode('');
        setError('');
    };

    return (
        <div className="space-y-2">
            <label className="block text-sm font-bold text-gray-700 flex items-center gap-2">
                <TagIcon className="w-4 h-4 text-gray-500" /> {label}
            </label>
            
            {appliedCode ? (
                <div className="flex items-center justify-between bg-green-50 border border-green-200 p-3 rounded-md">
                    <div className="flex items-center gap-2">
                        <CheckCircleIcon className="w-5 h-5 text-green-600" />
                        <div>
                            <p className="text-sm font-bold text-green-800">{appliedCode.code} Applied</p>
                            <p className="text-xs text-green-700">
                                {appliedCode.type === 'percentage' ? `${appliedCode.value}% OFF` : `E${appliedCode.value} OFF`}
                            </p>
                        </div>
                    </div>
                    <button onClick={handleRemove} className="text-xs text-red-600 hover:text-red-800 font-medium hover:underline">
                        Remove
                    </button>
                </div>
            ) : (
                <div className="flex gap-2">
                    <input 
                        type="text" 
                        value={code} 
                        onChange={(e) => setCode(e.target.value)} 
                        className="flex-grow block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:ring-blue-500 focus:border-blue-500 sm:text-sm uppercase"
                        placeholder="Enter Code"
                    />
                    <Button 
                        onClick={handleApply} 
                        disabled={loading || !code.trim()} 
                        className="bg-gray-800 text-white text-sm px-4"
                    >
                        {loading ? <Spinner className="w-4 h-4 border-2" /> : 'Apply'}
                    </Button>
                </div>
            )}
            
            {error && <p className="text-xs text-red-600 font-medium mt-1">{error}</p>}
        </div>
    );
};

export default PromoCodeInput;
