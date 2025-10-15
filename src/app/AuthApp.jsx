
"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { useFirebase } from '@/firebase';
import { 
  initiateEmailSignIn 
} from '@/firebase/non-blocking-login';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';

// --- Helper Functions & SVGs ---

const Eye = ({ ...props }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
    <circle cx="12" cy="12" r="3" />
  </svg>
);

const EyeOff = ({ ...props }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M9.88 9.88a3 3 0 1 0 4.24 4.24" />
    <path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68" />
    <path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61" />
    <line x1="2" x2="22" y1="2" y2="22" />
  </svg>
);

const UserIcon = ({ ...props }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
        <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
        <circle cx="12" cy="7" r="4" />
    </svg>
);

const LockIcon = ({ ...props }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
        <rect width="18" height="11" x="3" y="11" rx="2" ry="2" />
        <path d="M7 11V7a5 5 0 0 1 10 0v4" />
    </svg>
);

// --- Main Application Component ---
export default function AuthApp({ initialView = 'login' }) {
    const { user, isUserLoading, auth, firestore, userError } = useFirebase();
    const [appState, setAppState] = useState('loading'); // 'loading', 'auth', 'dashboard'
    const [error, setError] = useState('');
    const [successMessage, setSuccessMessage] = useState('');
    const [emailForDashboard, setEmailForDashboard] = useState('');

    useEffect(() => {
        if (isUserLoading) {
            setAppState('loading');
        } else if (user) {
            setEmailForDashboard(user.email);
            setAppState('dashboard');
        } else {
            setAppState('auth');
        }
    }, [user, isUserLoading]);

    useEffect(() => {
        if (userError) {
            setError(userError.message.replace('Firebase: ', ''));
        }
    }, [userError]);

    const handleSignOut = async () => {
        if (auth) {
            try {
                await auth.signOut();
                // onAuthStateChanged will handle the rest
            } catch (err) {
                console.error("Sign out failed:", err);
                setError(err.message);
            }
        }
    };

    const renderContent = () => {
        switch (appState) {
            case 'loading':
                return <LoadingSpinner />;
            case 'dashboard':
                return <Dashboard userEmail={emailForDashboard} onSignOut={handleSignOut} />;
            case 'auth':
            default:
                return <AuthScreen 
                  auth={auth} 
                  db={firestore} 
                  error={error} 
                  setError={setError} 
                  successMessage={successMessage}
                  setSuccessMessage={setSuccessMessage}
                  initialView={initialView} 
                />;
        }
    };

    return (
        <div className="flex items-center justify-center min-h-screen bg-transparent font-sans p-4">
            {renderContent()}
        </div>
    );
}

// --- Screen Components ---
const AuthScreen = ({ auth, db, error, setError, successMessage, setSuccessMessage, initialView }) => {
    const [authView, setAuthView] = useState(initialView); // 'login', 'signup', 'forgot'

    useEffect(() => {
        setAuthView(initialView);
    }, [initialView]);

    const resetMessages = () => {
      setError('');
      setSuccessMessage('');
    }

    const renderAuthContent = () => {
      switch(authView) {
        case 'signup':
          return {
            title: 'Create Account',
            subtitle: 'Get started with a new account',
            content: <SignUpForm auth={auth} db={db} setError={setError} />,
            footer: (
              <button
                onClick={() => { setAuthView('login'); resetMessages(); }}
                className="text-accent hover:text-white transition-colors duration-300"
              >
                Already have an account? Login
              </button>
            )
          };
        case 'forgot':
          return {
            title: 'Forgot Password',
            subtitle: 'Enter your email to reset your password',
            content: <ForgotPasswordForm auth={auth} setError={setError} setSuccessMessage={setSuccessMessage} />,
            footer: (
              <button
                onClick={() => { setAuthView('login'); resetMessages(); }}
                className="text-accent hover:text-white transition-colors duration-300"
              >
                Back to Login
              </button>
            )
          };
        case 'login':
        default:
          return {
            title: 'Welcome Back',
            subtitle: 'Sign in to continue',
            content: <LoginForm auth={auth} setError={setError} onForgotPasswordClick={() => { setAuthView('forgot'); resetMessages(); }} />,
            footer: (
              <button
                onClick={() => { setAuthView('signup'); resetMessages(); }}
                className="text-accent hover:text-white transition-colors duration-300"
              >
                Don't have an account? Sign Up
              </button>
            )
          };
      }
    };

    const { title, subtitle, content, footer } = renderAuthContent();

    return (
        <div className="w-full max-w-md">
            <div className="relative bg-background/50 backdrop-blur-md border border-white/20 rounded-2xl shadow-lg transition-all duration-300">
                <div className="p-8">
                    <h2 className="text-3xl font-bold text-white text-center mb-2 font-headline">
                        {title}
                    </h2>
                    <p className="text-muted-foreground text-center mb-8">
                        {subtitle}
                    </p>

                    {error && <ErrorMessage message={error} />}
                    {successMessage && <SuccessMessage message={successMessage} />}

                    {content}

                    <div className="text-center mt-6">
                        {footer}
                    </div>
                </div>
            </div>
        </div>
    );
};

const Dashboard = ({ userEmail, onSignOut }) => (
  <div className="w-full max-w-md text-center">
    <div className="relative bg-background/50 backdrop-blur-md border border-white/20 rounded-2xl shadow-lg p-8">
      <UserIcon className="w-16 h-16 mx-auto text-primary mb-4"/>
      <h2 className="text-2xl font-bold text-white mb-2 font-headline">Welcome!</h2>
      <p className="text-muted-foreground mb-6 truncate">{userEmail}</p>
      <button
        onClick={onSignOut}
        className="w-full bg-primary text-primary-foreground font-bold py-3 px-4 rounded-lg hover:bg-primary/90 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-opacity-75"
      >
        Sign Out
      </button>
    </div>
  </div>
);


// --- Form Components ---

const LoginForm = ({ auth, setError, onForgotPasswordClick }) => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = (e) => {
        e.preventDefault();
        setError('');
        if (!email || !password) {
            setError('Please fill in all fields.');
            return;
        }
        setIsLoading(true);
        // Uses non-blocking sign-in. Auth state change will be caught by the listener.
        initiateEmailSignIn(auth, email, password);
        // We don't need to setLoading(false) here because on error, the userError in the parent will trigger a state update
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            <InputField
                id="login-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Email Address"
                icon={<UserIcon className="w-5 h-5 text-gray-400" />}
                autoComplete="email"
            />
            <InputField
                id="login-password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Password"
                icon={<LockIcon className="w-5 h-5 text-gray-400" />}
                actionIcon={
                    showPassword ? 
                    <EyeOff className="w-5 h-5 text-gray-400 hover:text-white" /> : 
                    <Eye className="w-5 h-5 text-gray-400 hover:text-white" />
                }
                onActionClick={() => setShowPassword(!showPassword)}
                autoComplete="current-password"
            />
             <div className="text-right">
                <button
                    type="button"
                    onClick={onForgotPasswordClick}
                    className="text-sm text-accent hover:text-white transition-colors duration-300"
                >
                    Forgot Password?
                </button>
            </div>
            <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-primary text-primary-foreground font-bold py-3 px-4 rounded-lg hover:bg-primary/90 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-opacity-75 disabled:opacity-50 disabled:cursor-not-allowed flex justify-center items-center"
            >
                {isLoading ? <LoadingSpinner size="small" /> : 'Login'}
            </button>
        </form>
    );
};

const SignUpForm = ({ auth, db, setError }) => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [role, setRole] = useState('student');

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        if (password !== confirmPassword) {
            setError("Passwords do not match.");
            return;
        }
        if (!email || !password) {
            setError("Please fill in all fields.");
            return;
        }
        
        setIsLoading(true);

        try {
            const userCredential = await auth.createUserWithEmailAndPassword(email, password);
            const user = userCredential.user;

            // Save user profile to Firestore
            const userProfileRef = doc(db, 'userProfiles', user.uid);
            await setDoc(userProfileRef, {
                email: user.email,
                id: user.uid,
                firstName: '',
                lastName: '',
                photoURL: '',
                role: role,
                createdAt: serverTimestamp(),
            });
            // onAuthStateChanged will handle navigation to dashboard
        } catch (err) {
            setError(err.message.replace('Firebase: ', ''));
            setIsLoading(false);
        }
        // Don't set isLoading to false on success, as the component will unmount
    };
    
    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
                <label className="text-sm font-medium text-muted-foreground">I am signing up as a...</label>
                <div className="flex w-full bg-background/70 border border-white/20 rounded-lg p-1">
                    <button
                        type="button"
                        onClick={() => setRole('student')}
                        className={`flex-1 py-2 px-4 text-sm font-semibold rounded-md transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-ring ${role === 'student' ? 'bg-primary text-primary-foreground' : 'text-white hover:bg-primary/20'}`}
                    >
                        Student
                    </button>
                    <button
                        type="button"
                        onClick={() => setRole('institute')}
                        className={`flex-1 py-2 px-4 text-sm font-semibold rounded-md transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-ring ${role === 'institute' ? 'bg-primary text-primary-foreground' : 'text-white hover:bg-primary/20'}`}
                    >
                        Institute
                    </button>
                </div>
            </div>
            <InputField
                id="signup-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Email Address"
                icon={<UserIcon className="w-5 h-5 text-gray-400" />}
                autoComplete="email"
            />
            <InputField
                id="signup-password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Password"
                icon={<LockIcon className="w-5 h-5 text-gray-400" />}
                actionIcon={
                    showPassword ? 
                    <EyeOff className="w-5 h-5 text-gray-400 hover:text-white" /> : 
                    <Eye className="w-5 h-5 text-gray-400 hover:text-white" />
                }
                onActionClick={() => setShowPassword(!showPassword)}
                autoComplete="new-password"
            />
            <InputField
                id="signup-confirm-password"
                type={showPassword ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm Password"
                icon={<LockIcon className="w-5 h-5 text-gray-400" />}
                autoComplete="new-password"
            />

            <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-primary text-primary-foreground font-bold py-3 px-4 rounded-lg hover:bg-primary/90 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-opacity-75 disabled:opacity-50 disabled:cursor-not-allowed flex justify-center items-center"
            >
                {isLoading ? <LoadingSpinner size="small" /> : 'Sign Up'}
            </button>
        </form>
    );
};

const ForgotPasswordForm = ({ auth, setError, setSuccessMessage }) => {
    const [email, setEmail] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setSuccessMessage('');
        if (!email) {
            setError('Please enter your email address.');
            return;
        }
        setIsLoading(true);
        try {
            await auth.sendPasswordResetEmail(email);
            setSuccessMessage('Password reset email sent! Check your inbox.');
        } catch (err) {
            setError(err.message.replace('Firebase: ', ''));
        }
        setIsLoading(false);
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            <InputField
                id="forgot-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Email Address"
                icon={<UserIcon className="w-5 h-5 text-gray-400" />}
                autoComplete="email"
            />
            <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-primary text-primary-foreground font-bold py-3 px-4 rounded-lg hover:bg-primary/90 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-opacity-75 disabled:opacity-50 disabled:cursor-not-allowed flex justify-center items-center"
            >
                {isLoading ? <LoadingSpinner size="small" /> : 'Send Reset Email'}
            </button>
        </form>
    );
};


// --- UI Components ---

const InputField = ({ id, type, value, onChange, placeholder, icon, actionIcon, onActionClick, autoComplete }) => (
  <div className="relative">
    <span className="absolute inset-y-0 left-0 flex items-center pl-3">
      {icon}
    </span>
    <input
      id={id}
      type={type}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      className="w-full bg-background/70 text-white placeholder-gray-400 border border-white/20 rounded-lg py-3 pl-10 pr-10 focus:outline-none focus:ring-2 focus:ring-ring transition-all duration-300"
      required
      autoComplete={autoComplete}
    />
    {actionIcon && (
      <button type="button" onClick={onActionClick} className="absolute inset-y-0 right-0 flex items-center pr-3">
        {actionIcon}
      </button>
    )}
  </div>
);

const ErrorMessage = ({ message }) => (
  <div className="bg-red-500/20 border border-red-500/50 text-red-300 px-4 py-3 rounded-lg mb-6 text-sm text-center">
    {message}
  </div>
);

const SuccessMessage = ({ message }) => (
    <div className="bg-green-500/20 border border-green-500/50 text-green-300 px-4 py-3 rounded-lg mb-6 text-sm text-center">
      {message}
    </div>
  );

const LoadingSpinner = ({ size = 'large' }) => (
  <div className={`animate-spin rounded-full border-t-2 border-b-2 border-primary ${size === 'large' ? 'w-12 h-12' : 'w-6 h-6'}`}></div>
);

    