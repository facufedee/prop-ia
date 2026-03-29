import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { InMemoryRateLimiter } from './infrastructure/security/InMemoryRateLimiter';

const limiter = new InMemoryRateLimiter({
    interval: 60 * 1000, // 60 seconds
    uniqueTokenPerInterval: 500, // Max 500 users per second
});

// Subdomains that belong to the platform itself (not user sites)
const RESERVED_SUBDOMAINS = new Set(['www', 'app', 'api', 'mail', 'smtp', 'ftp', 'admin']);
const MAIN_DOMAIN = 'zetaprop.com.ar';

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

export async function middleware(request: NextRequest) {
    const nonce = Buffer.from(crypto.getRandomValues(new Uint8Array(16))).toString('base64');

    // ── Subdomain site routing ────────────────────────────────────────────────
    // Detects requests like mariposa.zetaprop.com.ar and rewrites to /sites/mariposa
    const host = request.headers.get('host') ?? '';
    if (host.endsWith(`.${MAIN_DOMAIN}`)) {
        const subdomain = host.slice(0, -(MAIN_DOMAIN.length + 1));
        if (subdomain && !RESERVED_SUBDOMAINS.has(subdomain)) {
            const url = request.nextUrl.clone();
            // Preserve the original path (e.g. /propiedades → /sites/slug/propiedades)
            const originalPath = url.pathname === '/' ? '' : url.pathname;
            url.pathname = `/sites/${subdomain}${originalPath}`;
            const response = NextResponse.rewrite(url);
            return applySecurityHeaders(response, request);
        }
    }
    // ─────────────────────────────────────────────────────────────────────────

    // Rate Limiting (Simple IP-based) - Skip in Development
    if (process.env.NODE_ENV !== 'development') {
        const ip = request.headers.get('x-forwarded-for') ?? '127.0.0.1';
        try {
            await limiter.check(ip, 20); // 20 requests per minute per IP in Production
        } catch {
            return new NextResponse('Too Many Requests', { status: 429 });
        }
    }

    // Custom headers for security
    const headers = new Headers(request.headers);
    const response = NextResponse.next({
        request: {
            headers: headers,
        },
    });

    return applySecurityHeaders(response, request);
}

export const config = {
    matcher: [
        /*
         * Match all request paths except for the ones starting with:
         * - api (API routes)
         * - _next/static (static files)
         * - _next/image (image optimization files)
         * - favicon.ico (favicon file)
         */
        '/((?!api|_next/static|_next/image|favicon.ico).*)',
    ],
};
