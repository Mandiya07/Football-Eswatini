import React, { useState, useEffect, useMemo } from 'react';
import { fetchAllTeams } from '../services/api';
import { Team } from '../data/teams';
import Spinner from './ui/Spinner';
import SearchIcon from './icons/SearchIcon';
import CheckCircleIcon from './icons/CheckCircleIcon';

interface TeamSelectorProps {
  selectedTeamIds: number[];
  onSelectionChange: (ids: number[]) => void;
}

const TeamSelector: React.FC<TeamSelectorProps> = ({ selectedTeamIds, onSelectionChange }) => {
  const [allTeams, setAllTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const loadTeams = async () => {
      const teams = await fetchAllTeams();
      setAllTeams(teams);
      setLoading(false);
    };
    loadTeams();
  }, []);

  const filteredTeams = useMemo(() => {
    return allTeams.filter(team =>
      team.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [allTeams, searchTerm]);

  const handleToggle = (teamId: number) => {
    const newSelection = selectedTeamIds.includes(teamId)
      ? selectedTeamIds.filter(id => id !== teamId)
      : [...selectedTeamIds, teamId];
    onSelectionChange(newSelection);
  };

  if (loading) {
    return <div className="flex justify-center p-8"><Spinner /></div>;
  }

  return (
    <div>
      <div className="relative mb-4">
        <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
          <SearchIcon className="h-5 w-5 text-gray-400" />
        </span>
        <input
          type="text"
          placeholder="Search for a team..."
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
          className="block w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
        />
      </div>
      <div className="max-h-64 overflow-y-auto space-y-2 pr-2">
        {filteredTeams.map(team => {
          const isSelected = selectedTeamIds.includes(team.id);
          return (
            <button
              key={team.id}
              onClick={() => handleToggle(team.id)}
              className={`w-full text-left p-2 rounded-md border-2 transition-colors duration-200 flex items-center gap-3 ${
                isSelected
                  ? 'bg-blue-100 border-blue-400'
                  : 'bg-white hover:bg-gray-50 border-gray-200'
              }`}
            >
              <img src={team.crestUrl} alt={team.name} className="w-8 h-8 rounded-full object-contain" />
              <span className="font-semibold text-sm flex-grow">{team.name}</span>
              {isSelected && <CheckCircleIcon className="w-6 h-6 text-blue-600 flex-shrink-0" />}
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default TeamSelector;