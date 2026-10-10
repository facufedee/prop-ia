import { adminDb } from '@/infrastructure/firebase/admin';
import { buildOneClickUnsubscribeUrl } from '@/lib/unsubscribeToken';

/**
 * Unsubscribe handling for marketing emails.
 *
 * Templates (in the repo and copies stored in Firestore `emailTemplates`) may
 * still carry the legacy unsigned unsubscribe link (an `email` query param), which the
 * unsubscribe page rejects. Links are therefore rewritten at send time to the
 * signed URL from `unsubscribeToken.ts`, or to the `{{unsubscribeUrl}}`
 * placeholder's value for templates that already use it.
 */

/** Generic unsubscribe page, used when the recipient is not a known user. */
export const UNSUBSCRIBE_PAGE_URL = 'https://zetaprop.com.ar/unsubscribe';

/**
 * Monitored inbox for mailto unsubscribes. Mirrors NEWSLETTER_REPLY_TO in
 * `src/lib/newsletter/sendNewsletter.ts`; duplicated to avoid a circular import
 * (that module imports `@/lib/resend`).
 */
const UNSUBSCRIBE_MAILTO = 'zetaprop.com.ar@gmail.com';

/** Legacy unsigned link: everything up to a quote, angle bracket or whitespace. */
const LEGACY_LINK = /https?:\/\/(?:www\.)?zetaprop\.com\.ar\/unsubscribe\?email=[^"'<>\s]*/g;
const PLACEHOLDER = /\{\{\s*unsubscribeUrl\s*\}\}/g;

export interface RewriteOptions {
    /** When true (default) the URL is escaped for use inside an HTML attribute. */
    html?: boolean;
}

export function rewriteUnsubscribeLinks(content: string, url: string, { html = true }: RewriteOptions = {}): string {
    const replacement = html ? url.replace(/&/g, '&amp;') : url;
    return content.replace(LEGACY_LINK, () => replacement).replace(PLACEHOLDER, () => replacement);
}

/** RFC 8058 one-click headers, same format as the blog newsletter. */
export function buildListUnsubscribeHeaders(userId: string): Record<string, string> {
    return {
        'List-Unsubscribe': `<${buildOneClickUnsubscribeUrl(userId)}>, <mailto:${UNSUBSCRIBE_MAILTO}?subject=unsubscribe>`,
        'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click',
    };
}

export interface MarketingRecipient {
    userId: string;
    unsubscribed: boolean;
}

/**
 * Resolves the recipient of a marketing email to a user document, by id when
 * given, otherwise by email (lowercased first, then the original casing).
 * Returns null for recipients that are not users. Firestore errors propagate so
 * a possibly-unsubscribed user is never emailed on a failed lookup.
 */
export async function resolveMarketingRecipient(email: string, userId?: string): Promise<MarketingRecipient | null> {
    const users = adminDb.collection('users');

    if (userId) {
        const snap = await users.doc(userId).get();
        if (snap.exists) {
            return { userId: snap.id, unsubscribed: snap.data()?.unsubscribedMarketing === true };
        }
    }

    const trimmed = email.trim();
    const candidates = Array.from(new Set([trimmed.toLowerCase(), trimmed]));
    for (const candidate of candidates) {
        const result = await users.where('email', '==', candidate).limit(1).get();
        if (!result.empty) {
            const doc = result.docs[0];
            return { userId: doc.id, unsubscribed: doc.data()?.unsubscribedMarketing === true };
        }
    }

    return null;
}
