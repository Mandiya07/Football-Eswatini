


import React, { useState } from 'react';
import { Card, CardContent } from '../ui/Card';
import Button from '../ui/Button';
import UploadCloudIcon from '../icons/UploadCloudIcon';
import CheckCircleIcon from '../icons/CheckCircleIcon';
import { db } from '../../services/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { handleFirestoreError } from '../../services/api';

const ManageMatchDay: React.FC<{ clubName: string }> = ({ clubName }) => {
    const [teamSheet, setTeamSheet] = useState<File | null>(null);
    const [formationNotes, setFormationNotes] = useState('');
    const [successMessage, setSuccessMessage] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);


    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setTeamSheet(e.target.files[0]);
        }
    };
    
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!teamSheet) {
            alert("Please upload a team sheet.");
            return;
        }
        setIsSubmitting(true);
        try {
            // In a real app, you would upload the file to Firebase Storage first
            // and then save the file URL. Here, we'll just save the metadata.
            await addDoc(collection(db, 'matchDaySubmissions'), {
                clubName,
                teamSheetName: teamSheet.name,
                teamSheetSize: teamSheet.size,
                formationNotes,
                submittedAt: serverTimestamp()
            });

            setSuccessMessage("Match Day information submitted successfully!");
            setTeamSheet(null);
            setFormationNotes('');
            // Reset file input visually
            const fileInput = document.getElementById('team-sheet-input') as HTMLInputElement;
            if(fileInput) fileInput.value = '';

            setTimeout(() => setSuccessMessage(''), 4000);
        } catch (error) {
            handleFirestoreError(error, 'submit match day info');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Card className="shadow-lg animate-fade-in">
            <CardContent className="p-6">
                <h3 className="text-2xl font-bold font-display mb-4">Match Day Hub</h3>
                <p className="text-gray-600 mb-6 text-sm">Upload team sheets, formations, and post-match reports for your upcoming fixture.</p>
                
                {successMessage && (
                    <div className="mb-4 p-3 bg-green-100 text-green-800 border border-green-200 rounded-md flex items-center gap-2 animate-fade-in">
                        <CheckCircleIcon className="w-5 h-5" />
                        <span className="text-sm font-semibold">{successMessage}</span>
                    </div>
                )}
                
                <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Team Sheet (PDF, DOCX)</label>
                        <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md">
                            <div className="space-y-1 text-center">
                                <UploadCloudIcon className="mx-auto h-12 w-12 text-gray-400" />
                                <div className="flex text-sm text-gray-600">
                                    <label htmlFor="team-sheet-input" className="relative cursor-pointer bg-white rounded-md font-medium text-primary hover:text-primary-dark focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-primary-light">
                                        <span>Upload a file</span>
                                        <input id="team-sheet-input" name="team-sheet" type="file" className="sr-only" onChange={handleFileChange} accept=".pdf,.doc,.docx" />
                                    </label>
                                    <p className="pl-1">or drag and drop</p>
                                </div>
                                {teamSheet ? (
                                    <p className="text-sm text-green-600 font-semibold">{teamSheet.name}</p>
                                ) : (
                                    <p className="text-xs text-gray-500">PDF, DOC, DOCX up to 10MB</p>
                                )}
                            </div>
                        </div>
                    </div>

                    <div>
                        <label htmlFor="formation-notes" className="block text-sm font-medium text-gray-700">Formations / Post-Match Report</label>
                        <textarea
                            id="formation-notes"
                            rows={6}
                            value={formationNotes}
                            onChange={e => setFormationNotes(e.target.value)}
                            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                            placeholder="e.g., Formation: 4-4-2. Key player instructions..."
                        ></textarea>
                    </div>
                    
                    <div className="text-right">
                        <Button type="submit" className="bg-primary text-white hover:bg-primary-dark focus:ring-primary-light" disabled={isSubmitting}>
                            {isSubmitting ? 'Submitting...' : 'Submit Match Day Info'}
                        </Button>
                    </div>
                </form>
            </CardContent>
        </Card>
    );
};

export default ManageMatchDay;