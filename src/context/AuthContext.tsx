"use client";

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User } from 'firebase/auth';
import { useRouter, usePathname } from 'next/navigation';
import { doc, getDoc, onSnapshot } from 'firebase/firestore';
import { useAuth as useFirebaseAuth, useFirestore } from '@/firebase'; 
import { UserProfile } from '@/lib/types';


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
  const { user, initialized: authInitialized } = useFirebaseAuth();
  const firestore = useFirestore();

  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [profileLoading, setProfileLoading] = useState(true);

  useEffect(() => {
    if (!user || !firestore) {
        setProfile(null);
        setProfileLoading(false);
        if (authInitialized && pathname.startsWith('/dashboard')) {
            router.replace('/login');
        }
        return;
    }

    setProfileLoading(true);
    const profileRef = doc(firestore, 'userProfiles', user.uid);
    
    const unsubscribe = onSnapshot(profileRef, (docSnap) => {
        if (docSnap.exists()) {
            const data = docSnap.data() as Omit<UserProfile, 'id'>;
            const userProfile: UserProfile = { id: docSnap.id, ...data };
            setProfile(userProfile);

            const dashboardPath = `/dashboard/${userProfile.role}`;
            if (pathname !== dashboardPath && (pathname === '/' || pathname === '/login' || pathname === '/signup' || pathname.startsWith('/dashboard'))) {
                router.replace(dashboardPath);
            }
        } else {
            // This can happen briefly during sign up
            setProfile(null);
        }
        setProfileLoading(false);
    }, (error) => {
        console.error("Error fetching user profile:", error);
        setProfile(null);
        setProfileLoading(false);
    });

    return () => unsubscribe();
  }, [user, firestore, authInitialized, router, pathname]);

  const loading = !authInitialized || profileLoading;

  return (
    <AuthContext.Provider value={{ user, profile, loading, authInitialized }}>
      {loading && (pathname.startsWith('/dashboard') || pathname === '/') ? (
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
