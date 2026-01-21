import React from 'react';

interface LogoProps {
  className?: string;
}

const Logo: React.FC<LogoProps> = ({ className }) => {
  return (
    <svg 
      viewBox="0 0 500 150" 
      xmlns="http://www.w3.org/2000/svg" 
      className={`${className} bg-transparent overflow-visible`}
      aria-label="Football Eswatini Logo"
    >
      {/* Main Blue Horizontal Bar */}
      <rect 
        x="5" 
        y="45" 
        width="490" 
        height="60" 
        rx="15" 
        fill="#2D29A1" 
      />
      
      {/* Central Blue Circle */}
      <circle 
        cx="250" 
        cy="75" 
        r="70" 
        fill="#2D29A1" 
      />
      
      {/* Soccer Ball Graphic (Simplified and stylized) */}
      <g transform="translate(210, 35) scale(0.95)">
        <circle cx="42" cy="42" r="40" fill="#FFFFFF" opacity="0.15" />
        {/* Soccer Ball Hexagons/Pentagons */}
        <path 
          d="M42 22 L52 30 L48 42 L36 42 L32 30 Z" 
          fill="#000000" 
          opacity="0.2" 
        />
        <path 
          d="M42 2 L54 18 L76 22 L82 42 L72 62 L50 78 L34 78 L12 62 L2 42 L8 22 L30 18 Z" 
          stroke="#FFFFFF" 
          strokeWidth="1" 
          fill="none" 
          opacity="0.3" 
        />
      </g>

      {/* "football" Text in Red */}
      <text 
        x="210" 
        y="95" 
        fontFamily="'Poppins', sans-serif" 
        fontWeight="800" 
        fontSize="65" 
        textAnchor="end" 
        fill="#FF4B4B"
        letterSpacing="-2"
        style={{ filter: 'drop-shadow(0px 2px 2px rgba(0,0,0,0.2))' }}
      >
        football
      </text>
      
      {/* "eswatini" Text in Yellow */}
      <text 
        x="290" 
        y="95" 
        fontFamily="'Poppins', sans-serif" 
        fontWeight="800" 
        fontSize="65" 
        textAnchor="start" 
        fill="#F1FA8C"
        letterSpacing="-2"
        style={{ filter: 'drop-shadow(0px 2px 2px rgba(0,0,0,0.2))' }}
      >
        eswatini
      </text>
    </svg>
  );
};

export default Logo;