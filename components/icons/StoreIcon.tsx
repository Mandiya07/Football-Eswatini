import React from 'react';

const StoreIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
        <path d="M18 6L12 2L6 6"></path>
        <path d="M2 6V20C2 21.1046 2.89543 22 4 22H20C21.1046 22 22 21.1046 22 20V6"></path>
        <path d="M12 22V16"></path>
        <path d="M6 12H18"></path>
    </svg>
);

export default StoreIcon;