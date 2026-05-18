"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { roleService, DEFAULT_PERMISSIONS } from "@/infrastructure/services/roleService";
import { useAuth } from "@/ui/context/AuthContext";

// Owner email always has full access regardless of role configuration in Firestore
const OWNER_EMAIL = "facundoflores8@gmail.com";

export default function PermissionGuard({ children }: { children: React.ReactNode }) {
    const router = useRouter();
    const pathname = usePathname();
    const { user, authReady, userRole } = useAuth();
    const [authorized, setAuthorized] = useState(false);
    const [checking, setChecking] = useState(true);

    useEffect(() => {
        // Wait only for auth (not Firestore) before making auth decisions
        if (!authReady) return;

        // Not authenticated
        if (!user) {
            setAuthorized(false);
            setChecking(false);
            return;
        }

        // Owner email bypass — immediate, no Firestore needed
        if (user.email === OWNER_EMAIL) {
            setAuthorized(true);
            setChecking(false);
            return;
        }

        // Check Email Verification for new users (created after May 16, 2026)
        if (user.metadata.creationTime) {
            const creationDate = new Date(user.metadata.creationTime);
            const cutoffDate = new Date("2026-05-16T00:00:00Z");
            if (creationDate >= cutoffDate && !user.emailVerified) {
                setAuthorized(false);
                setChecking(false);
                router.push("/verify-email");
                return;
            }
        }

        // Role not yet loaded — keep waiting (AuthContext onSnapshot is async)
        if (!userRole) return;

        // Super Admin or Administrador — full access
        if (userRole.name === "Super Admin" || userRole.name === "Administrador") {
            setAuthorized(true);
            setChecking(false);
            return;
        }

        // Public dashboard routes accessible to all authenticated users
        if (
            pathname === "/dashboard/cuenta" ||
            pathname === "/dashboard/novedades" ||
            pathname.startsWith("/dashboard/tutoriales")
        ) {
            setAuthorized(true);
            setChecking(false);
            return;
        }

        // Match most-specific permission for the current path
        const sortedPermissions = [...DEFAULT_PERMISSIONS].sort((a, b) => b.id.length - a.id.length);
        const matchingPermission = sortedPermissions.find(p => pathname.startsWith(p.id));

        if (matchingPermission) {
            if (userRole.permissions.includes(matchingPermission.id)) {
                setAuthorized(true);
            } else {
                console.warn(`Access denied to ${pathname}. Missing: ${matchingPermission.id}`);
                setAuthorized(false);
                router.push("/access-denied");
            }
        } else {
            // No matching permission rule — allow by default
            setAuthorized(true);
        }

        setChecking(false);
    }, [user, authReady, userRole, pathname, router]);

    // Auth not resolved yet — show splash
    if (!authReady) {
        return (
            <div className="fixed inset-0 bg-white z-50 flex flex-col items-center justify-center gap-4">
                <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
                <p className="text-gray-500 text-sm animate-pulse">Verificando credenciales...</p>
            </div>
        );
    }

    // Role hasn't resolved yet — only for non-owner users
    if (user && !userRole && user.email !== OWNER_EMAIL) {
        return (
            <div className="fixed inset-0 bg-white z-50 flex flex-col items-center justify-center gap-4">
                <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
                <p className="text-gray-500 text-sm animate-pulse">Configurando tu cuenta...</p>
            </div>
        );
    }

    if (!user) return null;

    if (checking) {
        return (
            <div className="fixed inset-0 bg-white z-50 flex items-center justify-center">
                <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    if (!authorized) return null;

    return <>{children}</>;
}
