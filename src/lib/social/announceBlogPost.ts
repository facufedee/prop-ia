import { FieldValue } from "firebase-admin/firestore";
import { adminDb } from "@/infrastructure/firebase/admin";
import { buildInstagramCaption, buildLinkedInCaption } from "@/lib/social/blogCaptions";

// Notifies a Make.com scenario (custom webhook) that a blog post was
// published, so it can post it to Instagram and LinkedIn. Never throws:
// a social failure must never break publishing. See docs/social-auto-publish.md.

const SITE_URL = "https://zetaprop.com.ar";
const TIMEOUT_MS = 8000;

export type AnnounceResult =
    | { status: "sent" }
    | { status: "skipped"; reason: "not-configured" | "not-found" | "unpublished" | "scheduled" }
    | { status: "already-announced"; announcedAt: string | null }
    | { status: "failed"; error: string };

let warnedNotConfigured = false;

type DateLike = { toDate?: () => Date } | Date | string | undefined | null;

function toDate(value: DateLike): Date | null {
    if (!value) return null;
    if (value instanceof Date) return value;
    if (typeof value === "string") return new Date(value);
    return typeof value.toDate === "function" ? value.toDate() : null;
}

function shortError(error: unknown): string {
    const message = error instanceof Error ? error.message : String(error);
    return message.slice(0, 200);
}

function imageUrl(id: string, format: "instagram" | "square" | "linkedin"): string {
    return `${SITE_URL}/api/social/blog/${id}/image?format=${format}&type=jpeg`;
}

function buildPayload(id: string, data: FirebaseFirestore.DocumentData) {
    const post = {
        title: String(data.title ?? ""),
        slug: String(data.slug ?? ""),
        excerpt: String(data.excerpt ?? ""),
        content: String(data.content ?? ""),
        category: String(data.category ?? ""),
        tags: Array.isArray(data.tags) ? data.tags.filter((t: unknown): t is string => typeof t === "string") : [],
    };
    const url = `${SITE_URL}/blog/${post.slug}`;
    return {
        event: "blog.published",
        post: {
            id,
            slug: post.slug,
            title: post.title,
            excerpt: post.excerpt,
            category: post.category,
            tags: post.tags,
            url,
            coverUrl: typeof data.imageUrl === "string" ? data.imageUrl : null,
        },
        images: {
            instagram: imageUrl(id, "instagram"),
            instagramSquare: imageUrl(id, "square"),
            linkedin: imageUrl(id, "linkedin"),
        },
        captions: {
            instagram: buildInstagramCaption(post),
            linkedin: buildLinkedInCaption(post, url),
        },
        publishedAt: toDate(data.publishedAt)?.toISOString() ?? null,
    };
}

export async function announceBlogPost(postId: string, options: { force?: boolean } = {}): Promise<AnnounceResult> {
    const webhookUrl = process.env.MAKE_SOCIAL_WEBHOOK_URL;
    if (!webhookUrl) {
        if (!warnedNotConfigured) {
            console.warn("[announceBlogPost] MAKE_SOCIAL_WEBHOOK_URL is not set; social announce skipped");
            warnedNotConfigured = true;
        }
        return { status: "skipped", reason: "not-configured" };
    }

    const ref = adminDb.collection("blog_posts").doc(postId);
    let data: FirebaseFirestore.DocumentData | undefined;
    try {
        const snap = await ref.get();
        data = snap.exists ? snap.data() : undefined;
    } catch (error) {
        console.error("[announceBlogPost] Failed to load post:", shortError(error));
        return { status: "failed", error: "Could not load post" };
    }

    if (!data) return { status: "skipped", reason: "not-found" };
    if (data.published !== true) return { status: "skipped", reason: "unpublished" };
    const publishedAt = toDate(data.publishedAt);
    // The public blog hides future-dated posts, so the link would 404.
    if (publishedAt && publishedAt.getTime() > Date.now()) return { status: "skipped", reason: "scheduled" };
    if (data.socialAnnouncedAt && !options.force) {
        return { status: "already-announced", announcedAt: toDate(data.socialAnnouncedAt)?.toISOString() ?? null };
    }

    const headers: Record<string, string> = { "content-type": "application/json" };
    const secret = process.env.MAKE_SOCIAL_WEBHOOK_SECRET;
    if (secret) headers["x-zetaprop-secret"] = secret;

    let error: string | null = null;
    try {
        const res = await fetch(webhookUrl, {
            method: "POST",
            headers,
            // The secret also travels in the body so a Make filter can compare it directly.
            body: JSON.stringify({ ...buildPayload(postId, data), ...(secret ? { secret } : {}) }),
            signal: AbortSignal.timeout(TIMEOUT_MS),
        });
        if (!res.ok) error = `Webhook responded ${res.status}`;
    } catch (err) {
        error = shortError(err);
    }

    try {
        await ref.update(
            error
                ? { socialAnnounceError: error }
                : { socialAnnouncedAt: FieldValue.serverTimestamp(), socialAnnounceError: FieldValue.delete() }
        );
    } catch (err) {
        console.error("[announceBlogPost] Failed to record announce state:", shortError(err));
    }

    if (error) {
        console.error(`[announceBlogPost] Announce failed for ${postId}: ${error}`);
        return { status: "failed", error };
    }
    return { status: "sent" };
}
