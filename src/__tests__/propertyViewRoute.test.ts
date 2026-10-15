// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

const BROWSER_UA =
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129.0 Safari/537.36';

// In-memory stand-in for the three collections the route touches.
const store = {
    properties: new Map<string, Record<string, unknown>>(),
    property_view_keys: new Map<string, Record<string, unknown>>(),
    property_stats: new Map<string, Record<string, unknown>>(),
};
const statsSetMock = vi.fn();
const verifyIdTokenMock = vi.fn();

vi.mock('firebase-admin/firestore', () => ({
    FieldValue: {
        increment: (n: number) => ({ __op: 'increment', n }),
        delete: () => ({ __op: 'delete' }),
        serverTimestamp: () => ({ __op: 'serverTimestamp' }),
    },
    Timestamp: { fromDate: (d: Date) => ({ __ts: d.toISOString() }) },
}));

vi.mock('@/infrastructure/firebase/admin', () => ({
    adminAuth: { verifyIdToken: verifyIdTokenMock },
    adminDb: {
        collection: (name: keyof typeof store) => ({
            doc: (id: string) => ({
                get: async () => ({ exists: store[name].has(id), data: () => store[name].get(id) }),
                create: async (data: Record<string, unknown>) => {
                    if (store[name].has(id)) {
                        throw Object.assign(new Error('ALREADY_EXISTS'), { code: 6 });
                    }
                    store[name].set(id, data);
                },
                set: async (data: Record<string, unknown>, opts: unknown) => {
                    statsSetMock(name, id, data, opts);
                    store[name].set(id, { ...(store[name].get(id) ?? {}), touched: true });
                },
            }),
        }),
    },
}));

function viewRequest(opts: { ua?: string; sessionId?: string; token?: string } = {}) {
    const headers: Record<string, string> = { 'content-type': 'application/json' };
    if (opts.ua !== undefined) headers['user-agent'] = opts.ua;
    if (opts.token) headers.authorization = `Bearer ${opts.token}`;
    return new NextRequest('https://zetaprop.com.ar/api/properties/prop1/view', {
        method: 'POST',
        headers,
        body: JSON.stringify({ sessionId: opts.sessionId ?? 'sess_abc123' }),
    });
}

const ctx = (id = 'prop1') => ({ params: Promise.resolve({ id }) });

describe('POST /api/properties/[id]/view', () => {
    beforeEach(() => {
        store.properties.clear();
        store.property_view_keys.clear();
        store.property_stats.clear();
        statsSetMock.mockReset();
        verifyIdTokenMock.mockReset();
        store.properties.set('prop1', { userId: 'owner1', status: 'active' });
    });

    it('ignores bots without writing', async () => {
        const { POST } = await import('../app/api/properties/[id]/view/route');
        const res = await POST(viewRequest({ ua: 'Googlebot/2.1 (+http://www.google.com/bot.html)' }), ctx());
        expect(res.status).toBe(204);
        expect(statsSetMock).not.toHaveBeenCalled();
        expect(store.property_view_keys.size).toBe(0);
    });

    it('ignores the property owner without writing', async () => {
        verifyIdTokenMock.mockResolvedValue({ uid: 'owner1' });
        const { POST } = await import('../app/api/properties/[id]/view/route');
        const res = await POST(viewRequest({ ua: BROWSER_UA, token: 'owner-token' }), ctx());
        expect(res.status).toBe(204);
        expect(statsSetMock).not.toHaveBeenCalled();
        expect(store.property_view_keys.size).toBe(0);
    });

    it('counts the first view of a session: increments views and today bucket, writes a TTL dedupe key', async () => {
        verifyIdTokenMock.mockResolvedValue({ uid: 'someone-else' });
        const { POST } = await import('../app/api/properties/[id]/view/route');
        const res = await POST(viewRequest({ ua: BROWSER_UA, token: 'visitor-token' }), ctx());
        expect(res.status).toBe(200);
        expect(statsSetMock).toHaveBeenCalledTimes(1);

        const [collectionName, docId, data, opts] = statsSetMock.mock.calls[0];
        expect(collectionName).toBe('property_stats');
        expect(docId).toBe('prop1');
        expect(opts).toEqual({ merge: true });
        expect(data.ownerId).toBe('owner1');
        expect(data.views).toEqual({ __op: 'increment', n: 1 });
        const today = new Date().toISOString().slice(0, 10);
        expect(data.viewsByDay[today]).toEqual({ __op: 'increment', n: 1 });

        expect(store.property_view_keys.size).toBe(1);
        const [keyId, keyDoc] = [...store.property_view_keys.entries()][0];
        expect(keyId).toBe(`prop1_sess_abc123_${today.replace(/-/g, '')}`);
        expect(keyDoc.expiresAt).toBeDefined();
    });

    it('does not count the same session twice on the same day', async () => {
        const { POST } = await import('../app/api/properties/[id]/view/route');
        const first = await POST(viewRequest({ ua: BROWSER_UA }), ctx());
        const second = await POST(viewRequest({ ua: BROWSER_UA }), ctx());
        expect(first.status).toBe(200);
        expect(second.status).toBe(204);
        expect(statsSetMock).toHaveBeenCalledTimes(1);
    });

    it('prunes viewsByDay buckets older than 90 days on write', async () => {
        store.property_stats.set('prop1', { viewsByDay: { '2020-01-01': 4 } });
        const { POST } = await import('../app/api/properties/[id]/view/route');
        await POST(viewRequest({ ua: BROWSER_UA }), ctx());
        const data = statsSetMock.mock.calls[0][2];
        expect(data.viewsByDay['2020-01-01']).toEqual({ __op: 'delete' });
    });

    it('treats an invalid token as an anonymous visitor', async () => {
        verifyIdTokenMock.mockRejectedValue(new Error('bad token'));
        const { POST } = await import('../app/api/properties/[id]/view/route');
        const res = await POST(viewRequest({ ua: BROWSER_UA, token: 'garbage' }), ctx());
        expect(res.status).toBe(200);
    });

    it('returns 204 without writing for unknown or inactive properties', async () => {
        const { POST } = await import('../app/api/properties/[id]/view/route');
        const unknown = await POST(viewRequest({ ua: BROWSER_UA }), ctx('missing'));
        store.properties.set('prop1', { userId: 'owner1', status: 'inactive' });
        const inactive = await POST(viewRequest({ ua: BROWSER_UA }), ctx());
        expect(unknown.status).toBe(204);
        expect(inactive.status).toBe(204);
        expect(statsSetMock).not.toHaveBeenCalled();
        expect(store.property_view_keys.size).toBe(0);
    });

    it('rejects a malformed session id with 400', async () => {
        const { POST } = await import('../app/api/properties/[id]/view/route');
        const res = await POST(viewRequest({ ua: BROWSER_UA, sessionId: 'bad/id with spaces' }), ctx());
        expect(res.status).toBe(400);
        expect(statsSetMock).not.toHaveBeenCalled();
    });
});
