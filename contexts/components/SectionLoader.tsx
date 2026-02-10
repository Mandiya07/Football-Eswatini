
import React from 'react';
import Skeleton from './ui/Skeleton';

const SectionLoader: React.FC = () => {
  return (
    <div className="space-y-8 animate-fade-in w-full">
      <Skeleton className="h-8 w-1/3" />
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="space-y-4">
          <Skeleton className="h-40 w-full" />
          <Skeleton className="h-4 w-5/6" />
          <Skeleton className="h-4 w-1/2" />
        </div>
        <div className="hidden md:block space-y-4">
          <Skeleton className="h-40 w-full" />
          <Skeleton className="h-4 w-5/6" />
          <Skeleton className="h-4 w-1/2" />
        </div>
        <div className="hidden md:block space-y-4">
          <Skeleton className="h-40 w-full" />
          <Skeleton className="h-4 w-5/6" />
          <Skeleton className="h-4 w-1/2" />
        </div>
      </div>
    </div>
  );
};
export default SectionLoader;
