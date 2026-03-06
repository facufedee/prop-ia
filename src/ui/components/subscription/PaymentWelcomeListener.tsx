"use client";

import { useEffect } from "react";
import { useAuth } from "@/ui/context/AuthContext";
import { toast } from "sonner";
import { doc, updateDoc } from "firebase/firestore";
import { db } from "@/infrastructure/firebase/client";

export default function PaymentWelcomeListener() {
    const { user, userData } = useAuth();

    useEffect(() => {
        const checkWelcomeMessage = async () => {
            if (user && userData?.showPaymentWelcome) {
                // Show the toast
                toast.success("¡Tu pago fue aprobado!", {
                    description: "Ya podés disfrutar de todas las características de nuestro sistema.",
                    duration: 8000,
                });

                // Clear the flag in Firestore
                try {
                    const userRef = doc(db, "users", user.uid);
                    await updateDoc(userRef, {
                        showPaymentWelcome: false
                    });
                } catch (error) {
                    console.error("Error clearing payment welcome flag:", error);
                }
            }
        };

        checkWelcomeMessage();
    }, [user, userData?.showPaymentWelcome]);

    return null;
}
