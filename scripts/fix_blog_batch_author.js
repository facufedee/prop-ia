// One-off: renames the author on the 7 blog posts published in
// scripts/publish_blog_batch_sept2026.js from "Equipo Zeta Prop" to
// "Facundo Zeta" (matching the byline already used on every other post on
// the blog), per the user's request right after publishing.
const admin = require("firebase-admin");

if (!admin.apps.length) {
    const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT_KEY
        ? JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY)
        : {};
    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
        projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || serviceAccount.project_id,
    });
}

const db = admin.firestore();
db.settings({ databaseId: "propia" });

const IDS = [
    "izJEZaMf7OBcdawo8QfI",
    "COdJteaSByZovq7dXJXM",
    "XJSj3g8RvvRYG4DwiG7U",
    "MmNJ5jM5bbrcEMeh0YeR",
    "fvfHWKgI88oPU82zIKsv",
    "GijxyKgvi0FAUBseWsRT",
    "WX66pJQiO3FpZ5lYnL7D",
];

async function main() {
    for (const id of IDS) {
        await db.collection("blog_posts").doc(id).update({ author: { name: "Facundo Zeta" } });
        console.log(`✓ actualizado ${id}`);
    }
    process.exit(0);
}

main().catch((err) => {
    console.error(err);
    process.exit(1);
});
