import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Card, CardContent } from './ui/Card';
import Button from './ui/Button';
import Input from './ui/Input';
import XIcon from './icons/XIcon';
import MailIcon from './icons/MailIcon';
import LockIcon from './icons/LockIcon';
import UserIcon from './icons/UserIcon';
import Spinner from './ui/Spinner';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose }) => {
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { login, signup } = useAuth();

  const handleClose = () => {
    // Reset form state on close
    setName('');
    setEmail('');
    setPassword('');
    setError('');
    onClose();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
        if (mode === 'login') {
            await login({ email, password });
        } else {
            if (!name) {
                setError('Name is required for sign up.');
                setLoading(false);
                return;
            }
            await signup({ name, email, password });
        }
        // Success: modal will be closed by AuthContext
    } catch (err) {
        let friendlyError = 'An unexpected error occurred. Please try again.';
        const errorCode = (err as any).code;

        switch (errorCode) {
            case 'auth/wrong-password':
                friendlyError = 'Incorrect password. Please try again.';
                break;
            case 'auth/user-not-found':
                friendlyError = 'No account found with this email address.';
                break;
            case 'auth/email-already-in-use':
                friendlyError = 'An account with this email already exists. Please log in.';
                break;
            case 'auth/weak-password':
                friendlyError = 'Password is too weak. It should be at least 6 characters long.';
                break;
            case 'auth/invalid-email':
                friendlyError = 'Please enter a valid email address.';
                break;
        }
        setError(friendlyError);
    } finally {
        setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4 animate-fade-in"
      onClick={handleClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="auth-modal-title"
    >
      <Card
        className="w-full max-w-md max-h-[90vh] overflow-y-auto relative animate-slide-up"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={handleClose}
          className="absolute top-4 right-4 text-gray-500 hover:text-gray-800 transition-colors z-10"
          aria-label="Close authentication form"
        >
          <XIcon className="w-6 h-6" />
        </button>

        <CardContent className="p-8">
          <div className="border-b border-gray-200 mb-6">
            <nav className="-mb-px flex space-x-6" aria-label="Tabs">
              <button
                onClick={() => { setMode('login'); setError(''); }}
                className={`whitespace-nowrap pb-4 px-1 border-b-2 font-medium text-sm ${mode === 'login' ? 'border-primary text-primary' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
              >
                Log In
              </button>
              <button
                onClick={() => { setMode('signup'); setError(''); }}
                className={`whitespace-nowrap pb-4 px-1 border-b-2 font-medium text-sm ${mode === 'signup' ? 'border-primary text-primary' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
              >
                Sign Up
              </button>
            </nav>
          </div>
          
          <form onSubmit={handleSubmit} className="space-y-4">
              {mode === 'login' ? (
                <div>
                    <h2 id="auth-modal-title" className="text-2xl font-bold font-display text-gray-800 mb-1">Welcome Back</h2>
                    <p className="text-gray-600 mb-6 text-sm">Log in to access your profile and features.</p>
                </div>
              ) : (
                 <div>
                    <h2 id="auth-modal-title" className="text-2xl font-bold font-display text-gray-800 mb-1">Create an Account</h2>
                    <p className="text-gray-600 mb-6 text-sm">Join the Football Eswatini community.</p>
                </div>
              )}

              {error && <p className="text-red-600 text-sm bg-red-100 p-2 rounded-md">{error}</p>}
              
              {mode === 'signup' && (
                <Input icon={<UserIcon className="w-5 h-5 text-gray-400" />} type="text" placeholder="Full Name" value={name} onChange={e => setName(e.target.value)} required />
              )}
              <Input icon={<MailIcon className="w-5 h-5 text-gray-400" />} type="email" placeholder="Email Address" value={email} onChange={e => setEmail(e.target.value)} required autoComplete="email" />
              <Input icon={<LockIcon className="w-5 h-5 text-gray-400" />} type="password" placeholder="Password" value={password} onChange={e => setPassword(e.target.value)} required autoComplete={mode === 'login' ? 'current-password' : 'new-password'} />
              
              <Button type="submit" className="w-full bg-primary text-white hover:bg-primary-dark focus:ring-primary-light flex justify-center items-center h-10" disabled={loading}>
                  {loading ? <Spinner className="w-5 h-5 border-2"/> : (mode === 'login' ? 'Log In' : 'Create Account')}
              </Button>
          </form>

            {mode === 'login' ? (
                 <p className="text-center text-sm text-gray-500 mt-4">
                    Don't have an account?{' '}
                    <button onClick={() => { setMode('signup'); setError(''); }} className="font-medium text-primary hover:underline">
                        Sign Up
                    </button>
                </p>
            ) : (
                 <p className="text-center text-sm text-gray-500 mt-4">
                    Already have an account?{' '}
                    <button onClick={() => { setMode('login'); setError(''); }} className="font-medium text-primary hover:underline">
                        Log In
                    </button>
                </p>
            )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AuthModal;