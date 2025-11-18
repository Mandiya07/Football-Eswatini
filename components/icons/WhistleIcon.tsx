import React from 'react';

const WhistleIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
        <path d="M14 2c-2.3 0-4.6 1-4.6 3.8v0a2 2 0 0 1-3.2 1.6L2.4 4.6A2 2 0 0 0 1 6.2v0c1.6 1.6 1.6 4 0 5.6L2.4 15A2 2 0 0 0 1 16.4v0a2 2 0 0 0 1.6 1.6l3.8-3.8a2 2 0 0 1 1.6-3.2h0c2.8 0 3.8-2.3 3.8-4.6v0" />
        <path d="M15.5 8.5L18 6" />
        <path d="M14 18V6.2c0-2.8 1-5.2 2.7-6.5" />
        <circle cx="18" cy="12" r="4" />
        <circle cx="18" cy="12" r="1" />
    </svg>
);

export default WhistleIcon;