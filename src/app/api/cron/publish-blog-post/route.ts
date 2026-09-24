import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/infrastructure/firebase/admin";
import { getStorage } from "firebase-admin/storage";
import { Timestamp } from "firebase-admin/firestore";
import os from "os";
import path from "path";
import fs from "fs/promises";

/**
 * Publishes one blog post, called by the scheduled "marketing" cloud agent
 * that researches Argentine real-estate news and writes posts autonomously
 * (no human review — see PLAN_APP_MOVIL.md history / chat for context).
 *
 * This endpoint exists so that cloud agent never needs the real Firebase
 * Admin service account — it only holds this narrow, single-purpose secret.
 *
 * POST /api/cron/publish-blog-post
 * Header requerido: x-cron-secret: <BLOG_AUTOPUBLISH_SECRET>
 * Body: { title, slug, excerpt, content, category, tags: string[], imageUrl, sourceNote? }
 *   - imageUrl: a publicly reachable URL (Pexels, Wikimedia Commons, etc.) to a
 *     royalty-free image. This endpoint downloads it and re-uploads it to this
 *     project's own Storage bucket — it is never hot-linked, matching the
 *     existing manual publish scripts' convention.
 */

const BUCKET_NAME = "prop-ia.firebasestorage.app";
const AUTHOR = { name: "Facundo Zeta" };
const SLUG_RE = /^[a-z0-9]+(-[a-z0-9]+)*$/;

function verifyBlogSecret(request: NextRequest): NextResponse | null {
    const secret = request.headers.get("x-cron-secret");
    const expected = process.env.BLOG_AUTOPUBLISH_SECRET;

    if (!expected) {
        console.error("[Security] BLOG_AUTOPUBLISH_SECRET env var is not set");
        return NextResponse.json({ error: "Server misconfiguration" }, { status: 500 });
    }
    if (!secret || secret !== expected) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return null;
}

export async function POST(request: NextRequest) {
    const authError = verifyBlogSecret(request);
    if (authError) return authError;

    let body: any;
    try {
        body = await request.json();
    } catch {
        return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
    }

    const { title, slug, excerpt, content, category, tags, imageUrl, sourceNote } = body ?? {};

    const missing = ["title", "slug", "excerpt", "content", "category", "imageUrl"].filter(
        (k) => typeof body?.[k] !== "string" || !body[k].trim()
    );
    if (missing.length > 0) {
        return NextResponse.json({ error: `Missing/invalid fields: ${missing.join(", ")}` }, { status: 400 });
    }
    if (!SLUG_RE.test(slug)) {
        return NextResponse.json({ error: "slug must be lowercase-with-hyphens, e.g. 'mi-post-2026'" }, { status: 400 });
    }
    if (!Array.isArray(tags) || tags.some((t) => typeof t !== "string")) {
        return NextResponse.json({ error: "tags must be a string array" }, { status: 400 });
    }

    // Avoid duplicate slugs — also lets the calling agent detect "already
    // covered this topic" if it accidentally reuses one.
    const existing = await adminDb.collection("blog_posts").where("slug", "==", slug).limit(1).get();
    if (!existing.empty) {
        return NextResponse.json({ error: `A post with slug "${slug}" already exists` }, { status: 409 });
    }

    // Download the source image and re-host it on our own Storage bucket
    // rather than hot-linking an external URL that could change or go down.
    let hostedImageUrl: string;
    try {
        const imgRes = await fetch(imageUrl);
        if (!imgRes.ok) throw new Error(`Fetch failed: ${imgRes.status}`);
        const contentType = imgRes.headers.get("content-type") || "image/jpeg";
        const ext = contentType.includes("png") ? "png" : "jpg";
        const buffer = Buffer.from(await imgRes.arrayBuffer());

        const tmpPath = path.join(os.tmpdir(), `blog-cover-${slug}.${ext}`);
        await fs.writeFile(tmpPath, buffer);

        const destination = `blog/${slug}/cover.${ext}`;
        const bucket = getStorage().bucket(BUCKET_NAME);
        await bucket.upload(tmpPath, {
            destination,
            metadata: { contentType },
            public: true,
        });
        await fs.unlink(tmpPath).catch(() => {});

        hostedImageUrl = `https://storage.googleapis.com/${BUCKET_NAME}/${destination}`;
    } catch (err: any) {
        console.error("[publish-blog-post] Image upload failed:", err.message);
        return NextResponse.json({ error: `Image upload failed: ${err.message}` }, { status: 502 });
    }

    const now = Timestamp.now();
    try {
        const docRef = await adminDb.collection("blog_posts").add({
            title,
            slug,
            excerpt,
            content,
            imageUrl: hostedImageUrl,
            category,
            author: AUTHOR,
            tags,
            published: true,
            publishedAt: now,
            createdAt: now,
            updatedAt: now,
            autoPublished: true,
            ...(sourceNote ? { sourceNote } : {}),
        });

        console.log(`[publish-blog-post] Published "${title}" (${docRef.id})`);
        return NextResponse.json({
            success: true,
            id: docRef.id,
            url: `https://zetaprop.com.ar/blog/${slug}`,
        });
    } catch (err: any) {
        console.error("[publish-blog-post] Firestore write failed:", err.message);
        return NextResponse.json({ error: `Firestore write failed: ${err.message}` }, { status: 500 });
    }
}
