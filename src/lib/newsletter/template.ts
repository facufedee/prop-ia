/**
 * Blog newsletter email template (HTML + plain text).
 * Layout follows the brand wrapper used by the marketing templates.
 */

export const SITE_URL = 'https://zetaprop.com.ar';
const LOGO_URL = `${SITE_URL}/assets/img/logo_zeta_prop_marzo.jpeg`;
const BRAND_BLUE = '#2563eb';

export interface NewsletterPost {
    title: string;
    slug: string;
    excerpt?: string;
    imageUrl?: string;
    category?: string;
}

export interface RenderNewsletterInput {
    posts: NewsletterPost[];
    unsubscribeUrl: string;
    recipientName?: string;
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
        ? `<a href="${url}"><img src="${escapeHtml(post.imageUrl)}" alt="${escapeHtml(post.title)}" width="100%" style="width: 100%; max-width: 540px; height: auto; border-radius: 10px; display: block; margin-bottom: 16px;" /></a>`
        : '';
    const category = post.category
        ? `<div style="font-size: 12px; font-weight: bold; text-transform: uppercase; letter-spacing: 0.05em; color: ${BRAND_BLUE}; margin-bottom: 6px;">${escapeHtml(post.category)}</div>`
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
        <a href="${url}" style="background-color: ${BRAND_BLUE}; color: #ffffff; padding: 11px 22px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">Leer nota</a>
    </div>`;
}

export function renderNewsletter({ posts, unsubscribeUrl, recipientName }: RenderNewsletterInput): RenderedNewsletter {
    const subject = buildSubject(posts);
    const name = recipientName?.trim();
    const greeting = name ? `Hola ${name},` : 'Hola,';
    const intro = 'Publicamos nuevas notas en el blog de Zeta Prop. Te las dejamos acá:';
    const reason = 'Recibís este correo porque tenés una cuenta en Zeta Prop.';

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
        <a href="${SITE_URL}"><img src="${LOGO_URL}" alt="Zeta Prop" style="height: 45px; margin-bottom: 10px;" /></a>
    </div>
    <div style="font-size: 16px;">
        <p style="margin: 0 0 8px;">${escapeHtml(greeting)}</p>
        <p style="margin: 0 0 28px;">${escapeHtml(intro)}</p>
        ${posts.map(renderPostHtml).join('\n')}
        <p style="margin: 0;">
            Más notas en <a href="${SITE_URL}/blog" style="color: ${BRAND_BLUE}; font-weight: bold; text-decoration: none;">zetaprop.com.ar/blog</a>
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
