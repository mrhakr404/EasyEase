"use client";

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User, onAuthStateChanged } from 'firebase/auth';
import { useRouter, usePathname } from 'next/navigation';
import { doc, getDoc } from 'firebase/firestore';
import { auth, firestore } from '@/lib/firebase/client'; 

// --- Types ---
interface ProfileData {
  role: 'student' | 'institute' | 'admin' | null;
  profileLoaded: boolean;
}

interface AuthContextType {
  user: User | null;
  profile: ProfileData | null; 
  authInitialized: boolean; // Firebase has finished its initial check
  loading: boolean;         // Overall loading (Auth Check + Profile Fetch)
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// --- Background Profile Fetch ---
const fetchUserProfile = async (uid: string): Promise<ProfileData> => {
  console.log(`Fetching profile for: ${uid} in background...`);
  const userProfileRef = doc(firestore, 'userProfiles', uid);
  const docSnap = await getDoc(userProfileRef);

  if (docSnap.exists()) {
    const data = docSnap.data();
    return {
      role: data.role || null,
      profileLoaded: true,
    };
  } else {
    // Handle case where user exists in Auth but not in Firestore
    return {
      role: null,
      profileLoaded: true, // Profile check is done, even if no profile found
    };
  }
};


// --- Auth Provider Component ---
export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const router = useRouter();
  const pathname = usePathname();

  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<ProfileData | null>(null);
  
  // authInitialized: True when Firebase onAuthStateChanged fires the first time.
  const [authInitialized, setAuthInitialized] = useState(false); 
  
  // loading: True until Firebase check AND Profile fetch are complete.
  const [loading, setLoading] = useState(true); 

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (authUser) => {
      // 1. Initial State Update (Fast Perceived Login)
      setUser(authUser);
      setAuthInitialized(true); 

      if (authUser) {
        // --- AUTHENTICATED PATH ---
        
        // 2. IMMEDIATE Redirection (Fast UX)
        // If the user is on a public page (login, signup, home), send them to their dashboard *instantly*.
        if (pathname === '/login' || pathname === '/signup' || pathname === '/') {
          // We will redirect after fetching the profile role
        }

        // 3. Background Profile Fetch
        try {
          const userProfile = await fetchUserProfile(authUser.uid);
          setProfile(userProfile);

          // 4. Role-based Redirection
          if (userProfile.role) {
             const dashboardPath = `/dashboard/${userProfile.role}`;
             if (pathname !== dashboardPath) {
                router.replace(dashboardPath);
             }
          }
          
        } catch (error) {
          console.error("Error fetching profile:", error);
        } finally {
          // 5. Final Loading State Resolved
          setLoading(false);
        }
      } else {
        // --- UN-AUTHENTICATED PATH (e.g., Logout) ---
        setProfile(null);
        setLoading(false);
        
        // 6. Protected Route Redirection
        // If they log out or are unauthenticated on a protected route, redirect to sign-in.
        if (pathname.startsWith('/dashboard')) {
          router.replace('/login'); 
        }
      }
    });

    return () => unsubscribe();
  }, [router, pathname]); // Depend on router and pathname for correct redirects

  return (
    <AuthContext.Provider value={{ user, profile, loading, authInitialized }}>
      {/* Show a full-screen loading state if Firebase hasn't checked auth yet */}
      {!authInitialized ? (
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
