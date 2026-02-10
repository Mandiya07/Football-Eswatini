
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
import TrophyIcon from '../icons/TrophyIcon';
import GlobeAltIcon from '../icons/GlobeIcon'; // Re-use globe for hub
import { db } from '../../services/firebase';
import { doc, runTransaction } from 'firebase/firestore';
import { handleFirestoreError, fetchCompetition, fetchAllCompetitions } from '../../services/api';
import { removeUndefinedProps, superNormalize } from '../../services/utils';
import { Competition, Team, TeamSocialMedia } from '../../data/teams';
import { useAuth } from '../../contexts/AuthContext';

const ClubBranding: React.FC<{ clubName: string; currentCompetitionId: string }> = ({ clubName, currentCompetitionId }) => {
    const { user, updateUser } = useAuth();
    
    // Branding State
    const [primaryColor, setPrimaryColor] = useState('#000000');
    const [secondaryColor, setSecondaryColor] = useState('#FFFFFF');
    const [welcomeMessage, setWelcomeMessage] = useState('');
    const [bannerUrl, setBannerUrl] = useState('');
    
    // Hub State
    const [allLeagues, setAllLeagues] = useState<{id: string, name: string}[]>([]);
    const [selectedHubId, setSelectedHubId] = useState(currentCompetitionId);
    const [isUpdatingHub, setIsUpdatingHub] = useState(false);

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

    useEffect(() => {
        const loadData = async () => {
            setLoading(true);
            try {
                // Load all leagues for the dropdown
                const comps = await fetchAllCompetitions();
                const list = Object.entries(comps)
                    .map(([id, c]) => ({ id, name: c.name }))
                    .sort((a,b) => a.name.localeCompare(b.name));
                setAllLeagues(list);

                // Load existing club branding from the current active hub
                const comp = await fetchCompetition(currentCompetitionId);
                const normName = superNormalize(clubName);
                const team = comp?.teams?.find(t => superNormalize(t.name) === normName);
                
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
    }, [clubName, currentCompetitionId]);

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

    const handleLinkToLeague = async () => {
        if (!user || !selectedHubId || selectedHubId === currentCompetitionId) return;
        
        setIsUpdatingHub(true);
        try {
            // Update the user's managedTeams array to point to the new hub
            const updatedManagedTeams = (user.managedTeams || []).map(t => 
                superNormalize(t.teamName) === superNormalize(clubName) 
                ? { ...t, competitionId: selectedHubId } 
                : t
            );

            await updateUser({ managedTeams: updatedManagedTeams });
            setSuccessMessage("League affiliation updated! Redirecting workspace...");
            
            // Hard reload after a short delay to reset the ManagementPortal context
            setTimeout(() => window.location.reload(), 2000);
        } catch (error) {
            console.error("Hub relinking failed", error);
            alert("Failed to update league link.");
        } finally {
            setIsUpdatingHub(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        setSuccessMessage('');

        try {
            const docRef = doc(db, 'competitions', currentCompetitionId);
            await runTransaction(db, async (transaction) => {
                const docSnap = await transaction.get(docRef);
                if (!docSnap.exists()) throw new Error("Hub not found");
                const comp = docSnap.data() as Competition;
                
                const normName = superNormalize(clubName);
                const updatedTeams = (comp.teams || []).map(t => {
                    if (superNormalize(t.name) === normName) {
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
            setSuccessMessage("Club Identity updated successfully!");
        } catch (error) {
            handleFirestoreError(error, 'update branding');
        } finally {
            setIsSubmitting(false);
        }
    };

    const inputClass = "block w-full px-4 py-3 border border-gray-300 rounded-2xl shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent sm:text-sm outline-none transition-all";

    if (loading) return <div className="flex justify-center p-8"><Spinner /></div>;

    const isIndependent = currentCompetitionId === 'independent-clubs';

    return (
        <div className="space-y-8 animate-fade-in">
            {/* LEAGUE AFFILIATION CARD */}
            <Card className={`shadow-lg border-0 overflow-hidden ${isIndependent ? 'ring-2 ring-blue-500' : ''}`}>
                <div className="bg-slate-900 p-6 text-white flex justify-between items-center">
                    <div className="flex items-center gap-3">
                        <TrophyIcon className="w-8 h-8 text-accent" />
                        <div>
                            <h3 className="text-xl font-bold font-display">League Affiliation</h3>
                            <p className="text-blue-100/60 text-xs">Determine which competition hub manages your scores and logs.</p>
                        </div>
                    </div>
                </div>
                <CardContent className="p-8">
                    <div className="flex flex-col md:flex-row items-end gap-6">
                        <div className="flex-grow">
                            <label className="block text-[10px] font-black uppercase text-gray-400 mb-2 tracking-widest">Select Official Hub</label>
                            <select 
                                value={selectedHubId} 
                                onChange={e => setSelectedHubId(e.target.value)}
                                className={inputClass}
                            >
                                <option value="independent-clubs">Independent (No official league)</option>
                                {allLeagues.map(l => (
                                    <option key={l.id} value={l.id}>{l.name}</option>
                                ))}
                            </select>
                        </div>
                        <Button 
                            onClick={handleLinkToLeague}
                            disabled={isUpdatingHub || selectedHubId === currentCompetitionId}
                            className="bg-primary text-white h-[48px] px-8 rounded-2xl font-black uppercase tracking-widest text-[10px] shadow-xl disabled:opacity-20"
                        >
                            {isUpdatingHub ? <Spinner className="w-4 h-4" /> : 'Link to League'}
                        </Button>
                    </div>
                    {isIndependent && (
                        <div className="mt-4 p-4 bg-blue-50 text-blue-800 rounded-2xl text-xs flex items-start gap-3 border border-blue-100">
                            <CheckCircleIcon className="w-5 h-5 text-blue-600 flex-shrink-0" />
                            <p><strong>Independent Status:</strong> Your club is currently registered as independent. Followers will see your fixtures and results, but you will not appear in any official league logs until linked to a competition hub.</p>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* BRANDING FORM */}
            <Card className="shadow-lg border-0 overflow-hidden">
                <div className="bg-white border-b border-gray-100 p-6 flex items-center gap-3">
                    <PaintBucketIcon className="w-8 h-8 text-primary" />
                    <h3 className="text-2xl font-bold font-display text-gray-900">Visual Identity</h3>
                </div>
                
                <CardContent className="p-8">
                    {successMessage && (
                        <div className="mb-6 p-4 bg-green-50 text-green-800 border border-green-200 rounded-2xl flex items-center gap-3 animate-fade-in shadow-sm">
                            <CheckCircleIcon className="w-6 h-6" />
                            <span className="font-bold">{successMessage}</span>
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-8">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div className="space-y-6">
                                <h4 className="font-black text-[10px] uppercase text-gray-400 tracking-widest">Brand Colors</h4>
                                <div>
                                    <label className="block text-xs font-bold text-gray-600 mb-2">Primary Color</label>
                                    <div className="flex items-center gap-3">
                                        <div className="relative">
                                            <input type="color" value={primaryColor} onChange={e => setPrimaryColor(e.target.value)} className="h-14 w-20 p-1 rounded-2xl border cursor-pointer opacity-0 absolute inset-0 z-10" />
                                            <div className="h-14 w-20 rounded-2xl border shadow-sm flex items-center justify-center font-black text-xs" style={{ backgroundColor: primaryColor, color: '#fff' }}>PICK</div>
                                        </div>
                                        <input type="text" value={primaryColor} onChange={e => setPrimaryColor(e.target.value)} className={inputClass} />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-600 mb-2">Secondary Color</label>
                                    <div className="flex items-center gap-3">
                                        <div className="relative">
                                            <input type="color" value={secondaryColor} onChange={e => setSecondaryColor(e.target.value)} className="h-14 w-20 p-1 rounded-2xl border cursor-pointer opacity-0 absolute inset-0 z-10" />
                                            <div className="h-14 w-20 rounded-2xl border shadow-sm flex items-center justify-center font-black text-xs" style={{ backgroundColor: secondaryColor, color: '#000' }}>PICK</div>
                                        </div>
                                        <input type="text" value={secondaryColor} onChange={e => setSecondaryColor(e.target.value)} className={inputClass} />
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <h4 className="font-black text-[10px] uppercase text-gray-400 tracking-widest">Hub Banner</h4>
                                <div className="border-2 border-dashed border-gray-200 rounded-[2rem] p-6 text-center hover:bg-gray-50 transition-colors cursor-pointer relative shadow-inner">
                                    <input type="file" onChange={handleFileChange} accept="image/*" className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
                                    {bannerUrl ? (
                                        <img src={bannerUrl} alt="Banner Preview" className="h-32 w-full object-cover rounded-2xl shadow-md" />
                                    ) : (
                                        <div className="py-8 text-gray-300 flex flex-col items-center gap-3">
                                            <div className="p-3 bg-white rounded-full shadow-sm"><PaintBucketIcon className="w-8 h-8"/></div>
                                            <p className="font-bold text-sm">Upload Branded Header</p>
                                            <p className="text-[10px] uppercase font-black tracking-widest">(Recommended: 1200x400px)</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        <div>
                            <label className="block text-[10px] font-black uppercase text-gray-400 mb-2 tracking-widest">Welcome Message / Mission Statement</label>
                            <textarea 
                                value={welcomeMessage} 
                                onChange={e => setWelcomeMessage(e.target.value)} 
                                className={inputClass} 
                                rows={3} 
                                placeholder="A personal greeting for fans who visit your hub..." 
                            />
                        </div>

                        <div className="space-y-4 pt-6 border-t">
                            <h4 className="font-black text-[10px] uppercase text-gray-400 tracking-widest">Official Social Links</h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="relative">
                                    <span className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none">
                                        <FacebookIcon className="w-4 h-4 text-blue-600" />
                                    </span>
                                    <input type="url" name="facebook" value={socialMedia.facebook} onChange={handleSocialChange} className={`${inputClass} pl-12`} placeholder="Facebook" />
                                </div>
                                <div className="relative">
                                    <span className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none">
                                        <TwitterIcon className="w-4 h-4 text-slate-900" />
                                    </span>
                                    <input type="url" name="twitter" value={socialMedia.twitter} onChange={handleSocialChange} className={`${inputClass} pl-12`} placeholder="Twitter / X" />
                                </div>
                                <div className="relative">
                                    <span className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none">
                                        <InstagramIcon className="w-4 h-4 text-pink-600" />
                                    </span>
                                    <input type="url" name="instagram" value={socialMedia.instagram} onChange={handleSocialChange} className={`${inputClass} pl-12`} placeholder="Instagram" />
                                </div>
                                <div className="relative">
                                    <span className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none">
                                        <GlobeIcon className="w-4 h-4 text-blue-400" />
                                    </span>
                                    <input type="url" name="website" value={socialMedia.website} onChange={handleSocialChange} className={`${inputClass} pl-12`} placeholder="Official Website" />
                                </div>
                            </div>
                        </div>

                        <div className="pt-6 border-t flex justify-end">
                            <Button 
                                type="submit" 
                                disabled={isSubmitting} 
                                className="bg-primary text-white hover:bg-primary-dark h-14 px-12 rounded-2xl font-black uppercase tracking-widest text-xs shadow-2xl transition-all active:scale-95"
                            >
                                {isSubmitting ? <Spinner className="w-4 h-4 border-2" /> : 'Save Profile Changes'}
                            </Button>
                        </div>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
};

export default ClubBranding;
