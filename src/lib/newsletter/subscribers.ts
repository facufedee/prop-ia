import { createHash } from 'crypto';
import { Timestamp } from 'firebase-admin/firestore';
import { adminDb } from '@/infrastructure/firebase/admin';
import { resolveMarketingRecipient } from '@/lib/marketingUnsubscribe';
import { sendEmailWithResend } from '@/lib/resend';
import { createConfirmToken } from '@/lib/unsubscribeToken';
import { renderConfirmationEmail } from './confirmationEmail';
import { SUBSCRIBERS_COLLECTION } from './subscriberCollection';
import { SITE_URL } from './template';

/**
 * Newsletter subscribers without an account (footer form), with double opt-in:
 * `pending` -> confirmation email -> `confirmed`. Only confirmed subscribers
 * receive the newsletter; unsubscribing sets `unsubscribed`.
 *
 * Doc id = sha256 hex of the normalized email, so re-subscribing is idempotent.
 */

export { SUBSCRIBERS_COLLECTION };
/** Same sender as the blog newsletter. Kept here to avoid importing sendNewsletter. */
const CONFIRMATION_FROM = 'Zeta Prop <newsletter@zetaprop.com.ar>';
/** A pending address gets at most one confirmation email per window. */
export const CONFIRMATION_RESEND_INTERVAL_MS = 10 * 60 * 1000;
const MAX_EMAIL_LENGTH = 254;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export type SubscriberStatus = 'pending' | 'confirmed' | 'unsubscribed';

type TimestampLike = { toMillis?: () => number } | null | undefined;

function millis(value: unknown): number {
    const ts = value as TimestampLike;
    return typeof ts?.toMillis === 'function' ? ts.toMillis() : 0;
}

/** Lowercased, trimmed email, or null when it is not a plausible address. */
export function normalizeEmail(raw: unknown): string | null {
    if (typeof raw !== 'string') return null;
    const email = raw.trim().toLowerCase();
    if (email.length > MAX_EMAIL_LENGTH || !EMAIL_PATTERN.test(email)) return null;
    return email;
}

export function subscriberIdFor(email: string): string {
    return createHash('sha256').update(email).digest('hex');
}

export function buildConfirmUrl(docId: string): string {
    const params = new URLSearchParams({ s: docId, t: createConfirmToken(docId) });
    return `${SITE_URL}/newsletter/confirmar?${params.toString()}`;
}

export type SubscribeOutcome = 'sent' | 'already_user' | 'already_confirmed' | 'throttled';

/**
 * Registers `email` (already normalized) as pending and sends the confirmation
 * email when appropriate. Errors (Firestore, Resend) propagate.
 */
export async function requestSubscription(email: string): Promise<SubscribeOutcome> {
    if (await resolveMarketingRecipient(email)) return 'already_user';

    const ref = adminDb.collection(SUBSCRIBERS_COLLECTION).doc(subscriberIdFor(email));
    const snap = await ref.get();
    const existing = snap.exists ? snap.data() : undefined;

    if (existing?.status === 'confirmed') return 'already_confirmed';
    if (
        existing?.status === 'pending' &&
        Date.now() - millis(existing.confirmationSentAt) < CONFIRMATION_RESEND_INTERVAL_MS
    ) {
        return 'throttled';
    }

    await ref.set(
        {
            email,
            status: 'pending' satisfies SubscriberStatus,
            createdAt: existing?.createdAt ?? Timestamp.now(),
            updatedAt: Timestamp.now(),
        },
        { merge: true }
    );

    const { subject, html, text } = renderConfirmationEmail(buildConfirmUrl(ref.id));
    const result = await sendEmailWithResend({ to: email, from: CONFIRMATION_FROM, subject, html, text });
    if (!result) {
        throw new Error('Resend is not configured; confirmation email not sent');
    }

    // Recorded only after a successful send, so a failed send can be retried at once.
    await ref.update({ confirmationSentAt: Timestamp.now() });
    return 'sent';
}

export type ConfirmOutcome = 'confirmed' | 'already_confirmed' | 'not_found' | 'unsubscribed';

/** Marks a pending subscriber as confirmed. The caller must have verified the confirm token. */
export async function confirmSubscription(docId: string): Promise<ConfirmOutcome> {
    const ref = adminDb.collection(SUBSCRIBERS_COLLECTION).doc(docId);
    const snap = await ref.get();
    if (!snap.exists) return 'not_found';

    const status = snap.data()?.status as SubscriberStatus | undefined;
    if (status === 'confirmed') return 'already_confirmed';
    // An old confirmation link must not undo an unsubscribe; subscribing again
    // moves the doc back to pending first.
    if (status === 'unsubscribed') return 'unsubscribed';

    await ref.update({ status: 'confirmed' satisfies SubscriberStatus, confirmedAt: Timestamp.now() });
    return 'confirmed';
}
