// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest, NextResponse } from 'next/server';
import { createFakeAdminDb, fakeTimestamp } from './helpers/fakeAdminDb';

let fake = createFakeAdminDb();

vi.mock('@/infrastructure/firebase/admin', () => ({
    get adminDb() {
        return fake.adminDb;
    },
}));

const verifyAdminMock = vi.fn();
vi.mock('@/lib/apiAuth', () => ({ verifyAdmin: verifyAdminMock }));

const publishMock = vi.fn();
vi.mock('@/lib/social/publishCarousel', () => ({ publishCarousel: publishMock }));

const BASE = 'https://zetaprop.com.ar/api/admin/social-carousel';

function req(url: string, method: string, body?: unknown) {
    return new NextRequest(url, {
        method,
        headers: { authorization: 'Bearer admin-token', 'content-type': 'application/json' },
        ...(body === undefined ? {} : { body: JSON.stringify(body) }),
    });
}

const publishParams = (id: string) => ({ params: Promise.resolve({ id }) });

describe('admin social carousel routes', () => {
    beforeEach(() => {
        fake = createFakeAdminDb();
        verifyAdminMock.mockReset().mockResolvedValue({ user: { uid: 'admin' }, error: null });
        publishMock.mockReset().mockResolvedValue({ status: 'sent' });
    });

    describe('GET /api/admin/social-carousel', () => {
        it('rejects non-admins with the verifyAdmin response', async () => {
            verifyAdminMock.mockResolvedValue({ user: null, error: NextResponse.json({ error: 'Forbidden' }, { status: 403 }) });
            const { GET } = await import('@/app/api/admin/social-carousel/route');
            expect((await GET(req(BASE, 'GET'))).status).toBe(403);
        });

        it('lists all topics in publish order with their status and drafts', async () => {
            await fake.adminDb.collection('social_carousels').doc('1').set({
                topicNumber: 1,
                status: 'published',
                coverTitle: 'Portada',
                listHeading: 'Lista',
                slides: [[]],
                caption: 'Caption',
                createdAt: fakeTimestamp.fromDate(new Date('2026-10-01T10:00:00Z')),
                publishedAt: fakeTimestamp.fromDate(new Date('2026-10-02T10:00:00Z')),
            });
            await fake.adminDb.collection('social_carousels').doc('21').set({ topicNumber: 21, status: 'draft', coverTitle: 'Borrador', slides: [[]] });

            const { GET } = await import('@/app/api/admin/social-carousel/route');
            const res = await GET(req(BASE, 'GET'));
            expect(res.status).toBe(200);
            const { topics } = await res.json();
            expect(topics).toHaveLength(100);
            expect(topics.slice(0, 3).map((t: { number: number }) => t.number)).toEqual([1, 21, 41]);
            expect(topics[0]).toMatchObject({
                number: 1,
                position: 1,
                status: 'published',
                carousel: { coverTitle: 'Portada', publishedAt: '2026-10-02T10:00:00.000Z', createdAt: '2026-10-01T10:00:00.000Z' },
            });
            expect(topics[1]).toMatchObject({ number: 21, status: 'draft', carousel: { coverTitle: 'Borrador' } });
            expect(topics[2]).toMatchObject({ number: 41, status: 'pending', carousel: null });
        });
    });

    describe('POST /api/admin/social-carousel/[id]/publish', () => {
        it('rejects non-admins without publishing', async () => {
            verifyAdminMock.mockResolvedValue({ user: null, error: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) });
            const { POST } = await import('@/app/api/admin/social-carousel/[id]/publish/route');
            expect((await POST(req(`${BASE}/1/publish`, 'POST', {}), publishParams('1'))).status).toBe(401);
            expect(publishMock).not.toHaveBeenCalled();
        });

        it('publishes without force by default', async () => {
            const { POST } = await import('@/app/api/admin/social-carousel/[id]/publish/route');
            const res = await POST(req(`${BASE}/1/publish`, 'POST'), publishParams('1'));
            expect(res.status).toBe(200);
            expect(publishMock).toHaveBeenCalledWith('1', { force: false });
        });

        it('passes force only when it is literally true', async () => {
            const { POST } = await import('@/app/api/admin/social-carousel/[id]/publish/route');
            await POST(req(`${BASE}/1/publish`, 'POST', { force: 'yes' }), publishParams('1'));
            expect(publishMock).toHaveBeenLastCalledWith('1', { force: false });
            await POST(req(`${BASE}/1/publish`, 'POST', { force: true }), publishParams('1'));
            expect(publishMock).toHaveBeenLastCalledWith('1', { force: true });
        });

        it('rejects an invalid id', async () => {
            const { POST } = await import('@/app/api/admin/social-carousel/[id]/publish/route');
            expect((await POST(req(`${BASE}/x/publish`, 'POST', {}), publishParams('../x'))).status).toBe(404);
            expect(publishMock).not.toHaveBeenCalled();
        });

        it.each([
            [{ status: 'not-found' }, 404],
            [{ status: 'already-published' }, 409],
            [{ status: 'not-configured' }, 503],
            [{ status: 'failed', error: 'Webhook responded 500' }, 502],
        ])('maps %o to HTTP %i', async (result, code) => {
            publishMock.mockResolvedValue(result);
            const { POST } = await import('@/app/api/admin/social-carousel/[id]/publish/route');
            const res = await POST(req(`${BASE}/1/publish`, 'POST', {}), publishParams('1'));
            expect(res.status).toBe(code);
            expect(await res.json()).toMatchObject({ status: result.status });
        });
    });
});
