
import React, { useState } from 'react';
import { Card, CardContent } from '../ui/Card';
import Button from '../ui/Button';
import Spinner from '../ui/Spinner';
import CheckCircleIcon from '../icons/CheckCircleIcon';
import VoteIcon from '../icons/VoteIcon';
import { db } from '../../services/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { handleFirestoreError } from '../../services/api';

const ClubPollsManagement: React.FC<{ clubName: string }> = ({ clubName }) => {
    const [pollType, setPollType] = useState('Player of the Month');
    const [question, setQuestion] = useState('');
    const [options, setOptions] = useState<string[]>(['', '']); // Start with 2 empty options
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [successMessage, setSuccessMessage] = useState('');

    const handleOptionChange = (index: number, value: string) => {
        const newOptions = [...options];
        newOptions[index] = value;
        setOptions(newOptions);
    };

    const addOption = () => setOptions([...options, '']);
    const removeOption = (index: number) => setOptions(options.filter((_, i) => i !== index));

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const validOptions = options.filter(o => o.trim() !== '');
        if (validOptions.length < 2) {
            alert("Please provide at least two options.");
            return;
        }

        setIsSubmitting(true);
        setSuccessMessage('');

        try {
            await addDoc(collection(db, 'polls'), {
                clubName,
                type: pollType,
                question: question || `${pollType}: Vote Now!`,
                options: validOptions.map(opt => ({ label: opt, votes: 0 })),
                isActive: true,
                createdAt: serverTimestamp()
            });
            setSuccessMessage("Poll created! It will now appear in the Fan Zone.");
            setQuestion('');
            setOptions(['', '']);
        } catch (error) {
            handleFirestoreError(error, 'create poll');
        } finally {
            setIsSubmitting(false);
        }
    };

    const inputClass = "block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm";

    return (
        <Card className="shadow-lg animate-fade-in">
            <CardContent className="p-6">
                <div className="flex items-center gap-3 mb-4">
                    <VoteIcon className="w-8 h-8 text-yellow-600" />
                    <h3 className="text-2xl font-bold font-display">Create Fan Poll</h3>
                </div>
                <p className="text-gray-600 mb-6 text-sm">Engage your supporters with interactive polls. Results are tracked in real-time.</p>

                {successMessage && (
                    <div className="mb-6 p-4 bg-green-50 text-green-800 border border-green-200 rounded-md flex items-center gap-3 animate-fade-in">
                        <CheckCircleIcon className="w-6 h-6" />
                        <span className="font-semibold">{successMessage}</span>
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-5 bg-yellow-50/50 p-6 rounded-lg border border-yellow-100">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Poll Type</label>
                            <select value={pollType} onChange={e => setPollType(e.target.value)} className={inputClass}>
                                <option>Player of the Month</option>
                                <option>Goal of the Month</option>
                                <option>Man of the Match</option>
                                <option>Custom Question</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Question / Title</label>
                            <input type="text" value={question} onChange={e => setQuestion(e.target.value)} className={inputClass} placeholder={`Who is your ${pollType}?`} required />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Options (Candidates)</label>
                        <div className="space-y-2">
                            {options.map((opt, index) => (
                                <div key={index} className="flex gap-2">
                                    <input 
                                        type="text" 
                                        value={opt} 
                                        onChange={e => handleOptionChange(index, e.target.value)} 
                                        className={inputClass} 
                                        placeholder={`Option ${index + 1}`}
                                        required={index < 2}
                                    />
                                    {options.length > 2 && (
                                        <button type="button" onClick={() => removeOption(index)} className="text-red-500 hover:text-red-700 font-bold px-2">X</button>
                                    )}
                                </div>
                            ))}
                        </div>
                        <button type="button" onClick={addOption} className="mt-2 text-sm text-blue-600 hover:underline font-semibold">+ Add Another Option</button>
                    </div>

                    <div className="text-right pt-2">
                        <Button type="submit" disabled={isSubmitting} className="bg-yellow-500 text-yellow-900 hover:bg-yellow-400 font-bold">
                            {isSubmitting ? <Spinner className="w-4 h-4 border-2" /> : 'Launch Poll'}
                        </Button>
                    </div>
                </form>
            </CardContent>
        </Card>
    );
};

export default ClubPollsManagement;
