"use client";

import { useState, useEffect } from "react";
import { Save, Shield, ShieldAlert, Check, Loader2 } from "lucide-react";

export default function MercadoPagoTab() {
    const [config, setConfig] = useState<any>({
        activeMode: 'sandbox',
        sandbox: { publicKey: '', accessToken: '' },
        production: { publicKey: '', accessToken: '' }
    });
    const [activeSubTab, setActiveSubTab] = useState<'mercadopago' | 'otros'>('mercadopago');
    const [viewMode, setViewMode] = useState<'sandbox' | 'production'>('sandbox');
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [saved, setSaved] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        fetch('/api/config/mercadopago')
            .then(res => res.json())
            .then(data => {
                if (data && !data.error) {
                    setConfig(data);
                    setViewMode(data.activeMode || 'sandbox');
                }
            })
            .catch(err => console.error("Error loading MP config:", err))
            .finally(() => setLoading(false));
    }, []);

    const handleSave = async () => {
        setSaving(true);
        setError(null);
        try {
            const res = await fetch('/api/config/mercadopago', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(config)
            });
            if (!res.ok) throw new Error("Error al guardar la configuración");
            setSaved(true);
            setTimeout(() => setSaved(false), 3000);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center p-12">
                <Loader2 className="w-8 h-8 animate-spin text-gray-300" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Sub-tabs Header */}
            <div className="flex gap-4 border-b">
                <button
                    onClick={() => setActiveSubTab('mercadopago')}
                    className={`pb-2 px-2 text-sm font-semibold transition-all ${activeSubTab === 'mercadopago' ? 'border-b-2 border-indigo-600 text-indigo-600' : 'text-gray-400'}`}
                >
                    Mercado Pago
                </button>
                <button
                    className="pb-2 px-2 text-sm font-semibold text-gray-300 cursor-not-allowed"
                    disabled
                >
                    Stripe (Próximamente)
                </button>
            </div>

            {activeSubTab === 'mercadopago' && (
                <div className="bg-white p-6 rounded-xl border shadow-sm">
                    <div className="flex justify-between items-center mb-8">
                        <div>
                            <h2 className="text-xl font-bold flex items-center gap-2">
                                <Shield className="w-5 h-5 text-indigo-600" />
                                Configuración de Mercado Pago
                            </h2>
                            <p className="text-sm text-gray-500 mt-1">
                                Las claves se almacenan de forma segura (encriptadas).
                            </p>
                        </div>
                        <button
                            onClick={handleSave}
                            disabled={saving}
                            className="flex items-center gap-2 px-6 py-2 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors font-medium text-sm disabled:opacity-50"
                        >
                            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                            {saved ? "Configuración Guardada" : "Guardar Cambios"}
                        </button>
                    </div>

                    <div className="space-y-8 max-w-2xl">
                        {/* Environment Selection with Active status */}
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-3 text-center">Gestionar Entornos</label>
                            <div className="grid grid-cols-2 gap-4">
                                <div
                                    onClick={() => setViewMode('sandbox')}
                                    className={`p-4 rounded-xl border-2 transition-all cursor-pointer relative ${viewMode === 'sandbox' ? 'border-indigo-600 bg-indigo-50/30' : 'border-gray-100 bg-gray-50'}`}
                                >
                                    <div className="flex items-center justify-between mb-2">
                                        <span className={`text-xs font-bold uppercase tracking-wider ${viewMode === 'sandbox' ? 'text-indigo-600' : 'text-gray-400'}`}>Sandbox</span>
                                        {config.activeMode === 'sandbox' && (
                                            <span className="bg-green-100 text-green-700 px-2 py-0.5 rounded text-[10px] font-black uppercase">ACTIVO</span>
                                        )}
                                    </div>
                                    <p className="text-xs text-gray-500">Pruebas con tarjetas ficticias.</p>
                                </div>

                                <div
                                    onClick={() => setViewMode('production')}
                                    className={`p-4 rounded-xl border-2 transition-all cursor-pointer relative ${viewMode === 'production' ? 'border-red-600 bg-red-50/30' : 'border-gray-100 bg-gray-50'}`}
                                >
                                    <div className="flex items-center justify-between mb-2">
                                        <span className={`text-xs font-bold uppercase tracking-wider ${viewMode === 'production' ? 'text-red-600' : 'text-gray-400'}`}>Producción</span>
                                        {config.activeMode === 'production' && (
                                            <span className="bg-green-100 text-green-700 px-2 py-0.5 rounded text-[10px] font-black uppercase">ACTIVO</span>
                                        )}
                                    </div>
                                    <p className="text-xs text-gray-500">Cobros reales a clientes.</p>
                                </div>
                            </div>

                            {/* Set as Active Toggle */}
                            <div className="mt-4 flex items-center justify-center">
                                <button
                                    onClick={() => setConfig({ ...config, activeMode: viewMode })}
                                    disabled={config.activeMode === viewMode}
                                    className={`px-4 py-2 rounded-lg text-xs font-bold flex items-center gap-2 transition-all ${config.activeMode === viewMode
                                        ? 'bg-green-50 text-green-600 cursor-default'
                                        : 'bg-white border text-gray-700 hover:border-gray-400'}`}
                                >
                                    {config.activeMode === viewMode ? (
                                        <><Check className="w-3 h-3" /> Este es el entorno activo</>
                                    ) : (
                                        <>Marcar {viewMode === 'sandbox' ? 'Sandbox' : 'Producción'} como Activo</>
                                    )}
                                </button>
                            </div>
                        </div>

                        {/* API Keys for currently viewed mode */}
                        <div className="grid gap-6 p-6 bg-gray-50 rounded-2xl border border-dashed">
                            <h3 className="text-sm font-bold flex items-center gap-2">
                                <span className={`w-2 h-2 rounded-full ${viewMode === 'sandbox' ? 'bg-indigo-400' : 'bg-red-400'}`}></span>
                                Credenciales de {viewMode === 'sandbox' ? 'Pasarela de Pruebas' : 'Pasarela Real'}
                            </h3>
                            <div className="space-y-2">
                                <label className="block text-sm font-semibold text-gray-700">Public Key</label>
                                <input
                                    type="text"
                                    value={config[viewMode]?.publicKey || ''}
                                    onChange={(e) => setConfig({
                                        ...config,
                                        [viewMode]: { ...(config[viewMode] || {}), publicKey: e.target.value }
                                    })}
                                    placeholder="APP_USR-..."
                                    className="w-full p-3 border rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none font-mono text-sm bg-white"
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="block text-sm font-semibold text-gray-700">Access Token</label>
                                <input
                                    type="password"
                                    value={config[viewMode]?.accessToken || ''}
                                    onChange={(e) => setConfig({
                                        ...config,
                                        [viewMode]: { ...(config[viewMode] || {}), accessToken: e.target.value }
                                    })}
                                    placeholder="TEST-..."
                                    className="w-full p-3 border rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none font-mono text-sm bg-white"
                                />
                            </div>
                        </div>

                        {error && (
                            <div className="p-4 bg-red-50 text-red-600 rounded-xl text-sm border border-red-100 flex items-center gap-3">
                                <ShieldAlert className="w-5 h-5 flex-shrink-0" />
                                {error}
                            </div>
                        )}

                        {saved && (
                            <div className="p-4 bg-green-50 text-green-700 rounded-xl text-sm border border-green-100 flex items-center gap-3 animate-in fade-in duration-300">
                                <Check className="w-5 h-5 flex-shrink-0" />
                                ¡Configuración actualizada! El entorno {config.activeMode === 'sandbox' ? 'Sandbox' : 'Producción'} está listo.
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
