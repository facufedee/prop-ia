// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from 'vitest';

type Data = Record<string, unknown>;

const state = { posts: new Map<string, Data>() };
const updateMock = vi.fn();

vi.mock('@/infrastructure/firebase/admin', () => ({
    adminDb: {
        collection: () => ({
            doc: (id: string) => ({
                get: async () => ({ exists: state.posts.has(id), data: () => state.posts.get(id) }),
                update: async (d: Data) => updateMock(id, d),
            }),
        }),
    },
}));

vi.mock('firebase-admin/firestore', () => ({
    FieldValue: { serverTimestamp: () => 'SERVER_TS', delete: () => 'DELETE' },
}));

const fetchMock = vi.fn();

const published: Data = {
    title: 'Cómo ajustar alquileres',
    slug: 'como-ajustar-alquileres',
    excerpt: 'Resumen de la nota.',
    content: '<p>Contenido</p>',
    category: 'Mercado Inmobiliario',
    tags: ['Alquileres'],
    imageUrl: 'https://storage.googleapis.com/bucket/cover.jpg',
    published: true,
    publishedAt: { toDate: () => new Date('2026-10-01T12:00:00Z') },
};

async function load() {
    vi.resetModules();
    return (await import('@/lib/social/announceBlogPost')).announceBlogPost;
}

describe('announceBlogPost', () => {
    beforeEach(() => {
        state.posts = new Map([['post_1', { ...published }]]);
        updateMock.mockReset();
        fetchMock.mockReset().mockResolvedValue({ ok: true, status: 200 });
        vi.stubGlobal('fetch', fetchMock);
        process.env.MAKE_SOCIAL_WEBHOOK_URL = 'https://hook.example.test/abc';
        process.env.MAKE_SOCIAL_WEBHOOK_SECRET = 'make-secret';
        vi.spyOn(console, 'warn').mockImplementation(() => {});
        vi.spyOn(console, 'error').mockImplementation(() => {});
    });

    it('skips without calling the webhook when it is not configured', async () => {
        delete process.env.MAKE_SOCIAL_WEBHOOK_URL;
        const announce = await load();
        expect(await announce('post_1')).toEqual({ status: 'skipped', reason: 'not-configured' });
        expect(fetchMock).not.toHaveBeenCalled();
        expect(updateMock).not.toHaveBeenCalled();
    });

    it('skips unpublished posts', async () => {
        state.posts.set('post_1', { ...published, published: false });
        const announce = await load();
        expect(await announce('post_1')).toEqual({ status: 'skipped', reason: 'unpublished' });
        expect(fetchMock).not.toHaveBeenCalled();
    });

    it('skips posts scheduled in the future', async () => {
        state.posts.set('post_1', { ...published, publishedAt: { toDate: () => new Date(Date.now() + 86_400_000) } });
        const announce = await load();
        expect(await announce('post_1')).toEqual({ status: 'skipped', reason: 'scheduled' });
        expect(fetchMock).not.toHaveBeenCalled();
    });

    it('skips posts that were already announced', async () => {
        state.posts.set('post_1', { ...published, socialAnnouncedAt: { toDate: () => new Date() } });
        const announce = await load();
        expect((await announce('post_1')).status).toBe('already-announced');
        expect(fetchMock).not.toHaveBeenCalled();
    });

    it('posts the payload with the secret header and marks the post as announced', async () => {
        const announce = await load();
        expect(await announce('post_1')).toEqual({ status: 'sent' });

        expect(fetchMock).toHaveBeenCalledTimes(1);
        const [url, init] = fetchMock.mock.calls[0];
        expect(url).toBe('https://hook.example.test/abc');
        expect(init.method).toBe('POST');
        expect(init.headers['x-zetaprop-secret']).toBe('make-secret');
        expect(init.signal).toBeDefined();

        const body = JSON.parse(init.body);
        expect(body.event).toBe('blog.published');
        expect(body.post).toMatchObject({
            id: 'post_1',
            slug: 'como-ajustar-alquileres',
            url: 'https://zetaprop.com.ar/blog/como-ajustar-alquileres',
            coverUrl: published.imageUrl,
        });
        expect(body.images.instagram).toBe('https://zetaprop.com.ar/api/social/blog/post_1/image?format=instagram&type=jpeg');
        expect(body.images.instagramSquare).toContain('format=square&type=jpeg');
        expect(body.images.linkedin).toContain('format=linkedin&type=jpeg');
        expect(body.captions.instagram).toContain('Cómo ajustar alquileres');
        expect(body.captions.linkedin).toContain('https://zetaprop.com.ar/blog/como-ajustar-alquileres');
        expect(body.publishedAt).toBe('2026-10-01T12:00:00.000Z');

        expect(updateMock).toHaveBeenCalledWith('post_1', { socialAnnouncedAt: 'SERVER_TS', socialAnnounceError: 'DELETE' });
    });

    it('stores a short error and returns failed when the webhook fails, without throwing', async () => {
        fetchMock.mockResolvedValue({ ok: false, status: 500 });
        const announce = await load();
        expect(await announce('post_1')).toEqual({ status: 'failed', error: 'Webhook responded 500' });
        expect(updateMock).toHaveBeenCalledWith('post_1', { socialAnnounceError: 'Webhook responded 500' });
    });

    it('returns failed when fetch rejects (e.g. timeout)', async () => {
        fetchMock.mockRejectedValue(new Error('The operation was aborted due to timeout'));
        const announce = await load();
        const result = await announce('post_1');
        expect(result.status).toBe('failed');
        expect(updateMock).toHaveBeenCalledWith('post_1', { socialAnnounceError: expect.any(String) });
    });

    it('re-sends an already announced post when forced', async () => {
        state.posts.set('post_1', { ...published, socialAnnouncedAt: { toDate: () => new Date() } });
        const announce = await load();
        expect(await announce('post_1', { force: true })).toEqual({ status: 'sent' });
        expect(fetchMock).toHaveBeenCalledTimes(1);
    });
});
