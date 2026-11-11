import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/infrastructure/firebase/admin";
import { verifyAdmin } from "@/lib/apiAuth";
import { CAROUSEL_COLLECTION } from "@/lib/social/carouselDraft";
import { PUBLISH_ORDER, getTopic } from "@/lib/social/carouselTopics";

// Admin overview for /dashboard/admin/redes: every topic of the bank in
// publish order with its status and, when it exists, its draft.
// social_carousels is server-only (Firestore rules deny clients).

type DateLike = { toDate?: () => Date } | Date | string | null | undefined;

function toIso(value: DateLike): string | null {
    if (!value) return null;
    if (value instanceof Date) return value.toISOString();
    if (typeof value === "string") return value;
    return typeof value.toDate === "function" ? value.toDate().toISOString() : null;
}

export async function GET(request: NextRequest) {
    const authResult = await verifyAdmin(request);
    if (authResult.error) return authResult.error;

    try {
        const snap = await adminDb.collection(CAROUSEL_COLLECTION).get();
        const byId = new Map<string, FirebaseFirestore.DocumentData>(
            snap.docs.map((doc: { id: string; data: () => FirebaseFirestore.DocumentData }) => [doc.id, doc.data()])
        );

        const topics = PUBLISH_ORDER.map((number, index) => {
            const topic = getTopic(number)!;
            const data = byId.get(String(number));
            return {
                number,
                position: index + 1,
                category: topic.category,
                title: topic.title,
                status: data ? (data.status === "published" ? "published" : "draft") : "pending",
                carousel: data
                    ? {
                          coverTitle: data.coverTitle ?? "",
                          listHeading: data.listHeading ?? "",
                          slides: Array.isArray(data.slides) ? data.slides : [],
                          caption: data.caption ?? "",
                          createdAt: toIso(data.createdAt),
                          updatedAt: toIso(data.updatedAt),
                          publishedAt: toIso(data.publishedAt),
                          publishError: data.publishError ?? null,
                      }
                    : null,
            };
        });

        return NextResponse.json({ topics });
    } catch (err: unknown) {
        console.error("[admin/social-carousel] Failed to load carousels:", err instanceof Error ? err.message : String(err));
        return NextResponse.json({ error: "No se pudieron cargar los carruseles" }, { status: 500 });
    }
}
