// Server-only — do NOT import from client components
import "server-only";
import { cache } from "react";
import { adminDb } from "@/infrastructure/firebase/admin";
import { SiteTemplate, NavItem } from "@/domain/models/Site";
import { SitePayload } from "./siteTypes";

export type { SitePayload };
export { payloadToSite } from "./siteTypes";

// ── Server property type (plain, no class instances) ─────────────────────────
export interface ServerProperty {
    id: string;
    title?: string;
    description?: string;
    price?: number;
    currency?: string;
    operation_type?: string;
    imageUrls?: string[];
    localidad?: string;
    provincia?: string;
    area_covered?: number;
    rooms?: number;
    bathrooms?: number;
    userId?: string;
    hidePrice?: boolean;
    status?: string;
    type?: string;
    calle?: string;
    altura?: string;
    code?: string;
    lat?: number;
    lng?: number;
    expenses?: number;
    video_url?: string;
    [key: string]: unknown;
}

function toSitePayload(id: string, data: Record<string, unknown>): SitePayload {
    return {
        id,
        userId:               (data.userId as string)          ?? "",
        slug:                 (data.slug as string)            ?? "",
        template:             ((data.template as string)       ?? "moderno") as SiteTemplate,
        nombre:               (data.nombre as string)          ?? "",
        descripcion:          (data.descripcion as string)     ?? "",
        logoUrl:              (data.logoUrl as string)         ?? "",
        coverUrl:             data.coverUrl as string | undefined,
        colorPrimario:        (data.colorPrimario as string)   ?? "#4f46e5",
        colorSecundario:      (data.colorSecundario as string) ?? "#7c3aed",
        whatsapp:             data.whatsapp   as string | undefined,
        email:                data.email      as string | undefined,
        instagram:            data.instagram  as string | undefined,
        facebook:             data.facebook   as string | undefined,
        direccion:            data.direccion  as string | undefined,
        navItems:             Array.isArray(data.navItems) ? (data.navItems as NavItem[]) : undefined,
        published:            (data.published as boolean)      ?? false,
        customDomain:         data.customDomain as string | undefined,
        customDomainVerified: data.customDomainVerified as boolean | undefined,
        createdAt: (data.createdAt as any)?.toDate?.()?.toISOString?.() ?? new Date().toISOString(),
        updatedAt: (data.updatedAt as any)?.toDate?.()?.toISOString?.() ?? new Date().toISOString(),
    };
}

// ── Cached fetches — deduplicated per React render tree ───────────────────────
// layout.tsx + page.tsx both call getSitePayload(slug) → only ONE Firestore query.

export const getSitePayload = cache(async (slug: string): Promise<SitePayload | null> => {
    try {
        const snap = await adminDb
            .collection("sites")
            .where("slug", "==", slug)
            .limit(1)
            .get();
        if (snap.empty) return null;
        return toSitePayload(snap.docs[0].id, snap.docs[0].data() as Record<string, unknown>);
    } catch (err) {
        console.error("getSitePayload:", err);
        return null;
    }
});

export const getActiveProperties = cache(async (userId: string): Promise<ServerProperty[]> => {
    try {
        const snap = await adminDb
            .collection("properties")
            .where("userId", "==", userId)
            .get();
        return snap.docs
            .map(d => ({ id: d.id, ...d.data() } as ServerProperty))
            .filter(p => p.status === "active");
    } catch (err) {
        console.error("getActiveProperties:", err);
        return [];
    }
});
