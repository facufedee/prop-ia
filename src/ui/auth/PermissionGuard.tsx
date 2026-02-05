"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { auth } from "@/infrastructure/firebase/client";
import { roleService, PERMISSIONS } from "@/infrastructure/services/roleService";
import { useAuth } from "@/ui/context/AuthContext";

export default function PermissionGuard({ children }: { children: React.ReactNode }) {
    const router = useRouter();
    const pathname = usePathname();
    const { user, userRole, loading: authLoading } = useAuth();
    const [authorized, setAuthorized] = useState(false);
    const [checking, setChecking] = useState(true);

    useEffect(() => {
        if (authLoading) return;

        if (!user) {
            setAuthorized(false);
            setChecking(false);
            return;
        }

        // If user is logged in but has no role yet, wait.
        // The AuthContext onSnapshot will eventually trigger with the role.
        // We can show a loading state while 'userRole' is null.
        if (!userRole) {
            // Potentially we could add a timeout here if role never appears?
            // For now, assume it's syncing or account setup is slightly delayed.
            return;
        }

        const checkPermissions = () => {
            // If Super Admin or Admin, bypass checks
            if (userRole.name === "Super Admin" || userRole.name === "Administrador") {
                setAuthorized(true);
                setChecking(false);
                return;
            }

            // Public/Common Dashboard Routes that all authenticated users should access
            if (pathname === '/dashboard/cuenta' || pathname === '/dashboard/novedades') {
                setAuthorized(true);
                setChecking(false);
                return;
            }

            // Find the most specific permission matching the current path
            const sortedPermissions = [...PERMISSIONS].sort((a, b) => b.id.length - a.id.length);
            const matchingPermission = sortedPermissions.find(p => pathname.startsWith(p.id));

            if (matchingPermission) {
                const hasPermission = userRole.permissions.includes(matchingPermission.id);
                if (hasPermission) {
                    setAuthorized(true);
                } else {
                    console.warn(`Access denied to ${pathname}. Missing permission: ${matchingPermission.id}`);
                    setAuthorized(false);
                    router.push("/access-denied");
                }
            } else {
                setAuthorized(true);
            }
            setChecking(false);
        };

        checkPermissions();

    }, [user, userRole, authLoading, pathname, router]);


    if (authLoading || (user && !userRole)) {
        return (
            <div className="fixed inset-0 bg-white z-50 flex flex-col items-center justify-center gap-4">
                <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
                <p className="text-gray-500 text-sm animate-pulse">
                    {user && !userRole ? "Configurando su cuenta..." : "Verificando credenciales..."}
                </p>
            </div>
        );
    }

    if (!user) {
        // AuthGuard usually handles this, so rendering nothing is fine before redirect logic elsewhere kicks in
        return null;
    }

    if (checking) {
        // Keep spinner if still calculating permissions logic
        return (
            <div className="fixed inset-0 bg-white z-50 flex items-center justify-center">
                <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
            </div>
        );
    }

    if (!authorized) {
        return null; // The useEffect redirects to /access-denied
    }

    return <>{children}</>;
}
