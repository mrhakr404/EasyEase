'use client';

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User } from 'firebase/auth';
import { useRouter, usePathname } from 'next/navigation';
import { doc, onSnapshot } from 'firebase/firestore';
import { useAuth as useFirebaseAuth, useFirestore } from '@/firebase';
import type { UserProfile } from '@/lib/types';

// --- Types ---
interface AuthContextType {
  user: User | null;
  profile: UserProfile | null;
  authInitialized: boolean;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// --- Auth Provider Component ---
export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const router = useRouter();
  const pathname = usePathname();
  const auth = useFirebaseAuth(); // Use the hook to get the auth instance
  const firestore = useFirestore();

  const { user, initialized: authInitialized } = useFirebaseAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [profileLoading, setProfileLoading] = useState(true);

  useEffect(() => {
    // This effect handles both profile fetching and redirection logic.

    // 1. Initial checks for dependencies
    if (!authInitialized || !firestore || !auth) {
      return;
    }

    const isProtectedAuthPage = pathname === '/login' || pathname === '/signup';

    // 2. Handle the "not logged in" case
    if (!user) {
      setProfile(null);
      setProfileLoading(false);
      // If user is on a protected dashboard route, redirect to login.
      if (pathname.startsWith('/dashboard')) {
        router.replace('/login');
      }
      return; // Stop further execution in this effect run.
    }

    // 3. Handle the "logged in" case: fetch profile and redirect if necessary
    setProfileLoading(true);
    const profileRef = doc(firestore, 'userProfiles', user.uid);

    const unsubscribe = onSnapshot(
      profileRef,
      docSnap => {
        if (docSnap.exists()) {
          const userProfile = { id: docSnap.id, ...docSnap.data() } as UserProfile;
          setProfile(userProfile);
          
          // --- REDIRECTION LOGIC ---
          // If we have a profile, we can decide where the user should be.
          const targetDashboard = `/dashboard/${userProfile.role}`;
          
          // Redirect if user is on a page they shouldn't be on (e.g., login page, or wrong dashboard)
          const isOnTargetDashboard = pathname === targetDashboard;
          if (!isOnTargetDashboard && (pathname.startsWith('/dashboard') || isProtectedAuthPage || pathname === '/')) {
             router.replace(targetDashboard);
          }

        } else {
          // This case can happen briefly during signup before the onUserCreate cloud function runs.
          console.warn(`User profile not found for uid: ${user.uid}. Waiting for creation.`);
          setProfile(null);
          // If they are on a dashboard without a profile, they will be redirected away.
          if (pathname.startsWith('/dashboard')) {
            router.replace('/login');
          }
        }
        setProfileLoading(false);
      },
      error => {
        console.error('Error fetching user profile:', error);
        setProfile(null);
        setProfileLoading(false);
        if (auth.signOut) {
            auth.signOut(); // Sign out on profile fetch error to prevent being stuck.
        }
        router.replace('/login');
      }
    );

    return () => unsubscribe();
  }, [user, authInitialized, firestore, auth, router, pathname]);

  const loading = !authInitialized || (!!user && profileLoading);
  
  // Show a global loader only on dashboard pages while we resolve auth/profile.
  const shouldShowLoader = loading && pathname.startsWith('/dashboard');

  return (
    <AuthContext.Provider value={{ user, profile, loading, authInitialized }}>
      {shouldShowLoader ? (
        <div className="min-h-screen flex items-center justify-center bg-background text-lg">
          <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-primary"></div>
        </div>
      ) : (
        children
      )}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
