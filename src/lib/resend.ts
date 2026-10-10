import { Resend } from 'resend';

const resendApiKey = process.env.RESEND_API_KEY;

if (!resendApiKey && process.env.NODE_ENV === 'production') {
    console.warn('[Resend] RESEND_API_KEY is not set in environment variables.');
}

export const resendClient = resendApiKey ? new Resend(resendApiKey) : null;

export const FROM_EMAIL = 'ZetaProp <notificaciones@zetaprop.com.ar>';

// Templates stored in Firestore (emailTemplates) still reference a logo file that
// no longer exists, so it is swapped at send time instead of migrating the data.
const RETIRED_LOGO_URL = 'https://zetaprop.com.ar/assets/img/logo_zeta_prop_marzo.jpeg';
const CURRENT_LOGO_URL = 'https://zetaprop.com.ar/assets/img/logo_zeta_prop_transparent.png';

export interface MarketingSendOptions {
    /** Recipient's user id; when omitted the user is looked up by email. */
    userId?: string;
}

export interface SendEmailOptions {
    to: string | string[];
    subject: string;
    html: string;
    text?: string;
    from?: string;
    /**
     * Marks the email as marketing: unsubscribed users are skipped, unsubscribe
     * links are rewritten to a signed URL and List-Unsubscribe headers added.
     * Requires a single recipient.
     */
    marketing?: MarketingSendOptions;
}

/** Returned instead of sending when a marketing recipient has unsubscribed. */
export interface SkippedEmailResult {
    data: null;
    error: null;
    skipped: 'unsubscribed';
}

type ResendPayload = Parameters<Resend['emails']['send']>[0];

/**
 * Applies marketing unsubscribe handling to the payload. Returns null when the
 * recipient unsubscribed and the email must not be sent.
 */
async function applyMarketing(
    payload: { to: string[]; html: string; text?: string },
    marketing: MarketingSendOptions
): Promise<{ html: string; text?: string; headers?: Record<string, string> } | null> {
    if (payload.to.length !== 1) {
        throw new Error('[Resend] Marketing emails require a single recipient');
    }

    // Loaded lazily so non-marketing callers do not pull in firebase-admin.
    const { resolveMarketingRecipient, rewriteUnsubscribeLinks, buildListUnsubscribeHeaders, UNSUBSCRIBE_PAGE_URL } =
        await import('@/lib/marketingUnsubscribe');
    const { buildUnsubscribeUrl } = await import('@/lib/unsubscribeToken');

    const recipient = await resolveMarketingRecipient(payload.to[0], marketing.userId);
    if (recipient?.unsubscribed) return null;

    const url = recipient ? buildUnsubscribeUrl(recipient.userId) : UNSUBSCRIBE_PAGE_URL;
    return {
        html: rewriteUnsubscribeLinks(payload.html, url),
        text: payload.text === undefined ? undefined : rewriteUnsubscribeLinks(payload.text, url, { html: false }),
        headers: recipient ? buildListUnsubscribeHeaders(recipient.userId) : undefined,
    };
}

/**
 * Send an email using Resend.
 * Returns the Resend data response, null if the client is not configured, or a
 * `SkippedEmailResult` when a marketing recipient has unsubscribed.
 */
export async function sendEmailWithResend(options: SendEmailOptions) {
    if (!resendClient) {
        console.warn('[Resend] Client not initialized. Skipping email send.');
        return null;
    }

    const { subject, from = FROM_EMAIL, marketing } = options;
    const to = Array.isArray(options.to) ? options.to : [options.to];
    let { text } = options;
    let html = options.html.split(RETIRED_LOGO_URL).join(CURRENT_LOGO_URL);
    let headers: Record<string, string> | undefined;

    try {
        if (marketing) {
            const prepared = await applyMarketing({ to, html, text }, marketing);
            if (!prepared) {
                console.log(`[Resend] Skipping marketing email to ${to[0]}: recipient unsubscribed`);
                const skipped: SkippedEmailResult = { data: null, error: null, skipped: 'unsubscribed' };
                return skipped;
            }
            ({ html, text, headers } = prepared);
        }

        const payload: ResendPayload = { from, to, subject, html };
        if (text !== undefined) payload.text = text;
        if (headers) payload.headers = headers;

        const data = await resendClient.emails.send(payload);

        // The Resend SDK reports API failures (invalid key, unverified domain, etc.)
        // in `error` instead of throwing, so surface them explicitly.
        if (data.error) {
            throw new Error(`Resend API error (${data.error.name}): ${data.error.message}`);
        }

        console.log(`[Resend] Email sent to ${to.join(', ')} - ID: ${data.data?.id}`);
        return data;
    } catch (error) {
        console.error('[Resend] Error sending email:', error);
        throw error;
    }
}

/** True when `sendEmailWithResend` skipped the email because the user unsubscribed. */
export function isSkippedEmail(result: unknown): result is SkippedEmailResult {
    return !!result && typeof result === 'object' && (result as { skipped?: unknown }).skipped === 'unsubscribed';
}
