// src/infrastructure/firebase/client.ts
import { initializeApp, getApps, FirebaseApp } from "firebase/app";
import { getAuth, Auth } from "firebase/auth";
import { getFirestore, Firestore } from "firebase/firestore";
import { getStorage, FirebaseStorage } from "firebase/storage";

let firebaseConfig: any = {};

// Firebase App Hosting ALWAYS sets FIREBASE_CONFIG in server environment
if (typeof window === "undefined") {
  // Server-side (SSR / Cloud Run / Build time)
  try {
    const configStr = process.env.FIREBASE_CONFIG || "{}";
    firebaseConfig = JSON.parse(configStr);

    // If config is empty or missing projectId, use a dummy config for build time
    if (!firebaseConfig.projectId) {
      console.warn("Firebase config not available during build. Using dummy config.");
      firebaseConfig = {
        apiKey: "dummy-api-key-for-build",
        authDomain: "dummy.firebaseapp.com",
        projectId: "dummy-project-id",
        storageBucket: "dummy.appspot.com",
        messagingSenderId: "123456789",
        appId: "1:123456789:web:dummy",
      };
    }
  } catch (e) {
    console.error("Error parsing FIREBASE_CONFIG:", e);
    // Fallback to dummy config
    firebaseConfig = {
      apiKey: "dummy-api-key-for-build",
      authDomain: "dummy.firebaseapp.com",
      projectId: "dummy-project-id",
      storageBucket: "dummy.appspot.com",
      messagingSenderId: "123456789",
      appId: "1:123456789:web:dummy",
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

// Auth helper - only works on client-side
let authInstance: Auth | undefined;
if (typeof window !== "undefined") {
  authInstance = getAuth(app);
}

// Export with type assertions for compatibility
export { app, db, storage };
export const auth = authInstance as Auth;

export default app;