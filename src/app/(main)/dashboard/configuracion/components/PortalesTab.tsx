"use client";

import { useState } from "react";
import { Check, ChevronRight, AlertCircle, Building2, ExternalLink } from "lucide-react";

type Portal = {
    id: string;
    name: string;
    color: string;
    bgColor: string;
};

const PORTALS: Portal[] = [
    { id: 'argenprop', name: 'Argenprop', color: 'text-orange-500', bgColor: 'bg-orange-50' },
    { id: 'zonaprop', name: 'Zonaprop', color: 'text-orange-600', bgColor: 'bg-orange-50' },
    { id: 'mercadolibre', name: 'MercadoLibre', color: 'text-yellow-600', bgColor: 'bg-yellow-50' },
    { id: 'lavoz', name: 'Clasificados La Voz', color: 'text-blue-600', bgColor: 'bg-blue-50' },
    { id: 'cadena3', name: 'Clasificados Cadena3', color: 'text-red-500', bgColor: 'bg-red-50' },
    { id: 'facebook', name: 'Facebook', color: 'text-blue-700', bgColor: 'bg-blue-50' },
];

export default function PortalesTab() {
    const [selectedPortalId, setSelectedPortalId] = useState('zonaprop');
    const [showLinkModal, setShowLinkModal] = useState(false);
    const [loading, setLoading] = useState(false);
    const [isLinked, setIsLinked] = useState(false);

    const selectedPortal = PORTALS.find(p => p.id === selectedPortalId) || PORTALS[1];

    const handleLinkAccount = (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        // Simulate API call
        setTimeout(() => {
            setLoading(false);
            setShowLinkModal(false);
            setIsLinked(true);
        }, 1500);
    };

    return (
        <div className="flex flex-col lg:flex-row gap-6 min-h-[600px] bg-white rounded-xl shadow-sm border overflow-hidden">
            {/* Sidebar de Portales */}
            <div className="w-full lg:w-64 bg-gray-50 border-r border-gray-100 flex-shrink-0">
                <div className="p-5 border-b border-gray-200">
                    <h3 className="font-semibold text-gray-900">Portales</h3>
                    <p className="text-xs text-gray-500 mt-1">Gestioná tus integraciones</p>
                </div>
                <div className="p-3 space-y-1">
                    {PORTALS.map((portal) => (
                        <button
                            key={portal.id}
                            onClick={() => setSelectedPortalId(portal.id)}
                            className={`w-full flex items-center justify-between px-3 py-3 rounded-lg text-sm transition-all duration-200 group ${selectedPortalId === portal.id
                                    ? 'bg-white text-gray-900 font-medium shadow-sm border border-gray-200 ring-1 ring-black/5'
                                    : 'text-gray-600 hover:bg-white hover:shadow-sm hover:text-gray-900'
                                }`}
                        >
                            <div className="flex items-center gap-3">
                                <div className={`w-2 h-2 rounded-full transition-colors ${selectedPortalId === portal.id ? 'bg-indigo-500' : 'bg-gray-300'}`} />
                                <span>{portal.name}</span>
                            </div>
                            {selectedPortalId === portal.id && <ChevronRight className="w-4 h-4 text-gray-400" />}
                        </button>
                    ))}
                </div>
            </div>

            {/* Main Content */}
            <div className="flex-1 p-8 bg-white">

                <div className="flex justify-between items-center mb-8 pb-4 border-b">
                    <div>
                        <h2 className="text-2xl font-bold text-gray-900">{selectedPortal.name}</h2>
                        <p className="text-gray-500 text-sm mt-1">Configuración de integración y sincronización</p>
                    </div>
                    {isLinked && (
                        <span className="px-3 py-1 bg-green-100 text-green-700 text-sm font-medium rounded-full flex items-center gap-2">
                            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                            Conectado
                        </span>
                    )}
                </div>

                <div className="flex flex-col items-center">

                    {/* Main Connect Card */}
                    <div className="w-full max-w-2xl bg-gray-50 rounded-2xl border border-gray-200 p-8 flex flex-col items-center text-center transition-all hover:shadow-md">

                        <h3 className="text-lg font-medium text-gray-500 mb-6">¿Cómo conectar?</h3>

                        {/* Logo Area */}
                        <div className={`w-64 h-32 ${selectedPortal.bgColor} rounded-xl flex items-center justify-center mb-8 border border-dashed border-gray-300 relative group`}>
                            <span className={`text-3xl font-extrabold ${selectedPortal.color} tracking-tight`}>{selectedPortal.name}</span>

                            <div className="absolute inset-0 bg-white/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center rounded-xl backdrop-blur-sm">
                                <ExternalLink className="text-gray-600 w-6 h-6" />
                            </div>
                        </div>

                        <p className="text-gray-600 text-sm mb-8 max-w-md leading-relaxed">
                            Para conectarte con un usuario existente ingresa tu email de <strong>{selectedPortal.name}</strong>.
                            <br />
                            Si no tienes una cuenta puedes registrarte ingresando <a href="#" className="text-indigo-600 hover:text-indigo-800 font-medium underline decoration-indigo-200 underline-offset-4">aquí</a>.
                        </p>

                        {/* Connection Action Box */}
                        {!isLinked ? (
                            <div className="w-full bg-white rounded-xl p-6 shadow-lg border border-gray-100 flex flex-col sm:flex-row items-center justify-between gap-4 transform transition-all hover:scale-[1.01]">
                                <div className="text-left flex items-center gap-4">
                                    <div className="p-3 bg-gray-100 rounded-lg">
                                        <Building2 className="w-6 h-6 text-gray-600" />
                                    </div>
                                    <div>
                                        <p className="text-xs text-gray-400 uppercase font-bold tracking-wider">Oficina</p>
                                        <p className="text-gray-900 font-bold text-lg">Ituzaingo Nº 647</p>
                                    </div>
                                </div>
                                <button
                                    onClick={() => setShowLinkModal(true)}
                                    className="w-full sm:w-auto bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-8 rounded-xl transition-all shadow-lg shadow-green-600/20 active:scale-95 flex items-center justify-center gap-2"
                                >
                                    Vincular cuenta
                                    <ChevronRight className="w-4 h-4" />
                                </button>
                            </div>
                        ) : (
                            <div className="w-full bg-white rounded-xl p-6 shadow-sm border border-green-200 flex items-center justify-between gap-4">
                                <div className="text-left">
                                    <h4 className="font-bold text-green-800 flex items-center gap-2">
                                        <Check className="w-5 h-5" /> Integración Activa
                                    </h4>
                                    <p className="text-sm text-green-600 mt-1">Tus propiedades se están sincronizando correctamente.</p>
                                </div>
                                <button
                                    onClick={() => setIsLinked(false)}
                                    className="text-red-900 hover:text-red-700 text-sm font-medium underline px-4"
                                >
                                    Desvincular
                                </button>
                            </div>
                        )}
                    </div>

                </div>

                {/* Modal "Link Account" */}
                {showLinkModal && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
                        <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden animate-in zoom-in-95 duration-200">
                            <div className="bg-gray-50 px-6 py-4 border-b border-gray-100 flex justify-between items-center">
                                <h3 className="font-bold text-gray-900 text-lg">Vincular {selectedPortal.name}</h3>
                                <button onClick={() => setShowLinkModal(false)} className="text-gray-400 hover:text-gray-600 p-1 hover:bg-gray-200 rounded-full transition-colors">
                                    <span className="text-xl leading-none">&times;</span>
                                </button>
                            </div>

                            <form onSubmit={handleLinkAccount} className="p-6 space-y-5">
                                <div className="bg-indigo-50 text-indigo-800 p-4 rounded-xl text-sm flex gap-3 items-start border border-indigo-100">
                                    <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                                    <p className="leading-relaxed">Ingresá las credenciales de tu cuenta de <strong>{selectedPortal.name}</strong> para activar la sincronización automática de tu inventario.</p>
                                </div>

                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-1.5">Usuario / Email</label>
                                        <input required type="text" className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-black focus:border-transparent outline-none transition-all font-medium" placeholder="ejemplo@inmobiliaria.com" />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-1.5">Contraseña</label>
                                        <input required type="password" className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-black focus:border-transparent outline-none transition-all font-medium" placeholder="••••••••" />
                                    </div>
                                </div>

                                <div className="pt-2 flex gap-3">
                                    <button type="button" onClick={() => setShowLinkModal(false)} className="flex-1 px-4 py-3 bg-white text-gray-700 border border-gray-200 rounded-xl font-bold hover:bg-gray-50 hover:border-gray-300 transition-colors">
                                        Cancelar
                                    </button>
                                    <button disabled={loading} type="submit" className="flex-1 px-4 py-3 bg-black text-white rounded-xl font-bold hover:bg-gray-800 transition-all shadow-lg hover:shadow-xl active:scale-[0.98] flex justify-center items-center gap-2">
                                        {loading ? (
                                            <>
                                                <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-white"></div>
                                                <span>Procesando...</span>
                                            </>
                                        ) : (
                                            <>
                                                <span>Activar integración</span>
                                                <Check className="w-4 h-4" />
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
