import React, { useState, useEffect } from 'react';
import { Team } from '../data/teams';
import { Card } from './ui/Card';
import { PositionIndicator } from './Logs';
import FormGuide from './ui/FormGuide';
import { Link } from 'react-router-dom';
import { DirectoryEntity } from '../data/directory';
import { fetchDirectoryEntries } from '../services/api';
import { findInMap, superNormalize } from '../services/utils';

interface StandingsTableProps {
  standings: Team[];
  competitionId?: string;
}

const StandingsTable: React.FC<StandingsTableProps> = ({ standings, competitionId }) => {
    const [directoryMap, setDirectoryMap] = useState<Map<string, DirectoryEntity>>(new Map());

    useEffect(() => {
        const loadDir = async () => {
            const entries = await fetchDirectoryEntries();
            const map = new Map<string, DirectoryEntity>();
            entries.forEach(entry => map.set(entry.name.trim().toLowerCase(), entry));
            setDirectoryMap(map);
        };
        loadDir();
    }, []);

    const validStandings = (standings || []).filter((t): t is Team => {
        return !!(t && t.stats && typeof t.stats.form === 'string' && t.name);
    });

    if (validStandings.length === 0) {
        return (
            <div className="bg-gray-50 border rounded-lg p-8 text-center">
                <p className="text-sm text-gray-500 italic">No league standings available for this group at the moment.</p>
            </div>
        );
    }

    const getTrend = (form: string) => {
        const last = form.split(' ')[0];
        if (last === 'W') return 'up';
        if (last === 'L') return 'down';
        return 'same';
    };

    const isUCL = competitionId === 'uefa-champions-league';
    const cid = competitionId || '';
    const isFirstDivision = cid.includes('first-division');
    const isPremierLeague = cid.includes('premier-league');

    const getRowStyle = (index: number) => {
        const pos = index + 1;
        if (isUCL) {
            if (pos <= 8) return 'bg-green-50/40 hover:bg-green-100/60 border-l-4 border-l-green-500';
            if (pos <= 16) return 'bg-blue-50/40 hover:bg-blue-100/60 border-l-4 border-l-blue-600';
            if (pos <= 24) return 'bg-blue-50/20 hover:bg-blue-100/40 border-l-4 border-l-blue-300';
            return 'bg-gray-50/80 grayscale-[0.5] opacity-80 hover:bg-gray-100 border-l-4 border-l-gray-400';
        }
        
        if (isFirstDivision) {
            if (pos === 3) return 'bg-yellow-50/50 border-l-4 border-l-yellow-500';
            if (pos === 12) return 'bg-orange-50/50 border-l-4 border-l-orange-500';
            if (pos >= 13) return 'bg-red-50/30 border-l-4 border-l-red-600';
        } else if (isPremierLeague) {
            if (pos === 12) return 'bg-orange-50/50 border-l-4 border-l-orange-500';
            if (pos >= 13) return 'bg-red-50/30 border-l-4 border-l-red-600';
        }

        return 'hover:bg-gray-50/50';
    };

  return (
    <Card className="shadow-lg overflow-hidden border-0 ring-1 ring-black/5">
        <div className="overflow-x-auto">
            <table className="w-full text-sm">
                <thead className="bg-gray-100 text-left text-gray-600 font-bold uppercase text-[10px] tracking-widest">
                    <tr>
                        <th className="px-4 py-4 w-12 text-center">#</th>
                        <th className="px-4 py-4">Team</th>
                        <th className="px-2 py-4 text-center w-10">P</th>
                        <th className="px-2 py-4 text-center w-10">W</th>
                        <th className="px-2 py-4 text-center w-10">D</th>
                        <th className="px-2 py-4 text-center w-10">L</th>
                        <th className="px-2 py-4 text-center w-10 hidden sm:table-cell">GS</th>
                        <th className="px-2 py-4 text-center w-10 hidden sm:table-cell">GC</th>
                        <th className="px-2 py-4 text-center w-10 font-bold">GD</th>
                        <th className="px-2 py-4 text-center w-12 font-black">Pts</th>
                        <th className="px-4 py-4 w-32">Form</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                    {validStandings.map((team, index) => {
                        const dirEntry = findInMap(team.name, directoryMap);
                        const profileUrl = (team.id && competitionId) ? `/competitions/${competitionId}/teams/${team.id}` : 
                                          (dirEntry?.teamId && dirEntry?.competitionId) ? `/competitions/${dirEntry.competitionId}/teams/${dirEntry.teamId}` : null;

                        return (
                            <tr key={team.id || team.name} className={`${getRowStyle(index)} transition-colors group`}>
                                <td className="px-4 py-3 text-center">
                                    <div className="flex flex-col items-center">
                                        <span className="font-black text-gray-900">{index + 1}</span>
                                        <PositionIndicator change={getTrend(team.stats.form)} />
                                    </div>
                                </td>
                                <td className="px-4 py-3">
                                    <div className="flex items-center gap-2">
                                        {profileUrl ? (
                                            <Link to={profileUrl} className="flex items-center space-x-3 group/link">
                                                <img src={dirEntry?.crestUrl || team?.crestUrl} alt="" loading="lazy" className="w-6 h-6 object-contain flex-shrink-0" />
                                                <span className="font-bold text-gray-900 truncate max-w-[120px] sm:max-w-none group-hover/link:text-primary group-hover/link:underline transition-colors">{team.name}</span>
                                            </Link>
                                        ) : (
                                            <div className="flex items-center space-x-3">
                                                <img src={dirEntry?.crestUrl || team?.crestUrl} alt="" loading="lazy" className="w-6 h-6 object-contain flex-shrink-0" />
                                                <span className="font-bold text-gray-900 truncate max-w-[120px] sm:max-w-none">{team.name}</span>
                                            </div>
                                        )}
                                    </div>
                                </td>
                                <td className="px-2 py-3 text-center">{team.stats.p}</td>
                                <td className="px-2 py-3 text-center">{team.stats.w}</td>
                                <td className="px-2 py-3 text-center">{team.stats.d}</td>
                                <td className="px-2 py-3 text-center">{team.stats.l}</td>
                                <td className="px-2 py-3 text-center hidden sm:table-cell">{team.stats.gs}</td>
                                <td className="px-2 py-3 text-center hidden sm:table-cell">{team.stats.gc}</td>
                                <td className={`px-2 py-3 text-center font-bold ${team.stats.gd > 0 ? 'text-green-600' : team.stats.gd < 0 ? 'text-red-600' : 'text-gray-400'}`}>
                                    {team.stats.gd > 0 ? `+${team.stats.gd}` : team.stats.gd}
                                </td>
                                <td className="px-2 py-3 text-center font-black relative">
                                    <div className="absolute inset-0 bg-primary/5 backdrop-blur-[2px] rounded m-1"></div>
                                    <span className="relative z-10 text-primary">{team.stats.pts}</span>
                                </td>
                                <td className="px-4 py-3">
                                    <FormGuide form={team.stats.form} />
                                </td>
                            </tr>
                        );
                    })}
                </tbody>
            </table>
        </div>
    </Card>
  );
};

export default StandingsTable;