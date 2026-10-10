import { createHmac, timingSafeEqual } from 'crypto';

/**
 * Signed newsletter unsubscribe links.
 *
 * The token is an HMAC-SHA256 of the user id keyed with CRON_SECRET plus a
 * fixed purpose label, so links cannot be forged for other users and no extra
 * secret is needed. Rotating CRON_SECRET invalidates previously sent links.
 */

const SITE_URL = 'https://zetaprop.com.ar';
const PURPOSE = 'newsletter-unsubscribe:';

function getSecret(): string {
    const secret = process.env.CRON_SECRET;
    if (!secret) {
        throw new Error('CRON_SECRET is not set; cannot sign unsubscribe tokens');
    }
    return secret;
}

export function createUnsubscribeToken(userId: string): string {
    return createHmac('sha256', getSecret()).update(PURPOSE + userId).digest('base64url');
}

export function verifyUnsubscribeToken(userId: string, token: string): boolean {
    if (!userId || !token) return false;

    const expected = Buffer.from(createUnsubscribeToken(userId));
    const received = Buffer.from(token);
    if (expected.length !== received.length) return false;

    return timingSafeEqual(expected, received);
}

function buildSignedUrl(path: string, userId: string): string {
    const params = new URLSearchParams({ u: userId, t: createUnsubscribeToken(userId) });
    return `${SITE_URL}${path}?${params.toString()}`;
}

/** Human-facing link: the unsubscribe page, which confirms and calls the API. */
export function buildUnsubscribeUrl(userId: string): string {
    return buildSignedUrl('/unsubscribe', userId);
}

/** RFC 8058 one-click target used in the List-Unsubscribe header. */
export function buildOneClickUnsubscribeUrl(userId: string): string {
    return buildSignedUrl('/api/newsletter/unsubscribe', userId);
}
