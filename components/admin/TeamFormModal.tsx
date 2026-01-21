
import React, { useState, useEffect } from 'react';
import { Team } from '../../data/teams';
import { Card, CardContent } from '../ui/Card';
import Button from '../ui/Button';
import XIcon from '../icons/XIcon';
import FacebookIcon from '../icons/FacebookIcon';
import TwitterIcon from '../icons/TwitterIcon';
import InstagramIcon from '../icons/InstagramIcon';
import YouTubeIcon from '../icons/YouTubeIcon';
import GlobeIcon from '../icons/GlobeIcon';
import BookIcon from '../icons/BookIcon';

type TeamFormData = {
    name: string;
    crestUrl: string;
    kitSponsorName: string;
    kitSponsorLogoUrl: string;
    facebook: string;
    twitter: string;
    instagram: string;
    youtube: string;
    website: string;
};

interface TeamFormModalProps {
    isOpen: boolean;
    onClose: () => void;
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
        facebook: '',
        twitter: '',
        instagram: '',
        youtube: '',
        website: '',
    });
    
    // Default to true for new teams to encourage directory population
    const [addToDirectory, setAddToDirectory] = useState(true);
    
    useEffect(() => {
        if (!team) {
            setFormData({ 
                name: '', crestUrl: '', kitSponsorName: '', kitSponsorLogoUrl: '',
                facebook: '', twitter: '', instagram: '', youtube: '', website: ''
            });
            setAddToDirectory(true); 
            return;
        }

        // Pre-fill form
        setFormData({
            name: team.name,
            crestUrl: team.crestUrl,
            kitSponsorName: team.kitSponsor?.name || '',
            kitSponsorLogoUrl: team.kitSponsor?.logoUrl || '',
            facebook: team.socialMedia?.facebook || '',
            twitter: team.socialMedia?.twitter || '',
            instagram: team.socialMedia?.instagram || '',
            youtube: team.socialMedia?.youtube || '',
            website: team.socialMedia?.website || '',
        });
        // If editing, default to false unless user explicitly checks it
        setAddToDirectory(false);

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
            socialMedia: {
                facebook: formData.facebook,
                twitter: formData.twitter,
                instagram: formData.instagram,
                youtube: formData.youtube,
                website: formData.website,
            }
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
    const socialInputClass = "block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm";

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/70 z-[300] flex items-start justify-center p-4 pt-24 md:pt-32 overflow-y-auto animate-fade-in" onClick={onClose}>
            <Card className="w-full max-w-lg mb-8 relative animate-slide-up" onClick={e => e.stopPropagation()}>
                <button onClick={onClose} className="absolute top-4 right-4 text-gray-500 hover:text-gray-800" aria-label="Close form"><XIcon className="w-6 h-6" /></button>
                <CardContent className="p-8">
                    <h2 className="text-2xl font-bold font-display mb-6">{team ? 'Edit Team' : 'Create New Team'}</h2>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        
                        <div>
                            <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">Team Name</label>
                            <input type="text" id="name" name="name" value={formData.name} onChange={handleChange} required className={inputClass} />
                        </div>
                        
                        {/* Directory Option */}
                        <div className="bg-blue-50 p-3 rounded-md border border-blue-100 flex items-start gap-3">
                            <input 
                                type="checkbox" 
                                id="addToDirectory" 
                                checked={addToDirectory} 
                                onChange={(e) => setAddToDirectory(e.target.checked)}
                                className="h-4 w-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500 mt-1"
                            />
                            <div>
                                <label htmlFor="addToDirectory" className="text-sm text-blue-800 font-medium cursor-pointer flex items-center gap-2">
                                    <BookIcon className="w-4 h-4" /> 
                                    {team ? 'Update Directory Entry' : 'Add to Football Directory'}
                                </label>
                                <p className="text-xs text-blue-600 mt-0.5">
                                    Sync this team to the public Directory listing.
                                </p>
                            </div>
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

                        {/* Social Media Links */}
                        <div className="space-y-4 pt-4 border-t">
                            <h3 className="text-lg font-semibold text-gray-700">Social Media</h3>
                            <div className="grid grid-cols-1 gap-3">
                                <div className="relative">
                                    <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                                        <FacebookIcon className="w-4 h-4 text-gray-400" />
                                    </span>
                                    <input type="url" name="facebook" value={formData.facebook} onChange={handleChange} className={socialInputClass} placeholder="Facebook URL" />
                                </div>
                                <div className="relative">
                                    <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                                        <TwitterIcon className="w-4 h-4 text-gray-400" />
                                    </span>
                                    <input type="url" name="twitter" value={formData.twitter} onChange={handleChange} className={socialInputClass} placeholder="Twitter/X URL" />
                                </div>
                                <div className="relative">
                                    <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                                        <InstagramIcon className="w-4 h-4 text-gray-400" />
                                    </span>
                                    <input type="url" name="instagram" value={formData.instagram} onChange={handleChange} className={socialInputClass} placeholder="Instagram URL" />
                                </div>
                                <div className="relative">
                                    <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                                        <YouTubeIcon className="w-4 h-4 text-gray-400" />
                                    </span>
                                    <input type="url" name="youtube" value={formData.youtube} onChange={handleChange} className={socialInputClass} placeholder="YouTube URL" />
                                </div>
                                <div className="relative">
                                    <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                                        <GlobeIcon className="w-4 h-4 text-gray-400" />
                                    </span>
                                    <input type="url" name="website" value={formData.website} onChange={handleChange} className={socialInputClass} placeholder="Website URL" />
                                </div>
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
