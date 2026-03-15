import { adminDb } from '@/infrastructure/firebase/admin';
import { sendEmailWithResend } from '@/lib/resend';
import { Timestamp } from 'firebase-admin/firestore';

// ======= Template Types =======
export type EmailTemplateType = 'welcome' | 'payment_confirmed' | 'payment_expiring' | 'new_lead';

export interface EmailTemplate {
    id?: string;
    type: EmailTemplateType;
    name: string;
    subject: string;
    html: string;
    isCustom?: boolean;
    updatedAt?: Date;
    updatedBy?: string;
}

export interface EmailLog {
    id?: string;
    type: EmailTemplateType;
    to: string;
    subject: string;
    status: 'sent' | 'failed';
    error?: string;
    sentAt: Date;
    metadata?: Record<string, any>;
}

const EMAIL_TEMPLATES_COLLECTION = 'emailTemplates';
const EMAIL_LOGS_COLLECTION = 'emailLogs';

// ======= Template Renderer Helpers =======
async function renderTemplate(component: React.ComponentType<any>, props: any): Promise<string> {
    const React = (await import('react')).default;
    const ReactDOMServer = (await import('react-dom/server')).default;
    return ReactDOMServer.renderToStaticMarkup(React.createElement(component, props));
}

// ======= Log Helper =======
async function logEmail(log: Omit<EmailLog, 'id'>): Promise<void> {
    try {
        await adminDb.collection(EMAIL_LOGS_COLLECTION).add({
            ...log,
            sentAt: Timestamp.fromDate(log.sentAt),
        });
    } catch (err) {
        console.error('[MarketingEmailService] Failed to log email:', err);
    }
}

// ======= Get Custom Template =======
async function getCustomTemplate(type: EmailTemplateType): Promise<EmailTemplate | null> {
    try {
        const snap = await adminDb
            .collection(EMAIL_TEMPLATES_COLLECTION)
            .where('type', '==', type)
            .limit(1)
            .get();

        if (!snap.empty) {
            const doc = snap.docs[0];
            return { id: doc.id, ...doc.data() } as EmailTemplate;
        }
        return null;
    } catch (err) {
        console.error('[MarketingEmailService] Failed to get custom template:', err);
        return null;
    }
}

// ======= Main Service =======
export const marketingEmailService = {
    // ---------- SEND WELCOME ----------
    sendWelcomeEmail: async (to: string, data: { userName?: string; email?: string }) => {
        try {
            const customTemplate = await getCustomTemplate('welcome');
            let html: string;
            let subject = customTemplate?.subject || '¡Bienvenido/a a ZetaProp! 🎉';

            if (customTemplate?.html) {
                html = customTemplate.html
                    .replace(/\{\{userName\}\}/g, data.userName || 'Usuario')
                    .replace(/\{\{email\}\}/g, data.email || to);
            } else {
                const { WelcomeEmail } = await import('@/ui/emails/WelcomeEmail');
                html = await renderTemplate(WelcomeEmail, data);
            }

            await sendEmailWithResend({ to, subject, html });

            await logEmail({
                type: 'welcome',
                to,
                subject,
                status: 'sent',
                sentAt: new Date(),
                metadata: { userName: data.userName },
            });
        } catch (error: any) {
            console.error('[MarketingEmailService] sendWelcomeEmail failed:', error);
            await logEmail({
                type: 'welcome',
                to,
                subject: '¡Bienvenido/a a ZetaProp!',
                status: 'failed',
                error: error?.message,
                sentAt: new Date(),
            });
        }
    },

    // ---------- SEND PAYMENT CONFIRMED ----------
    sendPaymentConfirmedEmail: async (
        to: string,
        data: { userName?: string; planName?: string; amount?: number | string; period?: string; endDate?: string }
    ) => {
        try {
            const customTemplate = await getCustomTemplate('payment_confirmed');
            let html: string;
            let subject = customTemplate?.subject || `¡Tu suscripción a ${data.planName || 'ZetaProp'} fue activada! ✅`;

            if (customTemplate?.html) {
                html = customTemplate.html
                    .replace(/\{\{userName\}\}/g, data.userName || 'Usuario')
                    .replace(/\{\{planName\}\}/g, data.planName || 'Plan PRO')
                    .replace(/\{\{amount\}\}/g, String(data.amount || ''))
                    .replace(/\{\{period\}\}/g, data.period === 'yearly' ? 'Anual' : 'Mensual')
                    .replace(/\{\{endDate\}\}/g, data.endDate || '');
            } else {
                const { PaymentConfirmedEmail } = await import('@/ui/emails/PaymentConfirmedEmail');
                html = await renderTemplate(PaymentConfirmedEmail, data);
            }

            await sendEmailWithResend({ to, subject, html });

            await logEmail({
                type: 'payment_confirmed',
                to,
                subject,
                status: 'sent',
                sentAt: new Date(),
                metadata: data,
            });
        } catch (error: any) {
            console.error('[MarketingEmailService] sendPaymentConfirmedEmail failed:', error);
            await logEmail({
                type: 'payment_confirmed',
                to,
                subject: 'Pago Confirmado',
                status: 'failed',
                error: error?.message,
                sentAt: new Date(),
            });
        }
    },

    // ---------- SEND PAYMENT EXPIRING ----------
    sendPaymentExpiringEmail: async (
        to: string,
        data: { userName?: string; planName?: string; expiryDate?: string; daysLeft?: number }
    ) => {
        try {
            const customTemplate = await getCustomTemplate('payment_expiring');
            let html: string;
            let subject = customTemplate?.subject || `Tu suscripción a ZetaProp vence en ${data.daysLeft || 7} días ⏰`;

            if (customTemplate?.html) {
                html = customTemplate.html
                    .replace(/\{\{userName\}\}/g, data.userName || 'Usuario')
                    .replace(/\{\{planName\}\}/g, data.planName || 'Plan PRO')
                    .replace(/\{\{expiryDate\}\}/g, data.expiryDate || '')
                    .replace(/\{\{daysLeft\}\}/g, String(data.daysLeft || 7));
            } else {
                const { PaymentExpiringEmail } = await import('@/ui/emails/PaymentExpiringEmail');
                html = await renderTemplate(PaymentExpiringEmail, data);
            }

            await sendEmailWithResend({ to, subject, html });

            await logEmail({
                type: 'payment_expiring',
                to,
                subject,
                status: 'sent',
                sentAt: new Date(),
                metadata: data,
            });
        } catch (error: any) {
            console.error('[MarketingEmailService] sendPaymentExpiringEmail failed:', error);
            await logEmail({
                type: 'payment_expiring',
                to,
                subject: 'Suscripción por vencer',
                status: 'failed',
                error: error?.message,
                sentAt: new Date(),
            });
        }
    },

    // ---------- SEND NEW LEAD ----------
    sendNewLeadEmail: async (
        to: string,
        data: {
            agentName?: string;
            leadName?: string;
            leadEmail?: string;
            leadPhone?: string;
            propertyName?: string;
            propertyAddress?: string;
            message?: string;
        }
    ) => {
        try {
            const customTemplate = await getCustomTemplate('new_lead');
            let html: string;
            let subject = customTemplate?.subject || `🎉 ¡Tenés una nueva consulta en ZetaProp!`;

            if (customTemplate?.html) {
                html = customTemplate.html
                    .replace(/\{\{agentName\}\}/g, data.agentName || 'Agente')
                    .replace(/\{\{leadName\}\}/g, data.leadName || 'Un interesado')
                    .replace(/\{\{propertyName\}\}/g, data.propertyName || '')
                    .replace(/\{\{message\}\}/g, data.message || '');
            } else {
                const { NewLeadEmail } = await import('@/ui/emails/NewLeadEmail');
                html = await renderTemplate(NewLeadEmail, data);
            }

            await sendEmailWithResend({ to, subject, html });

            await logEmail({
                type: 'new_lead',
                to,
                subject,
                status: 'sent',
                sentAt: new Date(),
                metadata: data,
            });
        } catch (error: any) {
            console.error('[MarketingEmailService] sendNewLeadEmail failed:', error);
            await logEmail({
                type: 'new_lead',
                to,
                subject: 'Nueva consulta recibida',
                status: 'failed',
                error: error?.message,
                sentAt: new Date(),
            });
        }
    },

    // ---------- TEMPLATE MANAGEMENT ----------
    getTemplates: async (): Promise<EmailTemplate[]> => {
        const snap = await adminDb.collection(EMAIL_TEMPLATES_COLLECTION).get();
        return snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as EmailTemplate));
    },

    saveTemplate: async (template: Omit<EmailTemplate, 'id'>, updatedBy?: string): Promise<string> => {
        // Check if a template of this type already exists
        const existing = await adminDb
            .collection(EMAIL_TEMPLATES_COLLECTION)
            .where('type', '==', template.type)
            .limit(1)
            .get();

        const data = {
            ...template,
            isCustom: true,
            updatedAt: Timestamp.now(),
            updatedBy: updatedBy || 'system',
        };

        if (!existing.empty) {
            const docId = existing.docs[0].id;
            await adminDb.collection(EMAIL_TEMPLATES_COLLECTION).doc(docId).set(data, { merge: true });
            return docId;
        } else {
            const ref = await adminDb.collection(EMAIL_TEMPLATES_COLLECTION).add(data);
            return ref.id;
        }
    },

    deleteTemplate: async (id: string): Promise<void> => {
        await adminDb.collection(EMAIL_TEMPLATES_COLLECTION).doc(id).delete();
    },

    // ---------- EMAIL LOGS ----------
    getEmailLogs: async (limit = 50): Promise<EmailLog[]> => {
        const snap = await adminDb
            .collection(EMAIL_LOGS_COLLECTION)
            .orderBy('sentAt', 'desc')
            .limit(limit)
            .get();

        return snap.docs.map(doc => {
            const data = doc.data();
            return {
                id: doc.id,
                ...data,
                sentAt: data.sentAt?.toDate() || new Date(),
            } as EmailLog;
        });
    },

    getEmailStats: async (): Promise<Record<EmailTemplateType, { sent: number; failed: number }>> => {
        const snap = await adminDb.collection(EMAIL_LOGS_COLLECTION).get();
        const stats: Record<string, { sent: number; failed: number }> = {
            welcome: { sent: 0, failed: 0 },
            payment_confirmed: { sent: 0, failed: 0 },
            payment_expiring: { sent: 0, failed: 0 },
            new_lead: { sent: 0, failed: 0 },
        };

        snap.docs.forEach(doc => {
            const { type, status } = doc.data();
            if (stats[type]) {
                if (status === 'sent') stats[type].sent++;
                else if (status === 'failed') stats[type].failed++;
            }
        });

        return stats as Record<EmailTemplateType, { sent: number; failed: number }>;
    },
};
