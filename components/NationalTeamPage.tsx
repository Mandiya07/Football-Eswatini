import React from 'react';
import { Link } from 'react-router-dom';
import ArrowLeftIcon from './icons/ArrowLeftIcon';

const NationalTeamPage: React.FC = () => {
  return (
    <div className="bg-gray-50 py-12 min-h-screen">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-6">
          <Link to="/national-team" className="inline-flex items-center gap-2 text-sm font-semibold text-gray-600 hover:text-gray-900 transition-colors">
            <ArrowLeftIcon className="w-4 h-4" />
            Back to National Teams
          </Link>
        </div>
        <div className="text-center mb-12">
          <h1 className="text-4xl font-display font-extrabold text-blue-800 mb-4">All National Teams</h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Explore all Eswatini national football teams across different age groups and categories.
          </p>
        </div>
        <div className="bg-white rounded-2xl p-12 text-center border border-gray-200 shadow-sm">
          <p className="text-gray-500 italic">National team directory is being updated. Please check back soon.</p>
        </div>
      </div>
    </div>
  );
};

export default NationalTeamPage;
