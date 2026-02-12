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
    },

    sendWelcomeEmail: async (to: string, name: string): Promise<{ success: boolean; error?: any }> => {
        console.log(`[Service] Attempting to send welcome email to ${to}`);
        if (!postmarkClient) {
            const msg = "[Service] Postmark client not configured for welcome email";
            console.warn(msg);
            return { success: false, error: msg };
        }

        const firstName = name ? name.split(' ')[0] : 'Hola';

        try {
            await postmarkClient.sendEmail({
                "From": "facundo@zetaprop.com.ar",
                "To": to,
                "Subject": "Bienvenido/a a Zeta Prop 🚀 | Cargá tu primer alquiler hoy",
                "HtmlBody": `
                    <div style="font-family: Arial, sans-serif; color: #333; line-height: 1.6;">
                        <p>Hola ${firstName},</p>
                        
                        <p>Gracias por registrarte en Zeta Prop.</p>
                        
                        <p>Ya podés comenzar a organizar tu gestión desde hoy mismo.</p>
                        
                        <p>Para empezar, te recomiendo estos pasos simples:</p>
                        
                        <ol>
                            <li>Cargar una propiedad</li>
                            <li>Agregar el propietario</li>
                            <li>Incorporar el inquilino</li>
                            <li>Registrar el contrato (aunque ya esté avanzado)</li>
                            <li>Cargar pagos y vencimientos</li>
                        </ol>
                        
                        <p>No importa si el alquiler ya está en curso. Podés ingresar contratos vigentes y continuar la gestión desde el punto en el que estás hoy.</p>
                        
                        <p>La idea es que tengas todo centralizado: propiedades, contratos, aumentos y cobranzas en un solo lugar.</p>
                        
                        <p>Si en algún momento necesitás ayuda o querés sugerir mejoras, podés escribirme directamente a este mail.</p>
                        
                        <p>Estoy para ayudarte.</p>
                        
                        <p><strong>Facundo</strong><br>
                        Zeta Prop<br>
                        <a href="https://zetaprop.com.ar">https://zetaprop.com.ar</a></p>
                        
                        <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;">
                        
                        <p style="color: #666; font-size: 0.9em;">
                            👉 <strong>Consejo:</strong> empezá cargando solo un alquiler. En menos de 10 minutos vas a ver cómo funciona todo el sistema.
                        </p>
                    </div>
                `,
                "TextBody": `Hola ${firstName},\n\nGracias por registrarte en Zeta Prop.\n\nYa podés comenzar a organizar tu gestión desde hoy mismo.\n\nPara empezar, te recomiendo estos pasos simples:\n1. Cargar una propiedad\n2. Agregar el propietario\n3. Incorporar el inquilino\n4. Registrar el contrato (aunque ya esté avanzado)\n5. Cargar pagos y vencimientos\n\nNo importa si el alquiler ya está en curso. Podés ingresar contratos vigentes y continuar la gestión desde el punto en el que estás hoy.\n\nLa idea es que tengas todo centralizado: propiedades, contratos, aumentos y cobranzas en un solo lugar.\n\nSi en algún momento necesitás ayuda o querés sugerir mejoras, podés escribirme directamente a este mail.\n\nEstoy para ayudarte.\n\nFacundo\nZeta Prop\nhttps://zetaprop.com.ar\n\nConsejo: empezá cargando solo un alquiler. En menos de 10 minutos vas a ver cómo funciona todo el sistema.`
            });
            console.log(`Welcome email sent to ${to}`);
            return { success: true };
        } catch (e: any) {
            console.error("Welcome email failed:", e);
            // Return specific error message
            return { success: false, error: e.message || JSON.stringify(e) };
        }
    }
};
