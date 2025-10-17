
'use client';
import {
  Auth,
  createUserWithEmailAndPassword as firebaseCreateUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  UserCredential,
} from 'firebase/auth';
import { getFunctions, httpsCallable } from 'firebase/functions';

/**
 * A wrapper around Firebase's createUserWithEmailAndPassword that also
 * sets the user's role via a Cloud Function.
 */
export async function createUserWithEmailAndPassword(
  auth: Auth,
  email: string,
  password: string,
  options: { role: string }
): Promise<UserCredential> {
  const userCredential = await firebaseCreateUserWithEmailAndPassword(auth, email, password);
  const user = userCredential.user;

  if (user && options.role) {
    const functions = getFunctions(auth.app);
    const setInitialUserRole = httpsCallable(functions, 'setInitialUserRole');
    try {
      await setInitialUserRole({ uid: user.uid, role: options.role });
    } catch (error) {
      // The user is created in Auth, but role setting failed.
      // In a production app, you might want to delete the user or schedule a retry.
      console.error("Failed to set user role via Cloud Function:", error);
      // We still return the credential, but the profile might be incomplete.
    }
  }

  return userCredential;
}
