// @vitest-environment node
/* eslint-disable @typescript-eslint/no-explicit-any -- reads the fake store exposed by the mocked module */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import crypto from 'crypto';
import { NextRequest } from 'next/server';
import type { createFakeAdminDb } from './helpers/fakeAdminDb';

vi.mock('server-only', () => ({}));
vi.mock('firebase-admin/firestore', async () => {
    const { fakeTimestamp } = await import('./helpers/fakeAdminDb');
    return { Timestamp: fakeTimestamp };
});
vi.mock('@/infrastructure/firebase/admin', async () => {
    const { createFakeAdminDb } = await import('./helpers/fakeAdminDb');
    const fake = createFakeAdminDb();
    return { adminDb: fake.adminDb, adminAuth: {}, __fake: fake };
});
vi.mock('@/infrastructure/services/configService', () => ({
    configService: {
        getMercadoPagoConfig: vi.fn(async () => ({
            activeMode: 'sandbox',
            sandbox: { publicKey: 'TEST-pk', accessToken: 'TEST-access-token' },
            production: { publicKey: '', accessToken: '' },
        })),
    },
}));
vi.mock('@/lib/apiAuth', () => ({
    verifyAuth: vi.fn(async () => ({ user: { uid: 'u1' } })),
}));
const paymentCreateMock = vi.fn();
vi.mock('mercadopago', () => ({
    MercadoPagoConfig: class {},
    Payment: class {
        create = paymentCreateMock;
    },
}));

const SECRET = 'test-webhook-secret';
let fake: ReturnType<typeof createFakeAdminDb>;
let mpPayment: Record<string, unknown>;
const fetchMock = vi.fn();

function signedWebhook(paymentId: string, opts: { badSignature?: boolean } = {}) {
    const ts = '1700000000';
    const requestId = 'req-1';
    const hash = crypto
        .createHmac('sha256', SECRET)
        .update(`id:${paymentId};request-id:${requestId};ts:${ts}`)
        .digest('hex');
    const v1 = opts.badSignature ? hash.replace(/./, (c) => (c === 'a' ? 'b' : 'a')) : hash;
    return new NextRequest(`https://zetaprop.com.ar/api/webhooks/mercadopago?data.id=${paymentId}`, {
        method: 'POST',
        headers: { 'x-signature': `ts=${ts},v1=${v1}`, 'x-request-id': requestId },
        body: JSON.stringify({ type: 'payment', data: { id: paymentId } }),
    });
}

const doc = (path: string) => fake.docs.get(path);

describe('payment activation (Admin SDK)', () => {
    beforeEach(async () => {
        fake = ((await import('@/infrastructure/firebase/admin')) as any).__fake;
        fake.docs.clear();
        fake.docs.set('payments/pay1', { userId: 'u1', preferenceId: 'pref1', status: 'pending', amount: 0 });
        fake.docs.set('plans/pro', { name: 'Plan Profesional', tier: 'pro', price: { monthly: 1000, yearly: 10000 } });
        fake.docs.set('roles/role-pro', { name: 'Cliente Pro' });
        fake.docs.set('users/u1', { email: 'owner@example.com', roleId: 'role-free' });

        mpPayment = {
            status: 'approved',
            metadata: { plan_id: 'pro', billing_period: 'monthly' },
            preference_id: 'pref1',
            transaction_amount: 1000,
        };
        fetchMock.mockReset();
        fetchMock.mockImplementation(async (url: string) =>
            url.startsWith('https://api.mercadopago.com/')
                ? { ok: true, status: 200, json: async () => mpPayment }
                : { ok: true, status: 200, json: async () => ({}) },
        );
        vi.stubGlobal('fetch', fetchMock);
        process.env.MP_WEBHOOK_SECRET = SECRET;
        paymentCreateMock.mockReset();
    });

    afterEach(() => {
        vi.unstubAllGlobals();
    });

    it('webhook rejects an invalid signature without touching Firestore', async () => {
        const { POST } = await import('../app/api/webhooks/mercadopago/route');
        const res = await POST(signedWebhook('123', { badSignature: true }));
        expect(res.status).toBe(401);
        expect(doc('payments/pay1')!.status).toBe('pending');
        expect(fetchMock).not.toHaveBeenCalled();
    });

    it('webhook activates the subscription, upgrades the role, completes the payment and notifies', async () => {
        const { POST } = await import('../app/api/webhooks/mercadopago/route');
        const res = await POST(signedWebhook('123'));
        expect(res.status).toBe(200);
        expect(await res.json()).toEqual({ status: 'success', message: 'Subscription activated successfully' });

        expect(fetchMock.mock.calls[0][0]).toBe('https://api.mercadopago.com/v1/payments/123');
        expect(fetchMock.mock.calls[0][1].headers.Authorization).toBe('Bearer TEST-access-token');

        expect(doc('payments/pay1')).toMatchObject({ status: 'completed', providerPaymentId: '123', amount: 1000 });

        const subs = fake.list('subscriptions');
        expect(subs).toHaveLength(1);
        expect(subs[0][1]).toMatchObject({
            userId: 'u1',
            planId: 'pro',
            planTier: 'pro',
            status: 'active',
            billingPeriod: 'monthly',
            amount: 1000,
            currency: 'ARS',
            paymentMethod: 'mercadopago',
            trialEndDate: null,
            usage: { properties: 0, users: 0, clients: 0, tasaciones: 0, aiCredits: 0 },
        });

        expect(doc('users/u1')!.roleId).toBe('role-pro');
        // Paid access window is mirrored into the user doc for Firestore rules.
        expect(doc('users/u1')!.accessUntil.toDate().getTime()).toBe(subs[0][1].endDate.toDate().getTime());

        const notifications = fake.list('notifications').map(([, n]) => n);
        expect(notifications).toHaveLength(2);
        expect(notifications[0]).toMatchObject({ title: '¡Suscripción Activada!', targetRole: 'u1', readBy: [] });
        expect(notifications[1]).toMatchObject({ title: 'Nueva Suscripción', targetRole: 'Administrador' });
    });

    it('webhook is idempotent: a replayed notification does not activate twice', async () => {
        const { POST } = await import('../app/api/webhooks/mercadopago/route');
        await POST(signedWebhook('123'));
        const replay = await POST(signedWebhook('123'));
        expect(replay.status).toBe(200);
        expect(await replay.json()).toEqual({ status: 'ignored', message: 'No pending payment found' });
        expect(fake.list('subscriptions')).toHaveLength(1);
    });

    it('webhook extends an existing active subscription instead of creating one', async () => {
        const end = new Date('2030-01-15T00:00:00Z');
        fake.docs.set('subscriptions/sub1', {
            userId: 'u1',
            status: 'active',
            createdAt: { toMillis: () => 1, toDate: () => new Date(1) },
            endDate: { toMillis: () => end.getTime(), toDate: () => end },
        });
        const { POST } = await import('../app/api/webhooks/mercadopago/route');
        const res = await POST(signedWebhook('123'));
        expect(res.status).toBe(200);
        expect(fake.list('subscriptions')).toHaveLength(1);
        const updated = doc('subscriptions/sub1')!;
        expect(updated.status).toBe('active');
        expect(updated.endDate.toDate().toISOString()).toBe('2030-02-15T00:00:00.000Z');
        expect(doc('users/u1')!.accessUntil.toDate().toISOString()).toBe('2030-02-15T00:00:00.000Z');
    });

    it('webhook ignores payments that are not approved', async () => {
        mpPayment.status = 'pending';
        const { POST } = await import('../app/api/webhooks/mercadopago/route');
        const res = await POST(signedWebhook('123'));
        expect(await res.json()).toEqual({ status: 'ignored', message: 'Payment status is pending' });
        expect(doc('payments/pay1')!.status).toBe('pending');
        expect(fake.list('subscriptions')).toHaveLength(0);
    });

    it('process-payment activates the subscription for an approved card payment', async () => {
        paymentCreateMock.mockResolvedValue({ id: 123, status: 'approved', status_detail: 'accredited' });
        const { POST } = await import('../app/api/payments/process-payment/route');
        const req = new NextRequest('https://zetaprop.com.ar/api/payments/process-payment', {
            method: 'POST',
            body: JSON.stringify({
                formData: { token: 'tok', payment_method_id: 'visa', payer: { email: 'owner@example.com' } },
                transaction_amount: 1000,
                planId: 'pro',
                userId: 'u1',
                billing: 'monthly',
            }),
        });
        const res = await POST(req);
        expect(res.status).toBe(200);
        expect(await res.json()).toEqual({ id: 123, status: 'approved', status_detail: 'accredited' });
        expect(paymentCreateMock.mock.calls[0][0].body.metadata).toEqual({
            plan_id: 'pro',
            billing_period: 'monthly',
            user_id: 'u1',
        });
        expect(doc('payments/pay1')!.status).toBe('completed');
        expect(fake.list('subscriptions')).toHaveLength(1);
    });

    it('process-payment does not activate a rejected card payment', async () => {
        paymentCreateMock.mockResolvedValue({ id: 124, status: 'rejected', status_detail: 'cc_rejected_other_reason' });
        const { POST } = await import('../app/api/payments/process-payment/route');
        const req = new NextRequest('https://zetaprop.com.ar/api/payments/process-payment', {
            method: 'POST',
            body: JSON.stringify({
                formData: { token: 'tok', payment_method_id: 'visa', payer: { email: 'owner@example.com' } },
                transaction_amount: 1000,
                planId: 'pro',
                billing: 'monthly',
            }),
        });
        const res = await POST(req);
        expect((await res.json()).status).toBe('rejected');
        expect(fetchMock).not.toHaveBeenCalled();
        expect(doc('payments/pay1')!.status).toBe('pending');
    });
});
