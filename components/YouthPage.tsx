import React, { useState, useEffect } from 'react';
import { YouthLeague } from '../data/youth';
import { fetchYouthData } from '../services/api';
import YouthSection from './YouthSection';
import SectionLoader from './SectionLoader';

const YouthPage: React.FC = () => {
  const [youthData, setYouthData] = useState<YouthLeague[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      const data = await fetchYouthData();
      const order = ['u20', 'u17', 'schools', 'u13'];
      const sortedData = [...data].sort((a, b) => order.indexOf(a.id) - order.indexOf(b.id));
      setYouthData(sortedData);
      setLoading(false);
    };
    loadData();
  }, []);

  return (
    <div className="bg-gray-50 py-12">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 animate-fade-in">
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-display font-extrabold text-blue-800 mb-2">
            Youth Football Spotlight
          </h1>
          <p className="text-lg text-gray-600 max-w-3xl mx-auto">
            The future is now. Our updated Youth Spotlight features top talent from the U-20, U-17, Schools, and U-13 leagues, complete with our "Rising Stars" player profiles.
          </p>
        </div>

        {loading ? (
          <SectionLoader />
        ) : youthData.length > 0 ? (
          <div className="space-y-16">
            {youthData.map(league => (
              <YouthSection key={league.id} league={league} />
            ))}
          </div>
        ) : (
          <p className="text-center text-gray-500 py-8">Could not load youth league data.</p>
        )}
      </div>
    </div>
  );
};

export default YouthPage;