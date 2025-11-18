import React from 'react';

const UserCircleIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
        <circle cx="12" cy="12" r="10"></circle>
        <circle cx="12" cy="10" r="4"></circle>
        <path d="M12 14c-2.67 0-5 1.34-5 4h10c0-2.66-2.33-4-5-4z" opacity="0.4"></path>
    </svg>
);

export default UserCircleIcon;
