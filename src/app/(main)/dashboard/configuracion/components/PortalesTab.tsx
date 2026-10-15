"use client";

import { useState } from "react";
import { Check, ChevronRight, AlertCircle, ExternalLink } from "lucide-react";
import { useAuth } from "@/ui/context/AuthContext";
import { portalIntegrationService, PortalId } from "@/infrastructure/services/portalIntegrationService";

type Portal = {
    id: string;
    name: string;
    color: string;
    bgColor: string;
};

// Only Zonaprop and Argenprop actually support the "código de inmobiliaria"
// flow below — La Voz/Cadena3/Facebook stay listed for later but aren't
// wired to anything yet.
const PORTALS: Portal[] = [
    { id: 'argenprop', name: 'Argenprop', color: 'text-[var(--color-warning)]', bgColor: 'bg-[var(--color-warning-soft)]' },
    { id: 'zonaprop', name: 'Zonaprop', color: 'text-[var(--color-warning)]', bgColor: 'bg-[var(--color-warning-soft)]' },
    { id: 'lavoz', name: 'Clasificados La Voz', color: 'text-[var(--color-accent)]', bgColor: 'bg-[var(--color-accent-soft)]' },
    { id: 'cadena3', name: 'Clasificados Cadena3', color: 'text-[var(--color-danger)]', bgColor: 'bg-[var(--color-danger-soft)]' },
    { id: 'facebook', name: 'Facebook', color: 'text-[var(--color-accent)]', bgColor: 'bg-[var(--color-accent-soft)]' },
];

export default function PortalesTab() {
    const { user, userData } = useAuth();
    const [selectedPortalId, setSelectedPortalId] = useState('zonaprop');
    const [showLinkModal, setShowLinkModal] = useState(false);
    const [loading, setLoading] = useState(false);
    const [codeInput, setCodeInput] = useState('');
    const [error, setError] = useState<string | null>(null);

    const selectedPortal = PORTALS.find(p => p.id === selectedPortalId) || PORTALS[1];
    const isIntegrable = selectedPortalId === 'zonaprop' || selectedPortalId === 'argenprop';
    const savedCode: string | undefined = userData?.portalIds?.[selectedPortalId];

    const handleLinkAccount = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user || !codeInput.trim()) return;
        setLoading(true);
        setError(null);
        try {
            await portalIntegrationService.saveCode(user.uid, selectedPortalId as PortalId, codeInput);
            setShowLinkModal(false);
            setCodeInput('');
        } catch {
            setError("No se pudo guardar el código. Probá de nuevo.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex flex-col lg:flex-row gap-6 min-h-[600px] bg-[var(--color-paper-2)] rounded-xl shadow-sm border overflow-hidden">
            {/* Sidebar de Portales */}
            <div className="w-full lg:w-64 bg-[var(--color-paper)] border-r border-[var(--color-rule-2)] flex-shrink-0">
                <div className="p-5 border-b border-[var(--color-rule)]">
                    <h3 className="font-semibold text-[var(--color-ink)]">Portales</h3>
                    <p className="text-xs text-[var(--color-muted)] mt-1">Gestioná tus integraciones</p>
                </div>
                <div className="p-3 space-y-1">
                    {PORTALS.map((portal) => (
                        <button
                            key={portal.id}
                            onClick={() => setSelectedPortalId(portal.id)}
                            className={`w-full flex items-center justify-between px-3 py-3 rounded-lg text-sm transition-all duration-200 group ${selectedPortalId === portal.id
                                    ? 'bg-[var(--color-paper-2)] text-[var(--color-ink)] font-medium shadow-sm border border-[var(--color-rule)] ring-1 ring-[var(--color-rule)]/5'
                                    : 'text-[var(--color-ink-2)] hover:bg-[var(--color-paper-3)] hover:shadow-sm hover:text-[var(--color-ink)]'
                                }`}
                        >
                            <div className="flex items-center gap-3">
                                <div className={`w-2 h-2 rounded-full transition-colors ${selectedPortalId === portal.id ? 'bg-[var(--color-accent)]' : 'bg-[var(--color-paper-4)]'}`} />
                                <span>{portal.name}</span>
                            </div>
                            {selectedPortalId === portal.id && <ChevronRight strokeWidth={1.5} className="w-4 h-4 text-[var(--color-neutral)]" />}
                        </button>
                    ))}
                </div>
            </div>

            {/* Main Content */}
            <div className="flex-1 p-8 bg-[var(--color-paper-2)]">

                <div className="flex justify-between items-center mb-8 pb-4 border-b">
                    <div>
                        <h2 className="text-2xl font-bold text-[var(--color-ink)]">{selectedPortal.name}</h2>
                        <p className="text-[var(--color-muted)] text-sm mt-1">Configuración de integración y sincronización</p>
                    </div>
                    {isIntegrable && savedCode && (
                        <span className="px-3 py-1 bg-[var(--color-accent-soft)] text-[var(--color-accent)] text-sm font-medium rounded-full flex items-center gap-2">
                            <Check strokeWidth={1.5} className="w-4 h-4" />
                            Código guardado
                        </span>
                    )}
                </div>

                <div className="flex flex-col items-center">

                    {!isIntegrable ? (
                        <div className="w-full max-w-2xl bg-[var(--color-paper)] rounded-2xl border border-[var(--color-rule)] p-8 flex flex-col items-center text-center">
                            <h3 className="text-lg font-medium text-[var(--color-muted)] mb-2">Próximamente</h3>
                            <p className="text-[var(--color-muted)] text-sm max-w-md">
                                La integración con {selectedPortal.name} todavía no está disponible.
                            </p>
                        </div>
                    ) : (
                        <div className="w-full max-w-2xl bg-[var(--color-paper)] rounded-2xl border border-[var(--color-rule)] p-8 flex flex-col items-center text-center transition-all hover:shadow-md">

                            <h3 className="text-lg font-medium text-[var(--color-muted)] mb-6">¿Cómo funciona?</h3>

                            {/* Logo Area */}
                            <div className={`w-64 h-32 ${selectedPortal.bgColor} rounded-xl flex items-center justify-center mb-8 border border-dashed border-[var(--color-rule)] relative group`}>
                                <span className={`text-3xl font-extrabold ${selectedPortal.color} tracking-tight`}>{selectedPortal.name}</span>

                                <div className="absolute inset-0 bg-[var(--color-paper-2)]/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center rounded-xl backdrop-blur-sm">
                                    <ExternalLink strokeWidth={1.5} className="text-[var(--color-ink-2)] w-6 h-6" />
                                </div>
                            </div>

                            <div className="bg-[var(--color-warning-soft)] text-[var(--color-warning)] p-4 rounded-xl text-sm text-left flex gap-3 items-start border border-[var(--color-warning)]/30 mb-8 max-w-md">
                                <AlertCircle strokeWidth={1.5} className="w-5 h-5 flex-shrink-0 mt-0.5" />
                                <p className="leading-relaxed">
                                    La publicación automática hacia {selectedPortal.name} todavía no está activa — Zeta Prop está gestionando la integración oficial con el portal.
                                    Por ahora podés guardar tu <strong>código de inmobiliaria</strong> para tenerlo listo apenas se habilite, y mientras tanto usar el feed XML manual (más abajo, en Publicaciones).
                                </p>
                            </div>

                            {/* Connection Action Box */}
                            {!savedCode ? (
                                <div className="w-full bg-[var(--color-paper-2)] rounded-xl p-6 shadow-lg border border-[var(--color-rule-2)] flex flex-col sm:flex-row items-center justify-between gap-4 transform transition-all hover:scale-[1.01]">
                                    <p className="text-left text-sm text-[var(--color-muted)]">Todavía no guardaste un código para este portal.</p>
                                    <button
                                        onClick={() => setShowLinkModal(true)}
                                        className="w-full sm:w-auto bg-[var(--color-ink)] hover:bg-[var(--color-ink-2)] text-[var(--color-paper)] font-bold py-3 px-8 rounded-xl transition-all shadow-lg active:scale-95 flex items-center justify-center gap-2"
                                    >
                                        Guardar código
                                        <ChevronRight strokeWidth={1.5} className="w-4 h-4" />
                                    </button>
                                </div>
                            ) : (
                                <div className="w-full bg-[var(--color-paper-2)] rounded-xl p-6 shadow-sm border border-[var(--color-rule)] flex items-center justify-between gap-4">
                                    <div className="text-left">
                                        <p className="text-xs text-[var(--color-neutral)] uppercase font-bold tracking-wider">Código de inmobiliaria</p>
                                        <p className="text-[var(--color-ink)] font-bold text-lg">{savedCode}</p>
                                    </div>
                                    <button
                                        onClick={() => { setCodeInput(savedCode); setShowLinkModal(true); }}
                                        className="text-[var(--color-ink-2)] hover:text-[var(--color-ink)] text-sm font-medium underline px-4"
                                    >
                                        Editar
                                    </button>
                                </div>
                            )}
                        </div>
                    )}

                </div>

                {/* Modal "Save portal code" */}
                {showLinkModal && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
                        <div className="bg-[var(--color-paper-2)] rounded-2xl shadow-2xl max-w-md w-full overflow-hidden animate-in zoom-in-95 duration-200">
                            <div className="bg-[var(--color-paper)] px-6 py-4 border-b border-[var(--color-rule-2)] flex justify-between items-center">
                                <h3 className="font-bold text-[var(--color-ink)] text-lg">{selectedPortal.name}</h3>
                                <button onClick={() => setShowLinkModal(false)} className="text-[var(--color-neutral)] hover:text-[var(--color-ink-2)] p-1 hover:bg-[var(--color-paper-4)] rounded-full transition-colors">
                                    <span className="text-xl leading-none">&times;</span>
                                </button>
                            </div>

                            <form onSubmit={handleLinkAccount} className="p-6 space-y-5">
                                <div className="bg-[var(--color-accent-soft)] text-[var(--color-accent)] p-4 rounded-xl text-sm flex gap-3 items-start border border-[var(--color-accent)]/30">
                                    <AlertCircle strokeWidth={1.5} className="w-5 h-5 flex-shrink-0 mt-0.5" />
                                    <p className="leading-relaxed">
                                        Ingresá el código de inmobiliaria que <strong>{selectedPortal.name}</strong> te asignó. Nunca te vamos a pedir tu usuario o contraseña de {selectedPortal.name}.
                                    </p>
                                </div>

                                <div>
                                    <label className="block text-sm font-semibold text-[var(--color-ink-2)] mb-1.5">Código de inmobiliaria</label>
                                    <input
                                        required
                                        type="text"
                                        value={codeInput}
                                        onChange={(e) => setCodeInput(e.target.value)}
                                        className="w-full px-4 py-3 bg-[var(--color-paper)] border border-[var(--color-rule)] rounded-xl focus:bg-[var(--color-paper-2)] focus:ring-2 focus:ring-[var(--color-rule)] focus:border-transparent outline-none transition-all font-medium"
                                        placeholder="Ej: 123456"
                                    />
                                </div>

                                {error && <p className="text-sm text-[var(--color-danger)]">{error}</p>}

                                <div className="pt-2 flex gap-3">
                                    <button type="button" onClick={() => setShowLinkModal(false)} className="flex-1 px-4 py-3 bg-[var(--color-paper-2)] text-[var(--color-ink-2)] border border-[var(--color-rule)] rounded-xl font-bold hover:bg-[var(--color-paper-3)] hover:border-[var(--color-neutral)] transition-colors">
                                        Cancelar
                                    </button>
                                    <button disabled={loading} type="submit" className="flex-1 px-4 py-3 bg-[var(--color-ink)] text-[var(--color-paper)] rounded-xl font-bold hover:bg-[var(--color-ink-2)] transition-all shadow-lg hover:shadow-xl active:scale-[0.98] flex justify-center items-center gap-2">
                                        {loading ? (
                                            <>
                                                <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-[var(--color-paper-2)]"></div>
                                                <span>Guardando...</span>
                                            </>
                                        ) : (
                                            <>
                                                <span>Guardar</span>
                                                <Check strokeWidth={1.5} className="w-4 h-4" />
                                            </>
                                        )}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
