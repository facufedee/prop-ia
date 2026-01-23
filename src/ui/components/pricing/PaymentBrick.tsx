"use client";

import { useEffect, useState } from "react";
import { initMercadoPago, Payment } from "@mercadopago/sdk-react";
import { AlertCircle, Loader2 } from "lucide-react";

interface PaymentBrickProps {
    preferenceId?: string; // Optional context (good for Wallet/Credits)
    amount: number;       // Required for Card Payment
    publicKey: string;
    email?: string;       // Pre-fill user email
    onPaymentResult?: (result: any) => void;
}

export default function PaymentBrick({ preferenceId, amount, publicKey, email, onPaymentResult }: PaymentBrickProps) {
    const [sdkReady, setSdkReady] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!publicKey) {
            setError("Configuración de Mercado Pago incompleta.");
            return;
        }

        try {
            initMercadoPago(publicKey, { locale: 'es-AR' });
            setSdkReady(true);
            console.log("✅ Mercado Pago SDK initialized for Payment Brick");
        } catch (err) {
            console.error("❌ Mercado Pago SDK init failed:", err);
            setError("Error inicializando el sistema de pagos.");
        }
    }, [publicKey]);

    const initialization = {
        amount: amount,
        preferenceId: preferenceId,
        payer: {
            email: email || "",
        },
    };

    const customization = {
        paymentMethods: {
            creditCard: "all" as const,
            debitCard: "all" as const,
        },
        visual: {
            style: {
                theme: "default" as const,
            },
            hidePaymentButton: false,
        },
    };

    const onSubmit = async ({ selectedPaymentMethod, formData }: any) => {
        console.log("🚀 Submitting Payment...", selectedPaymentMethod);

        return new Promise<void>((resolve, reject) => {
            fetch("/api/payments/process-payment", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    formData,
                    transaction_amount: amount
                }),
            })
                .then((res) => res.json())
                .then((data) => {
                    if (data.error) {
                        console.error("❌ Payment Error:", data.error);
                        reject(data.error);
                    } else {
                        console.log("✅ Payment Success:", data);
                        if (onPaymentResult) onPaymentResult(data);
                        resolve();
                    }
                })
                .catch((err) => {
                    console.error("❌ Network Error:", err);
                    reject("Error de conexión");
                });
        });
    };

    const onError = async (error: any) => {
        console.error("❌ Brick Error:", error);
    };

    const onReady = async () => {
        console.log("✅ Brick is Ready");
    };

    if (error) {
        return (
            <div className="p-4 bg-red-50 text-red-600 rounded-xl flex items-center gap-2">
                <AlertCircle className="w-5 h-5" />
                <p>{error}</p>
            </div>
        );
    }

    if (!sdkReady) {
        return (
            <div className="p-8 flex justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
            </div>
        );
    }

    return (
        <div id="paymentBrick_container" className="rounded-xl overflow-hidden bg-white">
            <Payment
                initialization={initialization}
                customization={customization}
                onSubmit={onSubmit}
                onReady={onReady}
                onError={onError}
            />
        </div>
    );
}
