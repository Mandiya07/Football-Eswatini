
import React from 'react';
import { Link } from 'react-router-dom';

const NotFound: React.FC = () => {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center bg-gray-50">
      <div className="mb-8 p-6 bg-blue-50 rounded-full relative">
        <div className="font-black text-6xl text-blue-600">
          404
        </div>
      </div>
      <h1 className="text-4xl font-bold text-gray-900 mb-4 uppercase tracking-tighter">
        Final Whistle Blown Early!
      </h1>
      <p className="text-lg text-gray-600 max-w-md mb-10 leading-relaxed">
        We couldn't find the page you're looking for. It might have been moved, deleted, or never existed in our stadium.
      </p>
      <div className="flex flex-col sm:flex-row gap-4">
        <Link to="/" className="bg-blue-600 text-white h-12 px-8 rounded-xl font-bold uppercase tracking-widest shadow-lg flex items-center justify-center">
          Back to Home
        </Link>
      </div>
    </div>
  );
};

export default NotFound;
