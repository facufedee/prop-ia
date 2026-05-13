import { describe, it, expect, vi, beforeEach } from 'vitest';
import { roleService, DEFAULT_PERMISSIONS } from '../infrastructure/services/roleService';
import * as firestore from 'firebase/firestore';

// Mock Firebase and Auth
vi.mock('@/infrastructure/firebase/client', () => ({
    db: {},
    auth: { currentUser: { uid: 'user123', email: 'test@test.com', displayName: 'Test User' } }
}));

vi.mock('firebase/firestore', () => ({
    collection: vi.fn(),
    doc: vi.fn(),
    getDocs: vi.fn(),
    getDoc: vi.fn(),
    setDoc: vi.fn(),
    updateDoc: vi.fn(),
    deleteDoc: vi.fn(),
    query: vi.fn(),
    where: vi.fn(),
}));

describe('roleService', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('getAvailablePermissions should return default permissions when DB is empty', async () => {
        (firestore.getDocs as any).mockResolvedValue({
            empty: true,
            docs: []
        });

        const permissions = await roleService.getAvailablePermissions();
        expect(permissions).toEqual(DEFAULT_PERMISSIONS);
        // It should also try to initialize them via setDoc
        expect(firestore.setDoc).toHaveBeenCalled();
    });

    it('getRoles should return a list of roles', async () => {
        const mockRoles = [
            { id: '1', name: 'Admin', permissions: ['/dashboard'] },
            { id: '2', name: 'User', permissions: [] }
        ];

        (firestore.getDocs as any).mockResolvedValue({
            empty: false,
            docs: mockRoles.map(role => ({
                id: role.id,
                data: () => ({ name: role.name, permissions: role.permissions })
            }))
        });

        const roles = await roleService.getRoles();
        expect(roles).toHaveLength(2);
        expect(roles[0].name).toBe('Admin');
    });

    it('getRoleById should return role data if exists', async () => {
        (firestore.getDoc as any).mockResolvedValue({
            exists: () => true,
            id: 'role123',
            data: () => ({ name: 'Test Role', permissions: ['/test'] })
        });

        const role = await roleService.getRoleById('role123');
        expect(role).not.toBeNull();
        expect(role?.name).toBe('Test Role');
    });

    it('getRoleById should return null if not exists', async () => {
        (firestore.getDoc as any).mockResolvedValue({
            exists: () => false
        });

        const role = await roleService.getRoleById('unknown');
        expect(role).toBeNull();
    });
});
