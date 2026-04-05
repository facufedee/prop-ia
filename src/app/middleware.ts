import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { jwtVerify, createRemoteJWKSet } from "jose";
import { checkRateLimit } from "@/lib/rateLimit";

const PROJECT_ID = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "prop-ia";
const FIREBASE_JWKS_URL =
    "https://www.googleapis.com/service_accounts/v1/jwk/securetoken@system.gserviceaccount.com";
const JWKS = createRemoteJWKSet(new URL(FIREBASE_JWKS_URL));

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

// Rate limit configs per route pattern
const RATE_LIMITS: { pattern: RegExp; limit: number; windowMs: number }[] = [
    { pattern: /^\/api\/auth\//, limit: 10, windowMs: 60_000 },       // 10 req/min on auth
    { pattern: /^\/api\/leads\/public/, limit: 5, windowMs: 60_000 }, // 5 leads/min per IP
    { pattern: /^\/api\/admin\//, limit: 30, windowMs: 60_000 },      // 30 req/min on admin
    { pattern: /^\/api\/payments\//, limit: 10, windowMs: 60_000 },   // 10 payments/min
];

function getClientIp(req: NextRequest): string {
    return (
        req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
        req.headers.get("x-real-ip") ||
        "unknown"
    );
}

export async function middleware(req: NextRequest) {
    const { pathname } = req.nextUrl;

    // 1. Rate limiting on sensitive API routes
    for (const rule of RATE_LIMITS) {
        if (rule.pattern.test(pathname)) {
            const ip = getClientIp(req);
            const result = checkRateLimit(`${ip}:${pathname}`, {
                limit: rule.limit,
                windowMs: rule.windowMs,
            });

            if (!result.allowed) {
                return NextResponse.json(
                    { error: "Too many requests" },
                    {
                        status: 429,
                        headers: {
                            "Retry-After": String(Math.ceil((result.resetAt - Date.now()) / 1000)),
                            "X-RateLimit-Limit": String(rule.limit),
                            "X-RateLimit-Remaining": "0",
                        },
                    }
                );
            }
            break;
        }
    }

    // 2. Dashboard auth guard with real token verification
    if (pathname.startsWith("/dashboard")) {
        const token = req.cookies.get("authToken")?.value;

        if (!token) {
            return NextResponse.redirect(new URL("/login", req.url));
        }

        const isValid = await verifyFirebaseToken(token);
        if (!isValid) {
            const response = NextResponse.redirect(new URL("/login", req.url));
            response.cookies.delete("authToken");
            return response;
        }
    }

    return NextResponse.next();
}

export const config = {
    matcher: [
        "/dashboard/:path*",
        "/api/auth/:path*",
        "/api/leads/public",
        "/api/admin/:path*",
        "/api/payments/:path*",
    ],
};
