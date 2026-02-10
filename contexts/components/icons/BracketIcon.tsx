import React from 'react';

const BracketIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
        <path d="M6 3v2" />
        <path d="M6 9v2" />
        <path d="M6 15v2" />
        <path d="M6 21v-2" />
        <path d="M6 5h12" />
        <path d="M6 11h7" />
        <path d="M6 17h4" />
        <path d="M18 5v8" />
        <path d="M13 11v10" />
    </svg>
);

export default BracketIcon;
