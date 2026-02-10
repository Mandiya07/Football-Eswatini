import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth, NotificationPreferences } from '../contexts/AuthContext';
import { Card, CardContent } from './ui/Card';
import Button from './ui/Button';
import TeamSelector from './TeamSelector';
import PushNotificationsManager from './PushNotificationsManager';
import ArrowLeftIcon from './icons/ArrowLeftIcon';
import PencilIcon from './icons/PencilIcon';

const Switch: React.FC<{ label: string; checked: boolean; onToggle: () => void }> = ({ label, checked, onToggle }) => (
    <label className="flex items-center justify-between cursor-pointer">
        <span className="text-gray-700 text-sm">{label}</span>
        <button
            type="button"
            role="switch"
            aria-checked={checked}
            onClick={onToggle}
            className={`${
                checked ? 'bg-blue-600' : 'bg-gray-200'
            } relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2`}
        >
            <span
                aria-hidden="true"
                className={`${
                    checked ? 'translate-x-5' : 'translate-x-0'
                } pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out`}
            />
        </button>
    </label>
);

const ProfileSetupPage: React.FC = () => {
    const { user, updateUser } = useAuth();
    const navigate = useNavigate();

    const [name, setName] = useState(user?.name || '');
    const [email, setEmail] = useState(user?.email || '');
    const [avatar, setAvatar] = useState(user?.avatar || '');
    const [favoriteTeamIds, setFavoriteTeamIds] = useState(user?.favoriteTeamIds || []);
    
    const [notifications, setNotifications] = useState<NotificationPreferences>(
        user?.notificationPreferences || { matchAlerts: true, news: true, announcements: true }
    );

    if (!user) {
        navigate('/');
        return null;
    }

    const handleSaveChanges = () => {
        updateUser({ 
            name, 
            email, 
            avatar, 
            favoriteTeamIds,
            notificationPreferences: notifications
        });
        alert("Profile updated successfully!");
        navigate('/profile');
    };

    const handleAvatarFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            const reader = new FileReader();
            reader.onloadend = () => {
                if (typeof reader.result === 'string') {
                    setAvatar(reader.result);
                }
            };
            reader.readAsDataURL(file);
        }
    };
    
    const toggleNotification = (key: keyof NotificationPreferences) => {
        setNotifications(prev => ({ ...prev, [key]: !prev[key] }));
    };

    return (
        <div className="bg-gray-50 py-12">
            <div className="container mx-auto px-4 sm:px-6 lg:px-8 animate-fade-in">
                <div className="mb-6">
                    <button
                        onClick={() => navigate(-1)}
                        className="inline-flex items-center gap-2 text-sm font-semibold text-gray-600 hover:text-gray-900 transition-colors"
                    >
                        <ArrowLeftIcon className="w-4 h-4" />
                        Back to Profile
                    </button>
                </div>
                
                <div className="max-w-4xl mx-auto space-y-8">
                    <Card className="shadow-lg">
                        <CardContent className="p-8">
                            <h2 className="text-2xl font-bold font-display mb-6">Personal Information</h2>
                            <div className="flex flex-col sm:flex-row items-center gap-6">
                                <div className="relative group">
                                    <img src={avatar} alt="User avatar" className="w-24 h-24 rounded-full" />
                                    <label htmlFor="avatar-upload" className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                                        <PencilIcon className="w-6 h-6" />
                                        <input type="file" id="avatar-upload" className="sr-only" onChange={handleAvatarFileChange} accept="image/*" />
                                    </label>
                                </div>
                                <div className="flex-grow w-full grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                                        <input type="text" id="name" value={name} onChange={e => setName(e.target.value)} className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"/>
                                    </div>
                                    <div>
                                        <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                                        <input type="email" id="email" value={email} onChange={e => setEmail(e.target.value)} className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"/>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="shadow-lg">
                        <CardContent className="p-8">
                            <h2 className="text-2xl font-bold font-display mb-4">My Favorite Teams</h2>
                            <TeamSelector selectedTeamIds={favoriteTeamIds} onSelectionChange={setFavoriteTeamIds} />
                        </CardContent>
                    </Card>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <Card className="shadow-lg">
                            <CardContent className="p-6">
                                <h2 className="text-xl font-bold font-display mb-4">Notification Preferences</h2>
                                <p className="text-xs text-gray-500 mb-4">Choose what updates you receive via email and push notifications.</p>
                                <div className="space-y-4">
                                    <Switch label="Favorite team match alerts" checked={notifications.matchAlerts} onToggle={() => toggleNotification('matchAlerts')} />
                                    <Switch label="Weekly news summary" checked={notifications.news} onToggle={() => toggleNotification('news')} />
                                    <Switch label="Special feature announcements" checked={notifications.announcements} onToggle={() => toggleNotification('announcements')} />
                                </div>
                            </CardContent>
                        </Card>
                        <PushNotificationsManager />
                    </div>

                    <div className="text-right">
                        <Button onClick={handleSaveChanges} className="bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500">
                            Save Changes
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ProfileSetupPage;