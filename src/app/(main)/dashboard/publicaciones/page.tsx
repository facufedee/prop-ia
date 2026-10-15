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
        <div className="bg-[var(--color-paper-2)] p-6 rounded-xl shadow-sm border border-[var(--color-rule-2)]">
            <div className="flex items-start justify-between mb-6">
                <div className="flex items-center gap-4">
                    <div className={`w-14 h-14 ${accentBg} rounded-xl flex items-center justify-center border ${accentBorder}`}>
                        <span className={`${accentText} font-bold text-2xl`}>{label[0]}</span>
                    </div>
                    <div>
                        <h2 className="text-lg font-bold text-[var(--color-ink)]">{label}</h2>
                        <p className="text-sm text-[var(--color-muted)]">Publicación automática y sincronización.</p>
                    </div>
                </div>
                <div className={`text-xs px-2.5 py-1 rounded-full font-medium ${savedCode ? "bg-[var(--color-positive-soft)] text-[var(--color-positive)]" : "bg-[var(--color-paper-3)] text-[var(--color-muted)]"}`}>
                    {savedCode ? "Código guardado" : "Sin configurar"}
                </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label className="block text-sm font-medium text-[var(--color-ink-2)] mb-1.5">Código de inmobiliaria en {label}</label>
                    <input
                        type="text"
                        value={code}
                        onChange={(e) => setCode(e.target.value)}
                        placeholder="Ej: 123456"
                        className="w-full p-2.5 border border-[var(--color-rule)] rounded-lg bg-[var(--color-paper-3)] text-[var(--color-ink)] focus:ring-2 focus:ring-[var(--color-accent)]/40 focus:ring-offset-0 outline-none transition-all"
                    />
                </div>

                <div className="pt-4">
                    <button
                        type="submit"
                        disabled={saving || !code.trim()}
                        className={`w-full ${buttonBg} ${buttonHoverBg} text-[var(--color-paper)] font-medium py-2.5 rounded-lg transition shadow-sm hover:shadow active:scale-[0.99] transform duration-100 disabled:opacity-50 flex items-center justify-center gap-2`}
                    >
                        {saving ? "Guardando..." : savedCode ? (<><Check strokeWidth={1.5} className="w-4 h-4" /> Actualizar código</>) : "Guardar código"}
                    </button>
                </div>

                <div className="flex items-start gap-2 mt-4 p-3 bg-[var(--color-warning-soft)] rounded-lg">
                    <Info strokeWidth={1.5} className="w-4 h-4 text-[var(--color-warning)] mt-0.5 flex-shrink-0" />
                    <p className="text-xs text-[var(--color-warning)] leading-relaxed">
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
                    <h1 className="font-heading text-2xl font-bold text-[var(--color-ink)]">Publicaciones Multiplataforma</h1>
                    <p className="text-[var(--color-muted)] mt-1">Gestioná la conexión con los principales portales inmobiliarios.</p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <PortalCard
                    portal="argenprop"
                    label="Argenprop"
                    accentBg="bg-[var(--color-paper-3)]"
                    accentBorder="border-[var(--color-rule)]"
                    accentText="text-[var(--color-ink-2)]"
                    buttonBg="bg-[var(--color-ink)]"
                    buttonHoverBg="hover:bg-[var(--color-ink-2)]"
                    savedCode={portalIds.argenprop}
                    onSave={handleSave}
                />
                <PortalCard
                    portal="zonaprop"
                    label="Zonaprop"
                    accentBg="bg-[var(--color-paper-3)]"
                    accentBorder="border-[var(--color-rule)]"
                    accentText="text-[var(--color-ink-2)]"
                    buttonBg="bg-[var(--color-ink)]"
                    buttonHoverBg="hover:bg-[var(--color-ink-2)]"
                    savedCode={portalIds.zonaprop}
                    onSave={handleSave}
                />
            </div>

            {/* XML Feed Manual Section */}
            <div className="mt-8 bg-[var(--color-paper-2)] border border-[var(--color-rule)] text-[var(--color-ink)] rounded-xl p-8 overflow-hidden relative">
                <div className="relative z-10 flex flex-col md:flex-row justify-between items-center gap-6">
                    <div>
                        <h3 className="text-xl font-bold mb-2">¿Necesitás el Feed XML manual?</h3>
                        <p className="text-[var(--color-muted)] max-w-xl">
                            Si tu portal no soporta integración directa, podés usar nuestro feed XML estándar compatible con los principales portales (Zonaprop y Argenprop).
                        </p>
                    </div>
                    <button
                        onClick={() => user && window.open(`/api/feeds/${user.uid}`, '_blank')}
                        disabled={!user}
                        className="px-6 py-3 bg-[var(--color-ink)] text-[var(--color-paper)] font-bold rounded-lg hover:bg-[var(--color-ink-2)] transition whitespace-nowrap disabled:opacity-50"
                    >
                        Ver Feed XML
                    </button>
                </div>
            </div>
        </div>
    );
}
