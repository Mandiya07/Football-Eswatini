
import React, { useState } from 'react';
import { Card, CardContent } from './ui/Card';
import Button from './ui/Button';
import { useAuth } from '../contexts/AuthContext';
import TeamSelector from './TeamSelector';
import XIcon from './icons/XIcon';
import ArrowRightIcon from './icons/ArrowRightIcon';

interface OnboardingModalProps {
  onClose: () => void;
}

const OnboardingModal: React.FC<OnboardingModalProps> = ({ onClose }) => {
  const [step, setStep] = useState(1);
  const [selectedTeamIds, setSelectedTeamIds] = useState<number[]>([]);
  const { updateUser } = useAuth();

  const handleFinish = () => {
    updateUser({ favoriteTeamIds: selectedTeamIds });
    onClose();
  };

  return (
    <div 
      className="fixed inset-0 bg-black/70 z-[300] flex items-center justify-center p-4 animate-fade-in"
      role="dialog"
      aria-modal="true"
      aria-labelledby="onboarding-title"
    >
      <style>{`
        @keyframes fade-in { from { opacity: 0; } to { opacity: 1; } }
        .animate-fade-in { animation: fade-in 0.3s ease-out forwards; }
        
        @keyframes slide-up {
          from { transform: translateY(20px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
        .animate-slide-up { animation: slide-up 0.4s ease-out forwards; }
      `}</style>
      <Card className="w-full max-w-lg max-h-[90vh] overflow-y-auto relative animate-slide-up">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-500 hover:text-gray-800 transition-colors z-10"
          aria-label="Skip onboarding"
        >
          <XIcon className="w-6 h-6" />
        </button>
        
        <CardContent className="p-8">
          {step === 1 && (
            <div className="text-center">
              <h2 id="onboarding-title" className="text-2xl md:text-3xl font-display font-bold text-blue-800 mb-4">Welcome to Football Eswatini!</h2>
              <p className="text-gray-600 mb-8">Let's personalize your experience. Follow a couple of quick steps to get the most out of the app.</p>
              <Button onClick={() => setStep(2)} className="bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500 inline-flex items-center gap-2">
                Get Started <ArrowRightIcon className="w-4 h-4" />
              </Button>
            </div>
          )}

          {step === 2 && (
            <div>
              <h2 id="onboarding-title" className="text-2xl font-display font-bold text-blue-800 mb-2">Select Your Favorite Teams</h2>
              <p className="text-gray-600 mb-6 text-sm">Follow teams to get personalized news, notifications, and quick access to their stats. You can change this anytime in your profile.</p>
              <TeamSelector selectedTeamIds={selectedTeamIds} onSelectionChange={setSelectedTeamIds} />
              <div className="flex justify-between items-center mt-8">
                <Button onClick={onClose} className="text-gray-600 font-semibold">Skip for Now</Button>
                <Button onClick={handleFinish} className="bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500">
                  Finish Setup
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default OnboardingModal;
