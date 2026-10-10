// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/infrastructure/firebase/admin', () => ({ adminDb: {} }));

const SIGNED = 'https://zetaprop.com.ar/unsubscribe?u=user1&t=abc';

describe('rewriteUnsubscribeLinks', () => {
    it('replaces legacy ?email= links with the HTML-escaped signed URL', async () => {
        const { rewriteUnsubscribeLinks } = await import('../lib/marketingUnsubscribe');
        const html =
            '<a href="https://zetaprop.com.ar/unsubscribe?email=ana@b.com">baja</a>' +
            "<a href='https://zetaprop.com.ar/unsubscribe?email={{email}}'>baja</a>";

        const out = rewriteUnsubscribeLinks(html, SIGNED);

        expect(out).not.toContain('?email=');
        expect(out).toBe(
            '<a href="https://zetaprop.com.ar/unsubscribe?u=user1&amp;t=abc">baja</a>' +
                "<a href='https://zetaprop.com.ar/unsubscribe?u=user1&amp;t=abc'>baja</a>"
        );
    });

    it('replaces the {{unsubscribeUrl}} placeholder', async () => {
        const { rewriteUnsubscribeLinks } = await import('../lib/marketingUnsubscribe');

        const out = rewriteUnsubscribeLinks('<a href="{{unsubscribeUrl}}">baja</a>', SIGNED);

        expect(out).toBe('<a href="https://zetaprop.com.ar/unsubscribe?u=user1&amp;t=abc">baja</a>');
    });

    it('keeps the raw URL in plain-text mode', async () => {
        const { rewriteUnsubscribeLinks } = await import('../lib/marketingUnsubscribe');
        const text = 'Baja: https://zetaprop.com.ar/unsubscribe?email=ana@b.com\nOtra: {{unsubscribeUrl}}';

        const out = rewriteUnsubscribeLinks(text, SIGNED, { html: false });

        expect(out).toBe(`Baja: ${SIGNED}\nOtra: ${SIGNED}`);
    });
});

describe('buildListUnsubscribeHeaders', () => {
    beforeEach(() => {
        process.env.CRON_SECRET = 'test-secret';
    });

    it('returns RFC 8058 one-click headers with a signed URL and a mailto fallback', async () => {
        const { buildListUnsubscribeHeaders } = await import('../lib/marketingUnsubscribe');
        const { buildOneClickUnsubscribeUrl } = await import('../lib/unsubscribeToken');

        const headers = buildListUnsubscribeHeaders('user1');

        expect(headers['List-Unsubscribe']).toBe(
            `<${buildOneClickUnsubscribeUrl('user1')}>, <mailto:zetaprop.com.ar@gmail.com?subject=unsubscribe>`
        );
        expect(headers['List-Unsubscribe-Post']).toBe('List-Unsubscribe=One-Click');
    });
});

describe('repository email templates', () => {
    const SOURCES = [
        'src/app/(main)/dashboard/marketing/premiumTemplates.ts',
        'src/infrastructure/services/emailNotificationService.ts',
        'src/infrastructure/services/marketingEmailService.ts',
        'src/app/api/admin/bulk-email/route.ts',
        'scripts/seed_marketing_templates.js',
    ];

    it('contain no unsigned unsubscribe links or the missing logo', async () => {
        const { readFileSync } = await import('fs');
        const { resolve } = await import('path');

        for (const file of SOURCES) {
            const source = readFileSync(resolve(process.cwd(), file), 'utf-8');
            expect(source, file).not.toMatch(/unsubscribe\?email=/);
            expect(source, file).not.toContain('logo_zeta_prop_marzo');
        }
    });

    it('premium templates use the {{unsubscribeUrl}} placeholder and the working logo', async () => {
        const { PREMIUM_TEMPLATES } = await import('../app/(main)/dashboard/marketing/premiumTemplates');

        for (const template of PREMIUM_TEMPLATES) {
            expect(template.html, template.type).toContain('href="{{unsubscribeUrl}}"');
            expect(template.html, template.type).toContain(
                'https://zetaprop.com.ar/assets/img/logo_zeta_prop_transparent.png'
            );
        }
    });
});
