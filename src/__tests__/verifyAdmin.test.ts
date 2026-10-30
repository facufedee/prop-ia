// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

type Doc = Record<string, unknown> | undefined;
let tokens: Record<string, { uid: string; email?: string }> = {};
let users: Record<string, Doc> = {};
let roles: Record<string, Doc> = {};

const store: Record<string, () => Record<string, Doc>> = { users: () => users, roles: () => roles };

vi.mock('@/infrastructure/firebase/admin', () => ({
    adminAuth: {
        verifyIdToken: vi.fn(async (token: string) => {
            if (!tokens[token]) throw new Error('invalid token');
            return tokens[token];
        }),
    },
    adminDb: {
        collection: (name: string) => ({
            doc: (id: string) => ({
                get: async () => {
                    const data = store[name]()[id];
                    return { exists: !!data, data: () => data };
                },
            }),
        }),
    },
}));

function request(token?: string) {
    return new NextRequest('https://zetaprop.com.ar/api/marketing/templates', {
        headers: token ? { authorization: `Bearer ${token}` } : {},
    });
}

describe('verifyAdmin', () => {
    beforeEach(() => {
        tokens = {
            owner: { uid: 'root', email: 'facundoflores8@gmail.com' },
            admin: { uid: 'a1', email: 'admin@zeta.com' },
            superadmin: { uid: 's1', email: 'super@zeta.com' },
            pro: { uid: 'p1', email: 'pro@agency.com' },
            agent: { uid: 'g1', email: 'agent@agency.com' },
            norole: { uid: 'n1', email: 'norole@x.com' },
        };
        users = {
            a1: { roleId: 'role_admin' },
            s1: { roleId: 'role_super' },
            p1: { roleId: 'role_pro' },
            g1: { roleId: 'role_agent' },
            n1: {},
        };
        roles = {
            role_admin: { name: 'Administrador', permissions: ['/dashboard'] },
            role_super: { name: 'Super Admin', permissions: [] },
            // Stale roles that still list the admin-only routes must not pass.
            role_pro: { name: 'Cliente Pro', permissions: ['/dashboard/marketing', '/dashboard/blog'] },
            role_agent: { name: 'Agente', permissions: ['/dashboard/blog'] },
        };
    });

    it.each(['admin', 'superadmin', 'owner'])('accepts %s', async (token) => {
        const { verifyAdmin } = await import('../lib/apiAuth');
        const result = await verifyAdmin(request(token));
        expect(result.error).toBeNull();
        expect(result.user?.uid).toBe(tokens[token].uid);
    });

    it.each(['pro', 'agent', 'norole'])('rejects %s with 403 even if the role lists marketing/blog', async (token) => {
        const { verifyAdmin } = await import('../lib/apiAuth');
        const result = await verifyAdmin(request(token));
        expect(result.user).toBeNull();
        expect(result.error?.status).toBe(403);
    });

    it('rejects a missing or invalid token with 401', async () => {
        const { verifyAdmin } = await import('../lib/apiAuth');
        expect((await verifyAdmin(request())).error?.status).toBe(401);
        expect((await verifyAdmin(request('forged'))).error?.status).toBe(401);
    });
});
