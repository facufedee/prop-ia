import * as admin from 'firebase-admin';

if (!admin.apps.length) {
    try {
        const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT_KEY
            ? JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY)
            : {};

        // Check if we have credentials (production/local with env)
        if (Object.keys(serviceAccount).length > 0) {
            admin.initializeApp({
                credential: admin.credential.cert(serviceAccount)
            });
        } else {
            // Fallback for environments where Google Auth Default Credentials might work
            // or just to prevent crashing, though db calls will fail without auth.
            console.warn("FIREBASE_SERVICE_ACCOUNT_KEY not set. Admin SDK initialized without explicit cert.");
            admin.initializeApp();
        }
    } catch (error) {
        console.error('Firebase admin initialization error', error);
    }
}

export const adminAuth = admin.auth();
export const adminDb = admin.firestore();
