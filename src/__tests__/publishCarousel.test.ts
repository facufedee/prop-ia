// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createFakeAdminDb } from './helpers/fakeAdminDb';

let fake = createFakeAdminDb();

vi.mock('@/infrastructure/firebase/admin', () => ({
    get adminDb() {
        return fake.adminDb;
    },
}));
vi.mock('firebase-admin/firestore', () => ({
    FieldValue: { serverTimestamp: () => 'SERVER_TS' },
}));

const fetchMock = vi.fn();

function items(prefix: string) {
    return Array.from({ length: 5 }, (_, i) => ({ title: `${prefix} ${i + 1}`, detail: `Detalle ${i + 1}.` }));
}

const draft = {
    topicNumber: 21,
    category: 'Alquileres y administración',
    title: '5 cosas que revisar antes de firmar un contrato de alquiler',
    coverTitle: '5 cosas que revisar antes de firmar un alquiler',
    listHeading: 'Antes de firmar, revisá:',
    slides: [items('A'), items('B')],
    caption: 'Guardalo para tu próximo contrato.\n\n#alquileres',
    status: 'draft',
    publishedAt: null,
    publishError: null,
};

async function publish(id: string, options?: { force?: boolean }) {
    vi.resetModules();
    const { publishCarousel } = await import('@/lib/social/publishCarousel');
    return publishCarousel(id, options);
}

describe('publishCarousel', () => {
    beforeEach(async () => {
        fake = createFakeAdminDb();
        await fake.adminDb.collection('social_carousels').doc('21').set({ ...draft });
        fetchMock.mockReset().mockResolvedValue({ ok: true, status: 200 });
        vi.stubGlobal('fetch', fetchMock);
        process.env.MAKE_SOCIAL_WEBHOOK_URL = 'https://hook.example.test/abc';
        process.env.MAKE_SOCIAL_WEBHOOK_SECRET = 'make-secret';
        vi.spyOn(console, 'error').mockImplementation(() => {});
        vi.spyOn(console, 'warn').mockImplementation(() => {});
    });

    it('sends the ordered slide URLs and caption to Make, then marks the topic published', async () => {
        expect(await publish('21')).toEqual({ status: 'sent' });

        expect(fetchMock).toHaveBeenCalledTimes(1);
        const [url, init] = fetchMock.mock.calls[0];
        expect(url).toBe('https://hook.example.test/abc');
        expect(init.method).toBe('POST');
        expect(init.headers['x-zetaprop-secret']).toBe('make-secret');
        expect(init.signal).toBeDefined();

        const body = JSON.parse(init.body);
        expect(body.event).toBe('carousel.publish');
        expect(body.secret).toBe('make-secret');
        expect(body.topic).toEqual({
            number: 21,
            category: 'Alquileres y administración',
            title: draft.title,
            coverTitle: draft.coverTitle,
        });
        expect(body.caption).toBe(draft.caption);
        // cover + 2 list slides + closing
        expect(body.images).toEqual([1, 2, 3, 4].map((n) => `https://zetaprop.com.ar/api/social/carousel/21/image?slide=${n}&type=jpeg`));

        expect(fake.docs.get('social_carousels/21')).toMatchObject({ status: 'published', publishedAt: 'SERVER_TS', publishError: null });
    });

    it('does nothing when the webhook is not configured', async () => {
        delete process.env.MAKE_SOCIAL_WEBHOOK_URL;
        expect(await publish('21')).toEqual({ status: 'not-configured' });
        expect(fetchMock).not.toHaveBeenCalled();
        expect(fake.docs.get('social_carousels/21')!.status).toBe('draft');
    });

    it('reports unknown topics', async () => {
        expect(await publish('41')).toEqual({ status: 'not-found' });
        expect(fetchMock).not.toHaveBeenCalled();
    });

    it('refuses an already published topic unless forced', async () => {
        await fake.adminDb.collection('social_carousels').doc('21').set({ ...draft, status: 'published', publishedAt: 'EARLIER' });
        expect(await publish('21')).toEqual({ status: 'already-published' });
        expect(fetchMock).not.toHaveBeenCalled();

        expect(await publish('21', { force: true })).toEqual({ status: 'sent' });
        expect(fetchMock).toHaveBeenCalledTimes(1);
        expect(fake.docs.get('social_carousels/21')!.publishedAt).toBe('SERVER_TS');
    });

    it('stores the error and keeps the draft when Make fails', async () => {
        fetchMock.mockResolvedValue({ ok: false, status: 500 });
        expect(await publish('21')).toEqual({ status: 'failed', error: 'Webhook responded 500' });
        expect(fake.docs.get('social_carousels/21')).toMatchObject({ status: 'draft', publishError: 'Webhook responded 500' });
    });

    it('returns failed without throwing when fetch rejects', async () => {
        fetchMock.mockRejectedValue(new Error('The operation was aborted due to timeout'));
        const result = await publish('21');
        expect(result.status).toBe('failed');
        expect(fake.docs.get('social_carousels/21')!.publishError).toEqual(expect.any(String));
    });

    it('refuses a malformed draft without calling Make', async () => {
        await fake.adminDb.collection('social_carousels').doc('21').set({ ...draft, slides: [] });
        expect((await publish('21')).status).toBe('failed');
        expect(fetchMock).not.toHaveBeenCalled();
    });
});
