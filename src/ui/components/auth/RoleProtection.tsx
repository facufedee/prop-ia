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
    const { user, authReady, userRole } = useAuth();
    const [authorized, setAuthorized] = useState(false);
    const [checked, setChecked] = useState(false);

    useEffect(() => {
        if (!authReady) return; // wait only for auth, not Firestore

        if (!user) {
            router.push("/login");
            setChecked(true);
            return;
        }

        // Owner email — immediate access
        if (user.email === OWNER_EMAIL) {
            setAuthorized(true);
            setChecked(true);
            return;
        }

        // Role not yet loaded — keep waiting
        if (!userRole) return;

        let hasAccess = true;

        if (requiredRole && userRole.name !== requiredRole) {
            hasAccess = false;
        }

        if (requiredPermission) {
            if (userRole.name === "Super Admin" || userRole.name === "Administrador") {
                hasAccess = true;
            } else if (!userRole.permissions.includes(requiredPermission)) {
                hasAccess = false;
            }
        }

        setAuthorized(hasAccess);
        setChecked(true);
    }, [user, authReady, userRole, router, requiredPermission, requiredRole]);

    if (!checked) {
        return (
            <div className="flex h-[50vh] w-full items-center justify-center">
                <Loader2 strokeWidth={1.5} className="h-8 w-8 animate-spin text-[var(--color-accent)]" />
            </div>
        );
    }

    if (!authorized) {
        return (
            <div className="flex h-[60vh] flex-col items-center justify-center text-center p-6">
                <div className="bg-[var(--color-paper-3)] p-4 rounded-full mb-4">
                    <ShieldAlert strokeWidth={1.5} className="h-10 w-10 text-[var(--color-muted)]" />
                </div>
                <h2 className="text-2xl font-bold text-[var(--color-ink)] mb-2">Acceso Restringido</h2>
                <p className="text-[var(--color-muted)] max-w-md mb-6">
                    No tenés los permisos necesarios para ver esta página.
                </p>
                <button
                    onClick={() => router.push("/dashboard")}
                    className="px-4 py-2 bg-[var(--color-ink)] text-[var(--color-paper)] rounded-lg hover:bg-[var(--color-ink-2)] transition-colors"
                >
                    Volver al Dashboard
                </button>
            </div>
        );
    }

    return <>{children}</>;
}
