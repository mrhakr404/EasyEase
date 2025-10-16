'use client';

import { firebaseConfig } from '@/firebase/config';
import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getAuth, connectAuthEmulator } from 'firebase/auth';
import { getFirestore, connectFirestoreEmulator } from 'firebase/firestore'

function initializeServices() {
  const isConfigured = getApps().length > 0;
  const firebaseApp = isConfigured ? getApp() : initializeApp(firebaseConfig);
  const auth = getAuth(firebaseApp);
  const firestore = getFirestore(firebaseApp);

  if (process.env.NODE_ENV !== 'production' && typeof window !== 'undefined') {
    // Check if running in the browser
    const host = window.location.hostname;
    // Connect to emulators
    connectAuthEmulator(auth, `http://${host}:9099`, { disableWarnings: true });
    connectFirestoreEmulator(firestore, host, 8080);
  }

  return { firebaseApp, auth, firestore, isConfigured };
}

function getClientServices() {
  // To support HMR, we need to re-initialize services on each render.
  if (typeof window !== 'undefined') {
    return initializeServices();
  }
  // Otherwise, we can use a singleton pattern.
  if (!globalThis.__firebase) {
    globalThis.__firebase = initializeServices();
  }
  return globalThis.__firebase as ReturnType<typeof initializeServices>;
}

const { firebaseApp, auth, firestore } = getClientServices();

export { firebaseApp, auth, firestore };
