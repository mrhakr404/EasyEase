
'use client';

import { doc, getDoc, updateDoc, DocumentData, WithFieldValue, Firestore } from 'firebase/firestore';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';
import type { UserProfile } from '@/lib/types';


/**
 * Fetches a user's profile from Firestore.
 * @param firestore - The Firestore instance.
 * @param userId - The unique identifier of the user.
 * @returns A promise that resolves to the user's profile data or null if not found.
 */
export async function fetchUserProfile(firestore: Firestore, userId: string): Promise<UserProfile | null> {
  const userProfileRef = doc(firestore, 'userProfiles', userId);
  try {
    const docSnap = await getDoc(userProfileRef);
    if (docSnap.exists()) {
      return { id: docSnap.id, ...docSnap.data() } as UserProfile;
    } else {
      console.log("No such user profile!");
      return null;
    }
  } catch (error) {
    console.error("Error fetching user profile:", error);
    // In a real app, you might want to throw the error or handle it differently
    return null;
  }
}

/**
 * Updates a user's profile in Firestore.
 * This uses non-blocking `updateDoc` and optimistic error handling.
 * @param firestore - The Firestore instance.
 * @param userId - The unique identifier of the user.
 * @param data - An object containing the fields to update.
 */
export function updateUserProfile(firestore: Firestore | null, userId: string, data: Partial<UserProfile>): void {
  if (!firestore) {
    console.error("Firestore not initialized");
    return;
  }
  const userProfileRef = doc(firestore, 'userProfiles', userId);
  
  updateDoc(userProfileRef, data)
    .catch(error => {
      console.error("Error updating user profile:", error);
      errorEmitter.emit('permission-error', new FirestorePermissionError({
        path: userProfileRef.path,
        operation: 'update',
        requestResourceData: data,
      }));
    });
}
