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
            if (pos <= 8) return 'bg-green-50/40 hover:bg-green-100/60';
            if (pos <= 16) return 'bg-blue-50/40 hover:bg-blue-100/60';
            if (pos <= 24) return 'bg-blue-50/20 hover:bg-blue-100/40';
            return 'bg-gray-50/80 grayscale-[0.5] opacity-80 hover:bg-gray-100';
        }
        
        if (isFirstDivision) {
            if (pos === 3) return 'bg-yellow-50/50';
            if (pos === 12) return 'bg-orange-50/50';
            if (pos >= 13) return 'bg-red-50/30';
        } else if (isPremierLeague) {
            if (pos === 12) return 'bg-orange-50/50';
            if (pos >= 13) return 'bg-red-50/30';
        }

        return 'hover:bg-gray-50/50';
    };

  return (
    <div className="border border-gray-200 rounded-lg bg-white overflow-hidden shadow-sm">
        <table className="w-full text-[10px] sm:text-xs xl:text-sm border-collapse">
            <thead className="bg-[#0f2c82] text-left text-white font-bold uppercase text-[9px] sm:text-[10px] xl:text-xs sticky top-0 z-10">
                <tr>
                    <th className="px-1 py-3 sm:py-4 w-6 sm:w-8 text-center">#</th>
                    <th className="px-1 sm:px-2 py-3 sm:py-4">TEAM</th>
                    <th className="px-0.5 sm:px-1 py-3 sm:py-4 text-center w-5 sm:w-8">P</th>
                    <th className="px-0.5 sm:px-1 py-3 sm:py-4 text-center w-5 sm:w-8">W</th>
                    <th className="px-0.5 sm:px-1 py-3 sm:py-4 text-center w-5 sm:w-8">D</th>
                    <th className="px-0.5 sm:px-1 py-3 sm:py-4 text-center w-5 sm:w-8">L</th>
                    <th className="px-0.5 sm:px-1 py-3 sm:py-4 text-center w-5 sm:w-8">GF</th>
                    <th className="px-0.5 sm:px-1 py-3 sm:py-4 text-center w-5 sm:w-8">GA</th>
                    <th className="px-0.5 sm:px-1 py-3 sm:py-4 text-center w-6 sm:w-10 font-bold">GD</th>
                    <th className="px-0.5 sm:px-1 py-3 sm:py-4 text-center w-6 sm:w-10 font-bold">PTS</th>
                    <th className="px-1 sm:px-2 py-3 sm:py-4 text-center w-16 sm:w-24">FORM</th>
                </tr>
            </thead>
            <tbody>
                    {validStandings.map((team, index) => {
                        const dirEntry = findInMap(team.name, directoryMap);
                        const profileUrl = (team.id && competitionId) ? `/competitions/${competitionId}/teams/${team.id}` : 
                                          (dirEntry?.teamId && dirEntry?.competitionId) ? `/competitions/${dirEntry.competitionId}/teams/${dirEntry.teamId}` : null;

                        const crestUrl = dirEntry?.crestUrl || team?.crestUrl || null;

                        return (
                            <tr key={`${team.id || team.name}-${index}`} className={`bg-white even:bg-gray-50/70 border-b border-gray-100 transition-colors`}>
                                <td className="px-1 py-2 sm:py-3 text-center">
                                    <div className="flex flex-col items-center justify-center">
                                        <span className="font-bold text-gray-900 text-[10px] sm:text-xs xl:text-sm mb-0.5">{index + 1}</span>
                                        <PositionIndicator change={getTrend(team.stats.form)} />
                                    </div>
                                </td>
                                <td className="px-1 sm:px-2 py-2 sm:py-3">
                                    <div className="flex items-center gap-1.5 sm:gap-2">
                                        {profileUrl ? (
                                            <Link to={profileUrl} className="flex items-center space-x-1.5 sm:space-x-2 group/link truncate">
                                                <div className="w-5 h-5 sm:w-6 sm:h-6 flex items-center justify-center shrink-0">
                                                    {crestUrl ? (
                                                        <img src={crestUrl} alt="" loading="lazy" className="max-h-full max-w-full object-contain" />
                                                    ) : (
                                                        <div className="w-full h-full bg-slate-100 rounded-full flex items-center justify-center text-[8px] font-black text-slate-500 uppercase">{team.name.charAt(0)}</div>
                                                    )}
                                                </div>
                                                <span className="font-bold text-gray-800 group-hover/link:text-[#0b2880] transition-colors text-[10px] sm:text-xs xl:text-sm truncate max-w-[60px] sm:max-w-[80px] xl:max-w-none">{team.name}</span>
                                            </Link>
                                        ) : (
                                            <div className="flex items-center space-x-1.5 sm:space-x-2 truncate">
                                                <div className="w-5 h-5 sm:w-6 sm:h-6 flex items-center justify-center shrink-0">
                                                    {crestUrl ? (
                                                        <img src={crestUrl} alt="" loading="lazy" className="max-h-full max-w-full object-contain" />
                                                    ) : (
                                                        <div className="w-full h-full bg-slate-100 rounded-full flex items-center justify-center text-[8px] font-black text-slate-500 uppercase">{team.name.charAt(0)}</div>
                                                    )}
                                                </div>
                                                <span className="font-bold text-gray-800 text-[10px] sm:text-xs xl:text-sm truncate max-w-[60px] sm:max-w-[80px] xl:max-w-none">{team.name}</span>
                                            </div>
                                        )}
                                    </div>
                                </td>
                                <td className="px-0.5 sm:px-1 py-2 sm:py-3 text-center font-medium text-gray-600">{team.stats.p}</td>
                                <td className="px-0.5 sm:px-1 py-2 sm:py-3 text-center font-medium text-gray-600">{team.stats.w}</td>
                                <td className="px-0.5 sm:px-1 py-2 sm:py-3 text-center font-medium text-gray-600">{team.stats.d}</td>
                                <td className="px-0.5 sm:px-1 py-2 sm:py-3 text-center font-medium text-gray-600">{team.stats.l}</td>
                                <td className="px-0.5 sm:px-1 py-2 sm:py-3 text-center font-medium text-gray-600">{team.stats.gs}</td>
                                <td className="px-0.5 sm:px-1 py-2 sm:py-3 text-center font-medium text-gray-600">{team.stats.gc}</td>
                                <td className={`px-0.5 sm:px-1 py-2 sm:py-3 text-center font-medium ${team.stats.gd > 0 ? 'text-[#00b259]' : team.stats.gd < 0 ? 'text-red-500' : 'text-gray-600'}`}>
                                    {team.stats.gd > 0 ? `+${team.stats.gd}` : team.stats.gd}
                                </td>
                                <td className="px-0.5 sm:px-1 py-2 sm:py-3 text-center font-bold text-[#0f2c82]">
                                    {team.stats.pts}
                                </td>
                                <td className="px-1 sm:px-2 py-2 sm:py-3">
                                    <div className="flex justify-center scale-[0.65] sm:scale-75 xl:scale-90 origin-center">
                                        <FormGuide form={team.stats.form} />
                                    </div>
                                </td>
                            </tr>
                        );
                    })}
                </tbody>
        </table>
    </div>
  );
};

export default StandingsTable;