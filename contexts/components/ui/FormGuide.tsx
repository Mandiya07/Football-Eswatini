
import React from 'react';

interface FormGuideProps {
  form?: string | null;
}

const FormGuide: React.FC<FormGuideProps> = ({ form }) => {
    // Safely handle cases where form is null, undefined, or not a string
    const formLetters = typeof form === 'string' ? form.split(' ').filter(Boolean) : [];
    
    const getColor = (letter: string) => {
        switch (letter) {
            case 'W': return 'bg-green-500';
            case 'D': return 'bg-gray-400';
            case 'L': return 'bg-red-500';
            default: return 'bg-gray-200';
        }
    };

    if (formLetters.length === 0) {
        return null; // Render nothing if form is invalid or empty
    }

    return (
        <div className="flex space-x-1.5" aria-label={`Recent form: ${formLetters.join(', ')}`}>
            {formLetters.map((letter, index) => (
                <div key={index} className="relative">
                    <span 
                        className={`block w-4 h-4 rounded-full ${getColor(letter)} shadow-sm`}
                    ></span>
                </div>
            ))}
        </div>
    );
};

export default FormGuide;
