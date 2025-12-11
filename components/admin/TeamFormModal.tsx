
import React, { useState, useEffect } from 'react';
import { Team } from '../../data/teams';
import { Card, CardContent } from '../ui/Card';
import Button from '../ui/Button';
import XIcon from '../icons/XIcon';
import BookIcon from '../icons/BookIcon';
import CheckCircleIcon from '../icons/CheckCircleIcon';
import { fetchDirectoryEntries } from '../../services/api';

type TeamFormData = {
    name: string;
    crestUrl: string;
    kitSponsorName: string;
    kitSponsorLogoUrl: string;
};

interface TeamFormModalProps {
    isOpen: boolean;
    onClose: () => void;
    // Updated signature: accept addToDirectory boolean instead of linkedDirectoryId string
    onSave: (data: Partial<Omit<Team, 'id' | 'stats' | 'players' | 'fixtures' | 'results' | 'staff'>>, id?: number, addToDirectory?: boolean) => void;
    team: Team | null;
    competitionId: string;
}

const TeamFormModal: React.FC<TeamFormModalProps> = ({ isOpen, onClose, onSave, team, competitionId }) => {
    const [formData, setFormData] = useState<TeamFormData>({
        name: '',
        crestUrl: '',
        kitSponsorName: '',
        kitSponsorLogoUrl: '',
    });
    
    const [addToDirectory, setAddToDirectory] = useState(false);
    const [alreadyInDirectory, setAlreadyInDirectory] = useState(false);
    const [checkingDirectory, setCheckingDirectory] = useState(false);

    useEffect(() => {
        const checkDirectory = async () => {
            if (!team) {
                setFormData({ name: '', crestUrl: '', kitSponsorName: '', kitSponsorLogoUrl: '' });
                setAddToDirectory(true); // Default check for new teams
                return;
            }

            setCheckingDirectory(true);
            try {
                // Pre-fill form
                setFormData({
                    name: team.name,
                    crestUrl: team.crestUrl,
                    kitSponsorName: team.kitSponsor?.name || '',
                    kitSponsorLogoUrl: team.kitSponsor?.logoUrl || '',
                });

                // Check directory status
                const entries = await fetchDirectoryEntries();
                const exists = entries.some(e => 
                    (e.teamId === team.id && e.competitionId === competitionId) || 
                    (e.name.toLowerCase() === team.name.toLowerCase())
                );
                
                setAlreadyInDirectory(exists);
                setAddToDirectory(exists); // If exists, check the box to show it's linked (user can uncheck to unlink)

            } catch (error) {
                console.error("Error checking directory status", error);
            } finally {
                setCheckingDirectory(false);
            }
        };

        if (isOpen) {
            checkDirectory();
        }
    }, [team, isOpen, competitionId]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, field: 'crestUrl' | 'kitSponsorLogoUrl') => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            const reader = new FileReader();
            reader.onloadend = () => {
                if (typeof reader.result === 'string') {
                    setFormData(prev => ({ ...prev, [field]: reader.result as string }));
                }
            };
            reader.readAsDataURL(file);
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const dataToSave: Partial<Omit<Team, 'id' | 'stats' | 'players' | 'fixtures' | 'results' | 'staff'>> = {
            name: formData.name,
            crestUrl: formData.crestUrl || `https://via.placeholder.com/128/CCCCCC/FFFFFF?text=${formData.name.substring(0, 2).toUpperCase()}`,
        };

        if (formData.kitSponsorName.trim() && formData.kitSponsorLogoUrl.trim()) {
            dataToSave.kitSponsor = {
                name: formData.kitSponsorName.trim(),
                logoUrl: formData.kitSponsorLogoUrl.trim(),
            };
        } else {
            dataToSave.kitSponsor = undefined;
        }

        onSave(dataToSave, team?.id, addToDirectory);
    };

    const inputClass = "block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm";

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4 animate-fade-in" onClick={onClose}>
            <Card className="w-full max-w-lg max-h-[90vh] overflow-y-auto relative animate-slide-up" onClick={e => e.stopPropagation()}>
                <button onClick={onClose} className="absolute top-4 right-4 text-gray-500 hover:text-gray-800" aria-label="Close form"><XIcon className="w-6 h-6" /></button>
                <CardContent className="p-8">
                    <h2 className="text-2xl font-bold font-display mb-6">{team ? 'Edit Team' : 'Create New Team'}</h2>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        
                        <div>
                            <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">Team Name</label>
                            <input type="text" id="name" name="name" value={formData.name} onChange={handleChange} required className={inputClass} />
                        </div>
                        <div>
                            <label htmlFor="crestUrl" className="block text-sm font-medium text-gray-700 mb-1">Crest URL or Upload</label>
                            <div className="flex items-center gap-2">
                                <input type="text" id="crestUrl" name="crestUrl" value={formData.crestUrl} onChange={handleChange} className={inputClass} placeholder="Paste URL or leave blank for placeholder"/>
                                <label htmlFor="crestUpload" className="cursor-pointer bg-white py-2 px-3 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 whitespace-nowrap">
                                    Upload
                                    <input type="file" id="crestUpload" onChange={(e) => handleFileChange(e, 'crestUrl')} accept="image/*" className="sr-only" />
                                </label>
                            </div>
                            {formData.crestUrl && <img src={formData.crestUrl} alt="Crest preview" className="mt-4 h-24 w-24 object-contain border rounded-full p-2 mx-auto" />}
                        </div>

                        {/* Directory Add Option */}
                        <div className={`p-3 rounded-md border flex items-start gap-3 mt-2 ${addToDirectory ? 'bg-green-50 border-green-200' : 'bg-gray-50 border-gray-200'}`}>
                            <div className="flex items-center h-5">
                                <input
                                    id="addToDirectory"
                                    name="addToDirectory"
                                    type="checkbox"
                                    checked={addToDirectory}
                                    onChange={(e) => setAddToDirectory(e.target.checked)}
                                    className="focus:ring-blue-500 h-4 w-4 text-blue-600 border-gray-300 rounded"
                                />
                            </div>
                            <div className="text-sm">
                                <label htmlFor="addToDirectory" className={`font-medium flex items-center gap-2 ${addToDirectory ? 'text-green-800' : 'text-gray-700'}`}>
                                    {alreadyInDirectory ? <><CheckCircleIcon className="w-4 h-4"/> Linked to Directory</> : <><BookIcon className="w-4 h-4"/> Add to Football Directory</>}
                                </label>
                                <p className={`text-xs mt-1 ${addToDirectory ? 'text-green-700' : 'text-gray-500'}`}>
                                    {alreadyInDirectory 
                                     ? "Uncheck to remove this team's link to the public directory." 
                                     : "Check to create a public profile for this team in the Directory."}
                                </p>
                            </div>
                        </div>
                        
                        <div className="space-y-4 pt-4 border-t">
                            <h3 className="text-lg font-semibold text-gray-700">Kit Sponsor (Optional)</h3>
                             <div>
                                <label htmlFor="kitSponsorName" className="block text-sm font-medium text-gray-700 mb-1">Sponsor Name</label>
                                <input type="text" id="kitSponsorName" name="kitSponsorName" value={formData.kitSponsorName} onChange={handleChange} className={inputClass} placeholder="e.g., Umbro" />
                            </div>
                             <div>
                                <label htmlFor="kitSponsorLogoUrl" className="block text-sm font-medium text-gray-700 mb-1">Sponsor Logo URL or Upload</label>
                                <div className="flex items-center gap-2">
                                    <input type="text" id="kitSponsorLogoUrl" name="kitSponsorLogoUrl" value={formData.kitSponsorLogoUrl} onChange={handleChange} className={inputClass} placeholder="https://.../logo.png"/>
                                    <label htmlFor="sponsorLogoUpload" className="cursor-pointer bg-white py-2 px-3 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 whitespace-nowrap">
                                        Upload
                                        <input type="file" id="sponsorLogoUpload" onChange={(e) => handleFileChange(e, 'kitSponsorLogoUrl')} accept="image/*" className="sr-only" />
                                    </label>
                                </div>
                                {formData.kitSponsorLogoUrl && <img src={formData.kitSponsorLogoUrl} alt="Sponsor logo preview" className="mt-2 h-16 object-contain" />}
                            </div>
                        </div>

                        <div className="flex justify-end gap-2 pt-4">
                            <Button type="button" onClick={onClose} className="bg-gray-200 text-gray-800">Cancel</Button>
                            <Button type="submit" className="bg-primary text-white hover:bg-primary-dark">Save Team</Button>
                        </div>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
};

export default TeamFormModal;
