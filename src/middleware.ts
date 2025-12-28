import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { InMemoryRateLimiter } from './infrastructure/security/InMemoryRateLimiter';

const limiter = new InMemoryRateLimiter({
    interval: 60 * 1000, // 60 seconds
    uniqueTokenPerInterval: 500, // Max 500 users per second
});

export async function middleware(request: NextRequest) {
    const nonce = Buffer.from(crypto.getRandomValues(new Uint8Array(16))).toString('base64');

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

    // Security Headers (OWASP Top 10 Mitigation)

    // 1. Strict Transport Security (HSTS)
    // Force HTTPS for 1 year, include subdomains, preload
    response.headers.set(
        'Strict-Transport-Security',
        'max-age=31536000; includeSubDomains; preload'
    );

    // 2. X-Content-Type-Options
    // Prevent MIME type sniffing
    response.headers.set('X-Content-Type-Options', 'nosniff');

    // 3. X-Frame-Options
    // Prevent Clickjacking (allow from same origin is safer than DENY if you use iframes internally)
    response.headers.set('X-Frame-Options', 'SAMEORIGIN');

    // 4. Referrer Policy
    // Control information leakage in Referer header
    response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');

    // 5. Permissions Policy (Camera, Mic, Geolocation, etc.)
    // Restrict browser features
    response.headers.set(
        'Permissions-Policy',
        'camera=(), microphone=(), geolocation=(self), payment=(self)'
    );

    // 6. Content Security Policy (CSP)
    // Strict control over resources. Note: This handles 'unsafe-inline' for styles due to many frameworks needing it,
    // but typically scripts should be strict. 
    // IMPORTANT: For production, you might need to refine 'img-src' etc depending on where user content comes from.
    const cspHeader = `
    default-src 'self';
    script-src 'self' 'unsafe-eval' 'unsafe-inline' https://apis.google.com https://*.firebaseapp.com https://*.googleapis.com https://maps.googleapis.com https://maps.gstatic.com;
    style-src 'self' 'unsafe-inline' https://fonts.googleapis.com;
    img-src 'self' blob: data: https://*.googleusercontent.com https://*.googleapis.com https://maps.gstatic.com https://maps.googleapis.com;
    font-src 'self' https://fonts.gstatic.com;
    connect-src 'self' https://*.googleapis.com https://*.firebaseio.com https://*.cloudfunctions.net https://apis.datos.gob.ar;
    frame-src 'self' https://*.firebaseapp.com;
    object-src 'none';
    base-uri 'self';
    form-action 'self';
    upgrade-insecure-requests;
  `;

    // Replace newlines and spaces for header format
    const contentSecurityPolicyHeaderValue = cspHeader
        .replace(/\s{2,}/g, ' ')
        .trim();

    response.headers.set(
        'Content-Security-Policy',
        contentSecurityPolicyHeaderValue
    );

    return response;
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
