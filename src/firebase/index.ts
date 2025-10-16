'use client';

import {
  useState,
  useEffect,
  useMemo,
} from 'react';
import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  connectAuthEmulator,
  getAuth,
  onIdTokenChanged,
  onAuthStateChanged,
} from 'firebase/auth';
import { connectFirestoreEmulator, getFirestore } from 'firebase/firestore';

import { firebaseConfig } from './config';
import type { User, Auth } from 'firebase/auth';
import type { FirebaseApp } from 'firebase/app';
import type { Firestore } from 'firebase/firestore';

export * from './provider';
export { useCollection } from './firestore/use-collection';
export { useDoc } from './firestore/use-doc';

type FirebaseServices = {
  app: FirebaseApp;
  auth: Auth;
  firestore: Firestore;
};

// Singleton pattern to avoid re-initializing Firebase on every render
let firebaseServices: FirebaseServices | null = null;

/**
 * Initializes Firebase services. It connects to emulators if in a development
 * environment, otherwise it connects to production services.
 * @returns An object containing the initialized Firebase app, auth, and firestore services.
 */
export function initializeFirebase(): FirebaseServices {
  if (firebaseServices) {
    return firebaseServices;
  }

  const app = getApps().length ? getApp() : initializeApp(firebaseConfig);
  const auth = getAuth(app);
  const firestore = getFirestore(app);

  if (process.env.NODE_ENV === 'development' && typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')) {
    console.log('Connecting to Firebase Emulators');
    connectAuthEmulator(auth, 'http://localhost:9099');
    connectFirestoreEmulator(firestore, 'localhost', 8080);
  }

  firebaseServices = { app, auth, firestore };
  return firebaseServices;
}

/**
 * A React hook that provides the current authenticated user.
 * It listens for changes in the authentication state and updates accordingly.
 * @returns An object containing the user and a boolean indicating if the
 * authentication state has been initialized.
 */
export function useUser() {
  const [user, setUser] = useState<User | null>(null);
  const [initialized, setInitialized] = useState(false);
  const { auth } = initializeFirebase();

  useEffect(() => {
    const unsubscribe = onIdTokenChanged(auth, (user) => {
      setUser(user);
      if (!initialized) {
        setInitialized(true);
      }
    });

    return () => unsubscribe();
  }, [auth, initialized]);

  return { user, initialized };
}

/**
 * A hook to memoize Firestore queries and references.
 * It adds a `__memo` property to the returned value, which is checked
 * by `useCollection` and `useDoc` to prevent re-renders.
 */
export function useMemoFirebase<T>(factory: () => T, deps: React.DependencyList): T {
    // eslint-disable-next-line react-hooks/exhaustive-deps
    return useMemo(() => {
        const value = factory();
        if (value && typeof value === 'object') {
            (value as any).__memo = true;
        }
        return value;
    }, deps);
}
