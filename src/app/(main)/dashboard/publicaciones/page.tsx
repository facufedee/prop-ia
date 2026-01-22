"use client";

import { useState } from "react";
import { Info, Globe, CheckCircle, AlertCircle, ChevronRight, LayoutDashboard } from "lucide-react";

export default function PublicacionesPage() {
    const [selectedPortal, setSelectedPortal] = useState<string | null>(null);

    return (
        <div className="max-w-7xl mx-auto space-y-8">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Publicaciones Multiplataforma</h1>
                    <p className="text-gray-500 mt-1">Gestioná la conexión con los principales portales inmobiliarios.</p>
                </div>
            </div>

            {/* Argenprop Configuration Card */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Argenprop - Active Integration Logic */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                    <div className="flex items-start justify-between mb-6">
                        <div className="flex items-center gap-4">
                            <div className="w-14 h-14 bg-orange-50 rounded-xl flex items-center justify-center border border-orange-100">
                                <span className="text-orange-600 font-bold text-2xl">A</span>
                            </div>
                            <div>
                                <h2 className="text-lg font-bold text-gray-900">Argenprop</h2>
                                <p className="text-sm text-gray-500">Publicación automática y sincronización.</p>
                            </div>
                        </div>
                        <div className="bg-gray-100 text-gray-500 text-xs px-2.5 py-1 rounded-full font-medium">
                            Desconectado
                        </div>
                    </div>

                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1.5">ID Inmobiliaria (Portal)</label>
                            <input
                                type="text"
                                placeholder="Ej: 123456"
                                className="w-full p-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 outline-none transition-all"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1.5">Usuario</label>
                            <input
                                type="text"
                                placeholder="Usuario de Argenprop"
                                className="w-full p-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 outline-none transition-all"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1.5">Contraseña</label>
                            <input
                                type="password"
                                placeholder="••••••••"
                                className="w-full p-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 outline-none transition-all"
                            />
                        </div>

                        <div className="pt-4">
                            <button className="w-full bg-orange-600 text-white font-medium py-2.5 rounded-lg hover:bg-orange-700 transition shadow-sm hover:shadow active:scale-[0.99] transform duration-100">
                                Vincular Cuenta
                            </button>
                        </div>

                        <div className="flex items-start gap-2 mt-4 p-3 bg-blue-50/50 rounded-lg">
                            <Info className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
                            <p className="text-xs text-blue-700 leading-relaxed">
                                Al vincular tu cuenta, las propiedades marcadas como "Publicar" se enviarán automáticamente al feed XML compatible con Argenprop.
                            </p>
                        </div>
                    </div>
                </div>

                {/* Zonaprop - Active Integration Logic */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                    <div className="flex items-start justify-between mb-6">
                        <div className="flex items-center gap-4">
                            <div className="w-14 h-14 bg-indigo-50 rounded-xl flex items-center justify-center border border-indigo-100">
                                <span className="text-indigo-600 font-bold text-2xl">Z</span>
                            </div>
                            <div>
                                <h2 className="text-lg font-bold text-gray-900">Zonaprop</h2>
                                <p className="text-sm text-gray-500">Publicación automática y sincronización.</p>
                            </div>
                        </div>
                        <div className="bg-gray-100 text-gray-500 text-xs px-2.5 py-1 rounded-full font-medium">
                            Desconectado
                        </div>
                    </div>

                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1.5">Email / Usuario</label>
                            <input
                                type="text"
                                placeholder="tu@email.com"
                                className="w-full p-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1.5">Contraseña</label>
                            <input
                                type="password"
                                placeholder="••••••••"
                                className="w-full p-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all"
                            />
                        </div>

                        <div className="pt-4">
                            <button className="w-full bg-indigo-600 text-white font-medium py-2.5 rounded-lg hover:bg-indigo-700 transition shadow-sm hover:shadow active:scale-[0.99] transform duration-100">
                                Vincular Cuenta
                            </button>
                        </div>

                        <div className="flex items-start gap-2 mt-4 p-3 bg-blue-50/50 rounded-lg">
                            <Info className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
                            <p className="text-xs text-blue-700 leading-relaxed">
                                Al vincular tu cuenta, las propiedades marcadas como "Publicar" se enviarán automáticamente al feed XML compatible con Zonaprop.
                            </p>
                        </div>
                    </div>
                </div>
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
                        onClick={() => window.open('/api/feeds/TU_ID_AQUI', '_blank')}
                        className="px-6 py-3 bg-white text-slate-900 font-bold rounded-lg hover:bg-slate-100 transition shadow-lg whitespace-nowrap"
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
