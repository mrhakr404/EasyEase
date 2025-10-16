
'use client';

import { doc, getDoc, setDoc, updateDoc, addDoc, collection, serverTimestamp, DocumentData, WithFieldValue } from 'firebase/firestore';
import { firestore } from '@/lib/firebase/client';
import type { UserProfile, Institute } from '@/lib/types';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';


/**
 * Fetches a user's profile from Firestore.
 * @param userId - The unique identifier of the user.
 * @returns A promise that resolves to the user's profile data or null if not found.
 */
export async function fetchUserProfile(userId: string): Promise<UserProfile | null> {
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
 * @param userId - The unique identifier of the user.
 * @param data - An object containing the fields to update.
 */
export function updateUserProfile(userId: string, data: Partial<UserProfile>): void {
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

/**
 * Creates a new institute document in Firestore.
 * @param data - The data for the new institute, conforming to the Institute interface.
 * @returns A promise that resolves to the newly created document reference.
 */
export async function createInstitute(data: Omit<Institute, 'id' | 'createdAt'>): Promise<DocumentReference<DocumentData> | undefined> {
  const institutesColRef = collection(firestore, 'institutes');
  const newInstituteData: WithFieldValue<Omit<Institute, 'id'>> = {
    ...data,
    createdAt: serverTimestamp(),
  };

  try {
    const docRef = await addDoc(institutesColRef, newInstituteData);
    return docRef;
  } catch (error) {
    console.error("Error creating institute:", error);
    errorEmitter.emit('permission-error', new FirestorePermissionError({
      path: institutesColRef.path,
      operation: 'create',
      requestResourceData: newInstituteData,
    }));
    return undefined;
  }
}

/**
 * Fetches an institute's data from Firestore by its ID.
 * @param instituteId - The unique identifier of the institute.
 * @returns A promise that resolves to the institute's data or null if not found.
 */
export async function fetchInstituteById(instituteId: string): Promise<Institute | null> {
  const instituteRef = doc(firestore, 'institutes', instituteId);
  try {
    const docSnap = await getDoc(instituteRef);
    if (docSnap.exists()) {
      return { id: docSnap.id, ...docSnap.data() } as Institute;
    } else {
      console.log("No such institute found!");
      return null;
    }
  } catch (error) {
    console.error("Error fetching institute:", error);
    return null;
  }
}
