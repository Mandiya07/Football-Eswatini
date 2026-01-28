
import React from 'react';

const KeyIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
        <path d="m15.5 7.5 2.3 2.3a1 1 0 0 0 1.4 0l2.1-2.1a1 1 0 0 0 0-1.4L19 4.3a1 1 0 0 0-1.4 0l-2.1 2.1a1 1 0 0 0 0 1.1Z" />
        <path d="m15.5 7.5-10 10" />
        <path d="m7.5 15.5-2 2" />
        <circle cx="7.5" cy="16.5" r="4.5" />
    </svg>
);

export default KeyIcon;
