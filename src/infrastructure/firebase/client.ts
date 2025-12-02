// src/infrastructure/firebase/client.ts
import { initializeApp, getApps, FirebaseApp, FirebaseOptions } from "firebase/app";
import { getAuth, Auth } from "firebase/auth";
import { initializeFirestore, persistentLocalCache, persistentMultipleTabManager, getFirestore, Firestore } from "firebase/firestore";
import { getStorage, FirebaseStorage } from "firebase/storage";

// Helper to get config from various sources
const getFirebaseConfig = (): FirebaseOptions | null => {
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
      // Ensure we have at least apiKey and projectId
      if (config.apiKey && config.projectId) return config;
    } catch (e) {
      console.warn("Failed to parse FIREBASE_CONFIG", e);
    }
  }

  // 3. Return null if nothing found
  return null;
};

const firebaseConfig = getFirebaseConfig();

let app: FirebaseApp | undefined;
let auth: Auth | undefined;
let db: Firestore | undefined;
let storage: FirebaseStorage | undefined;

// Only initialize if we have a valid config
if (firebaseConfig) {
  try {
    app = getApps().length ? getApps()[0] : initializeApp(firebaseConfig);

    // Auth (Browser Only)
    if (typeof window !== "undefined") {
      try {
        auth = getAuth(app);
      } catch (e) {
        console.warn("Firebase Auth failed to initialize.", e);
      }
    }

    // Firestore
    try {
      db = initializeFirestore(app, {
        localCache: persistentLocalCache({
          tabManager: persistentMultipleTabManager()
        })
      }, "propia");
    } catch (e) {
      try {
        db = getFirestore(app, "propia");
      } catch (e2) {
        db = getFirestore(app);
      }
    }

    // Storage
    storage = getStorage(app);

  } catch (error) {
    console.error("Error initializing Firebase:", error);
  }
} else {
  console.warn("Firebase Config missing. Skipping initialization. (Expected during build if env vars are missing)");
}

export { app, auth, db, storage };