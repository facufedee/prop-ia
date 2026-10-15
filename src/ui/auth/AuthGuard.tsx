"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/ui/context/AuthContext";
import { BrandLoader } from "@/ui/components/ui/LoadingSpinner";

export default function AuthGuard({ children }: { children: React.ReactNode }) {
    const router = useRouter();
    const { user, authReady } = useAuth();

    useEffect(() => {
        if (!authReady) return;
        if (!user) router.push("/access-denied");
    }, [user, authReady, router]);

    if (!authReady) return <BrandLoader />;

    if (!user) return null;
    return <>{children}</>;
}
