import React from 'react';
import { Team } from '../data/teams';
import { Card } from './ui/Card';
import { PositionIndicator } from './Logs';
import FormGuide from './ui/FormGuide';
import { Link } from 'react-router-dom';

interface StandingsTableProps {
  standings: Team[];
}

const StandingsTable: React.FC<StandingsTableProps> = ({ standings }) => {
    // Robustness check: filter out any null, undefined, or malformed entries.
    // Ensure that team.stats exists and that form is a valid string before rendering.
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
    
  return (
    <Card className="shadow-lg">
        <div className="overflow-x-auto">
            <table className="w-full text-sm">
                <thead className="bg-gray-100 text-left text-gray-600 font-semibold uppercase text-xs">
                    <tr>
                        <th className="px-4 py-3 w-8">#</th>
                        <th className="px-4 py-3">Team</th>
                        <th className="px-4 py-3 text-center w-12" title="Played">P</th>
                        <th className="px-4 py-3 text-center w-12" title="Won">W</th>
                        <th className="px-4 py-3 text-center w-12" title="Drawn">D</th>
                        <th className="px-4 py-3 text-center w-12" title="Lost">L</th>
                        <th className="px-4 py-3 text-center w-12 font-bold" title="Goal Difference">GD</th>
                        <th className="px-4 py-3 text-center w-12 font-bold" title="Points">Pts</th>
                        <th className="px-4 py-3 w-32">Form</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                    {validStandings.map((team, index) => (
                        <tr key={team.id || team.name} className="hover:bg-gray-50/50">
                            <td className="px-4 py-2 font-bold text-gray-700">
                                <div className="flex items-center gap-2">
                                    <span>{index + 1}</span>
                                    <PositionIndicator change={'same'} />
                                </div>
                            </td>
                            <td className="px-4 py-2">
                                <div className="flex items-center space-x-3 group">
                                    {team.crestUrl ? (
                                        <img src={team.crestUrl} alt={`${team.name} crest`} loading="lazy" className="w-6 h-6 object-contain flex-shrink-0" />
                                    ) : (
                                        <div className="w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center text-[10px] font-bold text-gray-400">
                                            {team.name.charAt(0)}
                                        </div>
                                    )}
                                    <span className="font-semibold text-gray-800 truncate max-w-[120px] sm:max-w-none">{team.name}</span>
                                </div>
                            </td>
                            <td className="px-4 py-2 text-center">{team.stats.p}</td>
                            <td className="px-4 py-2 text-center">{team.stats.w}</td>
                            <td className="px-4 py-2 text-center">{team.stats.d}</td>
                            <td className="px-4 py-2 text-center">{team.stats.l}</td>
                            <td className="px-4 py-2 text-center font-bold">{team.stats.gd}</td>
                            <td className="px-4 py-2 text-center font-bold bg-gray-50/50">{team.stats.pts}</td>
                            <td className="px-4 py-2">
                                <FormGuide form={team.stats.form} />
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    </Card>
  );
};

export default StandingsTable;