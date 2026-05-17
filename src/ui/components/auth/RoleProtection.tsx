"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/ui/context/AuthContext";
import { Loader2, ShieldAlert } from "lucide-react";

const OWNER_EMAIL = "facundoflores8@gmail.com";

interface RoleProtectionProps {
    children: React.ReactNode;
    requiredPermission?: string;
    requiredRole?: string;
}

export function RoleProtection({ children, requiredPermission, requiredRole }: RoleProtectionProps) {
    const router = useRouter();
    const { user, userRole, loading } = useAuth();
    const [authorized, setAuthorized] = useState(false);
    const [checked, setChecked] = useState(false);

    useEffect(() => {
        // user=null + loading=true → onAuthStateChanged hasn't fired yet, wait
        if (!user && loading) return;

        // Auth fired but no user → not logged in
        if (!user) {
            router.push("/login");
            setChecked(true);
            return;
        }

        // Owner bypass — immediate access, no need for role
        if (user.email === OWNER_EMAIL) {
            setAuthorized(true);
            setChecked(true);
            return;
        }

        // Role not yet loaded → wait
        if (!userRole) return;

        let hasAccess = true;

        if (requiredRole && userRole.name !== requiredRole) {
            hasAccess = false;
        }

        if (requiredPermission) {
            if (userRole.name === "Super Admin") {
                hasAccess = true;
            } else if (!userRole.permissions.includes(requiredPermission)) {
                hasAccess = false;
            }
        }

        setAuthorized(hasAccess);
        setChecked(true);
    }, [user, userRole, loading, router, requiredPermission, requiredRole]);

    if (!checked) {
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
