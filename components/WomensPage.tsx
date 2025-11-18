import React from 'react';
import NewsSection from './News';
import Logs from './Logs';
import Fixtures from './Fixtures';

const WomensPage: React.FC = () => {
  // Explicitly set the competition ID to 'eswatini-women-football-league' to ensure all data
  // for fixtures, results, and logs on this page is sourced from the Eswatini Women Football League.
  const WOMENS_LEAGUE_ID = 'eswatini-women-football-league';

  return (
    <div className="bg-gray-50 py-12">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 animate-fade-in">
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-display font-extrabold text-blue-800 mb-2">
            Women's Football
          </h1>
          <p className="text-lg text-gray-600 max-w-3xl mx-auto">
            The central hub for all news, fixtures, and league standings in women's football in Eswatini.
          </p>
        </div>

        <div className="space-y-16">
          <NewsSection category="Womens" />
          <Fixtures showSelector={false} defaultCompetition={WOMENS_LEAGUE_ID} />
          <Logs showSelector={false} defaultLeague={WOMENS_LEAGUE_ID} />
        </div>
      </div>
    </div>
  );
};

export default WomensPage;
