'use client';

import { firebaseConfig } from '@/firebase/config';
import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore'

function initializeServices() {
  const isConfigured = getApps().length > 0;
  const firebaseApp = isConfigured ? getApp() : initializeApp(firebaseConfig);
  const auth = getAuth(firebaseApp);
  const firestore = getFirestore(firebaseApp);

  // NOTE: Emulator connections have been removed to connect to production services,
  // as they can be unreliable in some cloud development environments.
  // if (process.env.NODE_ENV !== 'production' && typeof window !== 'undefined') {
  //   const host = window.location.hostname;
  //   connectAuthEmulator(auth, `http://${host}:9099`, { disableWarnings: true });
  //   connectFirestoreEmulator(firestore, host, 8080);
  // }

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
