import React from 'react';

const Spinner: React.FC<{ className?: string }> = ({ className = '' }) => {
  return (
    <div
      className={`animate-spin rounded-full border-4 border-t-4 border-gray-200 border-t-blue-600 h-12 w-12 ${className}`}
      role="status"
      aria-label="Loading"
    >
      <span className="sr-only">Loading...</span>
    </div>
  );
};

export default Spinner;