
import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { Card, CardContent } from '../ui/Card';
import Button from '../ui/Button';
import LogInIcon from '../icons/LogInIcon';
import ShieldIcon from '../icons/ShieldIcon';
import Spinner from '../ui/Spinner';
import SparklesIcon from '../icons/SparklesIcon';

const AdminLoginPrompt: React.FC = () => {
  const { openAuthModal, isLoggedIn, user, bootstrapAdmin } = useAuth();
  const [isElevating, setIsElevating] = useState(false);

  // Parse authorized emails from string
  const authorizedEmails = (process.env.ADMIN_EMAIL || 'admin@footballeswatini.com')
    .toLowerCase()
    .split(',')
    .map(e => e.trim());
    
  const isUserAuthorized = user && authorizedEmails.includes(user.email.toLowerCase());

  const handleClaimAdmin = async () => {
      setIsElevating(true);
      try {
          await bootstrapAdmin();
          alert("Success! Your role has been synchronized. You are now a Super Admin.");
          window.location.reload();
      } catch (e) {
          alert("Synchronization failed. Check your connection or authorized email list.");
      } finally {
          setIsElevating(false);
      }
  };

  return (
    <div className="flex justify-center items-center py-12">
        <Card className="max-w-md w-full shadow-2xl overflow-hidden border-t-4 border-red-600">
            <CardContent className="p-8 text-center">
                <div className="flex justify-center mb-6">
                    <div className={`${isLoggedIn && !isUserAuthorized ? 'bg-orange-100' : 'bg-red-100'} p-5 rounded-full shadow-inner`}>
                        <ShieldIcon className={`w-10 h-10 ${isLoggedIn && !isUserAuthorized ? 'text-orange-600' : 'text-red-600'}`} />
                    </div>
                </div>
                
                <h2 className="text-3xl font-display font-black text-gray-900 mb-2">
                    {isLoggedIn ? (isUserAuthorized ? 'Admin Account Found' : 'Permission Required') : 'Administrator Access'}
                </h2>
                
                <div className="text-sm text-gray-600 space-y-4 mb-8">
                   {isLoggedIn ? (
                     isUserAuthorized ? (
                        <>
                            <p>You are logged in with an authorized administrator email (<strong>{user?.email}</strong>).</p>
                            <p className="bg-blue-50 p-3 rounded-lg text-blue-800 font-medium">
                                If you cannot see the admin panel, your role may be misconfigured. Click below to synchronize your permissions.
                            </p>
                        </>
                     ) : (
                        <p>Your current account (<strong>{user?.email}</strong>) does not have Super Admin privileges. Please sign out and log in with an official admin account.</p>
                     )
                   ) : (
                     <p>This section is reserved for authorized system administrators. Please sign in with your official credentials.</p>
                   )}
                </div>

                {!isLoggedIn ? (
                    <Button onClick={openAuthModal} className="w-full bg-secondary text-white hover:bg-red-700 focus:ring-red-500 inline-flex items-center justify-center gap-2 h-12 font-bold shadow-lg transition-all active:scale-95">
                        <LogInIcon className="w-5 h-5" />
                        Log In to Access
                    </Button>
                ) : isUserAuthorized ? (
                    <Button 
                        onClick={handleClaimAdmin} 
                        disabled={isElevating}
                        className="w-full bg-primary text-white h-12 font-black flex items-center justify-center gap-2 shadow-xl hover:bg-primary-dark transition-all active:scale-95"
                    >
                        {isElevating ? <Spinner className="w-5 h-5 border-white border-2" /> : <><SparklesIcon className="w-5 h-5" /> Sync Admin Permissions</>}
                    </Button>
                ) : (
                    <div className="space-y-4">
                        <Button variant="outline" onClick={() => window.location.href = '/'} className="w-full border-gray-300 h-11 font-bold">
                            Back to Home
                        </Button>
                        <button onClick={openAuthModal} className="text-xs text-blue-600 font-bold hover:underline">
                            Switch Account
                        </button>
                    </div>
                )}
            </CardContent>
        </Card>
    </div>
  );
};

export default AdminLoginPrompt;
