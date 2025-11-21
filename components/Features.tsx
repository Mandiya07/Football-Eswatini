
import React from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent } from './ui/Card';
import ArrowRightIcon from './icons/ArrowRightIcon';

// Import existing and new icons
import ClipboardIcon from './icons/ClipboardIcon';
import FileTextIcon from './icons/FileTextIcon';
import ShirtIcon from './icons/ShirtIcon';
import HistoryIcon from './icons/HistoryIcon';
import SparklesIcon from './icons/SparklesIcon';

interface Feature {
  title: string;
  description: string;
  Icon: React.FC<React.SVGProps<SVGSVGElement>>;
  iconBgColor: string;
  href?: string;
}

export const featuresData: Feature[] = [
  {
    title: 'Coach’s Corner',
    description: 'Get tactical insights, analysis, and post-match breakdowns from top coaches.',
    Icon: ClipboardIcon,
    iconBgColor: 'bg-red-100 text-red-600',
    href: '/coachs-corner'
  },
  {
    title: 'Memory Lane',
    description: 'Relive iconic moments, legendary players, and historic matches from Eswatini football.',
    Icon: HistoryIcon,
    iconBgColor: 'bg-blue-100 text-blue-600',
    href: '/memory-lane'
  },
  {
    title: 'Exclusive',
    description: 'Read one-on-one conversations with players, managers, and key figures in the sport.',
    Icon: FileTextIcon,
    iconBgColor: 'bg-yellow-100 text-yellow-600',
    href: '/exclusive'
  },
  {
    title: 'Team Yam',
    description: 'Celebrate the fan culture, chants, and behind-the-scenes stories of the supporters.',
    Icon: ShirtIcon,
    iconBgColor: 'bg-green-100 text-green-600',
    href: '/team-yam'
  },
];

export const FeatureCard: React.FC<{ feature: Feature; variant?: 'default' | 'compact' }> = ({ feature, variant = 'default' }) => {
    const { title, description, Icon, iconBgColor, href } = feature;

    if (variant === 'compact') {
      const cardContent = (
        <Card className="group transition-all duration-300 hover:shadow-lg hover:-translate-y-1 flex items-center h-full text-left">
            <CardContent className="flex items-center gap-4 p-4 w-full">
                <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${iconBgColor} flex-shrink-0 transition-transform duration-300 group-hover:scale-105`}>
                    <Icon className="w-7 h-7" />
                </div>
                <div className="flex-grow min-w-0">
                    <h3 className="font-display font-bold text-md text-gray-800 group-hover:text-primary transition-colors truncate">{title}</h3>
                    <p className="text-gray-600 text-xs leading-relaxed line-clamp-2">{description}</p>
                </div>
            </CardContent>
        </Card>
      );
      return href ? <Link to={href} className="block h-full">{cardContent}</Link> : <div className="h-full">{cardContent}</div>;
    }

    const cardContent = (
        <Card className="group transition-all duration-300 hover:shadow-xl hover:-translate-y-2 flex flex-col h-full text-left">
            <CardContent className="flex flex-col flex-grow p-6">
                <div className="flex-grow">
                    <div className={`w-14 h-14 rounded-xl flex items-center justify-center ${iconBgColor} mb-5 transition-transform duration-300 group-hover:scale-110`}>
                        <Icon className="w-8 h-8" />
                    </div>
                    <h3 className="font-display font-bold text-xl mb-2 text-gray-800 group-hover:text-blue-600 transition-colors">{title}</h3>
                    <p className="text-gray-600 text-sm leading-relaxed">{description}</p>
                </div>
            </CardContent>
        </Card>
    );

    return href ? <Link to={href} className="block h-full">{cardContent}</Link> : <div className="h-full">{cardContent}</div>;
};

const Features: React.FC = () => {
  return (
    <section>
      <h2 className="text-3xl font-display font-bold mb-8 text-center">Explore More</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
        {featuresData.map((feature) => (
          <FeatureCard key={feature.title} feature={feature} />
        ))}
      </div>
    </section>
  );
};

export default Features;
