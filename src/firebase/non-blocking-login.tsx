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
export function initiateEmailSignIn(authInstance: Auth, email: string, password: string): void {
  // CRITICAL: Call signInWithEmailAndPassword directly. Do NOT use 'await'.
  // The onAuthStateChanged listener will handle the success case.
  // We add a .catch() to handle specific failures like invalid credentials.
  signInWithEmailAndPassword(authInstance, email, password)
    .catch(error => {
      // We emit the error to a global handler that can display it in the UI.
      // This prevents the uncaught promise rejection from crashing the app.
      errorEmitter.emit('permission-error', error);
    });
}
