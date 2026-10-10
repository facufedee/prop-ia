// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

const updateMock = vi.fn();
const getMock = vi.fn();
const docMock = vi.fn(() => ({ get: getMock, update: updateMock }));
const collectionMock = vi.fn(() => ({ doc: docMock }));

vi.mock('@/infrastructure/firebase/admin', () => ({
    adminDb: { collection: collectionMock },
}));

const BASE = 'https://zetaprop.com.ar/api/newsletter/unsubscribe';

describe('POST /api/newsletter/unsubscribe', () => {
    beforeEach(() => {
        process.env.CRON_SECRET = 'test-secret';
        updateMock.mockReset().mockResolvedValue(undefined);
        getMock.mockReset().mockResolvedValue({ exists: true });
        docMock.mockClear();
        collectionMock.mockClear();
    });

    async function load() {
        const { POST } = await import('../app/api/newsletter/unsubscribe/route');
        const { createUnsubscribeToken } = await import('../lib/unsubscribeToken');
        return { POST, createUnsubscribeToken };
    }

    it('unsubscribes the user for a valid one-click request (query params, form body)', async () => {
        const { POST, createUnsubscribeToken } = await load();
        const t = createUnsubscribeToken('user-1');
        const req = new NextRequest(`${BASE}?u=user-1&t=${t}`, {
            method: 'POST',
            headers: { 'content-type': 'application/x-www-form-urlencoded' },
            body: 'List-Unsubscribe=One-Click',
        });

        const res = await POST(req);

        expect(res.status).toBe(200);
        expect(collectionMock).toHaveBeenCalledWith('users');
        expect(docMock).toHaveBeenCalledWith('user-1');
        expect(updateMock).toHaveBeenCalledWith(
            expect.objectContaining({ unsubscribedMarketing: true, unsubscribedAt: expect.any(String) })
        );
    });

    it('accepts a JSON body with u and t from the unsubscribe page', async () => {
        const { POST, createUnsubscribeToken } = await load();
        const t = createUnsubscribeToken('user-2');
        const req = new NextRequest(BASE, {
            method: 'POST',
            headers: { 'content-type': 'application/json' },
            body: JSON.stringify({ u: 'user-2', t }),
        });

        const res = await POST(req);

        expect(res.status).toBe(200);
        expect(docMock).toHaveBeenCalledWith('user-2');
        expect(updateMock).toHaveBeenCalled();
    });

    it('returns 403 for an invalid token and does not write', async () => {
        const { POST } = await load();
        const req = new NextRequest(`${BASE}?u=user-1&t=not-a-valid-token`, { method: 'POST' });

        const res = await POST(req);

        expect(res.status).toBe(403);
        expect(updateMock).not.toHaveBeenCalled();
    });

    it('returns 400 when params are missing', async () => {
        const { POST } = await load();
        const res = await POST(new NextRequest(BASE, { method: 'POST' }));

        expect(res.status).toBe(400);
        expect(updateMock).not.toHaveBeenCalled();
    });

    it('returns 200 without writing when the user does not exist', async () => {
        getMock.mockResolvedValue({ exists: false });
        const { POST, createUnsubscribeToken } = await load();
        const t = createUnsubscribeToken('ghost');
        const res = await POST(new NextRequest(`${BASE}?u=ghost&t=${t}`, { method: 'POST' }));

        expect(res.status).toBe(200);
        expect(updateMock).not.toHaveBeenCalled();
    });
});
