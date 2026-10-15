"use client";

import { useEffect } from "react";
import { auth } from "@/infrastructure/firebase/client";

const SESSION_ID_KEY = "zp_view_session";
const TRACKED_PREFIX = "zp_viewed_";

function randomId(): string {
    if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
        return crypto.randomUUID().replace(/-/g, "");
    }
    return `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 12)}`;
}

function getSessionId(): string {
    const existing = sessionStorage.getItem(SESSION_ID_KEY);
    if (existing) return existing;
    const created = randomId();
    sessionStorage.setItem(SESSION_ID_KEY, created);
    return created;
}

async function currentIdToken(): Promise<string | null> {
    try {
        if (!auth) return null;
        // Wait for the persisted session to restore so an owner reloading their own listing is
        // recognised; never forces a login.
        await auth.authStateReady();
        return (await auth.currentUser?.getIdToken()) ?? null;
    } catch {
        return null;
    }
}

async function sendView(propertyId: string): Promise<void> {
    const flag = `${TRACKED_PREFIX}${propertyId}`;
    if (sessionStorage.getItem(flag)) return;
    sessionStorage.setItem(flag, "1");

    const token = await currentIdToken();
    const headers: Record<string, string> = { "Content-Type": "application/json" };
    if (token) headers.Authorization = `Bearer ${token}`;

    await fetch(`/api/properties/${encodeURIComponent(propertyId)}/view`, {
        method: "POST",
        headers,
        body: JSON.stringify({ sessionId: getSessionId() }),
        keepalive: true,
    });
}

/**
 * Records one public view of a property per browser session. Fire-and-forget: it never throws
 * and never blocks rendering; the server decides whether the view counts (bots, owner, dedupe).
 */
export function useTrackPropertyView(propertyId: string | null | undefined): void {
    useEffect(() => {
        if (!propertyId) return;
        sendView(propertyId).catch(() => {
            // Tracking must never affect the page.
        });
    }, [propertyId]);
}
