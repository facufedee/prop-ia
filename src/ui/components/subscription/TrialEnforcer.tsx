"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/ui/context/AuthContext";
import { differenceInDays } from "date-fns";
import { useRouter } from "next/navigation";
import { Crown, Sparkles, Lock } from "lucide-react";

export default function TrialEnforcer() {
    const { user, userRole, loading } = useAuth();
    const [isExpired, setIsExpired] = useState(false);
    const router = useRouter();

    useEffect(() => {
        const checkTrialStatus = async () => {
            if (loading || !user || !userRole) return;

            // Check if user is on the Free plan
            const isFreeUser = userRole.name === "Cliente Free";

            if (isFreeUser && user.metadata.creationTime) {
                const signupDate = new Date(user.metadata.creationTime);
                const today = new Date();
                const daysSinceSignup = differenceInDays(today, signupDate);

                // 7 Days Trial Check
                if (daysSinceSignup >= 7) {
                    try {
                        // Dynamically import service to avoid build issues if mixed env
                        const { subscriptionService } = await import("@/infrastructure/services/subscriptionService");
                        const usage = await subscriptionService.checkUsageLimit(user.uid, 'properties');

                        // BLOCK only if they have actually used the platform (>= 1 property)
                        if (usage.current >= 1) {
                            setIsExpired(true);
                        } else {
                            // User has 0 properties, let them "explore" even if trial technically expired
                            console.log("Trial expired but user has 0 properties. Allowing exploration.");
                        }
                    } catch (error) {
                        console.error("Error checking trial usage:", error);
                    }
                }
            }
        };

        checkTrialStatus();
    }, [user, userRole, loading]);

    if (!isExpired) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md">
            <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-8 relative overflow-hidden animate-in zoom-in-95 duration-300">
                {/* Decorative background */}
                <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500"></div>
                <div className="absolute -top-10 -right-10 w-40 h-40 bg-indigo-500/10 rounded-full blur-3xl"></div>

                <div className="flex flex-col items-center text-center space-y-6 relative z-10">
                    <div className="w-20 h-20 bg-indigo-50 rounded-full flex items-center justify-center shadow-inner">
                        <Lock className="w-10 h-10 text-indigo-600" />
                    </div>

                    <div className="space-y-2">
                        <h2 className="text-2xl font-bold text-gray-900">
                            Tu prueba gratuita ha finalizado
                        </h2>
                        <p className="text-gray-600 leading-relaxed">
                            Esperamos que hayas disfrutado de tus 7 días de prueba en el <span className="font-semibold text-indigo-600">Plan Básico</span>.
                        </p>
                        <p className="text-sm text-gray-500">
                            Para continuar gestionando tus propiedades y acceder a todas las funcionalidades, por favor selecciona un plan.
                        </p>
                    </div>

                    <div className="w-full pt-4 space-y-3">
                        <button
                            onClick={() => router.push('/precios')}
                            className="w-full py-4 px-6 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 text-white font-bold shadow-lg shadow-indigo-500/30 hover:shadow-indigo-500/50 hover:scale-[1.02] transition-all duration-200 flex items-center justify-center gap-2"
                        >
                            <Crown className="w-5 h-5" />
                            Ver Planes y Suscribirme
                        </button>

                        {/* 
               We do NOT offer a cancel/close button because the requirement 
               implies purely blocking access ("lo mande a pagar").
               However, user might need to logout if they don't want to pay.
            */}
                        <button
                            onClick={() => {
                                // Import signOut from firebase/auth ? 
                                // Easier to just let them go to pricing or close tab.
                                // But good UX might be a logout option.
                                // For now, let's keep it strictly focused on conversion.
                            }}
                            className="text-xs text-gray-400 hover:text-gray-600"
                        >
                            {/* Optional Logout placeholder */}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
