"use client";

import { useEffect, useState } from "react";
import { Info, Check } from "lucide-react";
import { useAuth } from "@/ui/context/AuthContext";
import { portalIntegrationService, PortalId } from "@/infrastructure/services/portalIntegrationService";

function PortalCard({
    portal,
    label,
    accentBg,
    accentBorder,
    accentText,
    buttonBg,
    buttonHoverBg,
    savedCode,
    onSave,
}: {
    portal: PortalId;
    label: string;
    accentBg: string;
    accentBorder: string;
    accentText: string;
    buttonBg: string;
    buttonHoverBg: string;
    savedCode?: string;
    onSave: (portal: PortalId, code: string) => Promise<void>;
}) {
    const [code, setCode] = useState(savedCode || "");
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        setCode(savedCode || "");
    }, [savedCode]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!code.trim()) return;
        setSaving(true);
        try {
            await onSave(portal, code);
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <div className="flex items-start justify-between mb-6">
                <div className="flex items-center gap-4">
                    <div className={`w-14 h-14 ${accentBg} rounded-xl flex items-center justify-center border ${accentBorder}`}>
                        <span className={`${accentText} font-bold text-2xl`}>{label[0]}</span>
                    </div>
                    <div>
                        <h2 className="text-lg font-bold text-gray-900">{label}</h2>
                        <p className="text-sm text-gray-500">Publicación automática y sincronización.</p>
                    </div>
                </div>
                <div className={`text-xs px-2.5 py-1 rounded-full font-medium ${savedCode ? "bg-blue-100 text-blue-700" : "bg-gray-100 text-gray-500"}`}>
                    {savedCode ? "Código guardado" : "Sin configurar"}
                </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Código de inmobiliaria en {label}</label>
                    <input
                        type="text"
                        value={code}
                        onChange={(e) => setCode(e.target.value)}
                        placeholder="Ej: 123456"
                        className="w-full p-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-offset-0 outline-none transition-all"
                    />
                </div>

                <div className="pt-4">
                    <button
                        type="submit"
                        disabled={saving || !code.trim()}
                        className={`w-full ${buttonBg} ${buttonHoverBg} text-white font-medium py-2.5 rounded-lg transition shadow-sm hover:shadow active:scale-[0.99] transform duration-100 disabled:opacity-50 flex items-center justify-center gap-2`}
                    >
                        {saving ? "Guardando..." : savedCode ? (<><Check className="w-4 h-4" /> Actualizar código</>) : "Guardar código"}
                    </button>
                </div>

                <div className="flex items-start gap-2 mt-4 p-3 bg-amber-50/60 rounded-lg">
                    <Info className="w-4 h-4 text-amber-600 mt-0.5 flex-shrink-0" />
                    <p className="text-xs text-amber-700 leading-relaxed">
                        La publicación automática hacia {label} todavía no está activa — Zeta Prop está gestionando la integración oficial con el portal.
                        Nunca te vamos a pedir tu usuario o contraseña de {label}; sólo el código de inmobiliaria que el portal te asignó, para tenerlo listo apenas se habilite.
                    </p>
                </div>
            </form>
        </div>
    );
}

export default function PublicacionesPage() {
    const { user, userData } = useAuth();
    const portalIds = userData?.portalIds || {};

    const handleSave = async (portal: PortalId, code: string) => {
        if (!user) return;
        await portalIntegrationService.saveCode(user.uid, portal, code);
    };

    return (
        <div className="max-w-7xl mx-auto space-y-8">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Publicaciones Multiplataforma</h1>
                    <p className="text-gray-500 mt-1">Gestioná la conexión con los principales portales inmobiliarios.</p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <PortalCard
                    portal="argenprop"
                    label="Argenprop"
                    accentBg="bg-orange-50"
                    accentBorder="border-orange-100"
                    accentText="text-orange-600"
                    buttonBg="bg-orange-600"
                    buttonHoverBg="hover:bg-orange-700"
                    savedCode={portalIds.argenprop}
                    onSave={handleSave}
                />
                <PortalCard
                    portal="zonaprop"
                    label="Zonaprop"
                    accentBg="bg-indigo-50"
                    accentBorder="border-indigo-100"
                    accentText="text-indigo-600"
                    buttonBg="bg-indigo-600"
                    buttonHoverBg="hover:bg-indigo-700"
                    savedCode={portalIds.zonaprop}
                    onSave={handleSave}
                />
            </div>

            {/* XML Feed Manual Section */}
            <div className="mt-8 bg-slate-900 text-white rounded-xl p-8 overflow-hidden relative">
                <div className="relative z-10 flex flex-col md:flex-row justify-between items-center gap-6">
                    <div>
                        <h3 className="text-xl font-bold mb-2">¿Necesitás el Feed XML manual?</h3>
                        <p className="text-slate-300 max-w-xl">
                            Si tu portal no soporta integración directa, podés usar nuestro feed XML estándar compatible con los principales portales (Zonaprop y Argenprop).
                        </p>
                    </div>
                    <button
                        onClick={() => user && window.open(`/api/feeds/${user.uid}`, '_blank')}
                        disabled={!user}
                        className="px-6 py-3 bg-white text-slate-900 font-bold rounded-lg hover:bg-slate-100 transition shadow-lg whitespace-nowrap disabled:opacity-50"
                    >
                        Ver Feed XML
                    </button>
                </div>

                {/* Decorative background */}
                <div className="absolute -top-24 -right-24 w-64 h-64 bg-indigo-500 rounded-full blur-[100px] opacity-20"></div>
                <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-blue-500 rounded-full blur-[100px] opacity-20"></div>
            </div>
        </div>
    );
}
