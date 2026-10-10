// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

const sendEmailMock = vi.fn();
const logAddMock = vi.fn();

type FakeUser = { id: string; email: string; displayName?: string; unsubscribedMarketing?: boolean };
let fakeUsers: FakeUser[] = [];

vi.mock('@/lib/apiAuth', () => ({
    verifyAdmin: vi.fn(async () => ({ user: { uid: 'admin', email: 'admin@x.com' }, error: null })),
}));

vi.mock('@/lib/resend', () => ({
    sendEmailWithResend: sendEmailMock,
    isSkippedEmail: (r: unknown) => (r as { skipped?: string } | null)?.skipped === 'unsubscribed',
}));

vi.mock('@/infrastructure/firebase/admin', () => ({
    adminDb: {
        collection: (name: string) =>
            name === 'emailLogs'
                ? { add: logAddMock }
                : {
                      doc: (id: string) => ({
                          get: async () => {
                              const user = fakeUsers.find(u => u.id === id);
                              return { exists: !!user, id, data: () => user };
                          },
                      }),
                  },
    },
}));

vi.mock('firebase-admin', () => ({
    firestore: { Timestamp: { now: () => 'now' } },
}));

function request(body: unknown) {
    return new NextRequest('https://zetaprop.com.ar/api/admin/bulk-email', {
        method: 'POST',
        body: JSON.stringify(body),
    });
}

describe('POST /api/admin/bulk-email', () => {
    beforeEach(() => {
        sendEmailMock.mockReset().mockResolvedValue({ data: { id: 'e1' }, error: null });
        logAddMock.mockReset().mockResolvedValue(undefined);
        fakeUsers = [
            { id: 'u1', email: 'ana@b.com', displayName: 'Ana' },
            { id: 'u2', email: 'out@b.com', unsubscribedMarketing: true },
        ];
    });

    it('sends each subscribed user a marketing email bound to their user id', async () => {
        const { POST } = await import('../app/api/admin/bulk-email/route');
        const html = 'Hola {{nombre}} <a href="{{unsubscribeUrl}}">baja</a>';

        const res = await POST(request({ subject: 'Promo', html, userIds: ['u1', 'u2'] }));

        expect(res.status).toBe(200);
        expect(sendEmailMock).toHaveBeenCalledTimes(1);
        expect(sendEmailMock).toHaveBeenCalledWith({
            to: 'ana@b.com',
            subject: 'Promo',
            html: 'Hola Ana <a href="{{unsubscribeUrl}}">baja</a>',
            marketing: { userId: 'u1' },
        });
        expect(await res.json()).toMatchObject({ sent: 1, failed: 0, skipped: 0 });
    });

    it('does not count a send skipped for unsubscribe as sent', async () => {
        sendEmailMock.mockResolvedValue({ data: null, error: null, skipped: 'unsubscribed' });
        const { POST } = await import('../app/api/admin/bulk-email/route');

        const res = await POST(request({ subject: 'Promo', html: '<p/>', userIds: ['u1'] }));

        expect(await res.json()).toMatchObject({ sent: 0, failed: 0, skipped: 1 });
        expect(logAddMock).toHaveBeenCalledWith(expect.objectContaining({ status: 'skipped_unsubscribed' }));
    });
});
