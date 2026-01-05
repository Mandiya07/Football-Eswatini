import React from 'react';
import { Team } from '../data/teams';
import { Card } from './ui/Card';
import { PositionIndicator } from './Logs';
import FormGuide from './ui/FormGuide';
import { Link, useParams } from 'react-router-dom';

interface StandingsTableProps {
  standings: (Team & { positionChange?: 'up' | 'down' | 'same' })[];
  compId?: string;
}

const StandingsTable: React.FC<StandingsTableProps> = ({ standings, compId }) => {
    const { compId: routeCompId } = useParams<{ compId: string }>();
    const competitionId = compId || routeCompId || 'unknown';

    const validStandings = (standings || []).filter((t): t is Team & { positionChange?: 'up' | 'down' | 'same' } => {
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
    <Card className="shadow-lg overflow-hidden">
        <div className="overflow-x-auto">
            <table className="w-full text-sm">
                <thead className="bg-primary text-white text-left font-semibold uppercase text-[10px] tracking-wider">
                    <tr>
                        <th className="px-4 py-3 w-12 text-center">#</th>
                        <th className="px-4 py-3">Team</th>
                        <th className="px-2 py-3 text-center w-10" title="Played">P</th>
                        <th className="px-2 py-3 text-center w-10" title="Won">W</th>
                        <th className="px-2 py-3 text-center w-10" title="Drawn">D</th>
                        <th className="px-2 py-3 text-center w-10" title="Lost">L</th>
                        <th className="px-2 py-3 text-center w-10 hidden md:table-cell" title="Goals Scored">GS</th>
                        <th className="px-2 py-3 text-center w-10 hidden md:table-cell" title="Goals Conceded">GC</th>
                        <th className="px-2 py-3 text-center w-10 font-bold" title="Goal Difference">GD</th>
                        <th className="px-2 py-3 text-center w-10 font-black bg-white/10" title="Points">Pts</th>
                        <th className="px-4 py-3 w-32">Form</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                    {validStandings.map((team, index) => (
                        <tr key={team.id || team.name} className="hover:bg-gray-50/50 border-l-4 border-secondary group">
                            <td className="px-4 py-2">
                                <div className="flex flex-col items-center">
                                    <span className="font-bold text-gray-700">{index + 1}</span>
                                    <PositionIndicator change={team.positionChange} />
                                </div>
                            </td>
                            <td className="px-4 py-2">
                                <Link 
                                    to={`/competitions/${competitionId}/teams/${team.id}`}
                                    className="flex items-center space-x-3 group-hover:translate-x-1 transition-transform"
                                >
                                    {team.crestUrl ? (
                                        <img src={team.crestUrl} alt={`${team.name} crest`} loading="lazy" className="w-7 h-7 object-contain flex-shrink-0 bg-white rounded shadow-sm p-0.5" />
                                    ) : (
                                        <div className="w-7 h-7 rounded-full bg-gray-200 flex items-center justify-center text-[10px] font-bold text-gray-400">
                                            {team.name.charAt(0)}
                                        </div>
                                    )}
                                    <span className="font-bold text-gray-800 truncate max-w-[120px] sm:max-w-none group-hover:text-primary transition-colors">{team.name}</span>
                                </Link>
                            </td>
                            <td className="px-2 py-2 text-center font-medium">{team.stats.p}</td>
                            <td className="px-2 py-2 text-center">{team.stats.w}</td>
                            <td className="px-2 py-2 text-center">{team.stats.d}</td>
                            <td className="px-2 py-2 text-center">{team.stats.l}</td>
                            <td className="px-2 py-2 text-center hidden md:table-cell">{team.stats.gs}</td>
                            <td className="px-2 py-2 text-center hidden md:table-cell">{team.stats.gc}</td>
                            <td className="px-2 py-2 text-center font-bold text-gray-600">{team.stats.gd > 0 ? `+${team.stats.gd}` : team.stats.gd}</td>
                            <td className="px-2 py-2 text-center font-black bg-primary/5 text-primary">{team.stats.pts}</td>
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