'use client';
import {
  Auth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
} from 'firebase/auth';
import { errorEmitter } from './error-emitter';

/** Initiate email/password sign-up (non-blocking). */
export function initiateEmailSignUp(authInstance: Auth, email: string, password: string): Promise<any> {
  // CRITICAL: Call createUserWithEmailAndPassword. The promise is returned to handle user creation logic.
  return createUserWithEmailAndPassword(authInstance, email, password);
}

/** Initiate email/password sign-in (non-blocking). */
export function initiateEmailSignIn(authInstance: Auth, email: string, password: string): Promise<any> {
  // CRITICAL: Call signInWithEmailAndPassword directly. We return the promise so the UI can handle it.
  return signInWithEmailAndPassword(authInstance, email, password);
}

    