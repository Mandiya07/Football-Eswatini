import React from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent } from './ui/Card';
import GlobeIcon from './icons/GlobeIcon';
import ArrowRightIcon from './icons/ArrowRightIcon';

interface RegionStream {
  name: string;
  leagueId: string;
}

interface Region {
  id: string;
  name: string;
  leagueName?: string;
  leagueId?: string;
  color: string;
  streams?: RegionStream[];
}

const regions: Region[] = [
  { 
    id: 'hhohho', 
    name: 'Hhohho Region', 
    color: 'from-blue-500 to-blue-700',
    streams: [
      { name: 'Northern Zone', leagueId: 'hhohho-super-league-north' },
      { name: 'Southern Zone', leagueId: 'hhohho-super-league-south' }
    ]
  },
  { 
    id: 'lubombo', 
    name: 'Lubombo Region', 
    leagueId: 'lubombo-super-league', 
    leagueName: 'Lubombo Super League', 
    color: 'from-green-500 to-green-700' 
  },
  { 
    id: 'manzini', 
    name: 'Manzini Region', 
    leagueId: 'manzini-super-league', 
    leagueName: 'Manzini Super League', 
    color: 'from-yellow-500 to-yellow-700' 
  },
  { 
    id: 'shiselweni', 
    name: 'Shiselweni Region', 
    color: 'from-red-500 to-red-700',
    streams: [
        { name: 'Northern Zone', leagueId: 'shiselweni-super-league-north' },
        { name: 'Southern Zone', leagueId: 'shiselweni-super-league-south' }
    ]
  },
];

const RegionalPage: React.FC = () => {
  return (
    <div className="bg-gray-50 py-12">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 animate-fade-in">
        <div className="text-center mb-12">
          <GlobeIcon className="w-12 h-12 mx-auto text-primary mb-2" />
          <h1 className="text-4xl md:text-5xl font-display font-extrabold text-blue-800 mb-2">
            Regional Leagues
          </h1>
          <p className="text-lg text-gray-600 max-w-3xl mx-auto">
            Explore the heart of community football. Select a region to view its league standings, fixtures, and results.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          {regions.map((region) => (
            region.streams ? (
              // Card for regions with multiple streams (Hhohho, Shiselweni)
              <Card key={region.id} className={`shadow-lg text-white bg-gradient-to-br ${region.color}`}>
                <CardContent className="p-6">
                  <h2 className="text-2xl font-bold font-display mb-4">{region.name}</h2>
                  <div className="space-y-3">
                    {region.streams.map(stream => (
                      <Link
                        key={stream.leagueId}
                        to={`/region/${stream.leagueId}`}
                        className="group block bg-white/20 backdrop-blur-sm p-3 rounded-lg hover:bg-white/30 transition-colors"
                      >
                        <div className="flex justify-between items-center">
                          <span className="font-semibold">{stream.name}</span>
                          <ArrowRightIcon className="w-5 h-5 transform transition-transform duration-300 group-hover:translate-x-1" />
                        </div>
                      </Link>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ) : (
              // Card for regions with a single league (Manzini, Lubombo)
              <Link key={region.id} to={`/region/${region.leagueId}`} className="group block">
                <Card className={`shadow-lg transition-all duration-300 hover:shadow-xl hover:-translate-y-2 text-white bg-gradient-to-br ${region.color}`}>
                  <CardContent className="p-6 flex justify-between items-center">
                    <div>
                      <h2 className="text-2xl font-bold font-display">{region.name}</h2>
                      <p className="opacity-80">{region.leagueName}</p>
                    </div>
                    <ArrowRightIcon className="w-8 h-8 opacity-70 transform transition-transform duration-300 group-hover:opacity-100 group-hover:translate-x-1" />
                  </CardContent>
                </Card>
              </Link>
            )
          ))}
        </div>
      </div>
    </div>
  );
};

export default RegionalPage;