import { BRAND_BLUE, LOGO_URL, SITE_URL, escapeHtml } from './template';

/**
 * Double opt-in confirmation email for newsletter subscribers without an
 * account. Transactional: it carries no unsubscribe link, since the address is
 * not on the list until the link is clicked.
 */

export const CONFIRMATION_SUBJECT = 'Confirmá tu suscripción al newsletter de Zeta Prop';

export function renderConfirmationEmail(confirmUrl: string): { subject: string; html: string; text: string } {
    const subject = CONFIRMATION_SUBJECT;
    const intro = 'Recibimos un pedido para suscribir este correo al newsletter de Zeta Prop, con las nuevas notas del blog.';
    const action = 'Para confirmar la suscripción, hacé clic en el botón:';
    const ignore = 'Si no fuiste vos, ignorá este correo. No te vamos a enviar nada más.';

    const html = `<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>${escapeHtml(subject)}</title>
</head>
<body style="margin: 0; padding: 20px 10px; background-color: #f1f5f9;">
<div style="font-family: 'Segoe UI', Arial, sans-serif; color: #333; line-height: 1.6; max-width: 600px; margin: 0 auto; background-color: #ffffff; padding: 30px; border-radius: 12px; border: 1px solid #e2e8f0;">
    <div style="text-align: center; margin-bottom: 25px;">
        <a href="${SITE_URL}"><img src="${LOGO_URL}" alt="Zeta Prop" width="174" height="45" style="width: 174px; height: 45px; margin-bottom: 10px; border: 0;" /></a>
    </div>
    <div style="font-size: 16px;">
        <p style="margin: 0 0 8px;">Hola,</p>
        <p style="margin: 0 0 16px;">${escapeHtml(intro)}</p>
        <p style="margin: 0 0 24px;">${escapeHtml(action)}</p>
        <p style="margin: 0 0 28px; text-align: center;">
            <a href="${escapeHtml(confirmUrl)}" style="background-color: ${BRAND_BLUE}; color: #ffffff; padding: 12px 26px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">Confirmar suscripción</a>
        </p>
        <p style="margin: 0 0 8px; font-size: 14px; color: #475569;">Si el botón no funciona, copiá y pegá este enlace en tu navegador:</p>
        <p style="margin: 0; font-size: 13px; word-break: break-all;"><a href="${escapeHtml(confirmUrl)}" style="color: ${BRAND_BLUE};">${escapeHtml(confirmUrl)}</a></p>
    </div>
    <div style="font-size: 0.75em; color: #94a3b8; margin-top: 35px; border-top: 1px solid #e2e8f0; padding-top: 20px; text-align: center;">
        <p style="margin: 0;">${escapeHtml(ignore)}</p>
    </div>
</div>
</body>
</html>`;

    const text = ['Hola,', '', intro, '', action, confirmUrl, '', '--', ignore].join('\n');

    return { subject, html, text };
}
