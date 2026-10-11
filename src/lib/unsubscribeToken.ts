import { createHmac, timingSafeEqual } from 'crypto';

/**
 * Signed newsletter links (unsubscribe and subscription confirmation).
 *
 * A token is an HMAC-SHA256 of a purpose label plus a subject, keyed with
 * CRON_SECRET, so links cannot be forged for other subjects and no extra secret
 * is needed. Rotating CRON_SECRET invalidates previously sent links.
 *
 * Subjects are user ids, or `sub:<docId>` for `newsletter_subscribers` entries
 * (people without an account). Purpose labels keep an unsubscribe token from
 * being accepted as a confirm token and vice versa.
 */

const SITE_URL = 'https://zetaprop.com.ar';
// Must stay unchanged: already sent emails carry tokens signed with it.
const UNSUBSCRIBE_PURPOSE = 'newsletter-unsubscribe:';
const CONFIRM_PURPOSE = 'newsletter-confirm:';
const SUBSCRIBER_PREFIX = 'sub:';

function getSecret(): string {
    const secret = process.env.CRON_SECRET;
    if (!secret) {
        throw new Error('CRON_SECRET is not set; cannot sign unsubscribe tokens');
    }
    return secret;
}

function sign(purpose: string, subject: string): string {
    return createHmac('sha256', getSecret()).update(purpose + subject).digest('base64url');
}

function verify(purpose: string, subject: string, token: string): boolean {
    if (!subject || !token) return false;

    const expected = Buffer.from(sign(purpose, subject));
    const received = Buffer.from(token);
    if (expected.length !== received.length) return false;

    return timingSafeEqual(expected, received);
}

/** Unsubscribe subject for a newsletter subscriber document. */
export function subscriberSubject(docId: string): string {
    return SUBSCRIBER_PREFIX + docId;
}

/** The subscriber doc id when `subject` is in the `sub:` namespace, otherwise null (a user id). */
export function parseSubscriberSubject(subject: string): string | null {
    if (!subject.startsWith(SUBSCRIBER_PREFIX)) return null;
    const docId = subject.slice(SUBSCRIBER_PREFIX.length);
    return docId || null;
}

/** `userId` is a user id or a `sub:<docId>` subscriber subject. */
export function createUnsubscribeToken(userId: string): string {
    return sign(UNSUBSCRIBE_PURPOSE, userId);
}

export function verifyUnsubscribeToken(userId: string, token: string): boolean {
    return verify(UNSUBSCRIBE_PURPOSE, userId, token);
}

/** Token for the double opt-in link of a `newsletter_subscribers` document. */
export function createConfirmToken(docId: string): string {
    return sign(CONFIRM_PURPOSE, subscriberSubject(docId));
}

export function verifyConfirmToken(docId: string, token: string): boolean {
    if (!docId) return false;
    return verify(CONFIRM_PURPOSE, subscriberSubject(docId), token);
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
