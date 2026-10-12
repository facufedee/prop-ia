// One-off script: removes plan feature claims the product does not deliver from
// the Firestore `plans` collection (database "propia"). /precios and the home
// pricing section render `features`; the AI assistant tools read `featuresList`.
//
// The cleaned lists live in src/infrastructure/data/plans.ts (the seed), which
// this script imports, so the seed and Firestore stay identical.
//
// Only `features`, `featuresList` and `updatedAt` are written, with update(), on
// the existing docs basic / professional / enterprise. Prices, limits, tier,
// name and description are never touched; missing docs are skipped, not created.
// Re-running after --apply reports every plan as unchanged.
//
// Dry run (default, read-only — prints removed/added lines per plan):
//   node --env-file=.env.local scripts/clean_plan_claims.ts
// Write the changes:
//   node --env-file=.env.local scripts/clean_plan_claims.ts --apply
//
// Credentials: FIREBASE_SERVICE_ACCOUNT_KEY (service account JSON) in .env.local,
// or Application Default Credentials (gcloud auth application-default login),
// in which case prefix GOOGLE_CLOUD_QUOTA_PROJECT=prop-ia. Requires Node >= 22.18
// (built-in TypeScript type stripping).

import { cert, getApps, initializeApp } from "firebase-admin/app";
import { FieldValue, getFirestore } from "firebase-admin/firestore";

type PlansModule = typeof import("../src/infrastructure/data/plans");

const PLAN_IDS = ["basic", "professional", "enterprise"] as const;
const DISPLAY_FIELDS = ["features", "featuresList"] as const;
type DisplayField = (typeof DISPLAY_FIELDS)[number];

function initDb() {
    if (!getApps().length) {
        const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT_KEY
            ? JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY)
            : null;
        initializeApp({
            ...(serviceAccount ? { credential: cert(serviceAccount) } : {}),
            projectId:
                process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || serviceAccount?.project_id || "prop-ia",
        });
    }
    return getFirestore("propia");
}

function asStringList(value: unknown): string[] {
    return Array.isArray(value) ? value.filter((v): v is string => typeof v === "string") : [];
}

function sameList(a: string[], b: string[]): boolean {
    return a.length === b.length && a.every((item, i) => item === b[i]);
}

function printDiff(field: DisplayField, current: string[], next: string[]) {
    const removed = current.filter((item) => !next.includes(item));
    const added = next.filter((item) => !current.includes(item));
    console.log(`  ${field}:`);
    removed.forEach((item) => console.log(`    - ${item}`));
    added.forEach((item) => console.log(`    + ${item}`));
    if (!removed.length && !added.length) console.log("    (same items, order changed)");
}

async function main() {
    const apply = process.argv.includes("--apply");
    // Dynamic import with an explicit .ts URL: Node's type stripping needs the
    // extension, while tsc (no allowImportingTsExtensions) rejects it statically.
    const { PLANS } = (await import(
        new URL("../src/infrastructure/data/plans.ts", import.meta.url).href
    )) as PlansModule;
    const db = initDb();
    let pending = 0;

    for (const id of PLAN_IDS) {
        const plan = PLANS.find((p) => p.id === id);
        if (!plan) {
            console.warn(`[${id}] not in plans.ts seed — skipped`);
            continue;
        }
        const ref = db.collection("plans").doc(id);
        const snap = await ref.get();
        if (!snap.exists) {
            console.warn(`[${id}] Firestore doc missing — skipped (not created)`);
            continue;
        }

        const target: Record<DisplayField, string[]> = {
            features: plan.features,
            featuresList: plan.featuresList,
        };
        const changes: Partial<Record<DisplayField, string[]>> = {};
        for (const field of DISPLAY_FIELDS) {
            const current = asStringList(snap.get(field));
            if (!sameList(current, target[field])) changes[field] = target[field];
        }

        const changed = Object.keys(changes) as DisplayField[];
        if (!changed.length) {
            console.log(`[${id}] unchanged`);
            continue;
        }

        pending++;
        console.log(`[${id}]`);
        changed.forEach((field) => printDiff(field, asStringList(snap.get(field)), target[field]));

        if (apply) {
            await ref.update({ ...changes, updatedAt: FieldValue.serverTimestamp() });
            console.log(`  -> written`);
        }
    }

    if (!apply && pending) console.log(`\nDry run: ${pending} plan(s) would change. Pass --apply to write.`);
    if (apply) console.log(`\nDone: ${pending} plan(s) updated.`);
}

main().catch((error) => {
    console.error(error);
    process.exit(1);
});
