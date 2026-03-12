const admin = require('firebase-admin');

// Note: Replace with actual service account credentials if needed,
// but typically locally running this with ADC (Application Default Credentials)
// or checking if existing firebase-admin config exists in the project.
// We will try importing the project's config if it exists.

async function run() {
    try {
        const { adminDb } = require('./src/infrastructure/firebase/admin');
        const db = adminDb;

        const snapshot = await db.collection('notifications')
            .where('link', '==', '/dashboard/admin/usuarios')
            .get();

        if (snapshot.empty) {
            console.log("No broken links found!");
            process.exit(0);
        }

        console.log(`Found ${snapshot.size} broken links. Fixing...`);

        const batch = db.batch();
        snapshot.docs.forEach((doc: any) => {
            batch.update(doc.ref, { link: '/dashboard/gestion-plataforma' });
        });

        await batch.commit();
        console.log("Success! Fixed notifications.");
        process.exit(0);
    } catch(err) {
        console.error("Migration failed:", err);
        process.exit(1);
    }
}

run();
