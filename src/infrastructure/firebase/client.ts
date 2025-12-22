import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth, connectAuthEmulator } from "firebase/auth";
import { getFirestore, initializeFirestore, connectFirestoreEmulator, memoryLocalCache } from "firebase/firestore";
import { getStorage } from "firebase/storage";

// Firebase configuration
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  databaseURL: process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
};

console.log('🔥 Initializing Firebase with project:', firebaseConfig.projectId);

// Initialize Firebase
const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);

// Initialize Firestore with specific settings to fix "Client Offline" issues
const db = initializeFirestore(app, {
  localCache: memoryLocalCache(),
  experimentalForceLongPolling: true, // Force usage of long-polling instead of WebSockets
}, "propia");

// Connect to Emulators in Development
if (process.env.NODE_ENV === 'development' && typeof window !== 'undefined' && process.env.NEXT_PUBLIC_USE_EMULATORS === 'true') {
  // Connect to Firestore Emulator
  try {
    // Note: 127.0.0.1 is often more reliable than localhost on Windows
    connectFirestoreEmulator(db, '127.0.0.1', 8080);
    console.log('🔥 [EMULATOR] Connected to Firestore on 127.0.0.1:8080');
  } catch (error: any) {
    if (error.code !== 'failed-precondition') {
      console.warn('⚠️ [EMULATOR] Failed to connect to Firestore:', error);
    }
  }

  // Optional: Connect Auth Emulator if needed (usually better to use real auth for simplicity unless full offline)
  // const auth = getAuth(app);
  // connectAuthEmulator(auth, "http://127.0.0.1:9099");
} else if (process.env.NODE_ENV === 'development') {
  console.log('ℹ️ [FIREBASE] Using production Firestore (Emulator disabled). Set NEXT_PUBLIC_USE_EMULATORS=true to enable.');
}

console.log('✅ Firebase initialized successfully');

const storage = getStorage(app);
const auth = typeof window !== "undefined" ? getAuth(app) : undefined;

export { app, auth, db, storage };