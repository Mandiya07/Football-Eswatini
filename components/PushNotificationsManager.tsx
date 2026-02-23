import React, { useState, useEffect } from 'react';
import { Card, CardContent } from './ui/Card';
import Button from './ui/Button';
import BellIcon from './icons/BellIcon';
import XCircleIcon from './icons/XCircleIcon';
import CheckCircleIcon from './icons/CheckCircleIcon';

const PushNotificationsManager: React.FC = () => {
    const [permission, setPermission] = useState<NotificationPermission>('default');
    const [isSubscribed, setIsSubscribed] = useState(false);
    const [subscription, setSubscription] = useState<PushSubscription | null>(null);
    const [preferences, setPreferences] = useState({
        goals: true,
        results: true,
        news: true,
        transfers: false
    });

    useEffect(() => {
        if (!('Notification' in window) || !('serviceWorker' in navigator)) {
            return;
        }

        setPermission(Notification.permission);

        navigator.serviceWorker.ready.then(reg => {
            reg.pushManager.getSubscription().then(sub => {
                if (sub) {
                    setIsSubscribed(true);
                    setSubscription(sub);
                }
            });
        });

        // Load preferences from local storage
        const savedPrefs = localStorage.getItem('notification_preferences');
        if (savedPrefs) {
            setPreferences(JSON.parse(savedPrefs));
        }
    }, []);

    const savePreferences = (newPrefs: typeof preferences) => {
        setPreferences(newPrefs);
        localStorage.setItem('notification_preferences', JSON.stringify(newPrefs));
        // In a real app, you would also update this on your backend
    };

    const requestPermissionAndSubscribe = async () => {
        if (!('Notification' in window)) {
            alert('This browser does not support desktop notification');
            return;
        }

        const currentPermission = await Notification.requestPermission();
        setPermission(currentPermission);

        if (currentPermission === 'granted') {
            subscribeUser();
        }
    };

    const subscribeUser = async () => {
        try {
            const registration = await navigator.serviceWorker.ready;
            // In a real app, you would use a VAPID public key here
            // const vapidPublicKey = '...';
            // const convertedVapidKey = urlBase64ToUint8Array(vapidPublicKey);
            
            const sub = await registration.pushManager.subscribe({
                userVisibleOnly: true,
                // applicationServerKey: convertedVapidKey
            });
            
            console.log('User is subscribed:', sub);
            setIsSubscribed(true);
            setSubscription(sub);
            
            // MOCK: Send subscription to backend
            console.log('Sending subscription to backend...', sub);
        } catch (error) {
            console.error('Failed to subscribe the user: ', error);
        }
    };
    
    const sendTestNotification = () => {
        navigator.serviceWorker.ready.then(registration => {
            const options: NotificationOptions & { vibrate?: number[] } = {
                body: 'Goal! Mbabane Swallows 1 - 0 Young Buffaloes (15\')',
                icon: '/assets/icon-192.png',
                badge: '/assets/icon-192.png',
                vibrate: [200, 100, 200],
                tag: 'goal-alert',
                data: {
                    url: '/live-updates'
                }
            };
            registration.showNotification('Sihlangu Hub Alert!', options);
        });
    }

    const togglePreference = (key: keyof typeof preferences) => {
        savePreferences({ ...preferences, [key]: !preferences[key] });
    };

    const renderContent = () => {
        if (permission === 'denied') {
            return (
                <div className="flex items-center gap-3 p-4 bg-red-50 rounded-2xl border border-red-100">
                    <XCircleIcon className="w-6 h-6 text-red-600" />
                    <div>
                        <p className="font-black text-red-900 text-sm uppercase">Notifications Blocked</p>
                        <p className="text-xs text-red-700">Please enable them in your browser settings to stay updated.</p>
                    </div>
                </div>
            );
        }

        if (isSubscribed) {
             return (
                <div className="space-y-6">
                    <div className="flex items-center gap-3 p-4 bg-green-50 rounded-2xl border border-green-100">
                        <CheckCircleIcon className="w-6 h-6 text-green-600" />
                        <p className="font-black text-green-900 text-sm uppercase">Alerts are Active</p>
                    </div>

                    <div className="space-y-3">
                        <h3 className="text-[10px] font-black uppercase tracking-widest text-gray-400">Alert Preferences</h3>
                        <div className="grid grid-cols-1 gap-2">
                            {Object.entries(preferences).map(([key, value]) => (
                                <button 
                                    key={key}
                                    onClick={() => togglePreference(key as keyof typeof preferences)}
                                    className={`flex justify-between items-center p-3 rounded-xl border transition-all ${value ? 'bg-primary/5 border-primary/20 text-primary' : 'bg-gray-50 border-gray-100 text-gray-400'}`}
                                >
                                    <span className="text-xs font-bold uppercase tracking-tight">{key} Alerts</span>
                                    <div className={`w-8 h-4 rounded-full relative transition-colors ${value ? 'bg-primary' : 'bg-gray-300'}`}>
                                        <div className={`absolute top-0.5 w-3 h-3 bg-white rounded-full transition-all ${value ? 'left-4.5' : 'left-0.5'}`}></div>
                                    </div>
                                </button>
                            ))}
                        </div>
                    </div>

                    <Button onClick={sendTestNotification} variant="outline" className="w-full h-12 text-xs font-black uppercase tracking-widest border-gray-200">
                        Send Test Alert
                    </Button>
                </div>
            );
        }

        return (
            <div className="text-center">
                <p className="text-sm text-gray-600 mb-6 leading-relaxed">Never miss a goal. Get instant alerts for your favorite teams and competitions directly on your device.</p>
                <Button onClick={requestPermissionAndSubscribe} className="w-full h-14 bg-primary text-white rounded-2xl font-black uppercase tracking-widest shadow-xl hover:scale-[1.02] transition-transform">
                    Enable Live Alerts
                </Button>
            </div>
        );
    }

    if (!('Notification' in window)) return null;

    return (
        <Card className="shadow-2xl border-0 overflow-hidden rounded-[2rem]">
            <CardContent className="p-8">
                <div className="flex items-center gap-4 mb-8">
                    <div className="p-3 bg-primary/10 rounded-2xl">
                        <BellIcon className="w-8 h-8 text-primary" />
                    </div>
                    <div>
                        <h2 className="text-2xl font-black font-display text-gray-900 leading-none mb-1">Live Score Alerts</h2>
                        <p className="text-[10px] font-black uppercase tracking-widest text-primary opacity-60">Real-time Notifications</p>
                    </div>
                </div>
                {renderContent()}
            </CardContent>
        </Card>
    );
};

export default PushNotificationsManager;