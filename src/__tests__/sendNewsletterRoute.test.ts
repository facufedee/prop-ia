// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

const sendNewsletterMock = vi.fn();

vi.mock('@/lib/newsletter/sendNewsletter', () => ({ sendNewsletter: sendNewsletterMock }));

const URL_BASE = 'https://zetaprop.com.ar/api/cron/send-newsletter';

describe('POST /api/cron/send-newsletter', () => {
    beforeEach(() => {
        process.env.CRON_SECRET = 'test-secret';
        sendNewsletterMock.mockReset().mockResolvedValue({ status: 'dry_run', recipients: 1, posts: [] });
    });

    it('rejects requests without the cron secret', async () => {
        const { POST } = await import('../app/api/cron/send-newsletter/route');

        const res = await POST(new NextRequest(URL_BASE, { method: 'POST' }));

        expect(res.status).toBe(401);
        expect(sendNewsletterMock).not.toHaveBeenCalled();
    });

    it('passes dryRun and testTo through and returns the summary', async () => {
        const { POST } = await import('../app/api/cron/send-newsletter/route');

        const res = await POST(
            new NextRequest(`${URL_BASE}?dryRun=1&testTo=owner%40example.com`, {
                method: 'POST',
                headers: { 'x-cron-secret': 'test-secret' },
            })
        );

        expect(res.status).toBe(200);
        expect(sendNewsletterMock).toHaveBeenCalledWith({ dryRun: true, testTo: 'owner@example.com' });
        expect(await res.json()).toEqual({ status: 'dry_run', recipients: 1, posts: [] });
    });

    it('rejects an invalid testTo address', async () => {
        const { POST } = await import('../app/api/cron/send-newsletter/route');

        const res = await POST(
            new NextRequest(`${URL_BASE}?testTo=not-an-email`, {
                method: 'POST',
                headers: { 'x-cron-secret': 'test-secret' },
            })
        );

        expect(res.status).toBe(400);
        expect(sendNewsletterMock).not.toHaveBeenCalled();
    });

    it('returns 500 with the message on unexpected errors', async () => {
        sendNewsletterMock.mockRejectedValue(new Error('Resend is not configured'));
        const { POST } = await import('../app/api/cron/send-newsletter/route');

        const res = await POST(
            new NextRequest(URL_BASE, { method: 'POST', headers: { 'x-cron-secret': 'test-secret' } })
        );

        expect(res.status).toBe(500);
        expect(await res.json()).toEqual({ error: 'Resend is not configured' });
    });
});
