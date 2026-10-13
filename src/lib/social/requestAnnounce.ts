// Client-side helper for POST /api/social/blog/{id}/announce.
// Returns the announce status, or "failed" on network/auth errors.

export type AnnounceResponse = {
    status: "sent" | "skipped" | "already-announced" | "failed";
    reason?: string;
    error?: string;
};

export async function requestAnnounce(postId: string, idToken: string, force = false): Promise<AnnounceResponse> {
    try {
        const res = await fetch(`/api/social/blog/${encodeURIComponent(postId)}/announce`, {
            method: "POST",
            headers: { "content-type": "application/json", authorization: `Bearer ${idToken}` },
            body: JSON.stringify({ force }),
        });
        const body = (await res.json().catch(() => null)) as AnnounceResponse | null;
        if (body?.status) return body;
        return { status: "failed", error: `HTTP ${res.status}` };
    } catch (error) {
        return { status: "failed", error: error instanceof Error ? error.message : String(error) };
    }
}

// Spanish (voseo) toast copy for each outcome.
export function announceMessage(result: AnnounceResponse): { kind: "success" | "info" | "error"; text: string } {
    switch (result.status) {
        case "sent":
            return { kind: "success", text: "Nota enviada a redes (Instagram y LinkedIn)." };
        case "already-announced":
            return { kind: "info", text: "Esta nota ya se había enviado a redes." };
        case "skipped":
            if (result.reason === "not-configured") return { kind: "info", text: "El envío automático a redes no está configurado." };
            if (result.reason === "scheduled") return { kind: "info", text: "La nota está programada: enviala a redes cuando se publique." };
            return { kind: "info", text: "La nota no está publicada, no se envió a redes." };
        default:
            return { kind: "error", text: "No se pudo enviar a redes. Reintentá desde el Generador RRSS." };
    }
}
