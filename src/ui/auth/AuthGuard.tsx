"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/ui/context/AuthContext";

export default function AuthGuard({ children }: { children: React.ReactNode }) {
    const router = useRouter();
    const { user, authReady } = useAuth();

    useEffect(() => {
        if (!authReady) return;
        if (!user) router.push("/access-denied");
    }, [user, authReady, router]);

    if (!authReady) {
        return (
            <div className="fixed inset-0 bg-white z-50 flex items-center justify-center">
                <div className="text-center space-y-6">
                    <div className="flex justify-center mb-8">
                        <div className="relative">
                            <div className="absolute inset-0 bg-gradient-to-r from-indigo-600 via-purple-600 to-cyan-500 rounded-2xl blur-3xl opacity-30 animate-pulse" />
                            <img src="/assets/img/loading.png" alt="Cargando" className="relative h-20 w-auto animate-pulse" />
                        </div>
                    </div>
                    <div className="flex justify-center gap-2">
                        <div className="w-3 h-3 bg-indigo-600 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                        <div className="w-3 h-3 bg-purple-600 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                        <div className="w-3 h-3 bg-cyan-500 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                    </div>
                </div>
            </div>
        );
    }

    if (!user) return null;
    return <>{children}</>;
}
