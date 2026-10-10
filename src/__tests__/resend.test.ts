import { describe, it, expect, vi, beforeEach } from 'vitest';

const sendMock = vi.fn();

vi.mock('resend', () => ({
    Resend: class {
        emails = { send: sendMock };
    },
}));

type FakeUser = { id: string; email: string; unsubscribedMarketing?: boolean };
let fakeUsers: FakeUser[] = [];

function snapOf(user: FakeUser | undefined) {
    return { exists: !!user, id: user?.id, data: () => user };
}

vi.mock('@/infrastructure/firebase/admin', () => ({
    adminDb: {
        collection: () => ({
            doc: (id: string) => ({ get: async () => snapOf(fakeUsers.find(u => u.id === id)) }),
            where: (_field: string, _op: string, value: string) => ({
                limit: () => ({
                    get: async () => {
                        const docs = fakeUsers.filter(u => u.email === value).map(snapOf);
                        return { empty: docs.length === 0, docs };
                    },
                }),
            }),
        }),
    },
}));

describe('sendEmailWithResend', () => {
    beforeEach(() => {
        vi.resetModules();
        sendMock.mockReset();
        process.env.RESEND_API_KEY = 're_test_key';
    });

    it('returns the Resend response when the send succeeds', async () => {
        sendMock.mockResolvedValue({ data: { id: 'email_123' }, error: null });
        const { sendEmailWithResend } = await import('../lib/resend');

        const result = await sendEmailWithResend({ to: 'a@b.com', subject: 'Hi', html: '<p>Hi</p>' });

        expect(result?.data?.id).toBe('email_123');
    });

    it('throws when Resend returns an error instead of data', async () => {
        sendMock.mockResolvedValue({
            data: null,
            error: { name: 'validation_error', message: 'API key is invalid' },
        });
        const { sendEmailWithResend } = await import('../lib/resend');

        await expect(
            sendEmailWithResend({ to: 'a@b.com', subject: 'Hi', html: '<p>Hi</p>' })
        ).rejects.toThrow('API key is invalid');
    });
});

describe('sendEmailWithResend with the marketing option', () => {
    const legacyHtml = '<a href="https://zetaprop.com.ar/unsubscribe?email=ana@b.com">Darse de baja</a>';

    beforeEach(() => {
        vi.resetModules();
        sendMock.mockReset().mockResolvedValue({ data: { id: 'email_m' }, error: null });
        process.env.RESEND_API_KEY = 're_test_key';
        process.env.CRON_SECRET = 'test-secret';
        fakeUsers = [{ id: 'user1', email: 'ana@b.com' }];
    });

    it('skips users who unsubscribed from marketing without calling Resend', async () => {
        fakeUsers = [{ id: 'user1', email: 'ana@b.com', unsubscribedMarketing: true }];
        const { sendEmailWithResend } = await import('../lib/resend');

        const result = await sendEmailWithResend({
            to: 'ana@b.com', subject: 'Promo', html: legacyHtml, marketing: {},
        });

        expect(result).toMatchObject({ skipped: 'unsubscribed' });
        expect(sendMock).not.toHaveBeenCalled();
    });

    it('rewrites links to the signed URL and adds List-Unsubscribe headers for a known user', async () => {
        const { sendEmailWithResend } = await import('../lib/resend');
        const { buildUnsubscribeUrl, buildOneClickUnsubscribeUrl } = await import('../lib/unsubscribeToken');

        await sendEmailWithResend({
            to: 'Ana@B.com',
            subject: 'Promo',
            html: legacyHtml,
            text: 'Baja: {{unsubscribeUrl}}',
            marketing: {},
        });

        const payload = sendMock.mock.calls[0][0];
        const signed = buildUnsubscribeUrl('user1');
        expect(payload.html).toContain(`href="${signed.replace(/&/g, '&amp;')}"`);
        expect(payload.html).not.toContain('?email=');
        expect(payload.text).toBe(`Baja: ${signed}`);
        expect(payload.headers['List-Unsubscribe']).toContain(buildOneClickUnsubscribeUrl('user1'));
        expect(payload.headers['List-Unsubscribe-Post']).toBe('List-Unsubscribe=One-Click');
    });

    it('resolves the user by id when one is given', async () => {
        fakeUsers = [{ id: 'user9', email: 'other@b.com' }];
        const { sendEmailWithResend } = await import('../lib/resend');
        const { buildUnsubscribeUrl } = await import('../lib/unsubscribeToken');

        await sendEmailWithResend({
            to: 'ana@b.com', subject: 'Promo', html: '<a href="{{unsubscribeUrl}}">x</a>', marketing: { userId: 'user9' },
        });

        expect(sendMock.mock.calls[0][0].html).toContain(buildUnsubscribeUrl('user9').replace(/&/g, '&amp;'));
    });

    it('sends to unknown recipients with the generic page link and no List-Unsubscribe headers', async () => {
        fakeUsers = [];
        const { sendEmailWithResend } = await import('../lib/resend');

        await sendEmailWithResend({ to: 'stranger@x.com', subject: 'Promo', html: legacyHtml, marketing: {} });

        const payload = sendMock.mock.calls[0][0];
        expect(payload.html).toContain('href="https://zetaprop.com.ar/unsubscribe"');
        expect(payload.html).not.toContain('?email=');
        expect(payload.headers).toBeUndefined();
    });

    it('rejects marketing sends to more than one recipient', async () => {
        const { sendEmailWithResend } = await import('../lib/resend');

        await expect(
            sendEmailWithResend({ to: ['a@b.com', 'c@d.com'], subject: 'Promo', html: '<p/>', marketing: {} })
        ).rejects.toThrow(/single recipient/);
        expect(sendMock).not.toHaveBeenCalled();
    });

    it('leaves non-marketing sends untouched', async () => {
        const { sendEmailWithResend } = await import('../lib/resend');

        await sendEmailWithResend({ to: 'ana@b.com', subject: 'Hi', html: legacyHtml });

        expect(sendMock).toHaveBeenCalledWith({
            from: 'ZetaProp <notificaciones@zetaprop.com.ar>',
            to: ['ana@b.com'],
            subject: 'Hi',
            html: legacyHtml,
        });
    });
});

describe('resendClient helpers', () => {
    beforeEach(() => {
        vi.resetModules();
        sendMock.mockReset();
        process.env.RESEND_API_KEY = 're_test_key';
    });

    it('returns the Resend response when the send succeeds', async () => {
        sendMock.mockResolvedValue({ data: { id: 'email_456' }, error: null });
        const { sendNewLeadNotificationEmail } = await import('../lib/resendClient');

        const result = await sendNewLeadNotificationEmail({ to: 'agent@b.com', leadName: 'Ana' });

        expect(result?.data?.id).toBe('email_456');
    });

    it('throws when Resend returns an error instead of data', async () => {
        sendMock.mockResolvedValue({
            data: null,
            error: { name: 'validation_error', message: 'API key is invalid' },
        });
        const { sendNewLeadNotificationEmail } = await import('../lib/resendClient');

        await expect(
            sendNewLeadNotificationEmail({ to: 'agent@b.com', leadName: 'Ana' })
        ).rejects.toThrow('API key is invalid');
    });
});
