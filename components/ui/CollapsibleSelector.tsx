
import React, { useState } from 'react';
import ChevronDownIcon from '../icons/ChevronDownIcon';

interface CollapsibleSelectorProps {
    value: string;
    onChange: (value: string) => void;
    options: {
        label: string;
        options: { value: string; name: string }[];
    }[];
}

const CollapsibleSelector: React.FC<CollapsibleSelectorProps> = ({ value, onChange, options }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [expandedGroup, setExpandedGroup] = useState<string | null>(options[0]?.label || null);

    const currentOption = options.flatMap(g => g.options).find(opt => opt.value === value);

    const handleSelect = (val: string) => {
        onChange(val);
        setIsOpen(false);
    };

    return (
        <div className="relative w-full">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center justify-between w-full px-4 py-2 text-sm font-bold bg-white border border-gray-300 rounded-lg shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
            >
                <span className="truncate">{currentOption?.name || 'Select League...'}</span>
                <ChevronDownIcon className={`w-4 h-4 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} />
            </button>

            {isOpen && (
                <div className="absolute z-[110] w-full mt-2 bg-white rounded-xl shadow-2xl border border-gray-100 overflow-hidden animate-slide-up max-h-[400px] flex flex-col">
                    <div className="overflow-y-auto flex-grow p-1">
                        {options.map((group) => (
                            <div key={group.label} className="mb-1 last:mb-0">
                                <button
                                    onClick={() => setExpandedGroup(expandedGroup === group.label ? null : group.label)}
                                    className={`flex items-center justify-between w-full px-3 py-2 text-xs font-black uppercase tracking-widest text-left transition-colors rounded-lg ${expandedGroup === group.label ? 'bg-primary/5 text-primary' : 'text-gray-400 hover:bg-gray-50'}`}
                                >
                                    <span>{group.label}</span>
                                    <ChevronDownIcon className={`w-3 h-3 transition-transform ${expandedGroup === group.label ? 'rotate-180' : ''}`} />
                                </button>
                                
                                {expandedGroup === group.label && (
                                    <div className="mt-1 space-y-0.5 animate-fade-in pl-1">
                                        {group.options.map((opt) => (
                                            <button
                                                key={opt.value}
                                                onClick={() => handleSelect(opt.value)}
                                                className={`w-full text-left px-4 py-2 text-sm rounded-md transition-colors ${value === opt.value ? 'bg-primary text-white font-bold' : 'text-gray-700 hover:bg-blue-50'}`}
                                            >
                                                {opt.name}
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

export default CollapsibleSelector;
