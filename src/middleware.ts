import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const MAIN_DOMAIN = "zetaprop.com.ar";
const MAIN_HOSTS = [MAIN_DOMAIN, `www.${MAIN_DOMAIN}`];

// Resolve a custom domain to a site slug via Firestore REST API (Edge-safe)
async function resolveCustomDomain(domain: string): Promise<string | null> {
    const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
    const apiKey = process.env.NEXT_PUBLIC_FIREBASE_API_KEY;

    if (!projectId || !apiKey) return null;

    try {
        const url =
            `https://firestore.googleapis.com/v1/projects/${projectId}/databases/propia/documents:runQuery?key=${apiKey}`;

        const body = {
            structuredQuery: {
                from: [{ collectionId: "sites" }],
                where: {
                    compositeFilter: {
                        op: "AND",
                        filters: [
                            {
                                fieldFilter: {
                                    field: { fieldPath: "customDomain" },
                                    op: "EQUAL",
                                    value: { stringValue: domain },
                                },
                            },
                            {
                                fieldFilter: {
                                    field: { fieldPath: "published" },
                                    op: "EQUAL",
                                    value: { booleanValue: true },
                                },
                            },
                        ],
                    },
                },
                limit: 1,
            },
        };

        const res = await fetch(url, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(body),
        });

        if (!res.ok) return null;

        const data = (await res.json()) as Array<{ document?: { fields?: { slug?: { stringValue?: string } } } }>;

        const slug = data?.[0]?.document?.fields?.slug?.stringValue;
        return slug ?? null;
    } catch {
        return null;
    }
}

export async function middleware(request: NextRequest) {
    const hostname = request.headers.get("host") ?? "";
    const host = hostname.split(":")[0]; // strip port (for local dev)
    const url = request.nextUrl.clone();
    const pathname = url.pathname;

    // ── 1. Subdomain of zetaprop.com.ar → /sites/[slug] ──────────────────────
    if (host.endsWith(`.${MAIN_DOMAIN}`)) {
        const slug = host.slice(0, -(MAIN_DOMAIN.length + 1));
        if (slug && !pathname.startsWith(`/sites/${slug}`)) {
            url.pathname = `/sites/${slug}${pathname}`;
            return NextResponse.rewrite(url);
        }
        return NextResponse.next();
    }

    // ── 2. Main domain or local dev → serve normally ──────────────────────────
    if (
        MAIN_HOSTS.includes(host) ||
        host.startsWith("localhost") ||
        host === "127.0.0.1"
    ) {
        return NextResponse.next();
    }

    // ── 3. Custom domain → resolve slug via Firestore REST API ─────────────────
    if (!pathname.startsWith("/sites/")) {
        // Try bare domain and www. variant
        const bareHost = host.startsWith("www.") ? host.slice(4) : host;
        const slug = await resolveCustomDomain(bareHost) ?? await resolveCustomDomain(host);
        if (slug) {
            url.pathname = `/sites/${slug}${pathname}`;
            return NextResponse.rewrite(url);
        }
    }

    return NextResponse.next();
}

export const config = {
    matcher: [
        // Run on all paths except Next.js internals and static assets
        "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:ico|png|jpg|jpeg|svg|webp|css|js|woff2?)).*)",
    ],
};
