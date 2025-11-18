import React from 'react';
import Features from './Features';

const FeaturesPage: React.FC = () => {
  return (
    <div className="py-12">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 animate-fade-in">
            <div className="text-center mb-8">
                <h1 className="text-4xl md:text-5xl font-display font-extrabold text-blue-800 mb-2">
                    Special Features
                </h1>
                <p className="text-lg text-gray-600">
                    Dive deeper into the world of Eswatini football with our exclusive content.
                </p>
            </div>
            <Features />
        </div>
    </div>
  );
};

export default FeaturesPage;