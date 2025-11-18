

import React from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { Card, CardContent } from '../ui/Card';
import Button from '../ui/Button';
import LogInIcon from '../icons/LogInIcon';
import ShieldIcon from '../icons/ShieldIcon';

const ClubLoginPrompt: React.FC = () => {
  const { openAuthModal } = useAuth();

  return (
    <div className="flex justify-center items-center py-12">
        <Card className="max-w-md w-full shadow-xl">
            <CardContent className="p-8 text-center">
                <div className="flex justify-center mb-4">
                    <div className="bg-primary/10 p-4 rounded-full">
                        <ShieldIcon className="w-8 h-8 text-primary" />
                    </div>
                </div>
                <h2 className="text-2xl font-bold font-display text-gray-800">Club Management Portal</h2>
                <p className="text-gray-600 mt-2 mb-6">
                    This area is restricted to verified club officials and coaches. Please log in to continue.
                </p>
                <Button onClick={openAuthModal} className="w-full bg-primary text-white hover:bg-primary-dark focus:ring-primary-light inline-flex items-center justify-center gap-2">
                    <LogInIcon className="w-5 h-5" />
                    Log In to Access
                </Button>
            </CardContent>
        </Card>
    </div>
  );
};

export default ClubLoginPrompt;