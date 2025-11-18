
import React from 'react';

const MedalIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
        <path d="M9 3v4.38a2 2 0 0 0 1.11 1.81l1.39.82a2 2 0 0 1 1 1.81V14"/>
        <path d="M15 3v4.38a2 2 0 0 1-1.11 1.81l-1.39.82a2 2 0 0 0-1 1.81V14"/>
        <circle cx="12" cy="14" r="7"/>
        <circle cx="12" cy="14" r="3"/>
    </svg>
);

export default MedalIcon;
