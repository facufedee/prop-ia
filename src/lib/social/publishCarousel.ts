import { FieldValue } from "firebase-admin/firestore";
import { adminDb } from "@/infrastructure/firebase/admin";
import { CAROUSEL_COLLECTION } from "@/lib/social/carouselDraft";
import { carouselSlideCount, toCarouselContent } from "@/lib/social/carouselSlides";

// Sends an approved carousel to the Make.com social scenario (same webhook as
// announceBlogPost; the router branches on `event`). Never throws: every
// outcome is returned so the admin UI can show it. See docs/social-auto-publish.md.

const SITE_URL = "https://zetaprop.com.ar";
const TIMEOUT_MS = 8000;

export type PublishCarouselResult =
    | { status: "sent" }
    | { status: "not-configured" }
    | { status: "not-found" }
    | { status: "already-published" }
    | { status: "failed"; error: string };

function shortError(error: unknown): string {
    const message = error instanceof Error ? error.message : String(error);
    return message.slice(0, 200);
}

export function carouselImageUrls(id: string, slideCount: number): string[] {
    return Array.from({ length: slideCount }, (_, i) => `${SITE_URL}/api/social/carousel/${id}/image?slide=${i + 1}&type=jpeg`);
}

export async function publishCarousel(id: string, options: { force?: boolean } = {}): Promise<PublishCarouselResult> {
    const webhookUrl = process.env.MAKE_SOCIAL_WEBHOOK_URL;
    if (!webhookUrl) {
        console.warn("[publishCarousel] MAKE_SOCIAL_WEBHOOK_URL is not set; carousel not sent");
        return { status: "not-configured" };
    }

    const ref = adminDb.collection(CAROUSEL_COLLECTION).doc(id);
    let data: FirebaseFirestore.DocumentData | undefined;
    try {
        const snap = await ref.get();
        data = snap.exists ? snap.data() : undefined;
    } catch (error) {
        console.error("[publishCarousel] Failed to load carousel:", shortError(error));
        return { status: "failed", error: "Could not load carousel" };
    }

    if (!data) return { status: "not-found" };
    if (data.status === "published" && !options.force) return { status: "already-published" };

    const recordError = async (error: string) => {
        try {
            await ref.update({ publishError: error });
        } catch (err) {
            console.error("[publishCarousel] Failed to record publish error:", shortError(err));
        }
    };

    const content = toCarouselContent(data);
    if (!content) {
        const error = "Malformed carousel draft";
        await recordError(error);
        return { status: "failed", error };
    }

    const headers: Record<string, string> = { "content-type": "application/json" };
    const secret = process.env.MAKE_SOCIAL_WEBHOOK_SECRET;
    if (secret) headers["x-zetaprop-secret"] = secret;

    const payload = {
        event: "carousel.publish",
        topic: {
            number: Number(data.topicNumber ?? id),
            category: content.category,
            title: typeof data.title === "string" ? data.title : "",
            coverTitle: content.coverTitle,
        },
        images: carouselImageUrls(id, carouselSlideCount(content)),
        caption: typeof data.caption === "string" ? data.caption : "",
        // Also in the body so a Make filter can compare it directly.
        ...(secret ? { secret } : {}),
    };

    let error: string | null = null;
    try {
        const res = await fetch(webhookUrl, {
            method: "POST",
            headers,
            body: JSON.stringify(payload),
            signal: AbortSignal.timeout(TIMEOUT_MS),
        });
        if (!res.ok) error = `Webhook responded ${res.status}`;
    } catch (err) {
        error = shortError(err);
    }

    if (error) {
        console.error(`[publishCarousel] Publish failed for topic ${id}: ${error}`);
        await recordError(error);
        return { status: "failed", error };
    }

    try {
        await ref.update({ status: "published", publishedAt: FieldValue.serverTimestamp(), publishError: null });
    } catch (err) {
        // Make already has it; surface the bookkeeping failure instead of hiding it.
        console.error("[publishCarousel] Sent, but failed to mark as published:", shortError(err));
        return { status: "failed", error: "Sent to Make, but could not mark the topic as published" };
    }
    return { status: "sent" };
}
