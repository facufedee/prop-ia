// @vitest-environment node
import { describe, it, expect, vi, beforeAll, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

type Data = Record<string, unknown>;

const subscribers = new Map<string, Data>();
const updateMock = vi.fn();

vi.mock('@/infrastructure/firebase/admin', () => ({
    adminDb: {
        collection: (name: string) => {
            if (name !== 'newsletter_subscribers') throw new Error(`unexpected collection ${name}`);
            return {
                doc: (id: string) => ({
                    get: async () => ({ exists: subscribers.has(id), data: () => subscribers.get(id) }),
                    update: async (d: Data) => {
                        updateMock(id, d);
                        subscribers.set(id, { ...subscribers.get(id), ...d });
                    },
                }),
            };
        },
    },
}));

const BASE = 'https://zetaprop.com.ar/api/newsletter/confirm';

function request(body: unknown) {
    return new NextRequest(BASE, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(body),
    });
}

async function load() {
    const { POST } = await import('../app/api/newsletter/confirm/route');
    const tokens = await import('../lib/unsubscribeToken');
    return { POST, ...tokens };
}

// The first import pulls in next/server and firebase-admin, which can exceed the
// default 5s test timeout on a cold run.
beforeAll(async () => {
    await import('../app/api/newsletter/confirm/route');
}, 30_000);

beforeEach(() => {
    process.env.CRON_SECRET = 'test-secret';
    subscribers.clear();
    updateMock.mockReset();
});

describe('POST /api/newsletter/confirm', () => {
    it('confirms a pending subscriber with a valid token', async () => {
        subscribers.set('abc', { email: 'ana@example.com', status: 'pending' });
        const { POST, createConfirmToken } = await load();

        const res = await POST(request({ s: 'abc', t: createConfirmToken('abc') }));

        expect(res.status).toBe(200);
        expect(subscribers.get('abc')).toMatchObject({ status: 'confirmed', confirmedAt: expect.anything() });
    });

    it('is idempotent for an already confirmed subscriber', async () => {
        subscribers.set('abc', { email: 'ana@example.com', status: 'confirmed', confirmedAt: 'first' });
        const { POST, createConfirmToken } = await load();

        const res = await POST(request({ s: 'abc', t: createConfirmToken('abc') }));

        expect(res.status).toBe(200);
        expect(updateMock).not.toHaveBeenCalled();
        expect(subscribers.get('abc')?.confirmedAt).toBe('first');
    });

    it('returns 403 for an invalid token', async () => {
        subscribers.set('abc', { status: 'pending' });
        const { POST } = await load();

        const res = await POST(request({ s: 'abc', t: 'forged' }));

        expect(res.status).toBe(403);
        expect(updateMock).not.toHaveBeenCalled();
    });

    it('rejects an unsubscribe token used as a confirm token', async () => {
        subscribers.set('abc', { status: 'pending' });
        const { POST, createUnsubscribeToken } = await load();

        const res = await POST(request({ s: 'abc', t: createUnsubscribeToken('sub:abc') }));

        expect(res.status).toBe(403);
        expect(updateMock).not.toHaveBeenCalled();
    });

    it('returns 400 when params are missing', async () => {
        const { POST } = await load();

        expect((await POST(request({ s: 'abc' }))).status).toBe(400);
        expect((await POST(request({}))).status).toBe(400);
        expect(updateMock).not.toHaveBeenCalled();
    });

    it('returns 404 for an unknown subscriber', async () => {
        const { POST, createConfirmToken } = await load();

        const res = await POST(request({ s: 'ghost', t: createConfirmToken('ghost') }));

        expect(res.status).toBe(404);
    });

    it('does not re-subscribe an address that unsubscribed', async () => {
        subscribers.set('abc', { status: 'unsubscribed' });
        const { POST, createConfirmToken } = await load();

        const res = await POST(request({ s: 'abc', t: createConfirmToken('abc') }));

        expect(res.status).toBe(409);
        expect(updateMock).not.toHaveBeenCalled();
    });
});
