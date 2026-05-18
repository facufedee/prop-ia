"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/ui/context/AuthContext";

const OWNER_EMAIL = "facundoflores8@gmail.com";

export default function AdminGuard({ children }: { children: React.ReactNode }) {
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

        // Owner email — immediate access, no role needed
        if (user.email === OWNER_EMAIL) {
            setAuthorized(true);
            setChecked(true);
            return;
        }

        // Role-based check — wait if role not loaded yet
        if (!userRole) return;

        if (userRole.name === "Super Admin" || userRole.name === "Administrador") {
            setAuthorized(true);
        } else {
            router.push("/access-denied");
        }
        setChecked(true);
    }, [user, authReady, userRole, router]);

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
