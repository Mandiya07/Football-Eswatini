import React from 'react';

const NationalTeamIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
        <polygon points="12 6 13.09 9.26 16.5 9.27 14.21 11.14 15.18 14.52 12 12.77 8.82 14.52 9.79 11.14 7.5 9.27 10.91 9.26 12 6"></polygon>
    </svg>
);

export default NationalTeamIcon;