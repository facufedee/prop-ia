// src/infrastructure/firebase/client.ts
import { initializeApp, getApps } from "firebase/app";
import { getAuth } from "firebase/auth";
import { initializeFirestore, persistentLocalCache, persistentMultipleTabManager, getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID
};

const app = getApps().length ? getApps()[0] : initializeApp(firebaseConfig);

// Safe Auth Init for Build/Server Environments
let auth: any;
try {
  auth = getAuth(app);
} catch (e) {
  console.warn("Firebase Auth failed to initialize. This is expected during server-side build if env vars are missing.");
}

let firestoreDb;
try {
  firestoreDb = initializeFirestore(app, {
    localCache: persistentLocalCache({
      tabManager: persistentMultipleTabManager()
    })
  }, "propia");
} catch (e) {
  // If already initialized, use existing instance
  try {
    firestoreDb = getFirestore(app, "propia");
  } catch (e2) {
    firestoreDb = getFirestore(app);
  }
}

export const db = firestoreDb;
export const storage = getStorage(app);
export { auth, app };