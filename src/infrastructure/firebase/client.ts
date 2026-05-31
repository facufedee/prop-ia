import { initializeApp, getApps, getApp } from "firebase/app";
import { initializePerformance } from "firebase/performance";
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

// console.log('🔥 Initializing Firebase with project:', firebaseConfig.projectId);

// Initialize Firebase
const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);

// initializeFirestore throws if called more than once (e.g. hot-reload in dev).
// Fall back to getFirestore() which returns the already-initialized instance.
let db: ReturnType<typeof getFirestore>;
try {
  db = initializeFirestore(app, {
    localCache: memoryLocalCache(),
    experimentalForceLongPolling: true,
  }, "propia");
} catch {
  db = getFirestore(app, "propia");
}

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
  // console.log('ℹ️ [FIREBASE] Using production Firestore (Emulator disabled). Set NEXT_PUBLIC_USE_EMULATORS=true to enable.');
}

// console.log('✅ Firebase initialized successfully');

const storage = getStorage(app);
const auth = typeof window !== "undefined" ? getAuth(app) : undefined;

// Both flags must be false to stop Firebase Performance from auto-tracing DOM
// elements — Tailwind class names with dots/brackets (e.g. py-1.5, text-[2.75rem])
// are invalid attribute values and throw uncaught FirebaseErrors at runtime.
let perf: any = null;
if (typeof window !== "undefined") {
  perf = initializePerformance(app, {
    instrumentationEnabled: false,
    dataCollectionEnabled: false,
  });
}

export { app, auth, db, storage, perf };