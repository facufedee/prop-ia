/**
 * Blog newsletter email template (HTML + plain text).
 * Layout follows the brand wrapper used by the marketing templates.
 */

import { EMAIL_COLORS, emailHeaderBarHtml } from '@/lib/email/brandColors';

export const SITE_URL = 'https://zetaprop.com.ar';
/** PNG logo (its "Prop" is still indigo). Kept for confirmationEmail; the newsletter uses the text wordmark. */
export const LOGO_URL = `${SITE_URL}/assets/img/logo_zeta_prop_transparent.png`;
// Covers are cropped to this height with an overflow:hidden wrapper, since Gmail
// ignores object-fit and tall (portrait) covers would otherwise dominate the email.
const COVER_HEIGHT_PX = 260;
/** Deep bronze for links and white-text buttons on a white body (see src/lib/email/brandColors.ts). */
export const BRAND_ACCENT: string = EMAIL_COLORS.link;
/** @deprecated Kept as an alias for confirmationEmail.ts; use BRAND_ACCENT. */
export const BRAND_BLUE = BRAND_ACCENT;

export interface NewsletterPost {
    title: string;
    slug: string;
    excerpt?: string;
    imageUrl?: string;
    category?: string;
}

/** Registered user, or footer-form subscriber without an account. */
export type NewsletterRecipientKind = 'user' | 'subscriber';

export interface RenderNewsletterInput {
    posts: NewsletterPost[];
    unsubscribeUrl: string;
    recipientName?: string;
    /** Decides the "why you get this email" line. Defaults to 'user'. */
    recipientKind?: NewsletterRecipientKind;
}

export interface RenderedNewsletter {
    subject: string;
    html: string;
    text: string;
}

export function escapeHtml(value: string): string {
    return value
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

export function postUrl(slug: string): string {
    return `${SITE_URL}/blog/${encodeURIComponent(slug)}`;
}

/** "A", "A y B", "A, B y C" */
function joinSpanish(items: string[]): string {
    if (items.length <= 1) return items.join('');
    return `${items.slice(0, -1).join(', ')} y ${items[items.length - 1]}`;
}

export function buildSubject(posts: NewsletterPost[]): string {
    const titles = posts.map((p) => p.title.trim());
    return titles.length === 1 ? `Nueva nota: ${titles[0]}` : `Nuevas notas: ${joinSpanish(titles)}`;
}

function renderPostHtml(post: NewsletterPost): string {
    const url = escapeHtml(postUrl(post.slug));
    const image = post.imageUrl
        ? `<div style="height: ${COVER_HEIGHT_PX}px; max-height: ${COVER_HEIGHT_PX}px; overflow: hidden; border-radius: 10px; margin-bottom: 16px;"><a href="${url}"><img src="${escapeHtml(post.imageUrl)}" alt="${escapeHtml(post.title)}" width="540" style="width: 100%; max-width: 540px; height: auto; display: block;" /></a></div>`
        : '';
    const category = post.category
        ? `<div style="font-size: 12px; font-weight: bold; text-transform: uppercase; letter-spacing: 0.05em; color: ${BRAND_ACCENT}; margin-bottom: 6px;">${escapeHtml(post.category)}</div>`
        : '';
    const excerpt = post.excerpt
        ? `<p style="margin: 0 0 18px; color: #475569;">${escapeHtml(post.excerpt)}</p>`
        : '';

    return `
    <div style="margin-bottom: 32px; padding-bottom: 28px; border-bottom: 1px solid #e2e8f0;">
        ${image}
        ${category}
        <h2 style="font-size: 20px; line-height: 1.3; margin: 0 0 10px; color: #0f172a;">
            <a href="${url}" style="color: #0f172a; text-decoration: none;">${escapeHtml(post.title)}</a>
        </h2>
        ${excerpt}
        <a href="${url}" style="background-color: ${EMAIL_COLORS.buttonBg}; color: ${EMAIL_COLORS.buttonText}; padding: 11px 22px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">Leer nota</a>
    </div>`;
}

const REASON_BY_KIND: Record<NewsletterRecipientKind, string> = {
    user: 'Recibís este correo porque tenés una cuenta en Zeta Prop.',
    subscriber: 'Recibís este correo porque te suscribiste al newsletter de Zeta Prop.',
};

export function renderNewsletter({
    posts,
    unsubscribeUrl,
    recipientName,
    recipientKind = 'user',
}: RenderNewsletterInput): RenderedNewsletter {
    const subject = buildSubject(posts);
    const name = recipientName?.trim();
    const greeting = name ? `Hola ${name},` : 'Hola,';
    const intro = 'Publicamos nuevas notas en el blog de Zeta Prop. Te las dejamos acá:';
    const reason = REASON_BY_KIND[recipientKind];

    const html = `<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>${escapeHtml(subject)}</title>
</head>
<body style="margin: 0; padding: 20px 10px; background-color: #f1f5f9;">
<div style="font-family: 'Segoe UI', Arial, sans-serif; color: #333; line-height: 1.6; max-width: 600px; margin: 0 auto; background-color: #ffffff; padding: 30px; border-radius: 12px; border: 1px solid #e2e8f0;">
    <div style="margin-bottom: 25px;">
        ${emailHeaderBarHtml(SITE_URL)}
    </div>
    <div style="font-size: 16px;">
        <p style="margin: 0 0 8px;">${escapeHtml(greeting)}</p>
        <p style="margin: 0 0 28px;">${escapeHtml(intro)}</p>
        ${posts.map(renderPostHtml).join('\n')}
        <p style="margin: 0;">
            Más notas en <a href="${SITE_URL}/blog" style="color: ${BRAND_ACCENT}; font-weight: bold; text-decoration: none;">zetaprop.com.ar/blog</a>
        </p>
    </div>
    <div style="font-size: 0.75em; color: #94a3b8; margin-top: 35px; border-top: 1px solid #e2e8f0; padding-top: 20px; text-align: center;">
        <p style="margin: 0 0 6px;">${escapeHtml(reason)}</p>
        <p style="margin: 0;">¿No querés recibir más estos correos? <a href="${escapeHtml(unsubscribeUrl)}" style="color: #64748b; text-decoration: underline;">Darte de baja</a></p>
    </div>
</div>
</body>
</html>`;

    const textPosts = posts
        .map((p) => [p.category ? `[${p.category}]` : '', p.title, p.excerpt ?? '', `Leé la nota: ${postUrl(p.slug)}`]
            .filter(Boolean)
            .join('\n'))
        .join('\n\n');

    const text = [
        greeting,
        '',
        intro,
        '',
        textPosts,
        '',
        `Más notas: ${SITE_URL}/blog`,
        '',
        '--',
        reason,
        `Para darte de baja: ${unsubscribeUrl}`,
    ].join('\n');

    return { subject, html, text };
}
