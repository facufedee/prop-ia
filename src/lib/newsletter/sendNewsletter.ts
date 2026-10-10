import { createHash } from 'crypto';
import { Timestamp, type DocumentData, type DocumentReference } from 'firebase-admin/firestore';
import { adminDb } from '@/infrastructure/firebase/admin';
import { resendClient } from '@/lib/resend';
import { buildOneClickUnsubscribeUrl, buildUnsubscribeUrl } from '@/lib/unsubscribeToken';
import { renderNewsletter, type NewsletterPost } from './template';

export const NEWSLETTER_FROM = 'Zeta Prop <newsletter@zetaprop.com.ar>';
/** Monitored inbox for replies and mailto unsubscribes. Change here only. */
export const NEWSLETTER_REPLY_TO = 'zetaprop.com.ar@gmail.com';

const MIN_POSTS = 2;
/** Upper bound of posts per issue, so a backlog never produces a giant email. */
const MAX_POSTS_PER_ISSUE = 4;
/** Resend batch API limit. */
const BATCH_SIZE = 100;
/** A 'sending' issue older than this is assumed crashed and may be retried. */
const STALE_SENDING_MS = 30 * 60 * 1000;
const TEST_USER_ID = 'test';

interface PendingPost extends NewsletterPost {
    id: string;
    ref: DocumentReference;
}

interface Recipient {
    userId: string;
    email: string;
    name?: string;
}

export type SendNewsletterResult =
    | { status: 'skipped'; reason: 'not_enough_posts'; pending: number }
    | { status: 'skipped'; reason: 'already_sent' | 'in_progress'; newsletterId: string; posts: string[] }
    | { status: 'dry_run'; recipients: number; posts: string[]; pending: number }
    | { status: 'test_sent'; to: string; posts: string[]; emailId: string | null }
    | {
          status: 'sent' | 'partial' | 'failed';
          newsletterId: string;
          posts: string[];
          recipients: number;
          sent: number;
          failed: number;
          errors: string[];
      };

export interface SendNewsletterOptions {
    dryRun?: boolean;
    testTo?: string;
}

type TimestampLike = { toMillis?: () => number } | null | undefined;

function millis(value: unknown): number {
    const ts = value as TimestampLike;
    return typeof ts?.toMillis === 'function' ? ts.toMillis() : 0;
}

/** Published posts never included in a newsletter, newest first. Filtered in memory to avoid a composite index. */
export async function getPendingPosts(): Promise<PendingPost[]> {
    const snap = await adminDb.collection('blog_posts').where('published', '==', true).get();

    return snap.docs
        .map((doc) => ({ doc, data: doc.data() }))
        .filter(({ data }) => !data.newsletterSentAt && typeof data.slug === 'string' && data.slug)
        .sort((a, b) =>
            millis(b.data.publishedAt ?? b.data.createdAt) - millis(a.data.publishedAt ?? a.data.createdAt))
        .map(({ doc, data }) => ({
            id: doc.id,
            ref: doc.ref,
            title: String(data.title ?? ''),
            slug: String(data.slug),
            excerpt: typeof data.excerpt === 'string' ? data.excerpt : undefined,
            imageUrl: typeof data.imageUrl === 'string' ? data.imageUrl : undefined,
            category: typeof data.category === 'string' ? data.category : undefined,
        }));
}

async function loadUsers(): Promise<{ id: string; data: DocumentData }[]> {
    const snap = await adminDb.collection('users').get();
    return snap.docs.map((doc) => ({ id: doc.id, data: doc.data() }));
}

function toRecipients(users: { id: string; data: DocumentData }[]): Recipient[] {
    const byEmail = new Map<string, Recipient>();
    for (const { id, data } of users) {
        const email = typeof data.email === 'string' ? data.email.trim() : '';
        if (!email || data.unsubscribedMarketing === true) continue;

        const key = email.toLowerCase();
        if (byEmail.has(key)) continue;
        byEmail.set(key, {
            userId: id,
            email,
            name: typeof data.displayName === 'string' ? data.displayName : undefined,
        });
    }
    // Deterministic order keeps batch chunks (and their idempotency keys) stable across retries.
    return [...byEmail.values()].sort((a, b) => a.email.toLowerCase().localeCompare(b.email.toLowerCase()));
}

/** Users with a non-empty email who did not unsubscribe, deduped by lowercase email. */
export async function getRecipients(): Promise<Recipient[]> {
    return toRecipients(await loadUsers());
}

function buildEmail(posts: NewsletterPost[], recipient: Recipient) {
    const { subject, html, text } = renderNewsletter({
        posts,
        unsubscribeUrl: buildUnsubscribeUrl(recipient.userId),
        recipientName: recipient.name,
    });
    const oneClickUrl = buildOneClickUnsubscribeUrl(recipient.userId);

    return {
        from: NEWSLETTER_FROM,
        to: [recipient.email],
        replyTo: NEWSLETTER_REPLY_TO,
        subject,
        html,
        text,
        headers: {
            'List-Unsubscribe': `<${oneClickUrl}>, <mailto:${NEWSLETTER_REPLY_TO}?subject=unsubscribe>`,
            'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click',
        },
    };
}

function requireResend() {
    if (!resendClient) {
        throw new Error('Resend is not configured (RESEND_API_KEY missing)');
    }
    return resendClient;
}

function chunk<T>(items: T[], size: number): T[][] {
    const chunks: T[][] = [];
    for (let i = 0; i < items.length; i += size) chunks.push(items.slice(i, i + size));
    return chunks;
}

async function sendTest(posts: PendingPost[], testTo: string): Promise<SendNewsletterResult> {
    const client = requireResend();
    const users = await loadUsers();
    const match = users.find(
        (u) => typeof u.data.email === 'string' && u.data.email.trim().toLowerCase() === testTo.trim().toLowerCase()
    );

    const email = buildEmail(posts, {
        userId: match?.id ?? TEST_USER_ID,
        email: testTo,
        name: typeof match?.data.displayName === 'string' ? match.data.displayName : undefined,
    });
    const { data, error } = await client.emails.send(email);
    if (error) {
        throw new Error(`Resend API error (${error.name}): ${error.message}`);
    }

    return { status: 'test_sent', to: testTo, posts: posts.map((p) => p.slug), emailId: data?.id ?? null };
}

/**
 * Sends the newest pending blog posts to every subscribed user.
 *
 * - `dryRun`: report what would be sent; no email, no writes.
 * - `testTo`: send one email to that address; posts are not marked.
 * - Otherwise: full send guarded by the `newsletters/<slugs>` idempotency doc.
 */
export async function sendNewsletter({ dryRun = false, testTo }: SendNewsletterOptions = {}): Promise<SendNewsletterResult> {
    const pending = await getPendingPosts();
    if (pending.length < MIN_POSTS) {
        return { status: 'skipped', reason: 'not_enough_posts', pending: pending.length };
    }

    const posts = pending.slice(0, MAX_POSTS_PER_ISSUE);
    const slugs = posts.map((p) => p.slug);

    if (dryRun) {
        const recipients = await getRecipients();
        return { status: 'dry_run', recipients: recipients.length, posts: slugs, pending: pending.length };
    }

    if (testTo) {
        return sendTest(posts, testTo);
    }

    const client = requireResend();
    const newsletterId = [...slugs].sort().join('__');
    const newsletterRef = adminDb.collection('newsletters').doc(newsletterId);

    const blockedBy = await adminDb.runTransaction(async (tx) => {
        const snap = await tx.get(newsletterRef);
        const existing = snap.exists ? snap.data() : undefined;
        if (existing?.status === 'sent' || existing?.status === 'partial') return 'already_sent' as const;
        if (existing?.status === 'sending' && Date.now() - millis(existing.startedAt) < STALE_SENDING_MS) {
            return 'in_progress' as const;
        }
        tx.set(newsletterRef, {
            status: 'sending',
            posts: slugs,
            startedAt: Timestamp.now(),
        });
        return null;
    });
    if (blockedBy) {
        return { status: 'skipped', reason: blockedBy, newsletterId, posts: slugs };
    }

    const recipients = await getRecipients();
    let sent = 0;
    let failed = 0;
    const errors: string[] = [];

    for (const [index, group] of chunk(recipients, BATCH_SIZE).entries()) {
        // Same recipients for the same issue reuse the key, so a retried run within
        // Resend's 24h idempotency window does not deliver the chunk twice.
        const idempotencyKey = `newsletter-${createHash('sha256')
            .update(`${newsletterId}|${group.map((r) => r.email).join(',')}`)
            .digest('hex')
            .slice(0, 32)}`;
        try {
            const { error } = await client.batch.send(
                group.map((r) => buildEmail(posts, r)),
                { idempotencyKey }
            );
            if (error) {
                failed += group.length;
                errors.push(`chunk ${index}: ${error.name}: ${error.message}`);
            } else {
                sent += group.length;
            }
        } catch (err) {
            failed += group.length;
            errors.push(`chunk ${index}: ${err instanceof Error ? err.message : String(err)}`);
        }
    }

    const status = sent === 0 && failed > 0 ? 'failed' : failed > 0 ? 'partial' : 'sent';

    if (status !== 'failed') {
        const sentAt = Timestamp.now();
        await Promise.all(posts.map((p) => p.ref.update({ newsletterSentAt: sentAt })));
    }

    await newsletterRef.update({
        status,
        recipients: recipients.length,
        sent,
        failed,
        errors: errors.slice(0, 20),
        sentAt: Timestamp.now(),
    });

    if (errors.length) {
        console.error(`[Newsletter] ${newsletterId}: ${failed} failed`, errors);
    }

    return { status, newsletterId, posts: slugs, recipients: recipients.length, sent, failed, errors };
}
