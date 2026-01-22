"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";

export default function TenantLoginPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [formData, setFormData] = useState({
        dni: "",
        contractCode: ""
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError("");

        try {
            const res = await fetch("/api/portal/login", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(formData)
            });

            const data = await res.json();

            if (!res.ok) throw new Error(data.message || "Error al iniciar sesión");

            // Save branding to local storage to persist across portal pages
            if (data.branding) {
                localStorage.setItem("portal_branding", JSON.stringify(data.branding));
            }

            // Redirect to dashboard
            router.push("/portal/inquilino/dashboard");

        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex flex-col items-center justify-center min-h-[80vh]">
            <div className="w-full max-w-md bg-white p-8 rounded-xl shadow-lg border border-gray-100">
                <div className="text-center mb-8">
                    <h1 className="text-2xl font-bold text-gray-900">Acceso Inquilinos</h1>
                    <p className="text-gray-500 mt-2">Ingresa tus datos para ver tu contrato</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    {error && (
                        <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm border border-red-100">
                            {error}
                        </div>
                    )}

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            DNI / Identificación
                        </label>
                        <input
                            type="text"
                            required
                            value={formData.dni}
                            onChange={e => setFormData({ ...formData, dni: e.target.value })}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors bg-gray-50 focus:bg-white"
                            placeholder="Ej: 12345678"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Código de Contrato
                        </label>
                        <input
                            type="text"
                            required
                            value={formData.contractCode}
                            onChange={e => setFormData({ ...formData, contractCode: e.target.value })}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors bg-gray-50 focus:bg-white"
                            placeholder="Ej: CTR-2024-X9Y"
                        />
                        <p className="text-xs text-gray-400 mt-1">Este código figura en tu contrato o cupón de pago.</p>
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3 rounded-lg transition-colors flex items-center justify-center gap-2"
                    >
                        {loading && <Loader2 className="w-5 h-5 animate-spin" />}
                        Ingresar al Portal
                    </button>
                </form>

                <div className="mt-6 text-center text-sm text-gray-400">
                    &copy; 2024 Zeta Prop Secure Portal
                </div>
            </div>
        </div>
    );
}
