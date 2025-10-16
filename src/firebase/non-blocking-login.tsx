
'use client';
import {
  Auth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  UserCredential,
} from 'firebase/auth';

/**
 * Initiates email/password sign-up (non-blocking).
 * It returns the promise from createUserWithEmailAndPassword so the caller can handle the user credential.
 * Errors should be caught by the caller.
 */
export function initiateEmailSignUp(authInstance: Auth, email: string, password: string): Promise<UserCredential> {
  return createUserWithEmailAndPassword(authInstance, email, password);
}

/**
 * Initiates email/password sign-in (non-blocking).
 * It returns the promise from signInWithEmailAndPassword. The redirection and global state update
 * should be handled by the onAuthStateChanged listener in AuthContext.
 * Errors should be caught by the caller.
 */
export function initiateEmailSignIn(authInstance: Auth, email: string, password: string): Promise<UserCredential> {
  return signInWithEmailAndPassword(authInstance, email, password);
}

    