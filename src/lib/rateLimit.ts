/**
 * Edge-compatible in-memory rate limiter.
 * Uses a sliding window per IP. Suitable for Next.js middleware.
 *
 * Note: resets on serverless function cold-starts. For production at scale,
 * replace the store with an external KV (e.g. Upstash Redis).
 */

interface RateLimitEntry {
    count: number;
    resetAt: number;
}

const store = new Map<string, RateLimitEntry>();

export interface RateLimitConfig {
    /** Max requests per window */
    limit: number;
    /** Window duration in milliseconds */
    windowMs: number;
}

export function checkRateLimit(key: string, config: RateLimitConfig): { allowed: boolean; remaining: number; resetAt: number } {
    const now = Date.now();
    const entry = store.get(key);

    if (!entry || now > entry.resetAt) {
        store.set(key, { count: 1, resetAt: now + config.windowMs });
        return { allowed: true, remaining: config.limit - 1, resetAt: now + config.windowMs };
    }

    if (entry.count >= config.limit) {
        return { allowed: false, remaining: 0, resetAt: entry.resetAt };
    }

    entry.count++;
    return { allowed: true, remaining: config.limit - entry.count, resetAt: entry.resetAt };
}

// Periodic cleanup to avoid memory leaks in long-running processes
setInterval(() => {
    const now = Date.now();
    store.forEach((entry, key) => {
        if (now > entry.resetAt) store.delete(key);
    });
}, 60_000);
