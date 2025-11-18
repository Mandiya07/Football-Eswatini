import React from 'react';

const ThumbsDownIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
        <path d="M17 14V5a2 2 0 0 0-2-2H9a2 2 0 0 0-2 2v5.59a2 2 0 0 0 .59 1.41l2.4 2.41a2 2 0 0 1 .59 1.41V18a2 2 0 0 0 2 2h1" />
        <path d="M17 14h5a2 2 0 0 1 2 2v1a2 2 0 0 1-2 2h-5" />
    </svg>
);

export default ThumbsDownIcon;
