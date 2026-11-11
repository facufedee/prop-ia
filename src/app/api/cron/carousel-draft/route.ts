import { NextRequest, NextResponse } from "next/server";
import { Timestamp } from "firebase-admin/firestore";
import { adminDb } from "@/infrastructure/firebase/admin";
import { CAROUSEL_TOPICS, getTopic, nextTopic } from "@/lib/social/carouselTopics";
import { CAROUSEL_COLLECTION, CAROUSEL_LIMITS, parseCarouselDraft } from "@/lib/social/carouselDraft";

/**
 * Weekly Instagram carousel drafts, written by the scheduled cloud agent
 * (see docs/marketing/carrusel-rutina.md). Like /api/cron/publish-blog-post,
 * the agent only holds this narrow secret, never Firebase credentials.
 * Drafts are reviewed and published by an admin at /dashboard/admin/redes.
 *
 * Header requerido: x-cron-secret: <CAROUSEL_DRAFT_SECRET>
 *
 * GET  /api/cron/carousel-draft → next undrafted topic in publish order + text limits
 * POST /api/cron/carousel-draft → { topicNumber, coverTitle, listHeading, slides, caption }
 *   stores (or replaces) the draft for that topic; a published topic is never overwritten.
 */

function verifyCarouselSecret(request: NextRequest): NextResponse | null {
    const secret = request.headers.get("x-cron-secret");
    const expected = process.env.CAROUSEL_DRAFT_SECRET;

    if (!expected) {
        console.error("[Security] CAROUSEL_DRAFT_SECRET env var is not set");
        return NextResponse.json({ error: "Server misconfiguration" }, { status: 500 });
    }
    if (!secret || secret !== expected) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return null;
}

export async function GET(request: NextRequest) {
    const authError = verifyCarouselSecret(request);
    if (authError) return authError;

    try {
        const snap = await adminDb.collection(CAROUSEL_COLLECTION).get();
        const drafted = snap.docs.map((doc: { id: string }) => Number(doc.id)).filter((n: number) => getTopic(n) !== null);
        const topic = nextTopic(drafted);
        return NextResponse.json({
            topic: topic ? { number: topic.number, category: topic.category, title: topic.title } : null,
            remaining: CAROUSEL_TOPICS.length - new Set(drafted).size,
            limits: CAROUSEL_LIMITS,
        });
    } catch (err: unknown) {
        console.error("[carousel-draft] Failed to load drafts:", err instanceof Error ? err.message : String(err));
        return NextResponse.json({ error: "Failed to load drafts" }, { status: 500 });
    }
}

export async function POST(request: NextRequest) {
    const authError = verifyCarouselSecret(request);
    if (authError) return authError;

    let body: unknown;
    try {
        body = await request.json();
    } catch {
        return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
    }

    const parsed = parseCarouselDraft(body);
    if (!parsed.ok) return NextResponse.json({ error: parsed.error }, { status: 400 });

    const draft = parsed.data;
    const topic = getTopic(draft.topicNumber)!;
    const id = String(topic.number);
    const ref = adminDb.collection(CAROUSEL_COLLECTION).doc(id);

    try {
        const existing = await ref.get();
        const current = existing.exists ? existing.data() : undefined;
        if (current?.status === "published") {
            return NextResponse.json({ error: `Topic ${id} was already published` }, { status: 409 });
        }

        const now = Timestamp.now();
        await ref.set({
            topicNumber: topic.number,
            category: topic.category,
            title: topic.title,
            coverTitle: draft.coverTitle,
            listHeading: draft.listHeading,
            slides: draft.slides.map((slide) => slide.map(({ title, detail }) => ({ title, detail }))),
            caption: draft.caption,
            status: "draft",
            createdAt: current?.createdAt ?? now,
            updatedAt: now,
            publishedAt: null,
            publishError: null,
        });

        console.log(`[carousel-draft] Stored draft for topic ${id}${current ? " (replaced)" : ""}`);
        return NextResponse.json({
            success: true,
            id,
            status: "draft",
            replaced: Boolean(current),
            reviewUrl: "https://zetaprop.com.ar/dashboard/admin/redes",
        });
    } catch (err: unknown) {
        console.error("[carousel-draft] Firestore write failed:", err instanceof Error ? err.message : String(err));
        return NextResponse.json({ error: "Firestore write failed" }, { status: 500 });
    }
}
