import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { Competition } from '../data/teams';
import { listenToAllCompetitions } from '../services/api';

interface DataCacheContextType {
  competitions: Record<string, Competition>;
  loading: boolean;
  error: any | null;
}

const DataCacheContext = createContext<DataCacheContextType | undefined>(undefined);

export const DataCacheProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [competitions, setCompetitions] = useState<Record<string, Competition>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<any | null>(null);

  useEffect(() => {
    let timedOut = false;
    const timeoutId = setTimeout(() => {
      if (loading) {
        timedOut = true;
        console.warn("DataCacheProvider startup timeout hit. Forcing loading state to false.");
        setLoading(false);
      }
    }, 10000);

    // This single listener will power the entire app's competition data
    const unsubscribe = listenToAllCompetitions((allComps, err) => {
      clearTimeout(timeoutId);
      
      if (err) {
        const safeErr = {
            code: err?.code || 'unknown',
            message: err?.message || String(err)
        };
        console.log("DataCacheListener - Received data or error:", { allCompsKeys: Object.keys(allComps || {}), err: safeErr });
        console.error("Firestore cache listener error:", safeErr);
        setError(safeErr);
      } else {
        console.log("DataCacheListener - Setting competitions:", Object.keys(allComps || {}));
        setCompetitions(allComps || {});
        setError(null);
      }
      setLoading(false);
    });

    return () => {
      unsubscribe();
      clearTimeout(timeoutId);
    };
  }, []);

  return (
    <DataCacheContext.Provider value={{ competitions, loading, error }}>
      {children}
    </DataCacheContext.Provider>
  );
};

export const useDataCache = () => {
  const context = useContext(DataCacheContext);
  if (context === undefined) {
    throw new Error('useDataCache must be used within a DataCacheProvider');
  }
  return context;
};
