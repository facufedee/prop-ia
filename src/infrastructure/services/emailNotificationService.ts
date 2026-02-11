import { db } from "@/infrastructure/firebase/client";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { postmarkClient } from "@/lib/email";

export interface NotificationSettings {
    enabled: boolean;
    recipients: string[];
    events: {
        newUser: boolean;
        newPayment: boolean;
        newLead: boolean;
        subscriptionCancelled: boolean;
        newTicket: boolean;
    };
}

const DEFAULT_SETTINGS: NotificationSettings = {
    enabled: false,
    recipients: [],
    events: {
        newUser: false,
        newPayment: false,
        newLead: false,
        subscriptionCancelled: false,
        newTicket: false
    }
};

const SETTINGS_DOC_REF = "email_notifications"; // Document ID in 'settings' collection

export const emailNotificationService = {
    getSettings: async (): Promise<NotificationSettings> => {
        if (!db) return DEFAULT_SETTINGS;
        const ref = doc(db, "settings", SETTINGS_DOC_REF);
        const snap = await getDoc(ref);

        if (snap.exists()) {
            const data = snap.data();
            return {
                ...DEFAULT_SETTINGS,
                ...data,
                events: {
                    ...DEFAULT_SETTINGS.events,
                    ...(data.events || {})
                }
            } as NotificationSettings;
        }
        return DEFAULT_SETTINGS;
    },

    updateSettings: async (settings: NotificationSettings): Promise<void> => {
        if (!db) throw new Error("Firestore not initialized");
        const ref = doc(db, "settings", SETTINGS_DOC_REF);
        await setDoc(ref, settings, { merge: true });
    },

    sendNotification: async (event: keyof NotificationSettings['events'], data: any, subject: string, message: string) => {
        // 1. Check if notifications are enabled globally
        const settings = await emailNotificationService.getSettings();
        if (!settings.enabled || settings.recipients.length === 0) return;

        // 2. Check if specific event is enabled
        if (!settings.events[event]) return;

        // 3. Send Email
        if (!postmarkClient) {
            console.warn("Postmark client not configured");
            return;
        }

        try {
            await postmarkClient.sendEmail({
                "From": "facundo@zetaprop.com.ar",
                "To": settings.recipients.join(","),
                "Subject": `[ZetaProp Alerta] ${subject}`,
                "HtmlBody": `
                    <h2>Nueva Notificación de ZetaProp</h2>
                    <p><strong>Evento:</strong> ${event}</p>
                    <p>${message}</p>
                    <hr />
                    <h3>Datos:</h3>
                    <pre>${JSON.stringify(data, null, 2)}</pre>
                `,
                "TextBody": `Nueva Notificación: ${subject}. ${message}`
            });
            console.log(`Notification sent for ${event} to ${settings.recipients.length} recipients.`);
        } catch (error) {
            console.error("Failed to send email notification", error);
        }
    },

    sendTestEmail: async (recipients: string[]): Promise<boolean> => {
        if (!postmarkClient) return false;
        try {
            await postmarkClient.sendEmail({
                "From": "facundo@zetaprop.com.ar",
                "To": recipients.join(","),
                "Subject": "[ZetaProp] Email de Prueba",
                "HtmlBody": `
                    <h2>¡Funciona!</h2>
                    <p>Este es un correo de prueba para verificar la integración de notificaciones de ZetaProp.</p>
                    <p>Si estás viendo esto, la configuración de Postmark es correcta.</p>
                `,
                "TextBody": "Este es un correo de prueba de ZetaProp. Si lo lees, funciona."
            });
            return true;
        } catch (e) {
            console.error("Test email failed:", e);
            return false;
        }
    }
};
