
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
import UsersIcon from './icons/UsersIcon';

const tiles = [
  {
    name: 'Premier League',
    href: '/premier-league',
    Icon: TrophyIcon,
    color: 'text-primary',
  },
  {
    name: 'First Division',
    href: '/first-division',
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
    name: 'International Hub',
    href: '/international',
    Icon: GlobeIcon,
    color: 'text-blue-600',
  },
  {
    name: 'Community Hub',
    href: '/news#community-hub',
    Icon: UsersIcon,
    color: 'text-green-600',
  },
  {
    name: 'Interactive Zone',
    href: '/interactive',
    Icon: VoteIcon,
    color: 'text-indigo-600',
  },
];

const QuickAccess: React.FC = () => {
  return (
    <section className="py-12">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 md:gap-6">
          {tiles.map((tile) => (
            <Link
              key={tile.name}
              to={tile.href}
              className="group bg-white p-6 md:p-8 rounded-2xl shadow-sm border border-gray-200 hover:border-primary-light hover:shadow-xl hover:-translate-y-1.5 transition-all duration-300 flex flex-col items-center text-center focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-light min-h-[140px] md:min-h-[160px] justify-center"
            >
              <div className="mb-4">
                <tile.Icon className={`w-10 h-10 md:w-12 md:h-12 ${tile.color} transition-transform duration-300 group-hover:scale-110`} />
              </div>
              <p className="font-bold text-gray-800 text-sm md:text-base leading-tight tracking-tight">{tile.name}</p>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
};

export default QuickAccess;
