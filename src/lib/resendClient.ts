import { Resend } from 'resend';

const apiKey = process.env.RESEND_API_KEY;

if (!apiKey && process.env.NODE_ENV === 'production') {
  console.warn('RESEND_API_KEY is not set in environment variables.');
}

// Single shared client instance
export const resend = apiKey ? new Resend(apiKey) : null;

type EmailAddress = string;

interface BaseEmailParams {
  to: EmailAddress | EmailAddress[];
}

interface WelcomeEmailParams extends BaseEmailParams {
  name?: string;
}

interface PaymentEmailParams extends BaseEmailParams {
  amount: number;
  currency?: string;
  planName: string;
  billingPeriod: 'monthly' | 'yearly';
}

interface PaymentReminderEmailParams extends BaseEmailParams {
  daysLeft: number;
  nextPaymentDate: Date;
  planName: string;
}

interface NewLeadNotificationEmailParams extends BaseEmailParams {
  leadName: string;
  leadEmail?: string;
  message?: string;
  propertyTitle?: string;
}

interface PropertyInquiryEmailParams extends BaseEmailParams {
  propertyName: string;
  clientName?: string;
}

const FROM_DEFAULT = 'Zeta Prop <notificaciones@zetaprop.com.ar>';

export async function sendPropertyInquiryEmail(params: PropertyInquiryEmailParams) {
  if (!resend) {
    if (process.env.NODE_ENV === 'development') {
      console.log('[Resend] Skipped sendPropertyInquiryEmail (no API key)', params);
      return;
    }
    throw new Error('Resend client not configured');
  }

  return resend.emails.send({
    from: FROM_DEFAULT,
    to: Array.isArray(params.to) ? params.to : [params.to],
    subject: `Consulta sobre ${params.propertyName}`,
    html: `
      <div style="font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; font-size: 15px; color: #111827;">
        <h1 style="font-size: 20px; margin: 0 0 16px;">¡Gracias por tu interés en Zeta Prop!</h1>
        <p>Recibimos tu consulta sobre <strong>${params.propertyName}</strong>${params.clientName ? ` de parte de <strong>${params.clientName}</strong>` : ''}.</p>
        <p>Un integrante del equipo se va a contactar con vos a la brevedad.</p>
      </div>
    `,
  });
}

export async function sendWelcomeEmail(params: WelcomeEmailParams) {
  if (!resend) {
    if (process.env.NODE_ENV === 'development') {
      console.log('[Resend] Skipped sendWelcomeEmail (no API key)', params);
      return;
    }
    throw new Error('Resend client not configured');
  }

  const name = params.name ?? '¡Bienvenido!';

  return resend.emails.send({
    from: FROM_DEFAULT,
    to: Array.isArray(params.to) ? params.to : [params.to],
    subject: 'Bienvenido a Zeta Prop',
    html: `
      <div style="font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; font-size: 15px; color: #111827;">
        <h1 style="font-size: 22px; margin: 0 0 12px;">${name}</h1>
        <p>Gracias por crear tu cuenta en <strong>Zeta Prop</strong>.</p>
        <p>Ya podés empezar a cargar propiedades, clientes y alquileres, y simplificar toda la gestión diaria.</p>
        <p style="margin-top: 16px;">Si necesitás ayuda, respondé este correo y nuestro equipo te va a acompañar en la implementación.</p>
      </div>
    `,
  });
}

export async function sendPaymentEmail(params: PaymentEmailParams) {
  if (!resend) {
    if (process.env.NODE_ENV === 'development') {
      console.log('[Resend] Skipped sendPaymentEmail (no API key)', params);
      return;
    }
    throw new Error('Resend client not configured');
  }

  const { amount, planName, billingPeriod } = params;
  const currency = params.currency ?? 'ARS';

  return resend.emails.send({
    from: FROM_DEFAULT,
    to: Array.isArray(params.to) ? params.to : [params.to],
    subject: `Pago recibido - Plan ${planName}`,
    html: `
      <div style="font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; font-size: 15px; color: #111827;">
        <h1 style="font-size: 20px; margin: 0 0 16px;">¡Pago recibido correctamente!</h1>
        <p>Registramos tu pago del plan <strong>${planName}</strong> (${billingPeriod === 'yearly' ? 'anual' : 'mensual'}).</p>
        <p>Monto: <strong>${currency} ${amount.toLocaleString('es-AR')}</strong></p>
        <p>Tu suscripción ya se encuentra activa. Podés seguir usando todas las funcionalidades de Zeta Prop sin interrupciones.</p>
      </div>
    `,
  });
}

export async function sendPaymentReminderEmail(params: PaymentReminderEmailParams) {
  if (!resend) {
    if (process.env.NODE_ENV === 'development') {
      console.log('[Resend] Skipped sendPaymentReminderEmail (no API key)', params);
      return;
    }
    throw new Error('Resend client not configured');
  }

  const { daysLeft, nextPaymentDate, planName } = params;
  const formattedDate = nextPaymentDate.toLocaleDateString('es-AR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return resend.emails.send({
    from: FROM_DEFAULT,
    to: Array.isArray(params.to) ? params.to : [params.to],
    subject: `Recordatorio de pago - Plan ${planName}`,
    html: `
      <div style="font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; font-size: 15px; color: #111827;">
        <h1 style="font-size: 20px; margin: 0 0 16px;">Tu suscripción está por renovarse</h1>
        <p>Te recordamos que tu próximo pago del plan <strong>${planName}</strong> se debita el <strong>${formattedDate}</strong>.</p>
        <p>Faltan aproximadamente <strong>${daysLeft} día${daysLeft === 1 ? '' : 's'}</strong>.</p>
        <p>Si querés actualizar o cancelar tu plan, podés hacerlo desde tu panel de Zeta Prop.</p>
      </div>
    `,
  });
}

export async function sendNewLeadNotificationEmail(params: NewLeadNotificationEmailParams) {
  if (!resend) {
    if (process.env.NODE_ENV === 'development') {
      console.log('[Resend] Skipped sendNewLeadNotificationEmail (no API key)', params);
      return;
    }
    throw new Error('Resend client not configured');
  }

  const { leadName, leadEmail, message, propertyTitle } = params;

  return resend.emails.send({
    from: FROM_DEFAULT,
    to: Array.isArray(params.to) ? params.to : [params.to],
    subject: '¡Tenés una nueva consulta en Zeta Prop!',
    html: `
      <div style="font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; font-size: 15px; color: #111827;">
        <h1 style="font-size: 20px; margin: 0 0 16px;">Felicitaciones, tenés una nueva consulta</h1>
        <p>Un usuario dejó una consulta en tu CRM Zeta Prop.</p>
        <ul style="padding-left: 20px; margin: 12px 0;">
          <li><strong>Nombre:</strong> ${leadName}</li>
          ${leadEmail ? `<li><strong>Email:</strong> ${leadEmail}</li>` : ''}
          ${propertyTitle ? `<li><strong>Propiedad:</strong> ${propertyTitle}</li>` : ''}
        </ul>
        ${message ? `<p><strong>Mensaje:</strong></p><p style="white-space: pre-line; border-left: 3px solid #E5E7EB; padding-left: 12px; margin-top: 4px;">${message}</p>` : ''}
        <p style="margin-top: 16px;">Ingresá a Zeta Prop para responderla y hacer seguimiento desde el módulo de Leads.</p>
        <a href="https://zetaprop.com.ar/dashboard/leads" style="display: inline-block; padding: 12px 24px; background-color: #007bff; color: white; text-decoration: none; border-radius: 8px; margin-top: 16px;">Ir a Zeta Prop</a>
        <p style="margin-top: 16px;">Si no podés acceder al link, podés copiar y pegar el siguiente URL en tu navegador:</p>
        <p style="white-space: pre-line; border-left: 3px solid #E5E7EB; padding-left: 12px; margin-top: 4px;">https://zetaprop.com.ar/dashboard/leads</p>
      </div>
    `,
  });
}

