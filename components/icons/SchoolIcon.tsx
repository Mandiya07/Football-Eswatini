import React from 'react';

const SchoolIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
        <path d="M14 22v-4a2 2 0 1 0-4 0v4" />
        <path d="M18 10v6" />
        <path d="M6 10v6" />
        <path d="M2 12h20" />
        <path d="M12 2L3 7v3h18V7L12 2z" />
    </svg>
);

export default SchoolIcon;