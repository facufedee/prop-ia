// Client-safe types and helpers — no server-only imports
import { Site } from "@/domain/models/Site";

// Serializable Site for the Server→Client RSC boundary (dates as ISO strings)
export type SitePayload = Omit<Site, "createdAt" | "updatedAt"> & {
    createdAt: string;
    updatedAt: string;
};

// Convert SitePayload back to Site (reconstructs Date objects)
export function payloadToSite(p: SitePayload): Site {
    return {
        ...p,
        createdAt: new Date(p.createdAt),
        updatedAt: new Date(p.updatedAt),
    };
}
