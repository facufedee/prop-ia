import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as firestore from 'firebase/firestore';
import { ADMIN_ONLY_PERMISSIONS, planAdminOnlyPermissionStrips } from '../lib/roles/adminOnlyPermissions';
import { roleService, DEFAULT_ROLE_PERMISSIONS, DEFAULT_PERMISSIONS } from '../infrastructure/services/roleService';

vi.mock('@/infrastructure/firebase/client', () => ({
    db: {},
    auth: { currentUser: { uid: 'admin', email: 'admin@zeta.com', displayName: 'Admin' } },
}));

vi.mock('@/infrastructure/services/auditLogService', () => ({
    auditLogService: { logConfig: vi.fn() },
}));

vi.mock('firebase/firestore', () => ({
    collection: vi.fn(),
    doc: vi.fn((_db: unknown, _col: string, id: string) => ({ id })),
    getDocs: vi.fn(),
    getDoc: vi.fn(async () => ({ exists: () => true, data: () => ({ name: 'role' }) })),
    setDoc: vi.fn(),
    updateDoc: vi.fn(),
    deleteDoc: vi.fn(),
    addDoc: vi.fn(),
    query: vi.fn(),
    where: vi.fn(),
    serverTimestamp: vi.fn(),
}));

const ADMIN_ROLES = ['Super Admin', 'Administrador'];

function mockRoles(roles: Array<{ id: string; name: string; permissions: string[] }>) {
    vi.mocked(firestore.getDocs).mockResolvedValue({
        empty: roles.length === 0,
        docs: roles.map(({ id, ...data }) => ({ id, data: () => data })),
    } as unknown as Awaited<ReturnType<typeof firestore.getDocs>>);
}

describe('planAdminOnlyPermissionStrips', () => {
    it('removes marketing and blog from non-admin roles only', () => {
        const plan = planAdminOnlyPermissionStrips([
            { id: 'pro', name: 'Cliente Pro', permissions: ['/dashboard', '/dashboard/marketing', '/dashboard/blog'] },
            { id: 'agent', name: 'Agente', permissions: ['/dashboard/blog', '/dashboard/leads'] },
            { id: 'custom', name: 'Inmobiliaria X', permissions: ['/dashboard/marketing'] },
            { id: 'super', name: 'Super Admin', permissions: ['/dashboard/marketing', '/dashboard/blog'] },
            { id: 'admin', name: 'Administrador', permissions: ['/dashboard/blog'] },
            { id: 'basic', name: 'Cliente Básico', permissions: ['/dashboard'] },
        ]);

        expect(plan).toEqual([
            { id: 'pro', name: 'Cliente Pro', removed: ['/dashboard/marketing', '/dashboard/blog'], permissions: ['/dashboard'] },
            { id: 'agent', name: 'Agente', removed: ['/dashboard/blog'], permissions: ['/dashboard/leads'] },
            { id: 'custom', name: 'Inmobiliaria X', removed: ['/dashboard/marketing'], permissions: [] },
        ]);
    });

    it('is idempotent: applying the plan leaves nothing to strip', () => {
        const roles = [{ id: 'pro', name: 'Cliente Pro', permissions: ['/dashboard', '/dashboard/blog'] }];
        const applied = roles.map(r => {
            const strip = planAdminOnlyPermissionStrips([r])[0];
            return strip ? { ...r, permissions: strip.permissions } : r;
        });
        expect(planAdminOnlyPermissionStrips(applied)).toEqual([]);
    });
});

describe('default role permissions', () => {
    it('never grant admin-only routes to a non-admin role', () => {
        for (const [name, permissions] of Object.entries(DEFAULT_ROLE_PERMISSIONS)) {
            if (ADMIN_ROLES.includes(name)) continue;
            for (const route of ADMIN_ONLY_PERMISSIONS) expect(permissions, name).not.toContain(route);
        }
    });

    it('keep admin roles with every permission', () => {
        for (const name of ADMIN_ROLES) {
            expect(DEFAULT_ROLE_PERMISSIONS[name]).toEqual(DEFAULT_PERMISSIONS.map(p => p.id));
        }
    });
});

describe('roleService admin-only cleanup', () => {
    beforeEach(() => {
        vi.mocked(firestore.updateDoc).mockClear();
    });

    it('syncDefaultRoles strips admin-only routes from stale client roles', async () => {
        mockRoles([
            { id: 'pro', name: 'Cliente Pro', permissions: [...DEFAULT_ROLE_PERMISSIONS['Cliente Pro'], '/dashboard/marketing', '/dashboard/blog'] },
            { id: 'agent', name: 'Agente', permissions: [...DEFAULT_ROLE_PERMISSIONS['Agente'], '/dashboard/blog'] },
            { id: 'super', name: 'Super Admin', permissions: DEFAULT_ROLE_PERMISSIONS['Super Admin'] },
        ]);

        const { updated } = await roleService.syncDefaultRoles();

        expect(updated.sort()).toEqual(['Agente', 'Cliente Pro']);
        const writes = vi.mocked(firestore.updateDoc).mock.calls.map(
            ([ref, data]) => [(ref as { id: string }).id, (data as unknown as { permissions: string[] }).permissions] as const
        );
        for (const [, permissions] of writes) {
            for (const route of ADMIN_ONLY_PERMISSIONS) expect(permissions).not.toContain(route);
        }
        expect(Object.fromEntries(writes).pro).toEqual(DEFAULT_ROLE_PERMISSIONS['Cliente Pro']);
    });

    it('syncDefaultRoles is a no-op once roles are clean', async () => {
        mockRoles([
            { id: 'pro', name: 'Cliente Pro', permissions: DEFAULT_ROLE_PERMISSIONS['Cliente Pro'] },
            { id: 'super', name: 'Super Admin', permissions: DEFAULT_ROLE_PERMISSIONS['Super Admin'] },
        ]);

        const { updated } = await roleService.syncDefaultRoles();

        expect(updated).toEqual([]);
        expect(firestore.updateDoc).not.toHaveBeenCalled();
    });
});
