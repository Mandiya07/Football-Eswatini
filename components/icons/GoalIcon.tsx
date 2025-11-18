import React from 'react';

const GoalIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
        <circle cx="12" cy="12" r="10"></circle>
        <path d="m16.33 7.67-1.55 4.33-4.33 1.55 1.55-4.33 4.33-1.55z"></path>
        <path d="M12 2a10 10 0 0 0-4.95 1.82"></path>
        <path d="M2.82 7.05A10 10 0 0 0 2 12"></path>
        <path d="M7.05 21.18A10 10 0 0 0 12 22"></path>
        <path d="M22 12a10 10 0 0 1-.82 4.95"></path>
    </svg>
);

export default GoalIcon;