

import React from 'react';
import { Link } from 'react-router-dom';
import TrophyIcon from './icons/TrophyIcon';
import MedalIcon from './icons/MedalIcon';
import GlobeIcon from './icons/GlobeIcon';
import YouthIcon from './icons/YouthIcon';
import SparklesIcon from './icons/SparklesIcon';
import WhistleIcon from './icons/WhistleIcon';
import WomanIcon from './icons/WomanIcon';
import NationalTeamIcon from './icons/NationalTeamIcon';
import VoteIcon from './icons/VoteIcon';

const tiles = [
  {
    name: 'Premier League',
    href: '/logs',
    Icon: TrophyIcon,
    color: 'text-primary',
  },
  {
    name: 'First Division',
    href: '/logs',
    Icon: MedalIcon,
    color: 'text-green-600',
  },
  {
    name: 'Cups',
    href: '/cups',
    Icon: TrophyIcon,
    color: 'text-secondary',
  },
  {
    name: 'Womens',
    href: '/womens',
    Icon: WomanIcon,
    color: 'text-pink-600',
  },
  {
    name: 'Youth Spotlight',
    href: '/youth',
    Icon: YouthIcon,
    color: 'text-teal-600',
  },
  {
    name: 'Regional',
    href: '/regional',
    Icon: GlobeIcon,
    color: 'text-accent',
  },
  {
    name: 'National Team',
    href: '/national-team',
    Icon: NationalTeamIcon,
    color: 'text-blue-500',
  },
  {
    name: 'Interactive Zone',
    href: '/interactive',
    Icon: VoteIcon,
    color: 'text-indigo-600',
  },
  {
    name: 'AI Assistant',
    href: '/ai-assistant',
    Icon: SparklesIcon,
    color: 'text-purple-600',
  },
];

const QuickAccess: React.FC = () => {
  return (
    <section className="py-12">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-5 gap-4 md:gap-6">
          {tiles.map((tile) => (
            <Link
              key={tile.name}
              to={tile.href}
              className="group bg-white p-4 rounded-xl shadow-sm border border-gray-200 hover:border-primary-light hover:shadow-lg hover:-translate-y-1 transition-all duration-300 flex flex-col items-center text-center focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-light"
            >
              <div className="mb-3">
                <tile.Icon className={`w-8 h-8 ${tile.color} transition-transform duration-300 group-hover:scale-110`} />
              </div>
              <p className="font-semibold text-gray-700 text-sm">{tile.name}</p>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
};

export default QuickAccess;