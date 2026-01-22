"use client";

import { useEffect, useState } from "react";
import { initMercadoPago, Wallet } from "@mercadopago/sdk-react";
import { AlertCircle, Loader2 } from "lucide-react";

interface PaymentWalletProps {
    preferenceId: string;
}

export default function PaymentWallet({ preferenceId }: PaymentWalletProps) {
    const [sdkReady, setSdkReady] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const publicKey = process.env.NEXT_PUBLIC_MP_PUBLIC_KEY;

        if (!publicKey) {
            setError("Configuración de Mercado Pago incompleta. Por favor, configura NEXT_PUBLIC_MP_PUBLIC_KEY en .env.local");
            console.error("❌ NEXT_PUBLIC_MP_PUBLIC_KEY is missing in environment variables");
            return;
        }

        try {
            initMercadoPago(publicKey, { locale: 'es-AR' });
            setSdkReady(true);
            console.log("✅ Mercado Pago SDK initialized successfully");
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : "Error desconocido";
            setError(`Error al inicializar Mercado Pago: ${errorMessage}`);
            console.error("❌ Mercado Pago SDK initialization failed:", err);
        }
    }, []);

    if (!preferenceId) {
        return (
            <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                <p className="text-sm text-yellow-800">⚠️ No se proporcionó ID de preferencia</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                <div>
                    <p className="text-sm font-medium text-red-800">Error de configuración</p>
                    <p className="text-xs text-red-600 mt-1">{error}</p>
                </div>
            </div>
        );
    }

    if (!sdkReady) {
        return (
            <div className="p-6 flex flex-col items-center justify-center gap-3">
                <Loader2 className="w-6 h-6 text-indigo-600 animate-spin" />
                <p className="text-sm text-gray-500">Inicializando Mercado Pago...</p>
            </div>
        );
    }

    return (
        <div id="wallet_container" className="mt-6 animate-in fade-in duration-300">
            <Wallet
                key={preferenceId}
                initialization={{ preferenceId: preferenceId }}
            />
        </div>
    );
}
