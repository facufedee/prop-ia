// src/infrastructure/firebase/client.ts
import { initializeApp, getApps } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

let firebaseConfig: any = {};

// -------------------------------
// HARDCODED CONFIGURATION (DEBUGGING)
// -------------------------------
firebaseConfig = {
  apiKey: "AIzaSyAILIUiGZhz0Ic4dKFFlcQrCg3OdrWCnwQ",
  authDomain: "prop-ia.firebaseapp.com",
  projectId: "prop-ia",
  storageBucket: "prop-ia.firebasestorage.app",
  messagingSenderId: "815439555210",
  appId: "1:815439555210:web:2449fdcf832d756613db73",
  databaseURL: "https://prop-ia-default-rtdb.firebaseio.com",
  measurementId: "G-W7RMLDXWYQ",
};

/*
// -------------------------------
// SERVER-SIDE
// -------------------------------
if (typeof window === "undefined") {
  // 1) Firebase Hosting / Cloud Run env (JSON string)
  const configStr =
    process.env.FIREBASE_CONFIG || process.env.FIREBASE_WEBAPP_CONFIG;

  if (configStr) {
    try {
      firebaseConfig = JSON.parse(configStr);
    } catch (err) {
      console.error("Error parsing FIREBASE_CONFIG:", err);
    }
  }

  // 2) Local dev / Vercel / SSR fallback
  if (!firebaseConfig?.projectId) {
    firebaseConfig = {
      apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
      authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
      projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
      storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
      messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
      appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
      databaseURL: process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL,
      measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
    };
  }
}

// -------------------------------
// CLIENT-SIDE
// -------------------------------
else {
  firebaseConfig = {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY!,
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN!,
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID!,
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET!,
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID!,
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID!,
    databaseURL: process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL!,
    measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID!,
  };
}
*/

console.log("🔥 Firebase Config (Client):", {
  projectId: firebaseConfig.projectId,
  authDomain: firebaseConfig.authDomain,
  apiKeyPresent: !!firebaseConfig.apiKey,
  dbUrl: firebaseConfig.databaseURL
});

// -------------------------------
// INITIALIZATION (safe on SSR)
// -------------------------------
const app = !getApps().length ? initializeApp(firebaseConfig) : getApps()[0];

// Firestore + Storage (ambos valen en server y client)
// Usamos initializeFirestore para forzar long polling si hay problemas de websockets
// import { getFirestore } from "firebase/firestore"; // Already imported at top
const db = getFirestore(app);
const storage = getStorage(app);

// Auth SOLO en cliente, jamás en SSR
const auth =
  typeof window !== "undefined" ? getAuth(app) : (undefined as any);

export { app, auth, db, storage };
export default app;
