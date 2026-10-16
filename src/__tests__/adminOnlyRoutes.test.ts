// @vitest-environment node
import { describe, it, expect, vi, beforeAll, beforeEach } from 'vitest';
import { NextRequest, NextResponse } from 'next/server';

// A signed-in client (valid ID token, non-admin role): verifyAuth accepts it,
// verifyAdmin rejects it. Every platform marketing/blog/social route must use
// verifyAdmin, so each one has to answer 403 without touching its services.
const verifyAuthMock = vi.fn(async () => ({ user: { uid: 'client', email: 'client@agency.com' }, error: null }));
const verifyAdminMock = vi.fn();

vi.mock('@/lib/apiAuth', () => ({
    verifyAuth: verifyAuthMock,
    verifyAdmin: verifyAdminMock,
}));

const marketingService = {
    getTemplates: vi.fn(),
    getEmailStats: vi.fn(),
    getEmailLogs: vi.fn(),
    saveTemplate: vi.fn(),
    deleteTemplate: vi.fn(),
    sendWelcomeEmail: vi.fn(),
    sendPaymentConfirmedEmail: vi.fn(),
    sendPaymentExpiringEmail: vi.fn(),
    sendNewLeadEmail: vi.fn(),
    sendCustomEmail: vi.fn(),
};
vi.mock('@/infrastructure/services/marketingEmailService', () => ({ marketingEmailService: marketingService }));

const announceMock = vi.fn();
vi.mock('@/lib/social/announceBlogPost', () => ({ announceBlogPost: announceMock }));

const publishCarouselMock = vi.fn();
vi.mock('@/lib/social/publishCarousel', () => ({ publishCarousel: publishCarouselMock }));

const sendEmailMock = vi.fn();
vi.mock('@/lib/resend', () => ({ sendEmailWithResend: sendEmailMock, isSkippedEmail: () => false }));

const adminCollectionMock = vi.fn();
vi.mock('@/infrastructure/firebase/admin', () => ({ adminDb: { collection: adminCollectionMock } }));
vi.mock('firebase-admin', () => ({ firestore: { Timestamp: { now: () => 'now' } } }));

const generateContentMock = vi.fn();
vi.mock('@google/generative-ai', () => ({
    GoogleGenerativeAI: class {
        getGenerativeModel() {
            return { generateContent: generateContentMock };
        }
    },
}));

const fetchMock = vi.fn();

function req(url: string, method: string, body?: unknown) {
    return new NextRequest(`https://zetaprop.com.ar${url}`, {
        method,
        headers: { authorization: 'Bearer client-token' },
        ...(body === undefined ? {} : { body: JSON.stringify(body) }),
    });
}

const params = { params: Promise.resolve({ id: 'post1' }) };

type Call = () => Promise<Response>;

const ROUTES: Array<[string, Call]> = [
    ['GET /api/marketing/templates', async () => (await import('../app/api/marketing/templates/route')).GET(req('/api/marketing/templates', 'GET'))],
    ['POST /api/marketing/templates', async () =>
        (await import('../app/api/marketing/templates/route')).POST(req('/api/marketing/templates', 'POST', { type: 'pro', subject: 's', html: '<p/>' }))],
    ['DELETE /api/marketing/templates', async () =>
        (await import('../app/api/marketing/templates/route')).DELETE(req('/api/marketing/templates?id=t1', 'DELETE'))],
    ['POST /api/marketing/send', async () =>
        (await import('../app/api/marketing/send/route')).POST(req('/api/marketing/send', 'POST', { type: 'welcome', to: 'x@y.com', data: {} }))],
    ['POST /api/admin/bulk-email', async () =>
        (await import('../app/api/admin/bulk-email/route')).POST(req('/api/admin/bulk-email', 'POST', { userIds: ['u1'], subject: 's', html: 'h' }))],
    ['POST /api/social/blog/[id]/announce', async () =>
        (await import('../app/api/social/blog/[id]/announce/route')).POST(req('/api/social/blog/post1/announce', 'POST', { force: true }), params)],
    ['POST /api/blog/generate', async () =>
        (await import('../app/api/blog/generate/route')).POST(req('/api/blog/generate', 'POST', { url: 'https://example.com/article' }))],
    ['POST /api/social/generate', async () =>
        (await import('../app/api/social/generate/route')).POST(req('/api/social/generate', 'POST', { title: 't', content: 'c' }))],
    ['GET /api/admin/social-carousel', async () =>
        (await import('../app/api/admin/social-carousel/route')).GET(req('/api/admin/social-carousel', 'GET'))],
    ['POST /api/admin/social-carousel/[id]/publish', async () =>
        (await import('../app/api/admin/social-carousel/[id]/publish/route')).POST(
            req('/api/admin/social-carousel/1/publish', 'POST', { force: true }),
            { params: Promise.resolve({ id: '1' }) }
        )],
];

describe('platform marketing/blog/social routes are admin-only', () => {
    // Cold-importing the routes (cheerio, Gemini SDK) can exceed the default timeout.
    beforeAll(async () => {
        await Promise.all([
            import('../app/api/marketing/templates/route'),
            import('../app/api/marketing/send/route'),
            import('../app/api/admin/bulk-email/route'),
            import('../app/api/social/blog/[id]/announce/route'),
            import('../app/api/blog/generate/route'),
            import('../app/api/social/generate/route'),
            import('../app/api/admin/social-carousel/route'),
            import('../app/api/admin/social-carousel/[id]/publish/route'),
        ]);
    }, 60_000);

    beforeEach(() => {
        vi.clearAllMocks();
        verifyAdminMock.mockResolvedValue({
            user: null,
            error: NextResponse.json({ error: 'Forbidden' }, { status: 403 }),
        });
        vi.stubGlobal('fetch', fetchMock);
        process.env.GOOGLE_API_KEY = 'test-key';
    });

    it.each(ROUTES)('%s rejects a signed-in non-admin with 403 and no side effects', async (_name, call) => {
        const res = await call();

        expect(res.status).toBe(403);
        expect(verifyAdminMock).toHaveBeenCalledTimes(1);
        expect(verifyAuthMock).not.toHaveBeenCalled();
        for (const fn of Object.values(marketingService)) expect(fn).not.toHaveBeenCalled();
        expect(announceMock).not.toHaveBeenCalled();
        expect(publishCarouselMock).not.toHaveBeenCalled();
        expect(sendEmailMock).not.toHaveBeenCalled();
        expect(adminCollectionMock).not.toHaveBeenCalled();
        expect(generateContentMock).not.toHaveBeenCalled();
        expect(fetchMock).not.toHaveBeenCalled();
    });

    it('lets an admin through to the announce service', async () => {
        verifyAdminMock.mockResolvedValue({ user: { uid: 'admin', email: 'admin@zeta.com' }, error: null });
        announceMock.mockResolvedValue({ status: 'sent' });

        const { POST } = await import('../app/api/social/blog/[id]/announce/route');
        const res = await POST(req('/api/social/blog/post1/announce', 'POST', { force: true }), params);

        expect(res.status).toBe(200);
        expect(announceMock).toHaveBeenCalledWith('post1', { force: true });
    });
});
