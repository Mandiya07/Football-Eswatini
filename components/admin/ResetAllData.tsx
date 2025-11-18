import React, { useState } from 'react';
import { resetAllCompetitionData, handleFirestoreError } from '../../services/api';
import { Card, CardContent } from '../ui/Card';
import Button from '../ui/Button';
import Spinner from '../ui/Spinner';
import AlertTriangleIcon from '../icons/AlertTriangleIcon';

const ResetAllData: React.FC = () => {
    const [confirmationText, setConfirmationText] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [statusMessage, setStatusMessage] = useState({ type: '', text: '' });

    const CONFIRMATION_PHRASE = "permanently reset all";
    const isConfirmed = confirmationText === CONFIRMATION_PHRASE;

    const handleDelete = async () => {
        if (!isConfirmed) return;

        if (!window.confirm(`ARE YOU ABSOLUTELY SURE?\n\nThis will permanently delete all teams, fixtures, and results from EVERY competition. This action cannot be undone.`)) {
            return;
        }

        setSubmitting(true);
        setStatusMessage({ type: '', text: '' });

        try {
            await resetAllCompetitionData();
            setStatusMessage({ type: 'success', text: `All competition data has been successfully reset. The database is now a clean slate.` });
            setConfirmationText('');
        } catch (error) {
            // The API function now handles the alert. We just set a status message here.
            setStatusMessage({ type: 'error', text: `Failed to reset data. See alert for details.` });
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <Card className="shadow-lg animate-fade-in border-2 border-red-500 bg-red-50/50">
            <CardContent className="p-6">
                <div className="flex items-center gap-3 mb-4">
                    <AlertTriangleIcon className="w-6 h-6 text-red-600" />
                    <h3 className="text-2xl font-bold font-display text-red-800">Reset All Competition Data</h3>
                </div>
                <p className="text-sm text-red-700 mb-6">
                    This is the most destructive action available. It will permanently delete all teams, fixtures, and results for every competition in the database, resetting all league logs. Use with extreme caution.
                </p>

                <div className="space-y-4 max-w-lg">
                    <div>
                        <label htmlFor="confirmation-text" className="block text-sm font-medium text-gray-700 mb-1">
                            To confirm, type: <span className="font-bold text-red-700">{CONFIRMATION_PHRASE}</span>
                        </label>
                        <input
                            id="confirmation-text"
                            type="text"
                            value={confirmationText}
                            onChange={e => setConfirmationText(e.target.value)}
                            className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-red-500 focus:border-red-500 sm:text-sm rounded-md shadow-sm"
                        />
                    </div>

                    <Button 
                        onClick={handleDelete} 
                        disabled={!isConfirmed || submitting} 
                        className="bg-red-600 text-white hover:bg-red-700 focus:ring-red-500 disabled:bg-red-300 disabled:cursor-not-allowed h-11 w-auto flex justify-center items-center gap-2 px-6"
                    >
                        {submitting ? <Spinner className="w-5 h-5 border-2"/> : <>Permanently Reset All Data</>}
                    </Button>
                </div>
                
                {statusMessage.text && (
                    <div className={`mt-6 p-3 rounded-md text-sm font-semibold ${statusMessage.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                        {statusMessage.text}
                    </div>
                )}
            </CardContent>
        </Card>
    );
};

export default ResetAllData;