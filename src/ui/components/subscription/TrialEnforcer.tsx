"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/ui/context/AuthContext";
import { differenceInDays } from "date-fns";
import { useRouter } from "next/navigation";
import { Crown, Sparkles, Lock } from "lucide-react";
import { toast } from "sonner";
import { notificationService } from "@/infrastructure/services/notificationService";

export default function TrialEnforcer() {
    const { user, userRole, loading } = useAuth();
    const [isExpired, setIsExpired] = useState(false);
    const [requestingExtension, setRequestingExtension] = useState(false);
    const [requested, setRequested] = useState(false);
    const router = useRouter();

    const handleRequestExtension = async () => {
        if (!user) return;
        setRequestingExtension(true);
        const phoneNumber = "5491123889745"; // Using the standard support number
        const message = `Hola Facundo, queria solicitarte una prorroga para continuar utilizando la plataforma por 7 dias..\nMi mail es: ${user.email || 'desconocido'}`;
        const whatsappUrl = `https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}`;

        window.open(whatsappUrl, '_blank');

        try {
            await notificationService.createNotification(
                "Solicitud de Prórroga",
                `El usuario ${user.email} ha solicitado una prórroga de 7 días mediante WhatsApp.`,
                "warning",
                "Administrador",
                `/dashboard/gestion-plataforma/${user.uid}`
            );
        } catch (error) {
            console.error("Error creating notification", error);
        }

        setRequested(true);
        setRequestingExtension(false);
    };

    useEffect(() => {
        const checkTrialStatus = async () => {
            if (loading || !user || !userRole) return;

            // Fetch subscription status directly to ensure we have the latest data
            let planTier = 'basic';
            try {
                // Dynamically import to avoid server/client mismatch issues if any, though likely safe here
                const { collection, query, where, getDocs } = await import("firebase/firestore");
                const { db } = await import("@/infrastructure/firebase/client");

                if (db && user.uid) {
                    const q = query(collection(db, "subscriptions"), where("userId", "==", user.uid));
                    const snapshot = await getDocs(q);
                    if (!snapshot.empty) {
                        const subData = snapshot.docs[0].data();
                        planTier = subData.planTier || 'basic';

                        // If admin set a specific endDate, skip this trial enforcer (AccountLockEnforcer handles it)
                        if (subData.endDate) {
                            return;
                        }
                    }
                }
            } catch (err) {
                console.error("Error fetching subscription in TrialEnforcer:", err);
            }

            // Check if user is on the Free/Basic plan logic
            const hasPaidPlan = planTier === 'professional' || planTier === 'enterprise';

            if (hasPaidPlan) return;

            const isFreeUser = userRole.name === "Cliente Free" || planTier === 'basic';

            if (isFreeUser && user.metadata.creationTime) {
                const signupDate = new Date(user.metadata.creationTime);
                const today = new Date();
                const daysSinceSignup = differenceInDays(today, signupDate);

                // 14 Days Trial Check
                if (daysSinceSignup >= 14) {
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
                            Esperamos que hayas disfrutado de tus 14 días de prueba en el <span className="font-semibold text-indigo-600">Plan Básico</span>.
                        </p>
                        <p className="text-sm text-gray-500">
                            Para continuar gestionando tus propiedades y acceder a todas las funcionalidades, por favor selecciona un plan o comunicate con soporte si querés seguir probando.
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

                        <button
                            onClick={handleRequestExtension}
                            disabled={requestingExtension || requested}
                            className="w-full py-3 px-6 rounded-xl bg-indigo-50 text-indigo-700 font-semibold border border-indigo-100 hover:bg-indigo-100 transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.888-.788-1.489-1.761-1.663-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.8 12.8 0 0 0-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z" />
                            </svg>
                            {requested ? "¡Solicitud Enviada!" : requestingExtension ? "Enviando..." : "Solicitar Prórroga de 7 días"}
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
