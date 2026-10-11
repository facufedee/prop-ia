// @vitest-environment node
import { describe, it, expect, vi, beforeAll, beforeEach } from 'vitest';
import { createHash } from 'crypto';
import { NextRequest } from 'next/server';

// ── Fake Firestore ──────────────────────────────────────────────────────────

type Data = Record<string, unknown>;

const state = {
    subscribers: new Map<string, Data>(),
    users: [] as { id: string; data: Data }[],
};
const subscriberWriteMock = vi.fn();

const fakeDb = {
    collection: (name: string) => {
        if (name === 'newsletter_subscribers') {
            return {
                doc: (id: string) => ({
                    id,
                    get: async () => ({
                        id,
                        exists: state.subscribers.has(id),
                        data: () => state.subscribers.get(id),
                    }),
                    set: async (d: Data, opts?: { merge?: boolean }) => {
                        subscriberWriteMock('set', id, d);
                        state.subscribers.set(id, opts?.merge ? { ...state.subscribers.get(id), ...d } : d);
                    },
                    update: async (d: Data) => {
                        subscriberWriteMock('update', id, d);
                        state.subscribers.set(id, { ...state.subscribers.get(id), ...d });
                    },
                }),
            };
        }
        if (name === 'users') {
            return {
                doc: (id: string) => ({
                    get: async () => {
                        const user = state.users.find((u) => u.id === id);
                        return { id, exists: !!user, data: () => user?.data };
                    },
                }),
                where: (field: string, _op: string, value: unknown) => ({
                    limit: () => ({
                        get: async () => {
                            const docs = state.users
                                .filter((u) => u.data[field] === value)
                                .map((u) => ({ id: u.id, data: () => u.data }));
                            return { empty: docs.length === 0, docs };
                        },
                    }),
                }),
            };
        }
        throw new Error(`unexpected collection ${name}`);
    },
};

vi.mock('@/infrastructure/firebase/admin', () => ({ adminDb: fakeDb }));

const sendEmailMock = vi.fn();
vi.mock('@/lib/resend', () => ({ sendEmailWithResend: sendEmailMock }));

// ── Helpers ─────────────────────────────────────────────────────────────────

const URL_BASE = 'https://zetaprop.com.ar/api/newsletter/subscribe';
const ts = (ms: number) => ({ toMillis: () => ms });
const idFor = (email: string) => createHash('sha256').update(email).digest('hex');

function request(body: unknown) {
    return new NextRequest(URL_BASE, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: typeof body === 'string' ? body : JSON.stringify(body),
    });
}

async function load() {
    const { POST } = await import('../app/api/newsletter/subscribe/route');
    return POST;
}

// The first import pulls in next/server and firebase-admin, which can exceed the
// default 5s test timeout on a cold run.
beforeAll(async () => {
    await import('../app/api/newsletter/subscribe/route');
}, 30_000);

beforeEach(() => {
    process.env.CRON_SECRET = 'test-secret';
    state.subscribers = new Map();
    state.users = [];
    subscriberWriteMock.mockReset();
    sendEmailMock.mockReset().mockResolvedValue({ data: { id: 'e1' }, error: null });
});

describe('POST /api/newsletter/subscribe', () => {
    it('silently accepts a filled honeypot without writing or sending', async () => {
        const POST = await load();

        const res = await POST(request({ email: 'bot@example.com', website: 'http://spam' }));

        expect(res.status).toBe(200);
        expect(await res.json()).toEqual({ ok: true });
        expect(subscriberWriteMock).not.toHaveBeenCalled();
        expect(sendEmailMock).not.toHaveBeenCalled();
    });

    it.each([[{}], [{ email: 'not-an-email' }], [{ email: 42 }], ['{not json']])(
        'rejects invalid input %j with 400',
        async (body) => {
            const POST = await load();

            const res = await POST(request(body));

            expect(res.status).toBe(400);
            expect(subscriberWriteMock).not.toHaveBeenCalled();
            expect(sendEmailMock).not.toHaveBeenCalled();
        }
    );

    it('stores a new subscriber as pending under the sha256 of the normalized email and sends the confirmation', async () => {
        const POST = await load();

        const res = await POST(request({ email: '  Ana@Example.COM ' }));

        expect(res.status).toBe(200);
        expect(await res.json()).toEqual({ ok: true });

        const id = idFor('ana@example.com');
        expect(state.subscribers.get(id)).toMatchObject({
            email: 'ana@example.com',
            status: 'pending',
            createdAt: expect.anything(),
            confirmationSentAt: expect.anything(),
        });

        expect(sendEmailMock).toHaveBeenCalledTimes(1);
        const options = sendEmailMock.mock.calls[0][0];
        expect(options.to).toBe('ana@example.com');
        expect(options.from).toBe('Zeta Prop <newsletter@zetaprop.com.ar>');
        expect(options.subject).toBe('Confirmá tu suscripción al newsletter de Zeta Prop');
        expect(options.marketing).toBeUndefined();

        const { createConfirmToken } = await import('../lib/unsubscribeToken');
        const confirmUrl = `https://zetaprop.com.ar/newsletter/confirmar?s=${id}&t=${createConfirmToken(id)}`;
        expect(options.text).toContain(confirmUrl);
        expect(options.html).toContain(confirmUrl.replace(/&/g, '&amp;'));
        expect(options.text).toContain('Si no fuiste vos, ignorá este correo.');
    });

    it('does not email an address that belongs to a registered user', async () => {
        state.users = [{ id: 'u1', data: { email: 'ana@example.com' } }];
        const POST = await load();

        const res = await POST(request({ email: 'ANA@example.com' }));

        expect(res.status).toBe(200);
        expect(await res.json()).toEqual({ ok: true });
        expect(sendEmailMock).not.toHaveBeenCalled();
        expect(subscriberWriteMock).not.toHaveBeenCalled();
    });

    it('does not re-email a confirmed subscriber', async () => {
        const id = idFor('ana@example.com');
        state.subscribers.set(id, { email: 'ana@example.com', status: 'confirmed' });
        const POST = await load();

        const res = await POST(request({ email: 'ana@example.com' }));

        expect(res.status).toBe(200);
        expect(await res.json()).toEqual({ ok: true });
        expect(sendEmailMock).not.toHaveBeenCalled();
        expect(subscriberWriteMock).not.toHaveBeenCalled();
    });

    it('throttles confirmation re-sends for a pending subscriber to one per 10 minutes', async () => {
        const id = idFor('ana@example.com');
        state.subscribers.set(id, {
            email: 'ana@example.com',
            status: 'pending',
            confirmationSentAt: ts(Date.now() - 5 * 60 * 1000),
        });
        const POST = await load();

        const res = await POST(request({ email: 'ana@example.com' }));

        expect(res.status).toBe(200);
        expect(await res.json()).toEqual({ ok: true });
        expect(sendEmailMock).not.toHaveBeenCalled();
    });

    it('re-sends to a pending subscriber after the throttle window', async () => {
        const id = idFor('ana@example.com');
        const createdAt = ts(1);
        state.subscribers.set(id, {
            email: 'ana@example.com',
            status: 'pending',
            createdAt,
            confirmationSentAt: ts(Date.now() - 11 * 60 * 1000),
        });
        const POST = await load();

        await POST(request({ email: 'ana@example.com' }));

        expect(sendEmailMock).toHaveBeenCalledTimes(1);
        expect(state.subscribers.get(id)?.createdAt).toBe(createdAt);
    });

    it('moves an unsubscribed address back to pending, keeping createdAt, and sends the confirmation', async () => {
        const id = idFor('ana@example.com');
        const createdAt = ts(1);
        state.subscribers.set(id, { email: 'ana@example.com', status: 'unsubscribed', createdAt });
        const POST = await load();

        const res = await POST(request({ email: 'ana@example.com' }));

        expect(res.status).toBe(200);
        expect(state.subscribers.get(id)).toMatchObject({ status: 'pending', createdAt });
        expect(sendEmailMock).toHaveBeenCalledTimes(1);
    });

    it('returns 500 when the confirmation email cannot be sent and leaves the throttle open', async () => {
        sendEmailMock.mockRejectedValue(new Error('Resend down'));
        vi.spyOn(console, 'error').mockImplementation(() => {});
        const POST = await load();

        const res = await POST(request({ email: 'ana@example.com' }));

        expect(res.status).toBe(500);
        expect(state.subscribers.get(idFor('ana@example.com'))?.confirmationSentAt).toBeUndefined();
    });
});
