// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from 'vitest';
import sharp from 'sharp';
import { createFakeAdminDb } from './helpers/fakeAdminDb';

let fake = createFakeAdminDb();

vi.mock('@/infrastructure/firebase/admin', () => ({
    get adminDb() {
        return fake.adminDb;
    },
}));

function items(prefix: string) {
    return Array.from({ length: 5 }, (_, i) => ({ title: `${prefix} ${i + 1}`, detail: `Detalle ${i + 1}.` }));
}

const draft = {
    topicNumber: 1,
    category: 'Captación y tasación',
    title: '5 preguntas que tenés que hacerle a un propietario antes de tomar su propiedad',
    coverTitle: '5 preguntas para hacerle a un propietario antes de tomar su propiedad',
    listHeading: 'Antes de firmar, preguntale:',
    slides: [items('Pregunta')],
    caption: 'Guardalo.',
    status: 'draft',
};

async function get(id: string, query = '') {
    const { GET } = await import('@/app/api/social/carousel/[id]/image/route');
    return GET(new Request(`https://zetaprop.com.ar/api/social/carousel/${id}/image${query}`), {
        params: Promise.resolve({ id }),
    });
}

async function expectJpeg(res: Response) {
    expect(res.status).toBe(200);
    expect(res.headers.get('content-type')).toBe('image/jpeg');
    const meta = await sharp(Buffer.from(await res.arrayBuffer())).metadata();
    expect(meta).toMatchObject({ format: 'jpeg', width: 1080, height: 1350 });
}

describe('GET /api/social/carousel/[id]/image', () => {
    beforeEach(async () => {
        fake = createFakeAdminDb();
        await fake.adminDb.collection('social_carousels').doc('1').set({ ...draft });
        vi.spyOn(console, 'error').mockImplementation(() => {});
    });

    it('renders the cover, list and closing slides as 1080x1350 JPEGs', async () => {
        await expectJpeg(await get('1', '?slide=1&type=jpeg'));
        await expectJpeg(await get('1', '?slide=2&type=jpeg'));
        await expectJpeg(await get('1', '?slide=3&type=jpeg'));
    }, 30_000);

    it('renders published carousels too, with two list slides', async () => {
        await fake.adminDb
            .collection('social_carousels')
            .doc('21')
            .set({ ...draft, topicNumber: 21, category: 'Alquileres y administración', slides: [items('A'), items('B')], status: 'published' });
        await expectJpeg(await get('21', '?slide=4&type=jpeg'));
        expect((await get('21', '?slide=5&type=jpeg')).status).toBe(404);
    }, 30_000);

    it('defaults to slide 1 as PNG', async () => {
        const res = await get('1');
        expect(res.status).toBe(200);
        expect(res.headers.get('content-type')).toBe('image/png');
    }, 30_000);

    it('serves drafts with a short cache so re-drafted copy shows up', async () => {
        const res = await get('1', '?slide=1&type=jpeg');
        expect(res.headers.get('cache-control')).toContain('max-age=60');
    }, 30_000);

    it.each([
        ['an unknown topic', '99', '?slide=1'],
        ['a non-numeric id', 'abc', '?slide=1'],
        ['slide 0', '1', '?slide=0'],
        ['a slide past the closing slide', '1', '?slide=4'],
        ['a non-numeric slide', '1', '?slide=dos'],
    ])('returns 404 for %s', async (_label, id, query) => {
        expect((await get(id, query)).status).toBe(404);
    });

    it('returns 404 for a doc with an unexpected status', async () => {
        await fake.adminDb.collection('social_carousels').doc('2').set({ ...draft, topicNumber: 2, status: 'archived' });
        expect((await get('2', '?slide=1')).status).toBe(404);
    });

    it('returns 404 for a malformed doc instead of crashing', async () => {
        await fake.adminDb.collection('social_carousels').doc('3').set({ ...draft, topicNumber: 3, slides: 'nope' });
        expect((await get('3', '?slide=1')).status).toBe(404);
    });
});

describe('carousel list scale', () => {
    it('keeps the mockup scale for short copy and shrinks for copy at the limits', async () => {
        const { listScale } = await import('@/lib/social/carouselSlides');
        const short = Array.from({ length: 5 }, () => ({ title: '¿Por qué vende y para cuándo?', detail: 'La urgencia define la estrategia de precio.' }));
        expect(listScale('Antes de firmar, preguntale:', short).title).toBe(38);
        const long = Array.from({ length: 5 }, () => ({ title: 'M'.repeat(45), detail: 'M'.repeat(90) }));
        expect(listScale('M'.repeat(50), long).title).toBeLessThan(38);
    });
});
