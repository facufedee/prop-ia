"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "@/infrastructure/firebase/client";
import { roleService, PERMISSIONS } from "@/infrastructure/services/roleService";

export default function PermissionGuard({ children }: { children: React.ReactNode }) {
    const router = useRouter();
    const pathname = usePathname();
    const [loading, setLoading] = useState(true);
    const [authorized, setAuthorized] = useState(false);

    useEffect(() => {
        if (!auth) {
            setLoading(false);
            return;
        }

        const unsubscribe = onAuthStateChanged(auth, async (user) => {
            if (!user) {
                // Not logged in, AuthGuard handles this usually, but safe to redirect
                setAuthorized(false);
                setLoading(false);
                return;
            }

            try {
                const role = await roleService.getUserRole(user.uid);

                if (!role) {
                    console.error("User has no role assigned");
                    router.push("/access-denied");
                    setLoading(false);
                    return;
                }

                // If Super Admin or Admin, bypass checks
                if (role.name === "Super Admin" || role.name === "Administrador") {
                    setAuthorized(true);
                    setLoading(false);
                    return;
                }

                // Find the most specific permission matching the current path
                // Sort permissions by length descending to match /dashboard/blog before /dashboard
                const sortedPermissions = [...PERMISSIONS].sort((a, b) => b.id.length - a.id.length);

                const matchingPermission = sortedPermissions.find(p => pathname.startsWith(p.id));

                if (matchingPermission) {
                    const hasPermission = role.permissions.includes(matchingPermission.id);
                    if (hasPermission) {
                        setAuthorized(true);
                    } else {
                        console.warn(`Access denied to ${pathname}. Missing permission: ${matchingPermission.id}`);
                        // If user is on dashboard home but somehow restricted (unlikely), allow.
                        // But if they are on /dashboard/blog and lack it, deny.
                        router.push("/access-denied");
                    }
                } else {
                    // Path not governed by explicit permissions (e.g. /dashboard/profile maybe?)
                    // Default strict or allow? 
                    // Given /dashboard covers the root, almost everything is covered.
                    // If something falls through, we might allow it if it's not sensitive.
                    setAuthorized(true);
                }

            } catch (error) {
                console.error("Error verifying permissions:", error);
            } finally {
                setLoading(false);
            }
        });

        return () => unsubscribe();
    }, [pathname, router]);

    if (loading) {
        return (
            <div className="fixed inset-0 bg-white z-50 flex items-center justify-center">
                <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
            </div>
        );
    }

    if (!authorized) {
        return null;
    }

    return <>{children}</>;
}
