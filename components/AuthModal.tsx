
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
  const { login, loginWithGoogle, signup } = useAuth();

  const handleClose = () => {
    setName('');
    setEmail('');
    setPassword('');
    setError('');
    onClose();
  };

  const handleGoogleLogin = async () => {
    setLoading(true);
    setError('');
    try {
      await loginWithGoogle();
    } catch (err: any) {
      setError(err.message || 'Failed to sign in with Google.');
    } finally {
      setLoading(false);
    }
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
    } catch (err: any) {
        let friendlyError = 'An unexpected error occurred. Please try again.';
        const errorCode = err.code;

        switch (errorCode) {
            case 'auth/invalid-credential':
                friendlyError = 'Invalid email or password. Please check your details and try again.';
                break;
            case 'auth/operation-not-allowed':
                friendlyError = 'Email/password accounts are not enabled. Please sign in with Google or contact support.';
                break;
            case 'auth/network-request-failed':
                friendlyError = 'Network error. Please check your internet connection and try again.';
                break;
            case 'auth/user-disabled':
                friendlyError = 'This account has been disabled. Please contact support.';
                break;
            case 'auth/too-many-requests':
                friendlyError = 'Too many failed attempts. Please try again later or reset your password.';
                break;
            case 'auth/email-already-in-use':
                friendlyError = 'An account with this email already exists.';
                break;
            case 'auth/weak-password':
                friendlyError = 'Password is too weak. It should be at least 6 characters.';
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
      className="fixed inset-0 bg-black/70 z-[300] flex items-start justify-center p-4 pt-24 md:pt-32 overflow-y-auto animate-fade-in"
      onClick={handleClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="auth-modal-title"
    >
      <Card
        className="w-full max-w-md mb-8 relative animate-slide-up"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={handleClose}
          className="absolute top-4 right-4 text-gray-500 hover:text-gray-800 transition-colors z-10"
          aria-label="Close"
        >
          <XIcon className="w-6 h-6" />
        </button>

        <CardContent className="p-8">
          <div className="border-b border-gray-200 mb-6">
            <nav className="-mb-px flex space-x-6">
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
              <h2 id="auth-modal-title" className="text-2xl font-bold font-display text-gray-800 mb-1">
                {mode === 'login' ? 'Welcome Back' : 'Create an Account'}
              </h2>
              <p className="text-gray-600 mb-6 text-sm">
                {mode === 'login' ? 'Log in to access your profile.' : 'Join the Football Eswatini community.'}
              </p>

              {error && <div className="text-red-600 text-sm bg-red-50 p-3 rounded-md border border-red-100">{error}</div>}
              
              {mode === 'signup' && (
                <Input icon={<UserIcon className="w-5 h-5 text-gray-400" />} type="text" placeholder="Full Name" value={name} onChange={e => setName(e.target.value)} required />
              )}
              <Input icon={<MailIcon className="w-5 h-5 text-gray-400" />} type="email" placeholder="Email Address" value={email} onChange={e => setEmail(e.target.value)} required autoComplete="email" />
              <Input icon={<LockIcon className="w-5 h-5 text-gray-400" />} type="password" placeholder="Password" value={password} onChange={e => setPassword(e.target.value)} required autoComplete={mode === 'login' ? 'current-password' : 'new-password'} />
              
              <Button type="submit" className="w-full bg-primary text-white hover:bg-primary-dark h-11 flex justify-center items-center" disabled={loading}>
                  {loading ? <Spinner className="w-5 h-5 border-2"/> : (mode === 'login' ? 'Log In' : 'Create Account')}
              </Button>
          </form>

          <div className="mt-4">
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-300"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-white text-gray-500">Or continue with</span>
                </div>
              </div>

              <div className="mt-4">
                <Button 
                    type="button" 
                    onClick={handleGoogleLogin} 
                    className="w-full bg-white text-gray-700 border border-gray-300 hover:bg-gray-50 h-11 flex justify-center items-center font-semibold" 
                    disabled={loading}
                >
                  <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                  </svg>
                  Google
                </Button>
              </div>
          </div>

          <p className="text-center text-sm text-gray-500 mt-6">
            {mode === 'login' ? "Don't have an account? " : "Already have an account? "}
            <button onClick={() => { setMode(mode === 'login' ? 'signup' : 'login'); setError(''); }} className="font-bold text-primary hover:underline">
                {mode === 'login' ? 'Sign Up' : 'Log In'}
            </button>
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default AuthModal;
