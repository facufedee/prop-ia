import { db } from "@/infrastructure/firebase/client";
import { doc, getDoc, setDoc, collection, addDoc, query, where, getDocs, limit } from "firebase/firestore";

const logSentEmail = async (to: string, subject: string, templateKey: string, status: 'success' | 'error', errorMsg?: string) => {
    if (!db) return;
    try {
        await addDoc(collection(db, "sent_emails"), {
            to,
            subject,
            templateKey,
            status,
            error: errorMsg || null,
            sentAt: new Date().toISOString()
        });
    } catch (e) {
        console.error("Failed to log email to Firestore", e);
    }
};

const isUnsubscribed = async (email: string): Promise<boolean> => {
    if (!db) return false;
    try {
        const q = query(collection(db, "users"), where("email", "==", email), limit(1));
        const querySnapshot = await getDocs(q);
        if (querySnapshot.empty) return false;
        const userData = querySnapshot.docs[0].data();
        return userData.unsubscribedMarketing === true;
    } catch (e) {
        console.error("Error checking unsubscribe status:", e);
        return false;
    }
};
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
                "From": "Facundo Zeta <facundo@zetaprop.com.ar>",
                "ReplyTo": "facundo@zetaprop.com.ar",
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
                "From": "Facundo Zeta <facundo@zetaprop.com.ar>",
                "ReplyTo": "facundo@zetaprop.com.ar",
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

        // Check if user is unsubscribed
        const unsubscribed = await isUnsubscribed(to);
        if (unsubscribed) {
            console.log(`[Service] User ${to} is unsubscribed. Skipping welcome marketing email.`);
            return { success: true };
        }

        try {
            await postmarkClient.sendEmail({
                "From": "Facundo Zeta <facundo@zetaprop.com.ar>",
                "ReplyTo": "facundo@zetaprop.com.ar",
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
                        <a href="https://zetaprop.com.ar">zetaprop.com.ar</a></p>
                        
                        <p style="font-size: 0.9em; color: #666;">
                            Ingresá al portal: <a href="https://zetaprop.com.ar/login">zetaprop.com.ar/login</a>
                        </p>
                        
                        <p style="font-size: 0.8em; color: #999; margin-top: 10px;">
                            ¿No querés recibir más estos correos? <a href="https://zetaprop.com.ar/unsubscribe?email=${to}">Darse de baja</a>
                        </p>
                        
                        <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;">
                        
                        <p style="color: #666; font-size: 0.9em;">
                            👉 <strong>Consejo:</strong> empezá cargando solo un alquiler. En menos de 10 minutos vas a ver cómo funciona todo el sistema.
                        </p>
                    </div>
                `,
                "TextBody": `Hola ${firstName},\n\nGracias por registrarte en Zeta Prop.\n\nYa podés comenzar a organizar tu gestión desde hoy mismo.\n\nPara empezar, te recomiendo estos pasos simples:\n1. Cargar una propiedad\n2. Agregar el propietario\n3. Incorporar el inquilino\n4. Registrar el contrato (aunque ya esté avanzado)\n5. Cargar pagos y vencimientos\n\nNo importa si el alquiler ya está en curso. Podés ingresar contratos vigentes y continuar la gestión desde el punto en el que estás hoy.\n\nLa idea es que tengas todo centralizado: propiedades, contratos, aumentos y cobranzas en un solo lugar.\n\nSi en algún momento necesitás ayuda o querés sugerir mejoras, podés escribirme directamente a este mail.\n\nEstoy para ayudarte.\n\nFacundo\nZeta Prop\nzetaprop.com.ar\n\nIngresá al portal: zetaprop.com.ar/login\n\nConsejo: empezá cargando solo un alquiler. En menos de 10 minutos vas a ver cómo funciona todo el sistema.`
            });
            console.log(`Welcome email sent to ${to}`);
            await logSentEmail(to, "Bienvenido/a a Zeta Prop 🚀 | Cargá tu primer alquiler hoy", "welcome", "success");
            return { success: true };
        } catch (e: any) {
            console.error("Welcome email failed:", e);
            await logSentEmail(to, "Bienvenido/a a Zeta Prop 🚀 | Cargá tu primer alquiler hoy", "welcome", "error", e.message || JSON.stringify(e));
            // Return specific error message
            return { success: false, error: e.message || JSON.stringify(e) };
        }
    },

    sendMarketingEmail: async (to: string, name: string, templateKey: string): Promise<{ success: boolean; error?: any }> => {
        console.log(`[Service] Attempting to send marketing email (${templateKey}) to ${to}`);
        if (!postmarkClient) {
            const msg = "[Service] Postmark client not configured for marketing email";
            console.warn(msg);
            return { success: false, error: msg };
        }

        // Check if user is unsubscribed
        const unsubscribed = await isUnsubscribed(to);
        if (unsubscribed) {
            console.log(`[Service] User ${to} is unsubscribed. Skipping marketing email.`);
            return { success: false, error: "USER_UNSUBSCRIBED" };
        }

        const firstName = name ? name.split(' ')[0] : 'Hola';

        // Templates configurations
        const templates: Record<string, { subject: string, htmlBody: string, textBody: string }> = {
            'welcome': {
                subject: 'Bienvenido a Zeta Prop — empezá en 5 minutos',
                htmlBody: `
                    <div style="font-family: Arial, sans-serif; color: #333; line-height: 1.6;">
                        <p>Hola ${firstName},</p>
                        <p>Gracias por registrarte en Zeta Prop.</p>
                        <p>La plataforma está pensada para que puedas administrar tus alquileres de forma simple y tener propiedades, contratos, aumentos y cobranzas en un solo lugar.</p>
                        <p>Para empezar, te recomiendo estos pasos:</p>
                        <ul>
                            <li>Cargar una propiedad</li>
                            <li>Agregar el propietario</li>
                            <li>Incorporar el inquilino</li>
                            <li>Registrar el contrato</li>
                        </ul>
                        <p>Con solo un contrato ya podés comenzar a gestionar todo desde el sistema.</p>
                        <p>Entrar a Zeta Prop:<br><a href="https://zetaprop.com.ar">https://zetaprop.com.ar</a></p>
                        <p>Si necesitás ayuda para empezar, podés escribirme directamente.</p>
                        <p>Saludos,<br><strong>Facundo</strong><br>Zeta Prop</p>
                        <p style="font-size: 0.85em; color: #666; margin-top: 20px; border-top: 1px solid #eee; pt-4;">
                            Ingresá al portal: <a href="https://zetaprop.com.ar/login">zetaprop.com.ar/login</a>
                        </p>
                        <p style="font-size: 0.75em; color: #999; margin-top: 10px;">
                            ¿No querés recibir más correos de este tipo? <a href="https://zetaprop.com.ar/unsubscribe?email=${to}">Darse de baja</a>
                        </p>
                    </div>
                `,
                textBody: `Hola ${firstName},\n\nGracias por registrarte en Zeta Prop.\n\nLa plataforma está pensada para que puedas administrar tus alquileres de forma simple y tener propiedades, contratos, aumentos y cobranzas en un solo lugar.\n\nPara empezar, te recomiendo estos pasos:\n- Cargar una propiedad\n- Agregar el propietario\n- Incorporar el inquilino\n- Registrar el contrato\n\nCon solo un contrato ya podés comenzar a gestionar todo desde el sistema.\n\nIngresá al portal: zetaprop.com.ar/login\n\nSi no querés recibir más estos correos: https://zetaprop.com.ar/unsubscribe?email=${to}\n\nSi necesitás ayuda para empezar, podés escribirme directamente.\n\nSaludos,\nFacundo\nZeta Prop`
            },
            'activation': {
                subject: 'Un consejo para empezar: cargá solo un alquiler',
                htmlBody: `
                    <div style="font-family: Arial, sans-serif; color: #333; line-height: 1.6;">
                        <p>Hola ${firstName},</p>
                        <p>Muchos usuarios comienzan usando Zeta Prop con un solo alquiler.</p>
                        <p>No hace falta cargar toda la cartera de propiedades de golpe. Con estos datos ya podés empezar:</p>
                        <ul>
                            <li>Una propiedad</li>
                            <li>Un propietario</li>
                            <li>Un inquilino</li>
                            <li>El contrato</li>
                        </ul>
                        <p>A partir de ahí el sistema ya te permite:</p>
                        <ul>
                            <li>registrar pagos</li>
                            <li>controlar vencimientos automáticamente</li>
                            <li>ver la cuenta corriente del alquiler</li>
                            <li>generar liquidaciones</li>
                        </ul>
                        <p>Podés ingresar y hacer la prueba desde acá:<br><a href="https://zetaprop.com.ar/login">zetaprop.com.ar/login</a></p>
                        <p>Si querés, avisame y te ayudo a cargar el primer contrato.</p>
                        <p>Saludos,<br><strong>Facundo</strong></p>
                        <p style="font-size: 0.85em; color: #666; margin-top: 20px; border-top: 1px solid #eee; pt-4;">
                            Ingresá al portal: <a href="https://zetaprop.com.ar/login">zetaprop.com.ar/login</a>
                        </p>
                        <p style="font-size: 0.75em; color: #999; margin-top: 10px;">
                            ¿No querés recibir más correos de este tipo? <a href="https://zetaprop.com.ar/unsubscribe?email=${to}">Darse de baja</a>
                        </p>
                    </div>
                `,
                textBody: `Hola ${firstName},\n\nMuchos usuarios comienzan usando Zeta Prop con un solo alquiler.\n\nNo hace falta cargar toda la cartera de propiedades de golpe. Con estos datos ya podés empezar:\n- Una propiedad\n- Un propietario\n- Un inquilino\n- El contrato\n\nA partir de ahí el sistema ya te permite:\n- registrar pagos\n- controlar vencimientos automáticamente\n- ver la cuenta corriente del alquiler\n- generar liquidaciones\n\nIngresá al portal: zetaprop.com.ar/login\n\nSi no querés recibir más estos correos: https://zetaprop.com.ar/unsubscribe?email=${to}\n\nSi querés, avisame y te ayudo a cargar el primer contrato.\n\nSaludos,\nFacundo`
            },
            'value': {
                subject: 'Cómo generar la liquidación del alquiler en segundos',
                htmlBody: `
                    <div style="font-family: Arial, sans-serif; color: #333; line-height: 1.6;">
                        <p>Hola ${firstName},</p>
                        <p>Una de las funciones que más valoran las inmobiliarias que usan Zeta Prop es la generación automática de liquidaciones.</p>
                        <p>Una vez cargado el contrato y los pagos, el sistema puede generar:</p>
                        <p><strong>Liquidación para el propietario</strong></p>
                        <ul>
                            <li>alquiler cobrado</li>
                            <li>comisión inmobiliaria</li>
                            <li>gastos o descuentos</li>
                            <li>monto a transferir</li>
                        </ul>
                        <p><strong>Liquidación para el inquilino</strong></p>
                        <ul>
                            <li>alquiler del período</li>
                            <li>aumentos aplicados</li>
                            <li>expensas u otros cargos</li>
                            <li>total a pagar</li>
                        </ul>
                        <p>De esta forma evitás preparar liquidaciones manuales en Word o Excel.</p>
                        <p>Todo queda ordenado, registrado y listo para enviar.</p>
                        <p>Podés probarlo entrando acá:<br><a href="https://zetaprop.com.ar/login">zetaprop.com.ar/login</a></p>
                        <p>Saludos,<br><strong>Facundo</strong></p>
                        <p style="font-size: 0.85em; color: #666; margin-top: 20px; border-top: 1px solid #eee; pt-4;">
                            Ingresá al portal: <a href="https://zetaprop.com.ar/login">zetaprop.com.ar/login</a>
                        </p>
                        <p style="font-size: 0.75em; color: #999; margin-top: 10px;">
                            ¿No querés recibir más correos de este tipo? <a href="https://zetaprop.com.ar/unsubscribe?email=${to}">Darse de baja</a>
                        </p>
                    </div>
                `,
                textBody: `Hola ${firstName},\n\nUna de las funciones que más valoran las inmobiliarias que usan Zeta Prop es la generación automática de liquidaciones.\n\nUna vez cargado el contrato y los pagos, el sistema puede generar:\n\nLiquidación para el propietario\n- alquiler cobrado\n- comisión inmobiliaria\n- gastos o descuentos\n- monto a transferir\n\nLiquidación para el inquilino\n- alquiler del período\n- aumentos aplicados\n- expensas u otros cargos\n- total a pagar\n\nDe esta forma evitás preparar liquidaciones manuales en Word o Excel.\nTodo queda ordenado, registrado y listo para enviar.\n\nIngresá al portal: zetaprop.com.ar/login\n\nSi no querés recibir más estos correos: https://zetaprop.com.ar/unsubscribe?email=${to}\n\nSaludos,\nFacundo`
            },
            'social': {
                subject: 'Cómo están usando Zeta Prop otras inmobiliarias',
                htmlBody: `
                    <div style="font-family: Arial, sans-serif; color: #333; line-height: 1.6;">
                        <p>Hola ${firstName},</p>
                        <p>Muchas inmobiliarias utilizan Zeta Prop para simplificar la administración de alquileres.</p>
                        <p>Lo que más valoran es:</p>
                        <ul>
                            <li>tener todas las propiedades en un solo sistema</li>
                            <li>controlar vencimientos automáticamente</li>
                            <li>registrar pagos y cuentas corrientes</li>
                            <li>generar liquidaciones para propietarios en segundos</li>
                        </ul>
                        <p>Esto evita trabajar con múltiples planillas o documentos sueltos.</p>
                        <p>La idea de Zeta Prop es simplificar la gestión diaria y ahorrar tiempo en tareas administrativas.</p>
                        <p>Si todavía no cargaste tu primer contrato, podés hacerlo acá:<br><a href="https://zetaprop.com.ar/login">zetaprop.com.ar/login</a></p>
                        <p>Saludos,<br><strong>Facundo</strong></p>
                        <p style="font-size: 0.85em; color: #666; margin-top: 20px; border-top: 1px solid #eee; pt-4;">
                            Ingresá al portal: <a href="https://zetaprop.com.ar/login">zetaprop.com.ar/login</a>
                        </p>
                        <p style="font-size: 0.75em; color: #999; margin-top: 10px;">
                            ¿No querés recibir más correos de este tipo? <a href="https://zetaprop.com.ar/unsubscribe?email=${to}">Darse de baja</a>
                        </p>
                    </div>
                `,
                textBody: `Hola ${firstName},\n\nMuchas inmobiliarias utilizan Zeta Prop para simplificar la administración de alquileres.\n\nLo que más valoran es:\n- tener todas las propiedades en un solo sistema\n- controlar vencimientos automáticamente\n- registrar pagos y cuentas corrientes\n- generar liquidaciones para propietarios en segundos\n\nEsto evita trabajar con múltiples planillas o documentos sueltos.\n\nLa idea de Zeta Prop es simplificar la gestión diaria y ahorrar tiempo en tareas administrativas.\n\nIngresá al portal: zetaprop.com.ar/login\n\nSi no querés recibir más estos correos: https://zetaprop.com.ar/unsubscribe?email=${to}\n\nSaludos,\nFacundo`
            },
            'conversion': {
                subject: 'Seguí usando Zeta Prop para administrar tus alquileres',
                htmlBody: `
                    <div style="font-family: Arial, sans-serif; color: #333; line-height: 1.6;">
                        <p>Hola ${firstName},</p>
                        <p>Espero que hayas podido probar Zeta Prop durante estos días.</p>
                        <p>La idea del sistema es que puedas gestionar de forma simple:</p>
                        <ul>
                            <li>propiedades</li>
                            <li>contratos</li>
                            <li>vencimientos</li>
                            <li>pagos</li>
                            <li>liquidaciones</li>
                        </ul>
                        <p>Si la plataforma te resulta útil para organizar la administración de tus alquileres, podés continuar utilizándola de forma completa desde tu cuenta.</p>
                        <p>Entrar a Zeta Prop:<br><a href="https://zetaprop.com.ar">https://zetaprop.com.ar</a></p>
                        <p>Si tenés dudas o sugerencias, podés escribirme directamente.</p>
                        <p>Saludos,<br><strong>Facundo</strong><br>Zeta Prop</p>
                        <p style="font-size: 0.85em; color: #666; margin-top: 20px; border-top: 1px solid #eee; pt-4;">
                            Ingresá al portal: <a href="https://zetaprop.com.ar/login">zetaprop.com.ar/login</a>
                        </p>
                        <p style="font-size: 0.75em; color: #999; margin-top: 10px;">
                            ¿No querés recibir más correos de este tipo? <a href="https://zetaprop.com.ar/unsubscribe?email=${to}">Darse de baja</a>
                        </p>
                    </div>
                `,
                textBody: `Hola ${firstName},\n\nEspero que hayas podido probar Zeta Prop durante estos días.\n\nLa idea del sistema es que puedas gestionar de forma simple:\n- propiedades\n- contratos\n- vencimientos\n- pagos\n- liquidaciones\n\nSi la plataforma te resulta útil para organizar la administración de tus alquileres, podés continuar utilizándola de forma completa desde tu cuenta.\n\nIngresá al portal: zetaprop.com.ar/login\n\nSi no querés recibir más estos correos: https://zetaprop.com.ar/unsubscribe?email=${to}\n\nSi tenés dudas o sugerencias, podés escribirme directamente.\n\nSaludos,\nFacundo\nZeta Prop`
            },
            'promotion': {
                subject: 'Publicá tus propiedades y ahorrá con nuestro CRM moderno',
                htmlBody: `
                    <div style="font-family: Arial, sans-serif; color: #333; line-height: 1.6;">
                        <p>Hola ${firstName},</p>
                        <p>En Zeta Prop sumamos nuevas herramientas para ayudarte a hacer crecer tu inmobiliaria sin pagar de más.</p>
                        <p>Ahora podés <strong>publicar tus propiedades y mostrarlas a tus clientes</strong>, obtener nuevos contactos y realizar un seguimiento inteligente de cada consulta.</p>
                        <p>Todo esto integrado en un <strong>CRM mucho más moderno, ágil y fácil de usar</strong> que las alternativas robustas del mercado actual, pero a un <strong>costo infinitamente más bajo</strong> en comparación a las grandes plataformas.</p>
                        <p>Animate a llevar tu gestión al próximo nivel:</p>
                        <p><a href="https://zetaprop.com.ar" style="display:inline-block; padding:10px 20px; background-color:#4F46E5; color:white; text-decoration:none; border-radius:5px; margin-top:10px;">Descubrir Zeta Prop</a></p>
                        <p>Cualquier consulta o duda, podés escribirme directamente a este mail.</p>
                        <p>Saludos,<br><strong>Facundo</strong><br>Zeta Prop</p>
                        <p style="font-size: 0.85em; color: #666; margin-top: 20px; border-top: 1px solid #eee; pt-4;">
                            Ingresá al portal: <a href="https://zetaprop.com.ar/login">zetaprop.com.ar/login</a>
                        </p>
                        <p style="font-size: 0.75em; color: #999; margin-top: 10px;">
                            ¿No querés recibir más correos de este tipo? <a href="https://zetaprop.com.ar/unsubscribe?email=${to}">Darse de baja</a>
                        </p>
                    </div>
                `,
                textBody: `Hola ${firstName},\n\nEn Zeta Prop sumamos nuevas herramientas para ayudarte a hacer crecer tu inmobiliaria sin pagar de más.\n\nAhora podés publicar tus propiedades y mostrarlas a tus clientes, obtener nuevos contactos y realizar un seguimiento inteligente de cada consulta.\n\nTodo esto integrado en un CRM mucho más moderno, ágil y fácil de usar que las alternativas robustas del mercado actual, pero a un costo infinitamente más bajo en comparación a las grandes plataformas.\n\nAnimate a llevar tu gestión al próximo nivel ingresando a:\nzetaprop.com.ar/login\n\nSi no querés recibir más estos correos: https://zetaprop.com.ar/unsubscribe?email=${to}\n\nCualquier consulta o duda, podés escribirme directamente a este mail.\n\nSaludos,\nFacundo\nZeta Prop`
            },
            'crm_portal': {
                subject: 'Zeta Prop: CRM + Portal para tu Inmobiliaria 🏡',
                htmlBody: `
                    <div style="font-family: Arial, sans-serif; color: #333; line-height: 1.6;">
                        <p>Hola ${firstName},</p>
                        
                        <p>Queríamos contarte que en Zeta Prop no solo podés administrar alquileres y contratos.</p>
                        
                        <p>También podés <strong>publicar tus propiedades en venta o alquiler</strong> dentro de la plataforma y mostrarlas a tus clientes.</p>
                        
                        <p>Cada inmobiliaria tiene su propio espacio donde puede:</p>
                        
                        <ul>
                            <li>Publicar propiedades</li>
                            <li>Mostrar toda su cartera en una sola página</li>
                            <li>Compartir propiedades con clientes mediante un enlace</li>
                            <li>Mostrar fichas completas con fotos, descripción y ubicación</li>
                        </ul>
                        
                        <p>De esta forma, Zeta Prop funciona también como un <strong>portal inmobiliario</strong>, permitiéndote promocionar tus propiedades de manera simple y económica.</p>
                        
                        <p>Podés empezar a publicar tus propiedades directamente desde tu panel.</p>
                        
                        <p>Cualquier duda o sugerencia estamos para ayudarte.</p>
                        
                        <p>Saludos,<br>
                        <strong>Facundo</strong><br>
                        Zeta Prop</p>
                        
                        <p style="font-size: 0.85em; color: #666; margin-top: 20px; border-top: 1px solid #eee; pt-4;">
                            Ingresá al portal: <a href="https://zetaprop.com.ar/login">zetaprop.com.ar/login</a>
                        </p>
                        <p style="font-size: 0.75em; color: #999; margin-top: 10px;">
                            ¿No querés recibir más correos de este tipo? <a href="https://zetaprop.com.ar/unsubscribe?email=${to}">Darse de baja</a>
                        </p>
                    </div>
                `,
                textBody: `Hola ${firstName},\n\nQueríamos contarte que en Zeta Prop no solo podés administrar alquileres y contratos.\n\nTambién podés publicar tus propiedades en venta o alquiler dentro de la plataforma y mostrarlas a tus clientes.\n\nCada inmobiliaria tiene su propio espacio donde puede:\n• Publicar propiedades\n• Mostrar toda su cartera en una sola página\n• Compartir propiedades con clientes mediante un enlace\n• Mostrar fichas completas con fotos, descripción y ubicación\n\nDe esta forma, Zeta Prop funciona también como un portal inmobiliario, permitiéndote promocionar tus propiedades de manera simple y económica.\n\nPodés empezar a publicar tus propiedades directamente desde tu panel.\n\nIngresá al portal: zetaprop.com.ar/login\n\nSi no querés recibir más estos correos: https://zetaprop.com.ar/unsubscribe?email=${to}\n\nCualquier duda o sugerencia estamos para ayudarte.\n\nSaludos,\nFacundo\nZeta Prop`
            }
        };

        const template = templates[templateKey];
        if (!template) {
            return { success: false, error: 'Template not found' };
        }

        try {
            await postmarkClient.sendEmail({
                "From": "Facundo Zeta <facundo@zetaprop.com.ar>",
                "ReplyTo": "facundo@zetaprop.com.ar",
                "To": to,
                "Subject": template.subject,
                "HtmlBody": template.htmlBody,
                "TextBody": template.textBody
            });
            console.log(`Marketing email (${templateKey}) sent to ${to}`);
            await logSentEmail(to, template.subject, templateKey, "success");
            return { success: true };
        } catch (e: any) {
            console.error(`Marketing email (${templateKey}) failed:`, e);
            await logSentEmail(to, template.subject, templateKey, "error", e.message || JSON.stringify(e));
            return { success: false, error: e.message || JSON.stringify(e) };
        }
    }
};
