// src/infrastructure/firebase/client.ts
import { initializeApp, getApps } from "firebase/app";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyC6MdDwOlP5sDfkIDzIqWhKYfSW6uCCs4s",
  authDomain: "propia-ab2e4.firebaseapp.com",
  projectId: "propia-ab2e4",
  storageBucket: "propia-ab2e4.firebasestorage.app",
  messagingSenderId: "771949809974",
  appId: "1:771949809974:web:5f11ba447fa30983f72397",
  measurementId: "G-6KXB4TYWHH"
};

const app = getApps().length ? getApps()[0] : initializeApp(firebaseConfig);

export const auth = getAuth(app);
export { app };