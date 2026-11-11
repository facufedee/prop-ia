import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';

// Backfills users/{uid}.accessUntil (read by Firestore rules) with the latest
// subscriptions.endDate of each user.
//
// Usage:
//   npx tsx scripts/backfillAccessUntil.ts          # dry run, prints what would change
//   npx tsx scripts/backfillAccessUntil.ts --apply  # writes the changes

const APPLY = process.argv.includes('--apply');

// Load .env.local manually
const envPath = path.join(process.cwd(), '.env.local');
if (fs.existsSync(envPath)) {
    const envConfig = dotenv.parse(fs.readFileSync(envPath));
    for (const k in envConfig) {
        process.env[k] = envConfig[k];
    }
} else {
    console.error(".env.local not found at " + envPath);
}

function toDate(value: unknown): Date | null {
    if (!value) return null;
    if (typeof (value as { toDate?: unknown }).toDate === 'function') {
        return (value as { toDate: () => Date }).toDate();
    }
    const d = new Date(value as string | number | Date);
    return isNaN(d.getTime()) ? null : d;
}

async function backfillAccessUntil() {
    // Dynamic import to ensure ENV vars are loaded first
    const { adminDb } = await import("../src/infrastructure/firebase/admin");
    const { Timestamp } = await import("firebase-admin/firestore");

    console.log(`Backfilling users.accessUntil (${APPLY ? 'APPLY' : 'DRY RUN'})...`);

    // userId -> max endDate across that user's subscriptions
    const latest = new Map<string, Date>();
    const subsSnap = await adminDb.collection("subscriptions").get();
    let skippedSubs = 0;
    subsSnap.docs.forEach((d) => {
        const data = d.data();
        const endDate = toDate(data.endDate);
        if (!data.userId || !endDate) {
            skippedSubs++;
            return;
        }
        const current = latest.get(data.userId);
        if (!current || endDate > current) latest.set(data.userId, endDate);
    });

    let changed = 0;
    let unchanged = 0;
    let missingUsers = 0;

    for (const [userId, endDate] of latest) {
        const userRef = adminDb.collection("users").doc(userId);
        const userSnap = await userRef.get();
        if (!userSnap.exists) {
            missingUsers++;
            console.warn(`  missing user doc: ${userId}`);
            continue;
        }
        const existing = toDate(userSnap.data()?.accessUntil);
        if (existing && existing.getTime() === endDate.getTime()) {
            unchanged++;
            continue;
        }
        changed++;
        console.log(`  ${userId}: ${existing?.toISOString() ?? '(none)'} -> ${endDate.toISOString()}`);
        if (APPLY) {
            await userRef.update({ accessUntil: Timestamp.fromDate(endDate) });
        }
    }

    console.log(
        `Subscriptions: ${subsSnap.size} (skipped without userId/endDate: ${skippedSubs}). ` +
        `Users: ${latest.size}, ${APPLY ? 'updated' : 'to update'}: ${changed}, unchanged: ${unchanged}, missing doc: ${missingUsers}.`
    );
    if (!APPLY) console.log("Dry run only. Re-run with --apply to write.");
}

backfillAccessUntil().then(() => process.exit(0)).catch(e => {
    console.error(e);
    process.exit(1);
});
