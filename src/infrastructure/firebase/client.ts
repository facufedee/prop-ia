// src/infrastructure/firebase/client.ts
import { initializeApp, getApps } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

let firebaseConfig: any = {};

// Determine which config to use based on environment
if (typeof window === "undefined") {
  // Server-side (SSR / Cloud Run / Build)
  // Try FIREBASE_CONFIG first (Firebase App Hosting)
  const fbConfigStr = process.env.FIREBASE_CONFIG || process.env.FIREBASE_WEBAPP_CONFIG;

  if (fbConfigStr) {
    try {
      firebaseConfig = JSON.parse(fbConfigStr);
    } catch (e) {
      console.error("Error parsing FIREBASE_CONFIG:", e);
    }
  }

  // Fallback to NEXT_PUBLIC variables if FIREBASE_CONFIG not available (local build)
  if (!firebaseConfig || !firebaseConfig.projectId) {
    firebaseConfig = {
      apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
      authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
      projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
      storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
      messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
      appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
    };
  }
} else {
  // Client-side (browser)
  firebaseConfig = {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY!,
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN!,
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID!,
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET!,
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID!,
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID!,
  };
}

// Initialize Firebase App
const app = !getApps().length ? initializeApp(firebaseConfig) : getApps()[0];

// Initialize Firestore and Storage (safe on both server and client)
const db = getFirestore(app);
const storage = getStorage(app);

// Auth - only initialize on client-side
// On server-side, auth will be undefined which is expected
const auth = typeof window !== "undefined" ? getAuth(app) : (undefined as any);

export { app, auth, db, storage };
export default app;