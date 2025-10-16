'use client';
import {
  createContext,
  useContext,
  useMemo,
  type ReactNode,
} from 'react';
import { initializeFirebase } from '.';

import { FirebaseErrorListener } from '@/components/FirebaseErrorListener';
import { AuthProvider } from '@/context/AuthContext';


const FirebaseContext = createContext<ReturnType<
  typeof initializeFirebase
> | null>(null);


/**
 * The main Firebase provider component that wraps the entire application.
 * It initializes Firebase services and provides them to all child components.
 */
export function FirebaseProvider({ children }: { children: ReactNode }) {
  const firebase = useMemo(() => initializeFirebase(), []);

  return (
    <FirebaseContext.Provider value={firebase}>
        <AuthProvider>
            {children}
            <FirebaseErrorListener />
        </AuthProvider>
    </FirebaseContext.Provider>
  );
}

/**
 * A hook to get the raw Firebase context, containing app, auth, and firestore.
 * Prefer using the more specific hooks like `useAuth` or `useFirestore` if possible.
 */
export function useFirebase() {
  return useContext(FirebaseContext);
}

/**
 * A hook to get the initialized Firebase App instance.
 */
export function useFirebaseApp() {
  return useFirebase()?.app;
}

/**
 * A hook to get the initialized Firebase Auth instance.
 */
export function useAuth() {
  const context = useFirebase();
  return context?.auth;
}

/**
 * A hook to get the initialized Firestore instance.
 */
export function useFirestore() {
  return useFirebase()?.firestore;
}
