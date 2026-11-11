// Removes admin-only dashboard permissions (/dashboard/marketing,
// /dashboard/blog) from every non-admin role in Firestore. Admin roles
// ("Super Admin", "Administrador") are never touched. Idempotent: roles that
// already lack the permissions are skipped, so re-running it is a no-op.
//
// Dry run by default; pass --apply to write. Run with:
//   GOOGLE_CLOUD_QUOTA_PROJECT=prop-ia node --env-file=.env.local scripts/strip_admin_only_permissions.mjs [--apply]
//
// The same cleanup also runs from the dashboard: Roles y Permisos -> sync
// default roles (roleService.syncDefaultRoles).

import admin from "firebase-admin";
import { planAdminOnlyPermissionStrips } from "../src/lib/roles/adminOnlyPermissions.ts";

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
db.settings({ databaseId: process.env.FIRESTORE_DATABASE || "propia" });

async function main() {
    const apply = process.argv.includes("--apply");
    const snapshot = await db.collection("roles").get();
    const roles = snapshot.docs.map((doc) => ({
        id: doc.id,
        name: doc.get("name"),
        permissions: doc.get("permissions") ?? [],
    }));

    const strips = planAdminOnlyPermissionStrips(roles);
    console.log(`Roles scanned: ${roles.length}`);
    console.log(`Roles to update: ${strips.length}`);
    for (const strip of strips) {
        console.log(`  - ${strip.name} (${strip.id}): remove ${strip.removed.join(", ")}`);
    }

    if (!apply) {
        console.log("Dry run — pass --apply to write.");
        return;
    }

    for (const strip of strips) {
        await db.collection("roles").doc(strip.id).update({ permissions: strip.permissions });
    }
    console.log(`Updated ${strips.length} role(s).`);
}

main().catch((error) => {
    console.error(error);
    process.exit(1);
});
