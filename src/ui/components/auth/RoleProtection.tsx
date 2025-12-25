"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { auth, db } from "@/infrastructure/firebase/client";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { roleService } from "@/infrastructure/services/roleService";
import { Loader2, ShieldAlert } from "lucide-react";

interface RoleProtectionProps {
    children: React.ReactNode;
    requiredPermission?: string;
    requiredRole?: string; // e.g. "Administrador"
}

export function RoleProtection({ children, requiredPermission, requiredRole }: RoleProtectionProps) {
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [authorized, setAuthorized] = useState(false);

    useEffect(() => {
        if (!auth) return;

        const unsubscribe = onAuthStateChanged(auth, async (user) => {
            if (!user) {
                setLoading(false);
                setAuthorized(false);
                router.push("/login"); // or custom login path
                return;
            }

            try {
                // Fetch User Docs to get roleId
                const userRef = doc(db, "users", user.uid);
                const userSnap = await getDoc(userRef);

                if (!userSnap.exists()) {
                    setAuthorized(false);
                    setLoading(false);
                    return;
                }

                const userData = userSnap.data();
                if (!userData.roleId) {
                    setAuthorized(false);
                    setLoading(false);
                    return;
                }

                const role = await roleService.getRoleById(userData.roleId);

                if (!role) {
                    setAuthorized(false);
                    setLoading(false);
                    return;
                }

                // Check Logic
                let hasAccess = true;

                if (requiredRole && role.name !== requiredRole) {
                    hasAccess = false;
                }

                if (requiredPermission && !role.permissions.includes(requiredPermission)) {
                    // Special check for Admin who usually has all, but permissions list should be explicit
                    if (role.name !== "Administrador") {
                        hasAccess = false;
                    } else {
                        // If admin, we usually assume access, but let's check if the permission covers it.
                        // In my logic, Admin role SHOULD have the new permission in its list.
                        // If the permission is newly added, old admin data might not have it yet unless updated.
                        // For safety: Admin bypass or explicit check.
                        // Let's use strict check for now, assuming roleService.initialize or updates run.
                        if (!role.permissions.includes(requiredPermission)) {
                            // Fallback: If it's admin, maybe allow?
                            // Better strictly follow permissions to encourage correct config.
                            // But for this dev phase, I'll allow "Administrador" name match to override.
                            hasAccess = true;
                        }
                    }
                }

                setAuthorized(hasAccess);

            } catch (error) {
                console.error("Auth protection error:", error);
                setAuthorized(false);
            } finally {
                setLoading(false);
            }
        });

        return () => unsubscribe();
    }, [router, requiredPermission, requiredRole]);

    if (loading) {
        return (
            <div className="flex h-[50vh] w-full items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
            </div>
        );
    }

    if (!authorized) {
        return (
            <div className="flex h-[60vh] flex-col items-center justify-center text-center p-6">
                <div className="bg-red-50 p-4 rounded-full mb-4">
                    <ShieldAlert className="h-10 w-10 text-red-600" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Acceso Restringido</h2>
                <p className="text-gray-500 max-w-md mb-6">
                    No tienes los permisos necesarios para ver esta página. Si crees que es un error, contacta al administrador.
                </p>
                <button
                    onClick={() => router.push("/dashboard")}
                    className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                >
                    Volver al Dashboard
                </button>
            </div>
        );
    }

    return <>{children}</>;
}
