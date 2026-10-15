import { NextRequest, NextResponse } from "next/server";
import { FieldValue, Timestamp } from "firebase-admin/firestore";
import { adminAuth, adminDb } from "@/infrastructure/firebase/admin";
import { dayKey, isBotUserAgent, pruneViewsByDay } from "@/lib/propertyViews";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Public property view counter.
 *
 * Contract: 200 `{ counted: true }` when the view was counted, 204 (no body, no write) when it
 * was intentionally ignored (bot/preview user agent, unknown or inactive property, the owner
 * viewing their own listing, or the same session already counted this property today),
 * 400 for a malformed request.
 *
 * Data model (Admin SDK only; clients cannot write either collection):
 * - `property_stats/{propertyId}`: `{ ownerId, views, lastViewedAt, viewsByDay: { 'YYYY-MM-DD': n } }`.
 *   `viewsByDay` keeps only the last VIEWS_BY_DAY_KEEP_DAYS days (older buckets are deleted on write).
 * - `property_view_keys/{propertyId}_{sessionId}_{YYYYMMDD}`: per-session daily dedupe marker,
 *   created with `create()` so a second view fails instead of counting. `expiresAt` (+2 days)
 *   is meant for a Firestore TTL policy on `property_view_keys.expiresAt`, enabled in the console.
 */

const VIEWS_BY_DAY_KEEP_DAYS = 90;
const DEDUPE_KEY_TTL_DAYS = 2;
const ID_PATTERN = /^[A-Za-z0-9_-]{1,128}$/;
const SESSION_PATTERN = /^[A-Za-z0-9_-]{1,64}$/;
const ALREADY_EXISTS = 6;

const ignored = () => new NextResponse(null, { status: 204 });

async function viewerUid(request: NextRequest): Promise<string | null> {
    const header = request.headers.get("authorization");
    if (!header?.startsWith("Bearer ")) return null;
    try {
        const decoded = await adminAuth.verifyIdToken(header.slice(7));
        return decoded.uid;
    } catch {
        // An invalid or expired token only means we cannot tell whether this is the owner.
        return null;
    }
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    if (isBotUserAgent(request.headers.get("user-agent"))) return ignored();

    const { id } = await params;
    let sessionId: unknown;
    try {
        sessionId = (await request.json())?.sessionId;
    } catch {
        return NextResponse.json({ error: "Invalid body" }, { status: 400 });
    }
    if (!ID_PATTERN.test(id) || typeof sessionId !== "string" || !SESSION_PATTERN.test(sessionId)) {
        return NextResponse.json({ error: "Invalid request" }, { status: 400 });
    }

    try {
        const propertySnap = await adminDb.collection("properties").doc(id).get();
        if (!propertySnap.exists) return ignored();
        const property = propertySnap.data() ?? {};
        if (property.status === "inactive") return ignored();
        const ownerId = typeof property.userId === "string" ? property.userId : null;
        if (!ownerId) return ignored();

        const uid = await viewerUid(request);
        if (uid && uid === ownerId) return ignored();

        const now = new Date();
        const today = dayKey(now);
        const keyId = `${id}_${sessionId}_${today.replace(/-/g, "")}`;
        try {
            await adminDb.collection("property_view_keys").doc(keyId).create({
                propertyId: id,
                sessionId,
                createdAt: FieldValue.serverTimestamp(),
                expiresAt: Timestamp.fromDate(new Date(now.getTime() + DEDUPE_KEY_TTL_DAYS * 86_400_000)),
            });
        } catch (error) {
            if ((error as { code?: number })?.code === ALREADY_EXISTS) return ignored();
            throw error;
        }

        const statsRef = adminDb.collection("property_stats").doc(id);
        const statsSnap = await statsRef.get();
        const viewsByDay: Record<string, unknown> = { [today]: FieldValue.increment(1) };
        for (const staleKey of pruneViewsByDay(statsSnap.data()?.viewsByDay, now, VIEWS_BY_DAY_KEEP_DAYS)) {
            viewsByDay[staleKey] = FieldValue.delete();
        }

        await statsRef.set(
            {
                ownerId,
                views: FieldValue.increment(1),
                lastViewedAt: FieldValue.serverTimestamp(),
                viewsByDay,
            },
            { merge: true }
        );

        return NextResponse.json({ counted: true }, { status: 200 });
    } catch (error) {
        console.error("[property-view] failed to record view", error);
        return NextResponse.json({ error: "Internal error" }, { status: 500 });
    }
}
