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

  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [profileLoading, setProfileLoading] = useState(true);

  // Directly use the user and initialized state from the useUser hook.
  const { user, initialized: authInitialized } = useFirebaseAuth();

  useEffect(() => {
    // If auth is checked and there's no user, or if firestore is not ready
    if (authInitialized && (!user || !firestore)) {
      setProfile(null);
      setProfileLoading(false);
      // If user is on a protected route and not logged in, redirect
      if (pathname.startsWith('/dashboard')) {
        router.replace('/login');
      }
      return;
    }

    // If there's no user, we don't need to fetch a profile.
    if (!user) {
      setProfileLoading(false);
      return;
    }

    // User is logged in, start fetching profile.
    setProfileLoading(true);
    const profileRef = doc(firestore, 'userProfiles', user.uid);

    const unsubscribe = onSnapshot(
      profileRef,
      docSnap => {
        if (docSnap.exists()) {
          const userProfile = { id: docSnap.id, ...docSnap.data() } as UserProfile;
          setProfile(userProfile);
          
          // Redirect logic
          const targetDashboard = `/dashboard/${userProfile.role}`;
          if (pathname !== targetDashboard && (pathname.startsWith('/dashboard') || pathname === '/' || pathname === '/login' || pathname === '/signup')) {
            router.replace(targetDashboard);
          }

        } else {
          // This can happen briefly on signup before profile is created
          console.warn(`User profile not found for uid: ${user.uid}`);
          setProfile(null);
           if (pathname.startsWith('/dashboard')) {
            // If they are on a dashboard without a profile, something is wrong.
            // Send them to login to be safe. Could also go to a create-profile page.
             router.replace('/login');
           }
        }
        setProfileLoading(false);
      },
      error => {
        console.error('Error fetching user profile:', error);
        setProfile(null);
        setProfileLoading(false);
        // On error, redirect away from protected routes.
        if (pathname.startsWith('/dashboard')) {
          router.replace('/login');
        }
      }
    );

    return () => unsubscribe();
  }, [user, authInitialized, firestore, router, pathname]);

  // Overall loading is true if auth isn't checked OR if a user exists but their profile isn't loaded yet.
  const loading = !authInitialized || (!!user && profileLoading);

  const shouldShowLoader = loading && (pathname.startsWith('/dashboard') || (pathname === '/' && !!user));

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
