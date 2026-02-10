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

    }, []);

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
            // In a real app, a VAPID public key from your server would be required here.
            const sub = await registration.pushManager.subscribe({
                userVisibleOnly: true,
            });
            console.log('User is subscribed:', sub);
            setIsSubscribed(true);
            setSubscription(sub);
            // In a real app, you would send this 'sub' object to your backend to store.
        } catch (error) {
            console.error('Failed to subscribe the user: ', error);
        }
    };
    
    const sendTestNotification = () => {
        navigator.serviceWorker.ready.then(registration => {
            registration.showNotification('Test Notification!', {
                body: 'If you see this, notifications are working.',
                icon: '/assets/icon-192.png'
            });
        });
    }

    const renderContent = () => {
        if (permission === 'denied') {
            return (
                <div className="flex items-center gap-2 text-red-700 text-sm">
                    <XCircleIcon className="w-5 h-5" />
                    <div>
                        <p className="font-semibold">Notifications Blocked</p>
                        <p className="text-xs">Please enable them in your browser settings.</p>
                    </div>
                </div>
            );
        }
        if (isSubscribed) {
             return (
                <div className="flex flex-col gap-3">
                    <div className="flex items-center gap-2 text-green-700 text-sm">
                        <CheckCircleIcon className="w-5 h-5" />
                        <p className="font-semibold">Push Notifications Enabled</p>
                    </div>
                    <Button onClick={sendTestNotification} className="w-full bg-gray-200 text-gray-800 text-xs">
                        Send a Test Notification
                    </Button>
                </div>
            );
        }
        return (
            <Button onClick={requestPermissionAndSubscribe} className="w-full bg-blue-600 text-white hover:bg-blue-700">
                Enable Push Notifications
            </Button>
        );
    }

    if (!('Notification' in window)) return null;

    return (
        <Card className="shadow-lg">
            <CardContent className="p-6">
                <div className="flex items-center gap-3 mb-4">
                    <BellIcon className="w-6 h-6 text-blue-600" />
                    <h2 className="text-xl font-bold font-display">Push Notifications</h2>
                </div>
                <p className="text-sm text-gray-600 mb-4">Get notified about goals, results, and breaking news right on your device.</p>
                {renderContent()}
            </CardContent>
        </Card>
    );
};

export default PushNotificationsManager;