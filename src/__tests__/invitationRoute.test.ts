// @vitest-environment node
/* eslint-disable @typescript-eslint/no-explicit-any -- reads the fake store exposed by the mocked module */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';
import type { createFakeAdminDb } from './helpers/fakeAdminDb';

vi.mock('@/infrastructure/firebase/admin', async () => {
    const { createFakeAdminDb } = await import('./helpers/fakeAdminDb');
    const fake = createFakeAdminDb();
    return { adminDb: fake.adminDb, adminAuth: {}, __fake: fake };
});

let fake: ReturnType<typeof createFakeAdminDb>;
const at = (d: Date) => ({ toDate: () => d });
const call = async (token: string) => {
    const { GET } = await import('../app/api/invitations/[token]/route');
    return GET(new NextRequest(`https://zetaprop.com.ar/api/invitations/${token}`), {
        params: Promise.resolve({ token }),
    });
};

describe('GET /api/invitations/[token] (Admin SDK)', () => {
    beforeEach(async () => {
        fake = ((await import('@/infrastructure/firebase/admin')) as any).__fake;
        fake.docs.clear();
        fake.docs.set('invitations/inv1', {
            token: 'tok-valid',
            agenteId: 'ag1',
            email: 'agent@example.com',
            branchId: 'br1',
            organizationId: 'owner1',
            status: 'pending',
            expiresAt: at(new Date(Date.now() + 60 * 60 * 1000)),
            createdAt: at(new Date()),
        });
    });

    it('returns only the fields the sign-up page needs for a pending, unexpired token', async () => {
        const res = await call('tok-valid');
        expect(res.status).toBe(200);
        const body = await res.json();
        expect(body).toMatchObject({
            id: 'inv1',
            token: 'tok-valid',
            agenteId: 'ag1',
            email: 'agent@example.com',
            branchId: 'br1',
            organizationId: 'owner1',
            status: 'pending',
        });
        expect(Object.keys(body).sort()).toEqual(
            ['agenteId', 'branchId', 'email', 'expiresAt', 'id', 'organizationId', 'status', 'token'],
        );
    });

    it('returns 404 for unknown, used and expired tokens', async () => {
        fake.docs.set('invitations/used', { token: 'tok-used', status: 'used', expiresAt: at(new Date(Date.now() + 1e6)) });
        fake.docs.set('invitations/old', { token: 'tok-old', status: 'pending', expiresAt: at(new Date(Date.now() - 1000)) });
        for (const token of ['nope', 'tok-used', 'tok-old']) {
            const res = await call(token);
            expect(res.status, token).toBe(404);
            expect(await res.json()).toEqual({ error: 'La invitación no es válida o ha expirado.' });
        }
    });
});
