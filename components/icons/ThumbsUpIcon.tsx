import React from 'react';

const ThumbsUpIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
        <path d="M7 10v9a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2v-3.58a2 2 0 0 0-.59-1.41l-2.4-2.41a2 2 0 0 1-.59-1.41V6a2 2 0 0 0-2-2H9a2 2 0 0 0-2 2v4Z" />
        <path d="M7 10V5a2 2 0 0 1 2-2" />
    </svg>
);

export default ThumbsUpIcon;
