import React from 'react';

const Home: React.FC = () => {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 p-4 text-center">
      <h1 className="text-4xl font-display font-black text-slate-900 uppercase tracking-tighter mb-4">
        Football Eswatini
      </h1>
      <p className="text-lg text-slate-600 max-w-md">
        Welcome to the new home of Eswatini football. We are currently updating our platform to bring you the best experience.
      </p>
      <div className="mt-8 p-6 bg-white rounded-2xl shadow-sm border border-slate-100">
        <p className="text-sm font-medium text-slate-400 uppercase tracking-widest">
          Coming Soon
        </p>
        <div className="mt-4 flex gap-4 justify-center">
          <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
            <span className="text-blue-600 font-bold">⚽</span>
          </div>
          <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
            <span className="text-green-600 font-bold">🏆</span>
          </div>
          <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center">
            <span className="text-yellow-600 font-bold">⭐</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;
