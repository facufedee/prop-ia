import { describe, it, expect, vi, beforeEach } from 'vitest';

const sendMock = vi.fn();

vi.mock('resend', () => ({
    Resend: class {
        emails = { send: sendMock };
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
