
import React from 'react';

const Tooltip: React.FC<{ children: React.ReactNode; text: string }> = ({ children, text }) => {
  return (
    <div className="relative group flex items-center">
      {children}
      <div className="absolute right-full mr-3 px-2 py-1 bg-slate-900 text-white text-[10px] font-black uppercase tracking-widest rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none shadow-xl border border-white/10">
        {text}
        <div className="absolute left-full top-1/2 -translate-y-1/2 w-0 h-0 border-t-[4px] border-t-transparent border-b-[4px] border-b-transparent border-l-[4px] border-l-slate-900"></div>
      </div>
    </div>
  );
};

export default Tooltip;
