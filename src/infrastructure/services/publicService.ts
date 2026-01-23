import { db } from "@/infrastructure/firebase/client";
import { collection, query, where, getDocs, doc, getDoc, limit, orderBy } from "firebase/firestore";

export interface PublicProperty {
    id: string;
    title: string;
    description: string;
    price: number;
    currency: string;
    operation_type: string;
    imageUrls: string[];
    localidad: string;
    provincia: string;
    area_covered: number;
    rooms: number;
    bathrooms: number;
    userId: string;
    agency?: PublicAgency;
    lat?: number;
    lng?: number;
    expenses?: number;
    video_url?: string;
    hidePrice?: boolean;
    status?: 'active' | 'inactive' | 'reserved' | 'sold';
    code?: string;
    type?: string;
    address?: string;
}

export interface PublicAgency {
    uid: string;
    displayName: string;
    photoURL?: string;
    email?: string;
    phoneNumber?: string;
    slug?: string; // Derived or stored
}

const PROPERTIES_COLLECTION = "properties";
const USERS_COLLECTION = "users";

import { globalCache } from "@/infrastructure/cache/globalCache";

export const publicService = {
    // Get all public properties (limit to recent 20 for now)
    getAllProperties: async (): Promise<PublicProperty[]> => {
        const CACHE_KEY = "properties_all";

        // 1. Try Cache
        const cached = await globalCache.get<PublicProperty[]>(CACHE_KEY);
        if (cached) return cached;

        if (!db) return [];
        try {
            // In a real app, strict rules should apply (e.g., status == 'published')
            const q = query(collection(db, PROPERTIES_COLLECTION), where("publishToPortal", "==", true), limit(20)); // Removed orderBy for now to avoid index requirements
            const snapshot = await getDocs(q);

            const properties = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            } as PublicProperty));

            // Populate agency data
            const propertiesWithAgency = await Promise.all(properties.map(async (p) => {
                const agency = await publicService.getAgencyById(p.userId);
                return { ...p, agency };
            }));

            // 2. Set Cache (5 minutes TTL)
            await globalCache.set(CACHE_KEY, propertiesWithAgency, 300);

            return propertiesWithAgency;
        } catch (error) {
            console.error("Error fetching all properties:", error);
            return [];
        }
    },

    // Get properties by Agency Slug (Name)
    getPropertiesByAgencySlug: async (slug: string): Promise<{ agency: PublicAgency, properties: PublicProperty[] } | null> => {
        const agency = await publicService.getAgencyBySlug(slug);
        if (!agency) return null;

        if (!db) return null;

        try {
            const q = query(
                collection(db, PROPERTIES_COLLECTION),
                where("userId", "==", agency.uid)
            );
            const snapshot = await getDocs(q);
            const properties = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data(),
                agency
            } as PublicProperty));

            return { agency, properties };
        } catch (error) {
            console.error("Error fetching agency properties:", error);
            return null;
        }
    },

    // Get Property Detail
    getPropertyById: async (id: string): Promise<PublicProperty | null> => {
        if (!db) return null;
        try {
            const docRef = doc(db, PROPERTIES_COLLECTION, id);
            const snap = await getDoc(docRef);

            if (!snap.exists()) return null;

            const data = snap.data() as Omit<PublicProperty, "id">;
            const agency = await publicService.getAgencyById(data.userId);

            return {
                id: snap.id,
                ...data,
                agency
            };
        } catch (error) {
            console.error("Error fetching property:", error);
            return null;
        }
    },

    // Helper: Get Agency by ID
    getAgencyById: async (uid: string): Promise<PublicAgency | undefined> => {
        if (!uid || !db) return undefined;
        try {
            // Try cache or dataloader pattern in production
            const userDoc = await getDoc(doc(db, USERS_COLLECTION, uid));
            if (userDoc.exists()) {
                const data = userDoc.data();
                return {
                    uid: userDoc.id,
                    displayName: data.displayName || "Inmobiliaria",
                    photoURL: data.photoURL,
                    email: data.email,
                    phoneNumber: data.phoneNumber,
                    slug: publicService.slugify(data.displayName || "agency")
                };
            }
        } catch (error) {
            console.error("Error fetching agency:", error);
        }
        return undefined;
    },

    // Helper: Get Agency by Slug (Search by Name approximation)
    getAgencyBySlug: async (slug: string): Promise<PublicAgency | null> => {
        if (!db) return null;
        // This is inefficient (Client side filtering or requires index).
        // Best approach: Add 'slug' field to User.
        // Fallback: Query all users and match. MVP ONLY.
        try {
            const q = query(collection(db, USERS_COLLECTION));
            const snapshot = await getDocs(q);

            const match = snapshot.docs.find(doc => {
                const data = doc.data();
                const userName = data.displayName || "";
                return publicService.slugify(userName) === slug || doc.id === slug;
            });

            if (match) {
                const data = match.data();
                return {
                    uid: match.id,
                    displayName: data.displayName || "Inmobiliaria",
                    photoURL: data.photoURL,
                    email: data.email,
                    slug: publicService.slugify(data.displayName || "agency")
                };
            }
        } catch (error) {
            console.error("Error searching agency by slug:", error);
        }
        return null;
    },

    slugify: (text: string) => {
        return text
            .toString()
            .toLowerCase()
            .trim()
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "")
            .replace(/\s+/g, '-')
            .replace(/[^\w\-]+/g, '')
            .replace(/\-\-+/g, '-');
    }
};
