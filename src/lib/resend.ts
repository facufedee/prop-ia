import { Resend } from 'resend';

const resendApiKey = process.env.RESEND_API_KEY;

if (!resendApiKey && process.env.NODE_ENV === 'production') {
    console.warn('[Resend] RESEND_API_KEY is not set in environment variables.');
}

export const resendClient = resendApiKey ? new Resend(resendApiKey) : null;

export const FROM_EMAIL = 'ZetaProp <notificaciones@zetaprop.com.ar>';

export interface SendEmailOptions {
    to: string | string[];
    subject: string;
    html: string;
    from?: string;
}

/**
 * Send an email using Resend.
 * Returns the Resend data response or null if client is not configured.
 */
export async function sendEmailWithResend(options: SendEmailOptions) {
    if (!resendClient) {
        console.warn('[Resend] Client not initialized. Skipping email send.');
        return null;
    }

    const { to, subject, html, from = FROM_EMAIL } = options;

    try {
        const data = await resendClient.emails.send({
            from,
            to: Array.isArray(to) ? to : [to],
            subject,
            html,
        });

        console.log(`[Resend] Email sent to ${Array.isArray(to) ? to.join(', ') : to} - ID: ${data.data?.id}`);
        return data;
    } catch (error) {
        console.error('[Resend] Error sending email:', error);
        throw error;
    }
}
