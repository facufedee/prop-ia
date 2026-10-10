// One-off script: marks every existing blog post as already sent in a newsletter
// (newsletterSentAt) so the first newsletter only includes the posts listed in
// KEEP_PENDING. Dry run by default; pass --apply to write. Run with:
//   GOOGLE_CLOUD_QUOTA_PROJECT=prop-ia node --env-file=.env.local scripts/backfill_newsletter_sent.js [--apply]

const admin = require("firebase-admin");

if (!admin.apps.length) {
    const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT_KEY
        ? JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY)
        : null;
    admin.initializeApp({
        ...(serviceAccount ? { credential: admin.credential.cert(serviceAccount) } : {}),
        projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || serviceAccount?.project_id || "prop-ia",
    });
}

const db = admin.firestore();
db.settings({ databaseId: "propia" });

const KEEP_PENDING = new Set([
    "como-calcular-rentabilidad-real-departamento-alquiler",
    "comprar-departamento-en-pozo-ventajas-riesgos",
]);

async function main() {
    const apply = process.argv.includes("--apply");
    const snapshot = await db.collection("blog_posts").get();

    const toMark = snapshot.docs.filter(
        (doc) => !KEEP_PENDING.has(doc.get("slug")) && !doc.get("newsletterSentAt")
    );
    const kept = snapshot.docs.filter((doc) => KEEP_PENDING.has(doc.get("slug")));

    console.log(`Total posts: ${snapshot.size}`);
    console.log(`Kept pending: ${kept.map((d) => d.get("slug")).join(", ") || "(none found!)"}`);
    console.log(`To mark as sent: ${toMark.length}`);

    if (!apply) {
        console.log("Dry run — pass --apply to write.");
        process.exit(0);
    }

    const now = admin.firestore.Timestamp.now();
    for (let i = 0; i < toMark.length; i += 400) {
        const batch = db.batch();
        toMark.slice(i, i + 400).forEach((doc) =>
            batch.update(doc.ref, { newsletterSentAt: now, newsletterBackfilled: true })
        );
        await batch.commit();
    }
    console.log(`✓ Marked ${toMark.length} posts.`);
    process.exit(0);
}

main().catch((err) => {
    console.error("Backfill failed:", err);
    process.exit(1);
});
