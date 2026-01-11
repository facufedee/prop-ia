"use client";

import { useState, useEffect } from "react";
import { app, auth } from "@/infrastructure/firebase/client";
import { agentesService } from "@/infrastructure/services/agentesService";
import { ConfiguracionComisiones } from "@/domain/models/Agente";
import { Save, DollarSign, TrendingUp, Award } from "lucide-react";

export default function ComisionesConfigPage() {
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    const [formData, setFormData] = useState({
        comisionVentaDefault: "3",
        comisionAlquilerDefault: "50",
        comisionPropiedadPropiaDefault: "2",
    });

    useEffect(() => {
        fetchConfig();
    }, []);

    const fetchConfig = async () => {
        if (!auth?.currentUser) return;

        try {
            const data = await agentesService.getConfiguracion(auth.currentUser.uid);
            if (data) {
                setFormData({
                    comisionVentaDefault: data.comisionVentaDefault.toString(),
                    comisionAlquilerDefault: data.comisionAlquilerDefault.toString(),
                    comisionPropiedadPropiaDefault: data.comisionPropiedadPropiaDefault.toString(),
                });
            }
        } catch (error) {
            console.error("Error fetching config:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (field: string, value: string) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!auth?.currentUser) return;

        try {
            setSaving(true);

            const config: Omit<ConfiguracionComisiones, "id" | "userId" | "updatedAt"> = {
                comisionVentaDefault: parseFloat(formData.comisionVentaDefault),
                comisionAlquilerDefault: parseFloat(formData.comisionAlquilerDefault),
                comisionPropiedadPropiaDefault: parseFloat(formData.comisionPropiedadPropiaDefault),
                bonificaciones: [],
            };

            await agentesService.createOrUpdateConfiguracion(auth.currentUser.uid, config);
            alert("Configuración guardada exitosamente");
        } catch (error) {
            console.error("Error saving config:", error);
            alert("Error al guardar la configuración");
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="p-6 flex items-center justify-center min-h-[400px]">
                <div className="text-gray-500">Cargando configuración...</div>
            </div>
        );
    }

    return (
        <div className="p-6 max-w-4xl mx-auto space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-bold text-gray-900">Configuración de Comisiones</h1>
                <p className="text-gray-500">Configura los porcentajes de comisión por defecto para nuevos agentes</p>
            </div>

            {/* Info Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-6 border border-blue-200">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 bg-blue-600 rounded-lg">
                            <DollarSign className="w-5 h-5 text-white" />
                        </div>
                        <h3 className="font-semibold text-blue-900">Ventas</h3>
                    </div>
                    <p className="text-sm text-blue-700">Comisión por venta de propiedades de la inmobiliaria</p>
                </div>

                <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-6 border border-green-200">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 bg-green-600 rounded-lg">
                            <TrendingUp className="w-5 h-5 text-white" />
                        </div>
                        <h3 className="font-semibold text-green-900">Alquileres</h3>
                    </div>
                    <p className="text-sm text-green-700">Comisión por cierre de contratos de alquiler</p>
                </div>

                <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-6 border border-purple-200">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 bg-purple-600 rounded-lg">
                            <Award className="w-5 h-5 text-white" />
                        </div>
                        <h3 className="font-semibold text-purple-900">Prop. Propia</h3>
                    </div>
                    <p className="text-sm text-purple-700">Comisión extra si el agente trajo la propiedad</p>
                </div>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-gray-200 p-6 space-y-6">
                <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Comisiones por Defecto</h3>
                    <p className="text-sm text-gray-600 mb-6">
                        Estos valores se aplicarán automáticamente al crear nuevos agentes. Puedes personalizarlos individualmente después.
                    </p>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Comisión Venta (%)
                            </label>
                            <div className="relative">
                                <input
                                    type="number"
                                    required
                                    min="0"
                                    max="100"
                                    step="0.1"
                                    className="w-full p-3 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                                    value={formData.comisionVentaDefault}
                                    onChange={(e) => handleChange("comisionVentaDefault", e.target.value)}
                                />
                                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500">%</span>
                            </div>
                            <p className="text-xs text-gray-500 mt-1">Típicamente 2-5%</p>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Comisión Alquiler (%)
                            </label>
                            <div className="relative">
                                <input
                                    type="number"
                                    required
                                    min="0"
                                    max="100"
                                    step="0.1"
                                    className="w-full p-3 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                                    value={formData.comisionAlquilerDefault}
                                    onChange={(e) => handleChange("comisionAlquilerDefault", e.target.value)}
                                />
                                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500">%</span>
                            </div>
                            <p className="text-xs text-gray-500 mt-1">% del primer mes (típicamente 50%)</p>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Comisión Propiedad Propia (%)
                            </label>
                            <div className="relative">
                                <input
                                    type="number"
                                    required
                                    min="0"
                                    max="100"
                                    step="0.1"
                                    className="w-full p-3 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                                    value={formData.comisionPropiedadPropiaDefault}
                                    onChange={(e) => handleChange("comisionPropiedadPropiaDefault", e.target.value)}
                                />
                                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500">%</span>
                            </div>
                            <p className="text-xs text-gray-500 mt-1">Incentivo por traer propiedades</p>
                        </div>
                    </div>
                </div>

                {/* Ejemplos */}
                <div className="border-t border-gray-200 pt-6">
                    <h4 className="text-sm font-semibold text-gray-900 mb-4">Ejemplos de Cálculo</h4>

                    <div className="space-y-4">
                        {/* Ejemplo 1 */}
                        <div className="p-4 bg-gray-50 rounded-lg">
                            <p className="text-sm font-medium text-gray-900 mb-2">Venta de $100,000 (Propiedad de la Inmobiliaria)</p>
                            <div className="text-sm text-gray-700 space-y-1">
                                <p>• Comisión = $100,000 × {formData.comisionVentaDefault}%</p>
                                <p className="font-semibold text-indigo-600">
                                    = ${(100000 * parseFloat(formData.comisionVentaDefault) / 100).toLocaleString()}
                                </p>
                            </div>
                        </div>

                        {/* Ejemplo 2 */}
                        <div className="p-4 bg-gray-50 rounded-lg">
                            <p className="text-sm font-medium text-gray-900 mb-2">Venta de $100,000 (Propiedad del Agente)</p>
                            <div className="text-sm text-gray-700 space-y-1">
                                <p>• Comisión Base = $100,000 × {formData.comisionVentaDefault}% = ${(100000 * parseFloat(formData.comisionVentaDefault) / 100).toLocaleString()}</p>
                                <p>• Comisión Extra = $100,000 × {formData.comisionPropiedadPropiaDefault}% = ${(100000 * parseFloat(formData.comisionPropiedadPropiaDefault) / 100).toLocaleString()}</p>
                                <p className="font-semibold text-indigo-600">
                                    Total = ${(100000 * (parseFloat(formData.comisionVentaDefault) + parseFloat(formData.comisionPropiedadPropiaDefault)) / 100).toLocaleString()}
                                </p>
                            </div>
                        </div>

                        {/* Ejemplo 3 */}
                        <div className="p-4 bg-gray-50 rounded-lg">
                            <p className="text-sm font-medium text-gray-900 mb-2">Alquiler de $50,000/mes</p>
                            <div className="text-sm text-gray-700 space-y-1">
                                <p>• Comisión = $50,000 × {formData.comisionAlquilerDefault}%</p>
                                <p className="font-semibold text-indigo-600">
                                    = ${(50000 * parseFloat(formData.comisionAlquilerDefault) / 100).toLocaleString()}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Save Button */}
                <div className="flex justify-end pt-6 border-t border-gray-200">
                    <button
                        type="submit"
                        disabled={saving}
                        className="flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50"
                    >
                        <Save className="w-5 h-5" />
                        {saving ? "Guardando..." : "Guardar Configuración"}
                    </button>
                </div>
            </form>

            {/* Info */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h4 className="text-sm font-semibold text-blue-900 mb-2">💡 Nota Importante</h4>
                <ul className="text-sm text-blue-800 space-y-1 list-disc list-inside">
                    <li>Estos valores son solo por defecto para nuevos agentes</li>
                    <li>Puedes personalizar las comisiones de cada agente individualmente</li>
                    <li>Los cambios aquí NO afectan a agentes ya creados</li>
                    <li>Las comisiones se calculan automáticamente al registrar ventas/alquileres</li>
                </ul>
            </div>
        </div>
    );
}
