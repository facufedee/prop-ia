import * as admin from 'firebase-admin';
import { getFirestore } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';

if (!admin.apps.length) {
    try {
        const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT_KEY
            ? JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY)
            : {};

        // Check if we have credentials (production/local with env)
        if (Object.keys(serviceAccount).length > 0) {
            admin.initializeApp({
                credential: admin.credential.cert(serviceAccount),
                projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || serviceAccount.project_id
            });
        } else {
            // Cloud Run uses Application Default Credentials automatically
            admin.initializeApp({
                projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 'prop-ia'
            });
        }
    } catch (error) {
        console.error('Firebase admin initialization error', error);
    }
}

// Use the named database 'propia' instead of the default database
export const adminAuth = getAuth();
export const adminDb = getFirestore('propia');
