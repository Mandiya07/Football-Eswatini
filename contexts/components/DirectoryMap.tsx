
import React from 'react';
import { Card, CardContent } from './ui/Card';
import { Region } from '../data/directory';

interface DirectoryMapProps {
    activeRegion?: Region | 'all';
    onRegionClick?: (region: Region) => void;
}

const DirectoryMap: React.FC<DirectoryMapProps> = ({ activeRegion = 'all', onRegionClick }) => {
    // These coordinates are simplified for a stylized SVG map of Eswatini
    const regions = [
        { id: 'Hhohho', name: 'Hhohho (North)', path: 'M 40,10 L 80,10 L 80,45 L 40,45 Z', color: '#3b82f6', textPos: { x: 55, y: 25 } },
        { id: 'Lubombo', name: 'Lubombo (East)', path: 'M 80,10 L 120,40 L 120,90 L 80,90 L 80,45 Z', color: '#10b981', textPos: { x: 100, y: 55 } },
        { id: 'Manzini', name: 'Manzini (West)', path: 'M 20,45 L 80,45 L 80,90 L 40,120 L 20,90 Z', color: '#f59e0b', textPos: { x: 50, y: 70 } },
        { id: 'Shiselweni', name: 'Shiselweni (South)', path: 'M 40,120 L 80,90 L 100,120 L 80,140 L 40,140 Z', color: '#ef4444', textPos: { x: 70, y: 115 } },
    ];

    return (
        <Card className="shadow-lg bg-slate-900 border-0 overflow-hidden relative group">
            <div className="absolute top-4 left-4 z-10">
                <h3 className="text-white font-black text-xs uppercase tracking-widest">Regional Hubs</h3>
                <p className="text-white/40 text-[9px] uppercase font-bold">Interactive Distribution</p>
            </div>
            
            <CardContent className="p-0 flex items-center justify-center h-80">
                <svg viewBox="0 0 140 160" className="w-full h-full max-w-[300px]">
                    <g className="transition-all duration-500">
                        {regions.map((reg) => {
                            const isActive = activeRegion === 'all' || activeRegion === reg.id;
                            return (
                                <g 
                                    key={reg.id} 
                                    className="cursor-pointer group/reg" 
                                    onClick={() => onRegionClick?.(reg.id as Region)}
                                >
                                    <path 
                                        d={reg.path} 
                                        fill={isActive ? reg.color : '#1e293b'} 
                                        className="transition-all duration-300 hover:opacity-80"
                                        stroke="#0f172a"
                                        strokeWidth="1.5"
                                    />
                                    <text 
                                        x={reg.textPos.x} 
                                        y={reg.textPos.y} 
                                        fill="white" 
                                        fontSize="6" 
                                        fontWeight="900" 
                                        textAnchor="middle"
                                        className={`pointer-events-none transition-opacity duration-300 ${isActive ? 'opacity-100' : 'opacity-20'}`}
                                    >
                                        {reg.id.toUpperCase()}
                                    </text>
                                </g>
                            );
                        })}
                    </g>
                </svg>
            </CardContent>
            
            <div className="absolute bottom-4 right-4 text-right">
                <p className="text-[10px] text-white/60 font-medium">Kingdom of Eswatini</p>
                <div className="flex gap-1 mt-1 justify-end">
                    <div className="w-1.5 h-1.5 rounded-full bg-blue-500"></div>
                    <div className="w-1.5 h-1.5 rounded-full bg-yellow-500"></div>
                    <div className="w-1.5 h-1.5 rounded-full bg-green-500"></div>
                    <div className="w-1.5 h-1.5 rounded-full bg-red-500"></div>
                </div>
            </div>
        </Card>
    );
};

export default DirectoryMap;
