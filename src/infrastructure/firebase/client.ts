// src/infrastructure/firebase/client.ts
import { initializeApp, getApps, FirebaseOptions } from "firebase/app";
import { getAuth } from "firebase/auth";
import { initializeFirestore, persistentLocalCache, persistentMultipleTabManager, getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

// Helper to get config from various sources
const getFirebaseConfig = (): FirebaseOptions => {
  // 1. Try individual env vars (Local & Vercel)
  if (process.env.NEXT_PUBLIC_FIREBASE_API_KEY) {
    return {
      apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
      authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
      projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
      storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
      messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
      appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
      measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID
    };
  }

  // 2. Try FIREBASE_CONFIG (Firebase App Hosting)
  if (process.env.FIREBASE_CONFIG) {
    try {
      const config = JSON.parse(process.env.FIREBASE_CONFIG);
      // Ensure we have at least apiKey
      if (config.apiKey) return config;
    } catch (e) {
      console.warn("Failed to parse FIREBASE_CONFIG", e);
    }
  }

  // 3. Return empty object if nothing found (prevents build crash, but services won't work)
  return {};
};

const firebaseConfig = getFirebaseConfig();
const app = getApps().length ? getApps()[0] : initializeApp(firebaseConfig);

// Safe Auth Init: Only initialize if we have an API Key AND we are in the browser
let auth: any = null;
if (typeof window !== "undefined" && firebaseConfig.apiKey) {
  try {
    auth = getAuth(app);
  } catch (e) {
    console.warn("Firebase Auth failed to initialize.", e);
  }
}

// Safe Firestore Init
let firestoreDb;
try {
  firestoreDb = initializeFirestore(app, {
    localCache: persistentLocalCache({
      tabManager: persistentMultipleTabManager()
    })
  }, "propia");
} catch (e) {
  try {
    firestoreDb = getFirestore(app, "propia");
  } catch (e2) {
    firestoreDb = getFirestore(app);
  }
}

export const db = firestoreDb;
export const storage = getStorage(app);
export { auth, app };