import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { jwtVerify, createRemoteJWKSet } from "jose";
import { InMemoryRateLimiter } from './infrastructure/security/InMemoryRateLimiter';
import { domainLookupService } from './infrastructure/services/domainLookup';

// ── Configuration ────────────────────────────────────────────────────────────

const PROJECT_ID = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "prop-ia";
const FIREBASE_JWKS_URL = "https://www.googleapis.com/service_accounts/v1/jwk/securetoken@system.gserviceaccount.com";
const JWKS = createRemoteJWKSet(new URL(FIREBASE_JWKS_URL));

const MAIN_DOMAIN = 'zetaprop.com.ar';
const RESERVED_SUBDOMAINS = new Set(['www', 'app', 'api', 'mail', 'smtp', 'ftp', 'admin']);

// Rate Limiters
const globalLimiter = new InMemoryRateLimiter({
    interval: 60 * 1000,
    uniqueTokenPerInterval: 1000,
});

// Cache for domain lookups (short-lived)
const domainCache = new Map<string, { slug: string | null; expiry: number }>();
const CACHE_TTL = 30 * 1000; // 30 seconds

// ── Helpers ──────────────────────────────────────────────────────────────────

async function verifyFirebaseToken(token: string): Promise<boolean> {
    try {
        await jwtVerify(token, JWKS, {
            issuer: `https://securetoken.google.com/${PROJECT_ID}`,
            audience: PROJECT_ID,
        });
        return true;
    } catch {
        return false;
    }
}

function applySecurityHeaders(response: NextResponse, request: NextRequest): NextResponse {
    const url = request.nextUrl.clone();
    response.headers.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');
    response.headers.set('X-Content-Type-Options', 'nosniff');
    response.headers.set('X-Frame-Options', 'SAMEORIGIN');
    response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
    response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=(self), payment=(self)');
    
    if (url.hostname !== MAIN_DOMAIN && process.env.NODE_ENV === 'production') {
        response.headers.set('Link', `<https://${MAIN_DOMAIN}${url.pathname}>; rel="canonical"`);
    }
    return response;
}

function getClientIp(req: NextRequest): string {
    return (
        req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
        req.headers.get("x-real-ip") ||
        "127.0.0.1"
    );
}

// ── Middleware ───────────────────────────────────────────────────────────────

export async function proxy(request: NextRequest) {
    const { pathname } = request.nextUrl;
    const host = request.headers.get('host') ?? '';
    const url = request.nextUrl.clone();
    const originalPath = url.pathname === '/' ? '' : url.pathname;

    // 1. RATE LIMITING (Global & API Specific)
    if (process.env.NODE_ENV !== 'development') {
        const ip = getClientIp(request);
        try {
            // Global limit
            await globalLimiter.check(ip, 60); // 60 req/min
        } catch {
            return new NextResponse('Too Many Requests', { status: 429 });
        }
    }

    // 2. AUTH GUARD & REDIRECTS
    const token = request.cookies.get("authToken")?.value;
    const isAuthPath = pathname === "/login" || pathname === "/register";

    if (pathname.startsWith("/dashboard") || isAuthPath) {
        const isValid = token ? await verifyFirebaseToken(token) : false;

        // If on login/register and already validly logged in -> redirect to dashboard
        if (isAuthPath && isValid) {
            return NextResponse.redirect(new URL("/dashboard", request.url));
        }

        // If on dashboard and NOT logged in -> redirect to login
        if (pathname.startsWith("/dashboard") && !isValid) {
            const response = NextResponse.redirect(new URL("/login", request.url));
            if (token) response.cookies.delete("authToken");
            return response;
        }
    }

    // 3. SITE ROUTING (Subdomains & Custom Domains)
    let targetSlug: string | null = null;

    // Skip routing for static files, API, and platform reserved paths
    const isPlatformPath = pathname.startsWith('/_next') || pathname.startsWith('/api') || 
                          pathname.startsWith('/assets') || pathname === '/favicon.ico' ||
                          pathname.startsWith('/login') || pathname.startsWith('/dashboard') ||
                          pathname.startsWith('/sites'); // Avoid loops

    if (!isPlatformPath) {
        // A. Subdomain site routing
        if (host.endsWith(`.${MAIN_DOMAIN}`)) {
            const subdomain = host.slice(0, -(MAIN_DOMAIN.length + 1));
            if (subdomain && !RESERVED_SUBDOMAINS.has(subdomain)) {
                targetSlug = subdomain;
            }
        } 
        // B. Custom Domain routing
        else if (host !== MAIN_DOMAIN && host !== 'localhost:3000' && !host.endsWith('.vercel.app')) {
            const now = Date.now();
            const cached = domainCache.get(host);
            if (cached && cached.expiry > now) {
                targetSlug = cached.slug;
            } else {
                targetSlug = await domainLookupService.findSlugByDomain(host);
                console.log(`[Proxy] Domain lookup result for ${host}:`, targetSlug);
                domainCache.set(host, { slug: targetSlug, expiry: now + CACHE_TTL });
            }
        }

        // C. Rewrite if target found
        if (targetSlug) {
            console.log(`[Proxy] Rewriting ${host}${pathname} to /sites/${targetSlug}${originalPath}`);
            url.pathname = `/sites/${targetSlug}${originalPath}`;
            const response = NextResponse.rewrite(url);
            return applySecurityHeaders(response, request);
        }
    }

    // Default response
    const response = NextResponse.next();
    return applySecurityHeaders(response, request);
}

export const config = {
    matcher: [
        /*
         * Match all request paths except for the ones starting with:
         * - api (API routes - handled separately or skipped)
         * - _next/static (static files)
         * - _next/image (image optimization files)
         * - favicon.ico (favicon file)
         */
        '/((?!_next/static|_next/image|favicon.ico).*)',
    ],
};
