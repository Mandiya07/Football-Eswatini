import React from 'react';

interface FormGuideProps {
  form?: string | null;
}

const FormGuide: React.FC<FormGuideProps> = ({ form }) => {
    // Safely handle cases where form is null, undefined, or not a string
    const formLetters = typeof form === 'string' ? form.split(' ').filter(Boolean) : [];
    
    const getTooltip = (letter: string) => {
        switch (letter) {
            case 'W': return 'Win';
            case 'D': return 'Draw';
            case 'L': return 'Loss';
            default: return '';
        }
    };

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
                <div key={index} className="group relative">
                    <span 
                        className={`block w-4 h-4 rounded-full ${getColor(letter)}`}
                    ></span>
                    <span 
                        className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 bg-gray-800 text-white text-xs rounded py-1 px-2 whitespace-nowrap z-10 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none"
                    >
                        {getTooltip(letter)}
                        <div className="absolute top-full left-1/2 -translate-x-1/2 w-0 h-0 border-x-4 border-x-transparent border-t-4 border-t-gray-800"></div>
                    </span>
                </div>
            ))}
        </div>
    );
};

export default FormGuide;