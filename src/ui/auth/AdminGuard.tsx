"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/ui/context/AuthContext";

const OWNER_EMAIL = "facundoflores8@gmail.com";

export default function AdminGuard({ children }: { children: React.ReactNode }) {
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

        // Owner bypass — no need to wait for role
        if (user.email === OWNER_EMAIL) {
            setAuthorized(true);
            setChecked(true);
            return;
        }

        // For non-owners: Super Admin or Administrador bypass
        if (userRole?.name === "Super Admin" || userRole?.name === "Administrador") {
            setAuthorized(true);
            setChecked(true);
            return;
        }

        // Role not yet loaded → keep waiting
        if (!userRole) return;

        // Role loaded but insufficient → redirect
        router.push("/access-denied");
        setChecked(true);
    }, [user, userRole, loading, router]);

    if (!checked) {
        return (
            <div className="fixed inset-0 bg-white z-50 flex items-center justify-center">
                <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    if (!authorized) return null;

    return <>{children}</>;
}
