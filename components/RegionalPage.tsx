import React from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent } from './ui/Card';
import GlobeIcon from './icons/GlobeIcon';
import ArrowRightIcon from './icons/ArrowRightIcon';
import MapPinIcon from './icons/MapPinIcon';
import Button from './ui/Button';

interface Region {
  id: string;
  name: string;
  description: string;
  color: string;
  iconBg: string;
}

const regions: Region[] = [
  { 
    id: 'hhohho', 
    name: 'Hhohho', 
    description: 'Home to the capital city clubs and elite regional development programs.',
    color: 'from-blue-600 to-blue-800',
    iconBg: 'bg-blue-100 text-blue-600'
  },
  { 
    id: 'manzini', 
    name: 'Manzini', 
    description: 'The hub of football activity in Eswatini with intense regional rivalries.',
    color: 'from-yellow-500 to-yellow-700',
    iconBg: 'bg-yellow-100 text-yellow-700'
  },
  { 
    id: 'lubombo', 
    name: 'Lubombo', 
    description: 'Nurturing talent in the eastern lowveld with a focus on community tournaments.',
    color: 'from-green-600 to-green-800',
    iconBg: 'bg-green-100 text-green-600'
  },
  { 
    id: 'shiselweni', 
    name: 'Shiselweni', 
    description: 'Developing the future of football in the southern regions of the Kingdom.',
    color: 'from-red-600 to-red-800',
    iconBg: 'bg-red-100 text-red-600'
  },
];

const RegionalPage: React.FC = () => {
  return (
    <div className="bg-gray-50 py-12 min-h-screen">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 animate-fade-in">
        <div className="text-center mb-16">
          <div className="inline-block p-4 bg-primary/10 rounded-full mb-4">
            <GlobeIcon className="w-12 h-12 text-primary" />
          </div>
          <h1 className="text-4xl md:text-5xl font-display font-extrabold text-blue-900 mb-4">
            Regional Leagues
          </h1>
          <p className="text-lg text-gray-600 max-w-3xl mx-auto leading-relaxed">
            The bedrock of Eswatini football. Discover talent and follow competitive leagues across all four regions of the Kingdom.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto">
          {regions.map((region) => (
            <Link key={region.id} to={`/region/${region.id}`} className="group block h-full">
              <Card className="h-full shadow-lg hover:shadow-2xl transition-all duration-300 hover:-translate-y-2 border-0 overflow-hidden">
                <div className={`h-2 bg-gradient-to-r ${region.color}`}></div>
                <CardContent className="p-8 flex flex-col h-full">
                  <div className="flex justify-between items-start mb-6">
                    <div className={`p-4 rounded-2xl ${region.iconBg}`}>
                      <MapPinIcon className="w-8 h-8" />
                    </div>
                  </div>
                  
                  <h2 className="text-3xl font-display font-bold text-gray-900 mb-3">{region.name}</h2>
                  <p className="text-gray-600 mb-8 flex-grow leading-relaxed">
                    {region.description}
                  </p>
                  
                  <div className="flex items-center gap-2 text-primary font-bold uppercase tracking-wider group-hover:gap-4 transition-all">
                    Explore Region <ArrowRightIcon className="w-5 h-5" />
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>

        <div className="mt-20 max-w-4xl mx-auto">
            <Card className="bg-gradient-to-br from-gray-900 to-blue-900 text-white shadow-2xl border-0">
                <CardContent className="p-10 text-center md:text-left md:flex items-center justify-between gap-8">
                    <div className="flex-1">
                        <h2 className="text-3xl font-display font-bold mb-4">Are you a League Manager?</h2>
                        <p className="text-blue-100 mb-6 md:mb-0">
                            Create and manage your own regional league. Digitally track scores, teams, and standings for your community or organization.
                        </p>
                    </div>
                    <div className="flex-shrink-0">
                        <Link to="/league-registration">
                            <Button className="bg-yellow-400 text-blue-950 font-black px-8 py-4 rounded-xl hover:bg-yellow-300 transition-all hover:scale-105 shadow-xl">
                                Create New League
                            </Button>
                        </Link>
                    </div>
                </CardContent>
            </Card>
        </div>
      </div>
    </div>
  );
};

export default RegionalPage;