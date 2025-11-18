


import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '../ui/Card';
import Button from '../ui/Button';
import CheckIcon from '../icons/CheckIcon';
import XIcon from '../icons/XIcon';
// FIX: Import 'fetchPendingChanges' and 'deletePendingChange' which are now correctly exported from the API service.
import { fetchPendingChanges, deletePendingChange, PendingChange, handleFirestoreError } from '../../services/api';
import Spinner from '../ui/Spinner';

const ApprovalQueue: React.FC = () => {
  const [changes, setChanges] = useState<PendingChange[]>([]);
  const [loading, setLoading] = useState(true);
  const [processedIds, setProcessedIds] = useState<string[]>([]);

  const loadChanges = async () => {
    setLoading(true);
    const data = await fetchPendingChanges();
    setChanges(data);
    setLoading(false);
  };

  useEffect(() => {
    loadChanges();
  }, []);

  const handleDecision = async (id: string, decision: 'approved' | 'rejected') => {
    console.log(`Change ID ${id} has been ${decision}.`);
    // In a real app, you would apply the change here if approved.
    
    setProcessedIds(prev => [...prev, id]);
    
    try {
        await new Promise(resolve => setTimeout(resolve, 400)); // Wait for animation
        await deletePendingChange(id);
        setChanges(prev => prev.filter(change => change.id !== id));
    } catch (error) {
        // Error is already handled and alerted by deletePendingChange
        setProcessedIds(prev => prev.filter(processedId => processedId !== id)); // Revert visual change on error
    }
  };

  return (
    <Card className="shadow-lg animate-fade-in">
      <CardContent className="p-6">
        <h3 className="text-2xl font-bold font-display mb-1">Approval Queue</h3>
        <p className="text-sm text-gray-600 mb-6">Review and approve changes submitted by club officials.</p>
        
        {loading ? <div className="flex justify-center py-8"><Spinner /></div> : 
        changes.length > 0 ? (
          <div className="space-y-3">
            {changes.map(change => (
              <div 
                key={change.id} 
                className={`p-3 bg-white border rounded-lg flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 transition-opacity duration-300 ${processedIds.includes(change.id) ? 'opacity-0' : 'opacity-100'}`}
              >
                <div>
                  <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${change.type === 'Score Update' ? 'bg-blue-100 text-blue-800' : 'bg-yellow-100 text-yellow-800'}`}>
                    {change.type}
                  </span>
                  <p className="font-semibold mt-1">{change.description}</p>
                  <p className="text-xs text-gray-500">Submitted by: {change.author}</p>
                </div>
                <div className="flex-shrink-0 flex items-center gap-2">
                  <Button onClick={() => handleDecision(change.id, 'rejected')} className="bg-red-100 text-red-700 hover:bg-red-200 focus:ring-red-500 h-9 w-9 p-0 flex items-center justify-center">
                    <XIcon className="w-5 h-5" />
                  </Button>
                  <Button onClick={() => handleDecision(change.id, 'approved')} className="bg-green-100 text-green-700 hover:bg-green-200 focus:ring-green-500 h-9 w-9 p-0 flex items-center justify-center">
                    <CheckIcon className="w-5 h-5" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-center text-gray-500 py-8">The approval queue is empty.</p>
        )}
      </CardContent>
    </Card>
  );
};

export default ApprovalQueue;