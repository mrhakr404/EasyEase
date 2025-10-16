
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
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// --- Auth Provider Component ---
export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const router = useRouter();
  const pathname = usePathname();
  const auth = useFirebaseAuth();
  const firestore = useFirestore();

  const { user, initialized: authInitialized } = useFirebaseAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [profileLoading, setProfileLoading] = useState(true);

  useEffect(() => {
    if (!authInitialized || !firestore) {
      return;
    }

    const isPublicPage = ['/login', '/signup', '/'].includes(pathname);

    // Handle user is not logged in
    if (!user) {
      setProfile(null);
      setProfileLoading(false);
      if (!isPublicPage && pathname.startsWith('/dashboard')) {
        router.replace('/login');
      }
      return;
    }

    // User is logged in, fetch profile
    setProfileLoading(true);
    const profileRef = doc(firestore, 'userProfiles', user.uid);
    const unsubscribe = onSnapshot(
      profileRef,
      (docSnap) => {
        if (docSnap.exists()) {
          const userProfile = { id: docSnap.id, ...docSnap.data() } as UserProfile;
          setProfile(userProfile);
          
          if (userProfile.role) {
            const targetDashboard = `/dashboard/${userProfile.role}`;
            // Redirect if they are not already on their correct dashboard
            if (pathname !== targetDashboard && (isPublicPage || pathname.startsWith('/dashboard'))) {
              router.replace(targetDashboard);
            }
          }
        } else {
          // Profile doesn't exist yet, wait for backend function to create it
          setProfile(null);
        }
        setProfileLoading(false);
      },
      (error) => {
        console.error('Error fetching user profile:', error);
        setProfile(null);
        setProfileLoading(false);
        if (auth) {
          auth.signOut();
        }
      }
    );

    return () => unsubscribe();
  }, [user, authInitialized, firestore, auth, router, pathname]);

  const loading = !authInitialized || (!!user && profileLoading);

  const shouldShowLoader = loading && pathname.startsWith('/dashboard');

  return (
    <AuthContext.Provider value={{ user, profile, loading }}>
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

    