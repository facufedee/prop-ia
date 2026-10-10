// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

const sendNewsletterMock = vi.fn();
const addMock = vi.fn();

vi.mock('@/lib/newsletter/sendNewsletter', () => ({ sendNewsletter: sendNewsletterMock }));

vi.mock('@/infrastructure/firebase/admin', () => ({
    adminDb: {
        collection: () => ({
            where: () => ({ limit: () => ({ get: async () => ({ empty: true }) }) }),
            add: addMock,
        }),
    },
}));

vi.mock('firebase-admin/storage', () => ({
    getStorage: () => ({ bucket: () => ({ upload: vi.fn().mockResolvedValue(undefined) }) }),
}));

vi.mock('fs/promises', () => ({
    default: { writeFile: vi.fn().mockResolvedValue(undefined), unlink: vi.fn().mockResolvedValue(undefined) },
}));

const URL_BASE = 'https://zetaprop.com.ar/api/cron/publish-blog-post';

function publishRequest() {
    return new NextRequest(URL_BASE, {
        method: 'POST',
        headers: { 'x-cron-secret': 'blog-secret', 'content-type': 'application/json' },
        body: JSON.stringify({
            title: 'Titulo',
            slug: 'titulo-octubre-2026',
            excerpt: 'Resumen',
            content: 'Contenido',
            category: 'Mercado Inmobiliario',
            tags: ['Zeta Prop'],
            imageUrl: 'https://images.example.com/cover.jpg',
        }),
    });
}

describe('POST /api/cron/publish-blog-post', () => {
    beforeEach(() => {
        process.env.BLOG_AUTOPUBLISH_SECRET = 'blog-secret';
        sendNewsletterMock.mockReset();
        addMock.mockReset().mockResolvedValue({ id: 'post_1' });
        vi.stubGlobal(
            'fetch',
            vi.fn().mockResolvedValue({
                ok: true,
                headers: new Headers({ 'content-type': 'image/jpeg' }),
                arrayBuffer: async () => new ArrayBuffer(8),
            })
        );
    });

    it('triggers the newsletter after a successful publish and reports its result', async () => {
        sendNewsletterMock.mockResolvedValue({ status: 'skipped', reason: 'not_enough_posts', pending: 1 });
        const { POST } = await import('../app/api/cron/publish-blog-post/route');

        const res = await POST(publishRequest());
        const body = await res.json();

        expect(res.status).toBe(200);
        expect(body.success).toBe(true);
        expect(sendNewsletterMock).toHaveBeenCalledWith();
        expect(body.newsletter).toEqual({ status: 'skipped', reason: 'not_enough_posts', pending: 1 });
    });

    it('still reports the publish as successful when the newsletter fails', async () => {
        sendNewsletterMock.mockRejectedValue(new Error('Resend down'));
        const { POST } = await import('../app/api/cron/publish-blog-post/route');

        const res = await POST(publishRequest());
        const body = await res.json();

        expect(res.status).toBe(200);
        expect(body.success).toBe(true);
        expect(body.newsletter).toEqual({ status: 'error', error: 'Resend down' });
    });
});
