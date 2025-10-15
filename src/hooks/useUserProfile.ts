'use client';

import { useMemo } from 'react';
import { doc, Firestore } from 'firebase/firestore';
import { useFirestore, useDoc, useMemoFirebase } from '@/firebase';
import type { UseDocResult } from '@/firebase';

// Define the shape of the user profile
interface UserProfile {
  id: string;
  email: string;
  role: 'student' | 'institute' | 'admin';
  firstName?: string;
  lastName?: string;
  photoURL?: string;
}

// Custom hook to fetch a user's profile from Firestore
export default function useUserProfile(uid: string | undefined): UseDocResult<UserProfile> {
  const firestore = useFirestore();

  // Memoize the document reference to prevent re-renders
  const userProfileRef = useMemoFirebase(() => {
    if (!uid || !firestore) return null;
    return doc(firestore, 'userProfiles', uid);
  }, [firestore, uid]);

  return useDoc<UserProfile>(userProfileRef);
}
