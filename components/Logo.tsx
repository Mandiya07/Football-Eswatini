import React from 'react';

const Logo: React.FC<{ className?: string }> = ({ className }) => {
  return (
    <svg viewBox="0 0 320 80" xmlns="http://www.w3.org/2000/svg" className={className} aria-label="Football Eswatini Logo">
      <defs>
        <filter id="dropShadow" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur in="SourceAlpha" stdDeviation="1"/>
          <feOffset dx="1" dy="1" result="offsetblur"/>
          <feComponentTransfer>
            <feFuncA type="linear" slope="0.5"/>
          </feComponentTransfer>
          <feMerge> 
            <feMergeNode/>
            <feMergeNode in="SourceGraphic"/> 
          </feMerge>
        </filter>
      </defs>
      
      {/* Soccer Ball Icon */}
      <g transform="translate(140, 20)">
         <circle cx="20" cy="20" r="18" fill="#F9FAFB" stroke="#E5E7EB" strokeWidth="1"/>
         {/* Pentagons pattern */}
         <path d="M20 10 L26 14 L24 22 H16 L14 14 Z" fill="#1F2937" />
         <path d="M20 10 L20 2 M26 14 L33 11 M24 22 L29 29 M16 22 L11 29 M14 14 L7 11" stroke="#1F2937" strokeWidth="1.5" strokeLinecap="round" />
         <path d="M7 11 L4 16 M33 11 L36 16 M11 29 L14 34 M29 29 L26 34 M20 2 L16 0" stroke="#1F2937" strokeWidth="1" strokeLinecap="round" />
      </g>

      {/* Text "football" */}
      <text x="130" y="50" fontFamily="'Poppins', sans-serif" fontWeight="800" fontSize="26" textAnchor="end" fill="#D22730" filter="url(#dropShadow)">
        football
      </text>
      
      {/* Text "eswatini" */}
      <text x="190" y="50" fontFamily="'Poppins', sans-serif" fontWeight="800" fontSize="26" textAnchor="start" fill="#FDB913" filter="url(#dropShadow)">
        eswatini
      </text>
    </svg>
  );
};

export default Logo;