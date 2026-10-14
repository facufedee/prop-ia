"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/ui/context/AuthContext";
import { differenceInDays } from "date-fns";
import { useRouter } from "next/navigation";
import { Clock } from "lucide-react";

const FREE_ROLES = ["Cliente Free", "Cliente Básico"];

export default function TrialBanner() {
    const { user, userRole, userData, loading } = useAuth();
    const [daysRemaining, setDaysRemaining] = useState<number | null>(null);
    const router = useRouter();

    useEffect(() => {
        if (loading || !user || !userRole) return;

        if (FREE_ROLES.includes(userRole.name)) {
            // Prefer Firestore createdAt so test accounts don't trigger incorrectly
            const rawCreatedAt = userData?.createdAt;
            const signupDate = rawCreatedAt?.toDate
                ? rawCreatedAt.toDate()
                : rawCreatedAt instanceof Date
                    ? rawCreatedAt
                    : user.metadata.creationTime
                        ? new Date(user.metadata.creationTime)
                        : null;

            if (!signupDate) return;

            const daysUsed = differenceInDays(new Date(), signupDate);
            const remaining = 14 - daysUsed;

            setDaysRemaining(remaining);
        }
    }, [user, userRole, userData, loading]);

    if (daysRemaining === null) return null;

    // Don't show if trial expired (handled by Enforcer or Expired state)
    // Or show "0 days" if it's the last day.
    // If negative, they are expired.
    if (daysRemaining < 0) return null;

    return (
        <div className="bg-[var(--color-paper-2)] text-[var(--color-ink)] border-b border-[var(--color-rule)] px-4 py-2 flex flex-col sm:flex-row items-center justify-between gap-2 text-sm relative z-30">
            <div className="flex items-center gap-2">
                <Clock strokeWidth={1.5} className="w-4 h-4 text-[var(--color-accent)]" />
                <p className="font-medium">
                    {daysRemaining === 0
                        ? "¡Último día de tu prueba gratuita!"
                        : `Te quedan ${daysRemaining} días de prueba gratuita.`
                    }
                </p>
            </div>

            <button
                onClick={() => router.push('/precios')}
                className="bg-[var(--color-ink)] text-[var(--color-paper)] px-3 py-1 rounded-full text-xs font-bold hover:bg-[var(--color-ink-2)] transition-colors whitespace-nowrap"
            >
                Mejorar Plan
            </button>
        </div>
    );
}
