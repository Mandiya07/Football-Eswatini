import React from 'react';
import { Card, CardContent } from './ui/Card';
import { YouthLeague } from '../data/youth';
import RisingStars from './RisingStars';

interface YouthSectionProps {
  league: YouthLeague;
}

const YouthSection: React.FC<YouthSectionProps> = ({ league }) => {
  return (
    <section aria-labelledby={`league-title-${league.id}`}>
        <div className="mb-8">
            <h2 id={`league-title-${league.id}`} className="text-3xl font-display font-bold text-primary border-b-4 border-primary/20 pb-2">
            {league.name}
            </h2>
            <p className="text-gray-600 mt-3 max-w-4xl">{league.description}</p>
        </div>
        
        {league.risingStars && league.risingStars.length > 0 && (
            <div className="mb-8">
            <RisingStars players={league.risingStars} />
            </div>
        )}
        
        {league.teams && league.teams.length > 0 && (
            <Card className="bg-blue-50/50">
              <CardContent>
                <h3 className="text-xl font-bold font-display text-gray-700 mb-4">Participating Teams & Academies</h3>
                <div className="flex flex-wrap gap-4">
                    {league.teams.map(team => (
                    <div key={team.id} className="flex items-center gap-3 bg-white py-2 px-4 rounded-lg shadow-sm hover:shadow-md transition-shadow cursor-default border border-gray-200">
                        <img src={team.crestUrl} alt={team.name} className="w-8 h-8 object-contain" />
                        <span className="text-sm font-semibold text-gray-800">{team.name}</span>
                    </div>
                    ))}
                </div>
              </CardContent>
            </Card>
        )}
    </section>
  );
};

export default YouthSection;
