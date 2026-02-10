
import React from 'react';

const WomanIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
        <circle cx="12" cy="5" r="3" />
        <path d="M12 8v7a2 2 0 0 0 2 2h0a2 2 0 0 0 2-2V8" />
        <path d="M12 11h-4" />
        <path d="M6 15a6 6 0 0 0 12 0" />
    </svg>
);

export default WomanIcon;
