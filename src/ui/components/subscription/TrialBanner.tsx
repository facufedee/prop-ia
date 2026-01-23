"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/ui/context/AuthContext";
import { differenceInDays } from "date-fns";
import { useRouter } from "next/navigation";
import { Sparkles } from "lucide-react";

export default function TrialBanner() {
    const { user, userRole, loading } = useAuth();
    const [daysRemaining, setDaysRemaining] = useState<number | null>(null);
    const router = useRouter();

    useEffect(() => {
        if (loading || !user || !userRole) return;

        if (userRole.name === "Cliente Free" && user.metadata.creationTime) {
            const signupDate = new Date(user.metadata.creationTime);
            const today = new Date();
            const daysUsed = differenceInDays(today, signupDate);
            const remaining = 7 - daysUsed;

            setDaysRemaining(remaining);
        }
    }, [user, userRole, loading]);

    if (daysRemaining === null) return null;

    // Don't show if trial expired (handled by Enforcer or Expired state)
    // Or show "0 days" if it's the last day.
    // If negative, they are expired.
    if (daysRemaining < 0) return null;

    return (
        <div className="bg-indigo-600 text-white px-4 py-2 flex flex-col sm:flex-row items-center justify-between gap-2 text-sm relative z-30 shadow-md">
            <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-yellow-300 animate-pulse" />
                <p className="font-medium">
                    {daysRemaining === 0
                        ? "¡Último día de tu prueba gratuita!"
                        : `Te quedan ${daysRemaining} días de prueba gratuita.`
                    }
                </p>
            </div>

            <button
                onClick={() => router.push('/precios')}
                className="bg-white text-indigo-700 px-3 py-1 rounded-full text-xs font-bold hover:bg-gray-100 transition-colors shadow-sm whitespace-nowrap"
            >
                Mejorar Plan
            </button>
        </div>
    );
}
