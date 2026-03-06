const { initializeApp } = require('firebase/app');
const { getFirestore, doc, getDoc } = require('firebase/firestore');
require('dotenv').config({ path: '.env.local' });

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function test() {
  // Using Facundo's ID from URL
  const uid = "75LcxA6U3TPQ0xGYirARkzrq8uy1"; 
  const userSnap = await getDoc(doc(db, "users", uid));
  if (userSnap.exists()) {
    console.log("User data:", userSnap.data());
    const createdAt = userSnap.data().createdAt;
    console.log("createdAt:", createdAt);
    if (createdAt && createdAt.toDate) {
      console.log("createdAt date:", createdAt.toDate());
    }
  }
}
test().catch(console.error);
