import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardContent } from './ui/Card';
import { fetchAllCompetitions, fetchAllTeams } from '../services/api';
import { Competition, Team } from '../data/teams';
import ShieldCheckIcon from './icons/ShieldCheckIcon';
import BarChartIcon from './icons/BarChartIcon';
import MapPinIcon from './icons/MapPinIcon';
import TrophyIcon from './icons/TrophyIcon';
import UsersIcon from './icons/UsersIcon';
import WhistleIcon from './icons/WhistleIcon';
import StarIcon from './icons/StarIcon';
import BadgeCheckIcon from './icons/BadgeCheckIcon';
import SparklesIcon from './icons/SparklesIcon';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

const EFAIntelligenceDashboard: React.FC = () => {
    const [loading, setLoading] = useState(true);
    const [competitions, setCompetitions] = useState<Record<string, Competition>>({});
    const [teams, setTeams] = useState<Team[]>([]);
    
    // Custom chart interactive states
    const [hoveredSlice, setHoveredSlice] = useState<number | null>(null);
    const [hoveredPoint, setHoveredPoint] = useState<number | null>(null);
    const [hoveredBar, setHoveredBar] = useState<number | null>(null);

    useEffect(() => {
        const loadData = async () => {
            try {
                const [comps, allTeams] = await Promise.all([
                    fetchAllCompetitions(),
                    fetchAllTeams()
                ]);
                setCompetitions(comps);
                setTeams(allTeams);
            } catch (error) {
                console.error("Dashboard data load failed", error);
            } finally {
                setLoading(false);
            }
        };
        loadData();
    }, []);

    // 1. Regional Distribution Data
    const regionalData = useMemo(() => {
        const regions: Record<string, number> = {
            'Hhohho': 0,
            'Manzini': 0,
            'Lubombo': 0,
            'Shiselweni': 0
        };
        
        teams.forEach(team => {
            const region = team.region || 'Unassigned';
            if (regions[region] !== undefined) {
                regions[region]++;
            } else {
                regions['Unassigned'] = (regions['Unassigned'] || 0) + 1;
            }
        });

        return Object.entries(regions)
            .filter(([_, value]) => value > 0)
            .map(([name, value]) => ({ name, value }));
    }, [teams]);

    // 2. Goal Analytics (Simulated trend based on results)
    const goalTrends = useMemo(() => {
        return [
            { week: 'W1', goals: 12 },
            { week: 'W2', goals: 18 },
            { week: 'W3', goals: 15 },
            { week: 'W4', goals: 22 },
            { week: 'W5', goals: 19 },
            { week: 'W6', goals: 25 },
            { week: 'W7', goals: 28 },
            { week: 'W8', goals: 21 },
        ];
    }, []);

    // 3. Disciplinary Data
    const disciplinaryData = useMemo(() => {
        return [
            { region: 'Hhohho', yellow: 45, red: 3 },
            { region: 'Manzini', yellow: 38, red: 5 },
            { region: 'Lubombo', yellow: 32, red: 2 },
            { region: 'Shiselweni', yellow: 28, red: 4 },
        ];
    }, []);

    if (loading) return (
        <div className="py-20 text-center">
            <div className="animate-spin w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full mx-auto mb-4"></div>
            <p className="text-gray-500 font-bold uppercase tracking-widest text-xs">Assembling EFA Intelligence...</p>
        </div>
    );

    // Calculate Donut Segment Paths
    const donutTotal = regionalData.reduce((sum, item) => sum + item.value, 0);
    let accumulatedAngle = 0;
    const donutSlices = regionalData.map((item, index) => {
        const percentage = donutTotal > 0 ? item.value / donutTotal : 0;
        const angle = percentage * 360;
        const startAngle = accumulatedAngle;
        const endAngle = accumulatedAngle + angle;
        accumulatedAngle = endAngle;

        const polarToCartesian = (centerX: number, centerY: number, radius: number, angleInDegrees: number) => {
            const angleInRadians = ((angleInDegrees - 90) * Math.PI) / 180.0;
            return {
                x: centerX + radius * Math.cos(angleInRadians),
                y: centerY + radius * Math.sin(angleInRadians)
            };
        };

        const start = polarToCartesian(100, 100, 65, startAngle);
        const end = polarToCartesian(100, 100, 65, endAngle);
        const largeArcFlag = angle > 180 ? 1 : 0;
        const isFullCircle = angle >= 360;

        const d = isFullCircle 
            ? "" 
            : [
                "M", start.x, start.y,
                "A", 65, 65, 0, largeArcFlag, 1, end.x, end.y
            ].join(" ");

        return {
            d,
            isFullCircle,
            color: COLORS[index % COLORS.length],
            name: item.name,
            value: item.value,
            percentage: Math.round(percentage * 100)
        };
    });

    // Calculate Line Chart coordinates
    const lineChartWidth = 500;
    const lineChartHeight = 240;
    const linePaddingX = 40;
    const linePaddingY = 30;
    const minGoals = 10;
    const maxGoals = 30;

    const linePoints = goalTrends.map((d, i) => {
        const x = linePaddingX + (i / (goalTrends.length - 1)) * (lineChartWidth - linePaddingX * 2);
        const y = (lineChartHeight - linePaddingY) - ((d.goals - minGoals) / (maxGoals - minGoals)) * (lineChartHeight - linePaddingY * 2);
        return { x, y, week: d.week, goals: d.goals };
    });

    const linePathD = `M ${linePoints.map(p => `${p.x} ${p.y}`).join(' L ')}`;
    const lineAreaD = `${linePathD} L ${linePoints[linePoints.length - 1].x} ${lineChartHeight - linePaddingY} L ${linePoints[0].x} ${lineChartHeight - linePaddingY} Z`;

    const gridLines = [];
    for (let g = minGoals; g <= maxGoals; g += 5) {
        gridLines.push(g);
    }

    return (
        <div className="space-y-8">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-display font-black text-gray-900">EFA Strategic Analytics</h2>
                    <p className="text-gray-500 font-medium tracking-tight">Intelligence-driven decision making for Eswatini Football</p>
                </div>
                <div className="bg-blue-50 text-blue-600 px-4 py-2 rounded-2xl border border-blue-100 flex items-center gap-2 text-xs font-black uppercase tracking-widest">
                    <ShieldCheckIcon className="w-4 h-4" /> Live Registry Data
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* 1. Regional Distribution Custom Donut Chart */}
                <Card className="rounded-[2.5rem] border-0 shadow-2xl overflow-hidden bg-white">
                    <CardContent className="p-8">
                        <div className="flex items-center gap-3 mb-8 border-b border-gray-100 pb-4">
                            <div className="bg-blue-100 text-blue-600 p-3 rounded-2xl">
                                <MapPinIcon className="w-6 h-6" />
                            </div>
                            <div>
                                <h3 className="text-xl font-bold">Regional Distribution</h3>
                                <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Active Clubs by Region</p>
                            </div>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
                            {/* SVG Donut */}
                            <div className="relative flex justify-center items-center">
                                <svg viewBox="0 0 200 200" className="w-[180px] h-[180px] overflow-visible drop-shadow-sm">
                                    {donutSlices.map((slice, idx) => {
                                        const isHovered = hoveredSlice === idx;
                                        if (slice.isFullCircle) {
                                            return (
                                                <circle 
                                                    key={idx} 
                                                    cx="100" 
                                                    cy="100" 
                                                    r="65" 
                                                    fill="none" 
                                                    stroke={slice.color} 
                                                    strokeWidth={isHovered ? 20 : 16} 
                                                    className="transition-all duration-300 cursor-pointer"
                                                    onMouseEnter={() => setHoveredSlice(idx)}
                                                    onMouseLeave={() => setHoveredSlice(null)}
                                                />
                                            );
                                        }
                                        return (
                                            <path
                                                key={idx}
                                                d={slice.d}
                                                fill="none"
                                                stroke={slice.color}
                                                strokeWidth={isHovered ? 20 : 16}
                                                strokeLinecap="round"
                                                className="transition-all duration-300 cursor-pointer"
                                                onMouseEnter={() => setHoveredSlice(idx)}
                                                onMouseLeave={() => setHoveredSlice(null)}
                                            />
                                        );
                                    })}
                                    {/* Center Hole cutout & text */}
                                    <circle cx="100" cy="100" r="50" fill="white" />
                                    <text x="100" y="95" textAnchor="middle" className="text-2xl font-extrabold fill-gray-900 font-display">
                                        {donutTotal}
                                    </text>
                                    <text x="100" y="115" textAnchor="middle" className="text-[9px] font-black fill-gray-400 uppercase tracking-widest">
                                        Total Clubs
                                    </text>
                                </svg>
                            </div>

                            {/* Legend details */}
                            <div className="space-y-2.5">
                                {donutSlices.map((slice, idx) => {
                                    const isHovered = hoveredSlice === idx;
                                    return (
                                        <div 
                                            key={idx} 
                                            className={`flex items-center justify-between p-2.5 rounded-xl transition-all border ${
                                                isHovered ? 'bg-blue-50/50 border-blue-100 scale-[1.02]' : 'bg-transparent border-transparent'
                                            }`}
                                            onMouseEnter={() => setHoveredSlice(idx)}
                                            onMouseLeave={() => setHoveredSlice(null)}
                                        >
                                            <div className="flex items-center gap-2">
                                                <span className="w-3.5 h-3.5 rounded-full shrink-0 shadow-sm" style={{ backgroundColor: slice.color }} />
                                                <span className="text-sm font-bold text-gray-700">{slice.name}</span>
                                            </div>
                                            <div className="text-right">
                                                <span className="text-sm font-extrabold text-gray-900">{slice.value} Clubs</span>
                                                <span className="text-[10px] text-gray-400 block font-bold">{slice.percentage}%</span>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* 2. Goal Analytics Custom Line Chart */}
                <Card className="rounded-[2.5rem] border-0 shadow-2xl overflow-hidden bg-white">
                    <CardContent className="p-8">
                        <div className="flex items-center gap-3 mb-8 border-b border-gray-100 pb-4">
                            <div className="bg-green-100 text-green-600 p-3 rounded-2xl">
                                <BarChartIcon className="w-6 h-6" />
                            </div>
                            <div>
                                <h3 className="text-xl font-bold">Technical Performance</h3>
                                <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Goal Scoring Trends (National Leagues)</p>
                            </div>
                        </div>

                        <div className="relative w-full h-[240px] pt-4">
                            <svg viewBox={`0 0 ${lineChartWidth} ${lineChartHeight}`} className="w-full h-full overflow-visible">
                                <defs>
                                    <linearGradient id="chartLineGradient" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="0%" stopColor="#10B981" stopOpacity="0.25" />
                                        <stop offset="100%" stopColor="#10B981" stopOpacity="0.0" />
                                    </linearGradient>
                                </defs>

                                {/* Grid Lines */}
                                {gridLines.map((val, idx) => {
                                    const y = (lineChartHeight - linePaddingY) - ((val - minGoals) / (maxGoals - minGoals)) * (lineChartHeight - linePaddingY * 2);
                                    return (
                                        <g key={idx} className="opacity-40">
                                            <line x1={linePaddingX} y1={y} x2={lineChartWidth - linePaddingX} y2={y} stroke="#E5E7EB" strokeWidth="1" strokeDasharray="3 3" />
                                            <text x={linePaddingX - 10} y={y + 3} textAnchor="end" className="text-[9px] font-bold fill-gray-400 font-mono">{val}</text>
                                        </g>
                                    );
                                })}

                                {/* Gradient Fill Under Path */}
                                <path d={lineAreaD} fill="url(#chartLineGradient)" />

                                {/* Connected Path */}
                                <path d={linePathD} fill="none" stroke="#10B981" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />

                                {/* Interactive Dot Points */}
                                {linePoints.map((p, idx) => {
                                    const isHovered = hoveredPoint === idx;
                                    return (
                                        <g key={idx}>
                                            <circle 
                                                cx={p.x} 
                                                cy={p.y} 
                                                r={isHovered ? 8 : 5} 
                                                fill={isHovered ? '#059669' : '#10B981'} 
                                                stroke="white" 
                                                strokeWidth="2" 
                                                className="cursor-pointer transition-all duration-150 shadow"
                                                onMouseEnter={() => setHoveredPoint(idx)}
                                                onMouseLeave={() => setHoveredPoint(null)}
                                            />
                                            {/* Week labels under line */}
                                            <text x={p.x} y={lineChartHeight - linePaddingY + 16} textAnchor="middle" className="text-[10px] font-bold fill-gray-400 font-mono">{p.week}</text>
                                        </g>
                                    );
                                })}
                            </svg>

                            {/* Floating Tooltip bubble */}
                            {hoveredPoint !== null && (
                                <div 
                                    className="absolute bg-gray-900 text-white px-3 py-1.5 rounded-xl shadow-2xl text-xs font-bold pointer-events-none transition-all duration-100 z-10 border border-gray-800"
                                    style={{
                                        left: `${(linePoints[hoveredPoint].x / lineChartWidth) * 100}%`,
                                        top: `${(linePoints[hoveredPoint].y / lineChartHeight) * 100 - 20}%`,
                                        transform: 'translate(-50%, -100%)'
                                    }}
                                >
                                    <div className="font-sans text-[9px] uppercase text-gray-400 tracking-wider mb-0.5">{linePoints[hoveredPoint].week} Peak</div>
                                    <div className="font-mono text-emerald-400">{linePoints[hoveredPoint].goals} Goals</div>
                                </div>
                            )}
                        </div>
                    </CardContent>
                </Card>

                {/* 3. Disciplinary Heatmap Custom Bar Chart */}
                <Card className="rounded-[2.5rem] border-0 shadow-2xl overflow-hidden bg-white">
                    <CardContent className="p-8">
                        <div className="flex items-center gap-3 mb-8 border-b border-gray-100 pb-4">
                            <div className="bg-orange-100 text-orange-600 p-3 rounded-2xl">
                                <WhistleIcon className="w-6 h-6" />
                            </div>
                            <div>
                                <h3 className="text-xl font-bold">Fair Play Index</h3>
                                <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Disciplinary Cards by Region</p>
                            </div>
                        </div>

                        <div className="relative w-full">
                            <div className="flex justify-between items-end h-[210px] pt-4 px-2">
                                {disciplinaryData.map((d, i) => {
                                    const maxVal = 50;
                                    const yellowHeight = (d.yellow / maxVal) * 100;
                                    const redHeight = ((d.red * 9) / maxVal) * 100;
                                    const isHovered = hoveredBar === i;

                                    return (
                                        <div 
                                            key={i} 
                                            className={`flex flex-col items-center w-[22%] space-y-2 transition-all p-1.5 rounded-2xl ${
                                                isHovered ? 'bg-orange-50/40 border border-orange-100/50 scale-[1.02]' : 'border border-transparent'
                                            }`}
                                            onMouseEnter={() => setHoveredBar(i)}
                                            onMouseLeave={() => setHoveredBar(null)}
                                        >
                                            {/* Columns */}
                                            <div className="relative w-full h-[140px] bg-gray-50 rounded-xl flex items-end justify-center overflow-hidden gap-1.5 border border-gray-100/50 p-1">
                                                {/* Yellow card bar */}
                                                <div 
                                                    className="w-1/2 bg-amber-400 rounded-t-lg transition-all hover:bg-amber-500 shadow-sm relative group" 
                                                    style={{ height: `${yellowHeight}%` }}
                                                >
                                                    <div className="absolute -top-6 left-1/2 transform -translate-x-1/2 bg-gray-900 text-white text-[9px] font-mono font-bold px-1 rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10 whitespace-nowrap">
                                                        {d.yellow} Yellow
                                                    </div>
                                                </div>
                                                {/* Red card bar */}
                                                <div 
                                                    className="w-1/2 bg-red-500 rounded-t-lg transition-all hover:bg-red-600 shadow-sm relative group" 
                                                    style={{ height: `${redHeight}%` }}
                                                >
                                                    <div className="absolute -top-6 left-1/2 transform -translate-x-1/2 bg-gray-900 text-white text-[9px] font-mono font-bold px-1 rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10 whitespace-nowrap">
                                                        {d.red} Red
                                                    </div>
                                                </div>
                                            </div>
                                            <span className="text-[11px] font-black text-gray-700 tracking-tight">{d.region}</span>
                                        </div>
                                    );
                                })}
                            </div>

                            {/* Map Legend */}
                            <div className="flex justify-center gap-6 mt-6 pt-4 border-t border-gray-100 text-xs font-bold text-gray-500">
                                <div className="flex items-center gap-2">
                                    <span className="w-3.5 h-3.5 bg-amber-400 rounded shadow-sm shrink-0" />
                                    <span>Yellow Cards</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className="w-3.5 h-3.5 bg-red-500 rounded shadow-sm shrink-0" />
                                    <span>Red Cards</span>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* 4. Club Licensing Status */}
                <Card className="rounded-[2.5rem] border-0 shadow-2xl overflow-hidden bg-white">
                    <CardContent className="p-8">
                        <div className="flex items-center justify-between mb-8 border-b border-gray-100 pb-4">
                            <div className="flex items-center gap-3">
                                <div className="bg-indigo-100 text-indigo-600 p-3 rounded-2xl">
                                    <BadgeCheckIcon className="w-6 h-6" />
                                </div>
                                <div>
                                    <h3 className="text-xl font-bold">Club Licensing</h3>
                                    <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Compliance Status Wrapper</p>
                                </div>
                            </div>
                            <div className="text-right">
                                <span className="text-lg font-black text-indigo-600">82%</span>
                                <p className="text-[10px] font-bold text-gray-400 uppercase">National Avg</p>
                            </div>
                        </div>
                        
                        <div className="space-y-4">
                            {[
                                { name: "Mbabane Swallows", status: "Certified", color: "text-green-600 bg-green-50 border border-green-100" },
                                { name: "Young Buffaloes", status: "Certified", color: "text-green-600 bg-green-50 border border-green-100" },
                                { name: "Mbabane Highlanders", status: "Conditional", color: "text-amber-600 bg-amber-50 border border-amber-100" },
                                { name: "Manzini Wanderers", status: "Pending Audit", color: "text-blue-600 bg-blue-50 border border-blue-100" },
                            ].map((club, i) => (
                                <div key={i} className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl border border-gray-100">
                                    <div className="flex items-center gap-3">
                                        <div className="w-2 h-2 rounded-full bg-indigo-400"></div>
                                        <span className="text-sm font-bold text-gray-900">{club.name}</span>
                                    </div>
                                    <span className={`text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full ${club.color}`}>
                                        {club.status}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* National Team Pipeline Tracking */}
            <h3 className="text-2xl font-display font-black text-gray-900 flex items-center gap-2 mt-12 mb-6">
                <StarIcon className="w-8 h-8 text-yellow-500" /> National Team Pipeline - Sihlangu Semnikati
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {[
                    { name: "Sifiso Matsebula", age: 19, position: "FW", rating: 88, status: "High Priority", club: "Mbabane Swallows" },
                    { name: "Lindiwe Dlamini", age: 21, position: "MF", rating: 85, status: "Under Observation", club: "Manzini Wanderers" },
                    { name: "Muzi Tsabedze", age: 18, position: "GK", rating: 91, status: "National Call-up Pool", club: "Young Buffaloes" },
                ].map((player, i) => (
                    <Card key={i} className="rounded-3xl border-0 shadow-xl overflow-hidden group hover:scale-[1.02] transition-all bg-white">
                        <CardContent className="p-6">
                            <div className="flex justify-between items-start mb-4">
                                <div className="bg-gray-100 text-gray-500 px-3 py-1 rounded-full text-[10px] font-black">{player.position}</div>
                                <div className="text-yellow-500 flex items-center gap-1 font-black">
                                    <StarIcon className="w-4 h-4 fill-current" /> {player.rating}
                                </div>
                            </div>
                            <h4 className="text-xl font-bold text-gray-900 mb-1">{player.name}</h4>
                            <p className="text-xs text-gray-500 font-bold uppercase mb-4">{player.club} • Age {player.age}</p>
                            <div className="pt-4 border-t border-gray-100 flex items-center justify-between">
                                <span className="text-[10px] font-black text-blue-600 uppercase tracking-widest">{player.status}</span>
                                <div className="h-2 w-24 bg-gray-100 rounded-full overflow-hidden">
                                    <div className="h-full bg-blue-600" style={{ width: `${player.rating}%` }}></div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {/* Commercial & Sponsorship Value */}
            <div className="mt-12 mb-8">
                <h3 className="text-2xl font-display font-black text-gray-900 flex items-center gap-2 mb-2">
                    <SparklesIcon className="w-8 h-8 text-blue-500" /> Commercial Media Intelligence
                </h3>
                <p className="text-gray-500 font-medium text-sm">Targeted insights for potential sponsors (MTN, EswatiniBank, etc.)</p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
                {[
                    { label: "Total Asset Impressions", value: "1.2M", detail: "Monthly App Reach", trend: "+18%" },
                    { label: "Fan Engagement Rate", value: "4.8%", detail: "Avg. Session Duration", trend: "+2%" },
                    { label: "Digital Ticket Conversions", value: "24k", detail: "Unique Match Entries", trend: "+12%" },
                    { label: "Partner Brand Affinity", value: "72%", detail: "Sentiment Analysis", trend: "+5%" },
                ].map((item, i) => (
                    <div key={i} className="bg-white p-6 rounded-[2rem] border border-gray-100 shadow-xl flex flex-col justify-between">
                        <div>
                            <div className="flex justify-between items-start mb-4">
                                <span className="text-[10px] font-black text-green-600 bg-green-50 px-2 py-0.5 rounded-full">{item.trend}</span>
                            </div>
                            <span className="text-3xl font-black text-gray-900 block mb-1">{item.value}</span>
                        </div>
                        <div>
                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">{item.label}</p>
                            <p className="text-[10px] text-gray-400 font-medium">{item.detail}</p>
                        </div>
                    </div>
                ))}
            </div>

            {/* Geographic Distribution Map / Info */}
            <Card className="rounded-[2.5rem] bg-[#002B7F] text-white p-12 overflow-hidden relative">
                <div className="absolute top-0 right-0 p-20 opacity-10">
                    <MapPinIcon className="w-64 h-64" />
                </div>
                <div className="relative z-10 grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
                    <div>
                        <h3 className="text-3xl font-black mb-6">Football Landscape Analysis</h3>
                        <p className="text-blue-100 mb-8 leading-relaxed font-medium">
                            Our geographic intelligence tracks over 120 clubs across the four regions of Eswatini. 
                            This visualization helps EFA Technical Directors identify scouting gaps and infrastructure needs in real-time.
                        </p>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="bg-white/10 p-4 rounded-2xl border border-white/10">
                                <h4 className="text-2xl font-black">42%</h4>
                                <p className="text-[10px] font-bold text-blue-300 uppercase tracking-widest">Concentration in Manzini</p>
                            </div>
                            <div className="bg-white/10 p-4 rounded-2xl border border-white/10">
                                <h4 className="text-2xl font-black">12</h4>
                                <p className="text-[10px] font-bold text-blue-300 uppercase tracking-widest">New Regional Academies</p>
                            </div>
                        </div>
                    </div>
                </div>
            </Card>
        </div>
    );
};

export default EFAIntelligenceDashboard;
