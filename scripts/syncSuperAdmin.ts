import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';

// Load .env.local manually
const envPath = path.join(process.cwd(), '.env.local');
console.log("Looking for env at:", envPath);

if (fs.existsSync(envPath)) {
    console.log("Found .env.local");
    const envConfig = dotenv.parse(fs.readFileSync(envPath));
    for (const k in envConfig) {
        process.env[k] = envConfig[k];
    }
    // Check key presence (safe log)
    if (process.env.FIREBASE_SERVICE_ACCOUNT_KEY) {
        console.log("FIREBASE_SERVICE_ACCOUNT_KEY loaded (length: " + process.env.FIREBASE_SERVICE_ACCOUNT_KEY.length + ")");
    } else {
        console.error("FIREBASE_SERVICE_ACCOUNT_KEY not found in .env.local");
    }
} else {
    console.error(".env.local not found at " + envPath);
}

// import { adminDb } from "../src/infrastructure/firebase/admin"; 
async function syncSuperAdmin() {
    // Dynamic import to ensure ENV vars are loaded first
    const { adminDb } = await import("../src/infrastructure/firebase/admin");

    console.log("Starting Super Admin Permission Sync...");

    const ALL_PERMISSIONS_IDS = [
        "/dashboard",
        "/dashboard/tasacion",
        "/dashboard/propiedades",
        "/dashboard/alquileres",
        "/dashboard/agentes",
        "/dashboard/leads",
        "/dashboard/clientes",
        "/dashboard/chat",
        "/dashboard/publicaciones",
        "/dashboard/finanzas",
        "/dashboard/calendario",
        "/dashboard/soporte",
        "/dashboard/soporte/ticketera",
        "/dashboard/bitacora",
        "/dashboard/gestion-plataforma",
        "/dashboard/cuenta",
        "/dashboard/configuracion",
        "/dashboard/configuracion/roles",
        "/dashboard/configuracion/backup",
        "/dashboard/configuracion/suscripciones",
        "/dashboard/sucursales",
        "/dashboard/blog",
        "/dashboard/novedades",
        "/dashboard/emprendimientos"
    ];

    try {
        const rolesRef = adminDb.collection("roles");
        const snapshot = await rolesRef.where("name", "==", "Super Admin").get();

        if (snapshot.empty) {
            console.error("Super Admin role not found!");
            return;
        }

        const superAdminDoc = snapshot.docs[0];
        console.log(`Found Super Admin role (ID: ${superAdminDoc.id})`);

        await superAdminDoc.ref.update({
            permissions: ALL_PERMISSIONS_IDS
        });

        console.log("Successfully updated Super Admin permissions to include ALL system permissions.");
    } catch (error) {
        console.error("Error syncing roles:", error);
    }
}

// Check if run directly
syncSuperAdmin().then(() => process.exit(0)).catch(e => {
    console.error(e);
    process.exit(1);
});
