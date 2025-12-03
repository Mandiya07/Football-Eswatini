
import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '../ui/Card';
import Button from '../ui/Button';
import Spinner from '../ui/Spinner';
import CheckCircleIcon from '../icons/CheckCircleIcon';
import PaintBucketIcon from '../icons/PaintBucketIcon';
import FacebookIcon from '../icons/FacebookIcon';
import InstagramIcon from '../icons/InstagramIcon';
import YouTubeIcon from '../icons/YouTubeIcon';
import TwitterIcon from '../icons/TwitterIcon';
import GlobeIcon from '../icons/GlobeIcon';
import { db } from '../../services/firebase';
import { doc, runTransaction } from 'firebase/firestore';
import { handleFirestoreError, fetchCompetition } from '../../services/api';
import { removeUndefinedProps } from '../../services/utils';
import { Competition, Team, TeamSocialMedia } from '../../data/teams';

const ClubBranding: React.FC<{ clubName: string }> = ({ clubName }) => {
    const [primaryColor, setPrimaryColor] = useState('#000000');
    const [secondaryColor, setSecondaryColor] = useState('#FFFFFF');
    const [welcomeMessage, setWelcomeMessage] = useState('');
    const [bannerUrl, setBannerUrl] = useState('');
    
    // Social Media State
    const [socialMedia, setSocialMedia] = useState<TeamSocialMedia>({
        facebook: '',
        instagram: '',
        twitter: '',
        youtube: '',
        website: ''
    });

    const [loading, setLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [successMessage, setSuccessMessage] = useState('');

    const COMPETITION_ID = 'mtn-premier-league';

    useEffect(() => {
        const loadData = async () => {
            setLoading(true);
            try {
                const comp = await fetchCompetition(COMPETITION_ID);
                const team = comp?.teams?.find(t => t.name === clubName);
                if (team) {
                    if (team.branding) {
                        setPrimaryColor(team.branding.primaryColor || '#000000');
                        setSecondaryColor(team.branding.secondaryColor || '#FFFFFF');
                        setWelcomeMessage(team.branding.welcomeMessage || '');
                        setBannerUrl(team.branding.bannerUrl || '');
                    }
                    if (team.socialMedia) {
                        setSocialMedia({
                            facebook: team.socialMedia.facebook || '',
                            instagram: team.socialMedia.instagram || '',
                            twitter: team.socialMedia.twitter || '',
                            youtube: team.socialMedia.youtube || '',
                            website: team.socialMedia.website || ''
                        });
                    }
                }
            } catch (error) {
                console.error("Error loading branding", error);
            } finally {
                setLoading(false);
            }
        };
        loadData();
    }, [clubName]);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            const reader = new FileReader();
            reader.onloadend = () => {
                if (typeof reader.result === 'string') {
                    setBannerUrl(reader.result);
                }
            };
            reader.readAsDataURL(file);
        }
    };

    const handleSocialChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setSocialMedia(prev => ({ ...prev, [e.target.name]: e.target.value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        setSuccessMessage('');

        try {
            const docRef = doc(db, 'competitions', COMPETITION_ID);
            await runTransaction(db, async (transaction) => {
                const docSnap = await transaction.get(docRef);
                if (!docSnap.exists()) throw new Error("Competition not found");
                const comp = docSnap.data() as Competition;
                
                const updatedTeams = comp.teams.map(t => {
                    if (t.name === clubName) {
                        return {
                            ...t,
                            branding: {
                                primaryColor,
                                secondaryColor,
                                welcomeMessage,
                                bannerUrl
                            },
                            socialMedia: socialMedia
                        };
                    }
                    return t;
                });

                transaction.update(docRef, { teams: removeUndefinedProps(updatedTeams) });
            });
            setSuccessMessage("Club profile updated successfully!");
        } catch (error) {
            handleFirestoreError(error, 'update branding');
        } finally {
            setIsSubmitting(false);
        }
    };

    const inputClass = "block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm";

    if (loading) return <div className="flex justify-center p-8"><Spinner /></div>;

    return (
        <Card className="shadow-lg animate-fade-in">
            <CardContent className="p-6">
                <div className="flex items-center gap-3 mb-4">
                    <PaintBucketIcon className="w-8 h-8 text-purple-600" />
                    <h3 className="text-2xl font-bold font-display">Branded Club Hub</h3>
                </div>
                <p className="text-gray-600 mb-6 text-sm">
                    Customize your official team page. These settings will transform your profile into a branded microsite for your fans.
                </p>

                {successMessage && (
                    <div className="mb-6 p-4 bg-green-50 text-green-800 border border-green-200 rounded-md flex items-center gap-3 animate-fade-in">
                        <CheckCircleIcon className="w-6 h-6" />
                        <span className="font-semibold">{successMessage}</span>
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Color Pickers */}
                        <div className="space-y-4">
                            <h4 className="font-bold text-gray-700">Theme Colors</h4>
                            <div>
                                <label className="block text-sm font-medium text-gray-600 mb-1">Primary Color (Backgrounds/Headers)</label>
                                <div className="flex items-center gap-3">
                                    <input type="color" value={primaryColor} onChange={e => setPrimaryColor(e.target.value)} className="h-10 w-20 p-1 rounded border cursor-pointer" />
                                    <input type="text" value={primaryColor} onChange={e => setPrimaryColor(e.target.value)} className={inputClass} />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-600 mb-1">Secondary Color (Accents/Buttons)</label>
                                <div className="flex items-center gap-3">
                                    <input type="color" value={secondaryColor} onChange={e => setSecondaryColor(e.target.value)} className="h-10 w-20 p-1 rounded border cursor-pointer" />
                                    <input type="text" value={secondaryColor} onChange={e => setSecondaryColor(e.target.value)} className={inputClass} />
                                </div>
                            </div>
                        </div>

                        {/* Banner Upload */}
                        <div className="space-y-4">
                            <h4 className="font-bold text-gray-700">Custom Banner</h4>
                            <label className="block text-sm font-medium text-gray-600 mb-1">Header Image</label>
                            <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center hover:bg-gray-50 transition-colors cursor-pointer relative">
                                <input type="file" onChange={handleFileChange} accept="image/*" className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
                                {bannerUrl ? (
                                    <img src={bannerUrl} alt="Banner Preview" className="h-32 w-full object-cover rounded-md" />
                                ) : (
                                    <div className="py-8 text-gray-400">
                                        <p>Click to upload banner</p>
                                        <p className="text-xs mt-1">(Recommended: 1200x300px)</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Welcome Message */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Welcome Message</label>
                        <textarea 
                            value={welcomeMessage} 
                            onChange={e => setWelcomeMessage(e.target.value)} 
                            className={inputClass} 
                            rows={3} 
                            placeholder="A message from the Chairman or Coach to welcome fans to your official hub..." 
                        />
                    </div>

                    {/* Social Media Links */}
                    <div className="space-y-4 border-t pt-6">
                        <h4 className="font-bold text-gray-700">Social Media Profiles</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="relative">
                                <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                                    <FacebookIcon className="w-5 h-5 text-gray-400" />
                                </span>
                                <input 
                                    type="url" 
                                    name="facebook" 
                                    value={socialMedia.facebook} 
                                    onChange={handleSocialChange} 
                                    className={`${inputClass} pl-10`} 
                                    placeholder="Facebook URL" 
                                />
                            </div>
                            <div className="relative">
                                <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                                    <InstagramIcon className="w-5 h-5 text-gray-400" />
                                </span>
                                <input 
                                    type="url" 
                                    name="instagram" 
                                    value={socialMedia.instagram} 
                                    onChange={handleSocialChange} 
                                    className={`${inputClass} pl-10`} 
                                    placeholder="Instagram URL" 
                                />
                            </div>
                            <div className="relative">
                                <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                                    <TwitterIcon className="w-5 h-5 text-gray-400" />
                                </span>
                                <input 
                                    type="url" 
                                    name="twitter" 
                                    value={socialMedia.twitter} 
                                    onChange={handleSocialChange} 
                                    className={`${inputClass} pl-10`} 
                                    placeholder="Twitter/X URL" 
                                />
                            </div>
                            <div className="relative">
                                <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                                    <YouTubeIcon className="w-5 h-5 text-gray-400" />
                                </span>
                                <input 
                                    type="url" 
                                    name="youtube" 
                                    value={socialMedia.youtube} 
                                    onChange={handleSocialChange} 
                                    className={`${inputClass} pl-10`} 
                                    placeholder="YouTube URL" 
                                />
                            </div>
                             <div className="relative md:col-span-2">
                                <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                                    <GlobeIcon className="w-5 h-5 text-gray-400" />
                                </span>
                                <input 
                                    type="url" 
                                    name="website" 
                                    value={socialMedia.website} 
                                    onChange={handleSocialChange} 
                                    className={`${inputClass} pl-10`} 
                                    placeholder="Official Website URL" 
                                />
                            </div>
                        </div>
                    </div>

                    {/* Preview Section */}
                    <div className="border-t pt-6">
                        <h4 className="font-bold text-gray-700 mb-4">Live Preview</h4>
                        <div className="border rounded-xl overflow-hidden shadow-sm">
                            <div className="h-24 w-full relative bg-gray-200">
                                {bannerUrl && <img src={bannerUrl} className="w-full h-full object-cover" alt="" />}
                                <div className="absolute inset-0 bg-black/30"></div>
                                <div className="absolute bottom-4 left-4 text-white font-bold text-xl">{clubName}</div>
                            </div>
                            <div className="p-4 bg-white">
                                <div className="flex gap-2 mb-4">
                                    <button style={{ backgroundColor: primaryColor, color: '#fff' }} className="px-4 py-2 rounded text-sm font-bold">Primary</button>
                                    <button style={{ backgroundColor: secondaryColor, color: '#fff' }} className="px-4 py-2 rounded text-sm font-bold">Secondary</button>
                                </div>
                                {welcomeMessage && (
                                    <div className="bg-gray-50 p-3 rounded border text-sm text-gray-700 italic">
                                        "{welcomeMessage}"
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="text-right">
                        <Button type="submit" disabled={isSubmitting} className="bg-blue-600 text-white hover:bg-blue-700">
                            {isSubmitting ? <Spinner className="w-4 h-4 border-2" /> : 'Save Changes'}
                        </Button>
                    </div>
                </form>
            </CardContent>
        </Card>
    );
};

export default ClubBranding;