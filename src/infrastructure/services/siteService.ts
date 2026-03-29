import { db } from "@/infrastructure/firebase/client";
import {
    collection,
    doc,
    getDoc,
    getDocs,
    addDoc,
    updateDoc,
    query,
    where,
    serverTimestamp,
    Timestamp,
} from "firebase/firestore";
import { Site, SiteTemplate } from "@/domain/models/Site";

const COLLECTION = "sites";

function fromFirestore(id: string, data: Record<string, any>): Site {
    return {
        id,
        userId: data.userId ?? "",
        slug: data.slug ?? "",
        template: (data.template ?? "moderno") as SiteTemplate,
        nombre: data.nombre ?? "",
        descripcion: data.descripcion ?? "",
        logoUrl: data.logoUrl ?? "",
        coverUrl: data.coverUrl,
        colorPrimario: data.colorPrimario ?? "#4f46e5",
        colorSecundario: data.colorSecundario ?? "#7c3aed",
        whatsapp: data.whatsapp,
        email: data.email,
        instagram: data.instagram,
        facebook: data.facebook,
        direccion: data.direccion,
        published: data.published ?? false,
        customDomain: data.customDomain,
        customDomainVerified: data.customDomainVerified,
        createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toDate() : new Date(),
        updatedAt: data.updatedAt instanceof Timestamp ? data.updatedAt.toDate() : new Date(),
    };
}

export const siteService = {
    // Get the site owned by a user (1 per user for now)
    getSiteByUserId: async (userId: string): Promise<Site | null> => {
        if (!db) return null;
        try {
            const q = query(collection(db, COLLECTION), where("userId", "==", userId));
            const snap = await getDocs(q);
            if (snap.empty) return null;
            const d = snap.docs[0];
            return fromFirestore(d.id, d.data());
        } catch (err) {
            console.error("siteService.getSiteByUserId:", err);
            return null;
        }
    },

    // Get site by slug (for public rendering)
    getSiteBySlug: async (slug: string): Promise<Site | null> => {
        if (!db) return null;
        try {
            const q = query(collection(db, COLLECTION), where("slug", "==", slug));
            const snap = await getDocs(q);
            if (snap.empty) return null;
            const d = snap.docs[0];
            return fromFirestore(d.id, d.data());
        } catch (err) {
            console.error("siteService.getSiteBySlug:", err);
            return null;
        }
    },

    // Check if a slug is already taken
    isSlugAvailable: async (slug: string, excludeId?: string): Promise<boolean> => {
        if (!db) return false;
        try {
            const q = query(collection(db, COLLECTION), where("slug", "==", slug));
            const snap = await getDocs(q);
            if (snap.empty) return true;
            // If the only match is the current site, it's still "available"
            if (excludeId && snap.docs.length === 1 && snap.docs[0].id === excludeId) return true;
            return false;
        } catch {
            return false;
        }
    },

    // Create a new site
    createSite: async (data: Omit<Site, "id" | "createdAt" | "updatedAt">): Promise<string> => {
        if (!db) throw new Error("No database connection");
        const ref = await addDoc(collection(db, COLLECTION), {
            ...data,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
        });
        return ref.id;
    },

    // Update an existing site
    updateSite: async (id: string, data: Partial<Omit<Site, "id" | "createdAt">>): Promise<void> => {
        if (!db) throw new Error("No database connection");
        await updateDoc(doc(db, COLLECTION, id), {
            ...data,
            updatedAt: serverTimestamp(),
        });
    },

    // Toggle published state
    publishSite: async (id: string, published: boolean): Promise<void> => {
        if (!db) throw new Error("No database connection");
        await updateDoc(doc(db, COLLECTION, id), {
            published,
            updatedAt: serverTimestamp(),
        });
    },

    // Normalize a slug (same logic as publicService)
    slugify: (text: string): string =>
        text
            .toString()
            .toLowerCase()
            .trim()
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "")
            .replace(/\s+/g, "-")
            .replace(/[^\w-]+/g, "")
            .replace(/--+/g, "-"),
};
