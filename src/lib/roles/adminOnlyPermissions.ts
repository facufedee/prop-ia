// Dashboard routes that manage ZetaProp's own platform content (its email
// templates and bulk campaigns, its blog and the social announcements a post
// triggers). They belong to platform admins only and must never be granted to
// a client or agency role.
//
// Kept free of imports so scripts can load it directly with Node's type
// stripping (see scripts/strip_admin_only_permissions.mjs).

export const ADMIN_ONLY_PERMISSIONS: readonly string[] = ["/dashboard/marketing", "/dashboard/blog"];

export const ADMIN_ROLE_NAMES: readonly string[] = ["Super Admin", "Administrador"];

export function isAdminRoleName(name: string | null | undefined): boolean {
    return !!name && ADMIN_ROLE_NAMES.includes(name);
}

export interface RolePermissionsSnapshot {
    id: string;
    name?: string;
    permissions?: string[];
}

export interface RolePermissionStrip {
    id: string;
    name: string;
    removed: string[];
    permissions: string[];
}

/**
 * Plans which roles must lose admin-only permissions. Admin roles are left
 * untouched; roles that already lack them produce no entry, so applying the
 * plan twice is a no-op.
 */
export function planAdminOnlyPermissionStrips(roles: RolePermissionsSnapshot[]): RolePermissionStrip[] {
    const strips: RolePermissionStrip[] = [];
    for (const role of roles) {
        if (isAdminRoleName(role.name)) continue;
        const current = role.permissions ?? [];
        const removed = current.filter(p => ADMIN_ONLY_PERMISSIONS.includes(p));
        if (removed.length === 0) continue;
        strips.push({
            id: role.id,
            name: role.name ?? "(unnamed)",
            removed,
            permissions: current.filter(p => !ADMIN_ONLY_PERMISSIONS.includes(p)),
        });
    }
    return strips;
}
