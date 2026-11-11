// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';
import { createFakeAdminDb, fakeTimestamp } from './helpers/fakeAdminDb';

let fake = createFakeAdminDb();

vi.mock('@/infrastructure/firebase/admin', () => ({
    get adminDb() {
        return fake.adminDb;
    },
}));
vi.mock('firebase-admin/firestore', () => ({ Timestamp: fakeTimestamp }));

const URL_BASE = 'https://zetaprop.com.ar/api/cron/carousel-draft';

function items(prefix = 'Ítem') {
    return Array.from({ length: 5 }, (_, i) => ({ title: `${prefix} ${i + 1}`, detail: `Detalle del ${prefix.toLowerCase()} ${i + 1}.` }));
}

function validDraft(overrides: Record<string, unknown> = {}) {
    return {
        topicNumber: 1,
        coverTitle: '5 preguntas para hacerle a un propietario antes de tomar su propiedad',
        listHeading: 'Antes de firmar, preguntale:',
        slides: [items()],
        caption: 'Guardalo para tu próxima captación.\n\n#inmobiliaria #captacion',
        ...overrides,
    };
}

function request(method: 'GET' | 'POST', body?: unknown, secret: string | null = 'carousel-secret') {
    return new NextRequest(URL_BASE, {
        method,
        headers: { 'content-type': 'application/json', ...(secret ? { 'x-cron-secret': secret } : {}) },
        ...(body === undefined ? {} : { body: typeof body === 'string' ? body : JSON.stringify(body) }),
    });
}

async function route() {
    return import('@/app/api/cron/carousel-draft/route');
}

describe('/api/cron/carousel-draft', () => {
    beforeEach(() => {
        fake = createFakeAdminDb();
        process.env.CAROUSEL_DRAFT_SECRET = 'carousel-secret';
        vi.spyOn(console, 'error').mockImplementation(() => {});
    });

    describe('auth', () => {
        it('rejects a missing secret', async () => {
            const { GET, POST } = await route();
            expect((await GET(request('GET', undefined, null))).status).toBe(401);
            expect((await POST(request('POST', validDraft(), null))).status).toBe(401);
        });

        it('rejects a wrong secret', async () => {
            const { GET, POST } = await route();
            expect((await GET(request('GET', undefined, 'nope'))).status).toBe(401);
            expect((await POST(request('POST', validDraft(), 'nope'))).status).toBe(401);
            expect(fake.list('social_carousels')).toHaveLength(0);
        });

        it('fails closed when the secret is not configured', async () => {
            delete process.env.CAROUSEL_DRAFT_SECRET;
            const { GET } = await route();
            expect((await GET(request('GET', undefined, 'carousel-secret'))).status).toBe(500);
        });

        it('does not accept other cron secrets', async () => {
            process.env.CRON_SECRET = 'cron-secret';
            const { GET } = await route();
            expect((await GET(request('GET', undefined, 'cron-secret'))).status).toBe(401);
        });
    });

    describe('GET', () => {
        it('returns the first topic and the text limits', async () => {
            const { GET } = await route();
            const res = await GET(request('GET'));
            expect(res.status).toBe(200);
            const body = await res.json();
            expect(body.topic).toEqual({ number: 1, category: 'Captación y tasación', title: expect.any(String) });
            expect(body.remaining).toBe(100);
            expect(body.limits.itemTitle).toBe(45);
            expect(body.limits.itemDetail).toBe(90);
        });

        it('skips topics that already have a draft or were published', async () => {
            await fake.adminDb.collection('social_carousels').doc('1').set({ topicNumber: 1, status: 'published' });
            await fake.adminDb.collection('social_carousels').doc('21').set({ topicNumber: 21, status: 'draft' });
            const { GET } = await route();
            const body = await (await GET(request('GET'))).json();
            expect(body.topic.number).toBe(41);
            expect(body.remaining).toBe(98);
        });

        it('reports when the bank is exhausted', async () => {
            for (let n = 1; n <= 100; n++) {
                await fake.adminDb.collection('social_carousels').doc(String(n)).set({ topicNumber: n, status: 'published' });
            }
            const { GET } = await route();
            const body = await (await GET(request('GET'))).json();
            expect(body).toMatchObject({ topic: null, remaining: 0 });
        });
    });

    describe('POST', () => {
        it('stores a valid draft keyed by topic number with bank metadata', async () => {
            const { POST } = await route();
            const res = await POST(request('POST', validDraft()));
            expect(res.status).toBe(200);
            expect(await res.json()).toMatchObject({ success: true, id: '1', status: 'draft' });

            const stored = fake.docs.get('social_carousels/1')!;
            expect(stored).toMatchObject({
                topicNumber: 1,
                category: 'Captación y tasación',
                title: '5 preguntas que tenés que hacerle a un propietario antes de tomar su propiedad',
                coverTitle: validDraft().coverTitle,
                listHeading: 'Antes de firmar, preguntale:',
                status: 'draft',
                publishedAt: null,
                publishError: null,
            });
            expect(stored.slides).toHaveLength(1);
            expect(stored.slides[0]).toHaveLength(5);
            expect(stored.createdAt).toBeDefined();
        });

        it('accepts two list slides', async () => {
            const { POST } = await route();
            const res = await POST(request('POST', validDraft({ slides: [items('A'), items('B')] })));
            expect(res.status).toBe(200);
            expect(fake.docs.get('social_carousels/1')!.slides).toHaveLength(2);
        });

        it('trims text fields', async () => {
            const { POST } = await route();
            await POST(request('POST', validDraft({ coverTitle: '  Título con espacios  ' })));
            expect(fake.docs.get('social_carousels/1')!.coverTitle).toBe('Título con espacios');
        });

        it.each([
            ['an unknown topic', { topicNumber: 101 }],
            ['a non-integer topic', { topicNumber: '1' }],
            ['an empty cover title', { coverTitle: '   ' }],
            ['a too long cover title', { coverTitle: 'x'.repeat(101) }],
            ['a too long list heading', { listHeading: 'x'.repeat(51) }],
            ['no slides', { slides: [] }],
            ['three slides', { slides: [items(), items(), items()] }],
            ['a slide with four items', { slides: [items().slice(0, 4)] }],
            ['a slide with six items', { slides: [[...items(), { title: 'Extra', detail: 'Extra.' }]] }],
            ['a too long item title', { slides: [[{ title: 'x'.repeat(46), detail: 'ok' }, ...items().slice(1)]] }],
            ['a too long item detail', { slides: [[{ title: 'ok', detail: 'x'.repeat(91) }, ...items().slice(1)]] }],
            ['an empty caption', { caption: '' }],
            ['a caption over the Instagram limit', { caption: 'x'.repeat(2201) }],
            ['more than 30 hashtags', { caption: Array.from({ length: 31 }, (_, i) => `#tag${i}`).join(' ') }],
        ])('rejects %s', async (_label, overrides) => {
            const { POST } = await route();
            const res = await POST(request('POST', validDraft(overrides)));
            expect(res.status).toBe(400);
            expect((await res.json()).error).toEqual(expect.any(String));
            expect(fake.list('social_carousels')).toHaveLength(0);
        });

        it('rejects invalid JSON', async () => {
            const { POST } = await route();
            expect((await POST(request('POST', '{not json'))).status).toBe(400);
        });

        it('overwrites an existing draft but keeps its createdAt', async () => {
            const createdAt = fakeTimestamp.fromDate(new Date('2026-10-01T00:00:00Z'));
            await fake.adminDb.collection('social_carousels').doc('1').set({ topicNumber: 1, status: 'draft', createdAt });
            const { POST } = await route();
            const res = await POST(request('POST', validDraft({ coverTitle: 'Nuevo título' })));
            expect(res.status).toBe(200);
            const stored = fake.docs.get('social_carousels/1')!;
            expect(stored.coverTitle).toBe('Nuevo título');
            expect(stored.createdAt).toBe(createdAt);
        });

        it('refuses to overwrite a published topic', async () => {
            await fake.adminDb.collection('social_carousels').doc('1').set({ topicNumber: 1, status: 'published', coverTitle: 'Original' });
            const { POST } = await route();
            const res = await POST(request('POST', validDraft()));
            expect(res.status).toBe(409);
            expect(fake.docs.get('social_carousels/1')!.coverTitle).toBe('Original');
        });
    });
});
