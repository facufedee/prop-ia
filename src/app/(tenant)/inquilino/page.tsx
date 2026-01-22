"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Lock, User, Key, ArrowRight, ShieldCheck, AlertCircle } from "lucide-react";
import { alquileresService } from "@/infrastructure/services/alquileresService";

export default function TenantLoginPage() {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState("");
    const [formData, setFormData] = useState({
        code: "",
        dni: ""
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        setIsLoading(true);

        try {
            // Validation
            if (!formData.code || !formData.dni) {
                throw new Error("Por favor completa todos los campos");
            }

            if (!/^\d{7,8}$/.test(formData.dni)) {
                throw new Error("El DNI debe tener 7 u 8 números");
            }

            // Call verify service
            // Note: In a real app we would use a server action or API route to hide logic
            // providing direct ID access here for simplicity based on prompt constraint 
            // "Code in URL not allowed", but we will redirect to [ID] eventually.
            const access = await alquileresService.verifyTenantAccess(formData.code, formData.dni);

            if (access.valid && access.alquilerId) {
                // Set session token
                sessionStorage.setItem("zeta_tenant_session", JSON.stringify({
                    allowedId: access.alquilerId,
                    timestamp: Date.now()
                }));
                router.push(`/inquilino/${access.alquilerId}`);
            } else {
                throw new Error(access.error || "Datos incorrectos");
            }

        } catch (err: any) {
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
            <div className="max-w-md w-full bg-white rounded-3xl shadow-xl overflow-hidden border border-gray-100">
                {/* Header */}
                <div className="bg-indigo-900 p-8 text-center relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
                    <div className="relative z-10">
                        <div className="inline-flex p-3 bg-white/10 rounded-2xl mb-4 text-white backdrop-blur-sm">
                            <ShieldCheck size={32} />
                        </div>
                        <h1 className="text-2xl font-bold text-white mb-2">Portal de Inquilinos</h1>
                        <p className="text-indigo-200 text-sm">Accedé a tu contrato y pagos de forma segura</p>
                    </div>
                </div>

                {/* Form */}
                <div className="p-8">
                    <form onSubmit={handleSubmit} className="space-y-6">
                        {error && (
                            <div className="flex items-center gap-2 p-4 bg-red-50 text-red-600 rounded-xl text-sm animate-in fade-in slide-in-from-top-2">
                                <AlertCircle size={18} className="flex-shrink-0" />
                                {error}
                            </div>
                        )}

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Código de Alquiler
                                </label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                                        <Key size={18} />
                                    </div>
                                    <input
                                        type="text"
                                        value={formData.code}
                                        onChange={(e) => setFormData(prev => ({ ...prev, code: e.target.value.toUpperCase() }))}
                                        className="block w-full pl-10 pr-3 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-gray-50 text-gray-900 uppercase placeholder-gray-400 transition-all font-mono"
                                        placeholder="EJ: ROJAS-207"
                                    />
                                </div>
                                <p className="mt-1.5 text-xs text-gray-500">
                                    Lo encontrás en tu contrato o consultando a la inmobiliaria.
                                </p>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Tu DNI
                                </label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                                        <User size={18} />
                                    </div>
                                    <input
                                        type="text"
                                        inputMode="numeric"
                                        maxLength={8}
                                        value={formData.dni}
                                        onChange={(e) => setFormData(prev => ({ ...prev, dni: e.target.value.replace(/\D/g, '') }))}
                                        className="block w-full pl-10 pr-3 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-gray-50 text-gray-900 placeholder-gray-400 transition-all"
                                        placeholder="Ingresá solo números"
                                    />
                                </div>
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={isLoading}
                            className="w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3.5 rounded-xl transition-all shadow-lg hover:shadow-indigo-200 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {isLoading ? (
                                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            ) : (
                                <>
                                    Ingresar al Portal <ArrowRight size={18} />
                                </>
                            )}
                        </button>
                    </form>

                    <div className="mt-8 pt-8 border-t border-gray-50 text-center">
                        <p className="text-xs text-gray-400">
                            Protegido por Zeta Prop Security &bull; SSL Encrypted
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
