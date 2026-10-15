import "server-only";
import type { DocumentData } from "firebase-admin/firestore";
import { adminDb } from "@/infrastructure/firebase/admin";
import { publicService, PublicAgency, PublicProperty } from "@/infrastructure/services/publicService";

/**
 * Server-side (Admin SDK) agency lookup for /propiedades/[slug]. Agency links use
 * the slugified displayName (publicService.getAgencyById → slug), and resolving a
 * slug needs a scan of `users` that Firestore rules deny to visitors. Only the
 * public agency fields and public (active or portal-published) properties are returned.
 */

const toAgency = (uid: string, data: DocumentData): PublicAgency => ({
    uid,
    displayName: data.displayName || "Inmobiliaria",
    agencyName: data.agencyName,
    photoURL: data.photoURL,
    logoUrl: data.logoUrl,
    email: data.email,
    phoneNumber: data.phoneNumber,
    slug: publicService.slugify(data.displayName || "agency"),
});

export const publicAgencyAdminService = {
    getAgencyBySlug: async (slug: string): Promise<PublicAgency | null> => {
        if (!slug || slug.length > 200) return null;

        // Fast path: legacy links use the owner uid as slug.
        if (!slug.includes("/")) {
            const byId = await adminDb.collection("users").doc(slug).get();
            if (byId.exists) return toAgency(byId.id, byId.data()!);
        }

        // Slow path: match the slugified displayName (only displayName is fetched).
        const snapshot = await adminDb.collection("users").select("displayName").get();
        const match = snapshot.docs.find((d) => publicService.slugify(d.data().displayName || "") === slug);
        if (!match) return null;
        const full = await adminDb.collection("users").doc(match.id).get();
        return full.exists ? toAgency(full.id, full.data()!) : null;
    },

    getPropertiesByAgencySlug: async (
        slug: string,
    ): Promise<{ agency: PublicAgency; properties: PublicProperty[] } | null> => {
        const agency = await publicAgencyAdminService.getAgencyBySlug(slug);
        if (!agency) return null;

        const [active, published] = await Promise.all([
            adminDb.collection("properties").where("userId", "==", agency.uid).where("status", "==", "active").get(),
            adminDb.collection("properties").where("userId", "==", agency.uid).where("publishToPortal", "==", true).get(),
        ]);
        const byId = new Map<string, PublicProperty>();
        for (const d of [...active.docs, ...published.docs]) {
            byId.set(d.id, { id: d.id, ...d.data(), agency } as PublicProperty);
        }
        const properties = [...byId.values()].sort((a, b) => (a.id < b.id ? -1 : a.id > b.id ? 1 : 0));
        return { agency, properties };
    },
};
