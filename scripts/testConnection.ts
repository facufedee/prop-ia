
import { initializeApp } from "firebase/app";
import { getFirestore, collection, getDocs } from "firebase/firestore";

const firebaseConfig = {
    apiKey: "AIzaSyAILIUiGZhz0Ic4dKFFlcQrCg3OdrWCnwQ",
    authDomain: "prop-ia.firebaseapp.com",
    projectId: "prop-ia",
    storageBucket: "prop-ia.firebasestorage.app",
    messagingSenderId: "815439555210",
    appId: "1:815439555210:web:2449fdcf832d756613db73",
};

async function testConnection() {
    console.log("Initializing Firebase...");
    const app = initializeApp(firebaseConfig);
    const db = getFirestore(app);

    console.log("Testing Firestore connection...");
    try {
        const rolesRef = collection(db, "roles");
        const snapshot = await getDocs(rolesRef);
        console.log("Connection successful!");
        console.log(`Found ${snapshot.size} roles.`);
        snapshot.forEach(doc => {
            console.log(doc.id, "=>", doc.data());
        });
    } catch (error) {
        console.error("Connection failed:", error);
    }
}

testConnection();
