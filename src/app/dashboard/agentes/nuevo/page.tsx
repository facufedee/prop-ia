"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { app, auth } from "@/infrastructure/firebase/client";
import { agentesService } from "@/infrastructure/services/agentesService";
import { Agente } from "@/domain/models/Agente";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function NuevoAgentePage() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [config, setConfig] = useState<any>(null);

    const [formData, setFormData] = useState({
        nombre: "",
        email: "",
        telefono: "",
        comisionVenta: "",
        comisionAlquiler: "",
        comisionPropiedadPropia: "",
        activo: true,
    });

    useEffect(() => {
        fetchConfig();
    }, []);

    const fetchConfig = async () => {
        if (!auth.currentUser) return;

        try {
            const data = await agentesService.getConfiguracion(auth.currentUser.uid);
            if (data) {
                setConfig(data);
                setFormData(prev => ({
                    ...prev,
                    comisionVenta: data.comisionVentaDefault.toString(),
                    comisionAlquiler: data.comisionAlquilerDefault.toString(),
                    comisionPropiedadPropia: data.comisionPropiedadPropiaDefault.toString(),
                }));
            } else {
                // Defaults
                setFormData(prev => ({
                    ...prev,
                    comisionVenta: "3",
                    comisionAlquiler: "50",
                    comisionPropiedadPropia: "2",
                }));
            }
        } catch (error) {
            console.error("Error fetching config:", error);
        }
    };

    const handleChange = (field: string, value: string | boolean) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!auth.currentUser) return;

        try {
            setLoading(true);

            const agente: Omit<Agente, "id" | "createdAt" | "updatedAt"> = {
                nombre: formData.nombre,
                email: formData.email,
                telefono: formData.telefono,
                comisionVenta: parseFloat(formData.comisionVenta),
                comisionAlquiler: parseFloat(formData.comisionAlquiler),
                comisionPropiedadPropia: parseFloat(formData.comisionPropiedadPropia),
                totalVentas: 0,
                totalAlquileres: 0,
                totalVisitas: 0,
                totalComisiones: 0,
                propiedadesPropias: [],
                propiedadesAsignadas: [],
                activo: formData.activo,
                fechaIngreso: new Date(),
                userId: auth.currentUser.uid,
            };

            await agentesService.createAgente(agente);
            router.push("/dashboard/agentes");
        } catch (error) {
            console.error("Error creating agente:", error);
            alert("Error al crear el agente");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="p-6 max-w-4xl mx-auto">
            <div className="mb-6">
                <Link
                    href="/dashboard/agentes"
                    className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4"
                >
                    <ArrowLeft className="w-5 h-5" />
                    Volver a agentes
                </Link>
                <h1 className="text-2xl font-bold text-gray-900">Nuevo Agente</h1>
                <p className="text-gray-500">Agregar un nuevo agente al equipo</p>
            </div>

            <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-gray-200 p-6 space-y-6">
                {/* Datos Personales */}
                <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Datos Personales</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Nombre Completo *
                            </label>
                            <input
                                type="text"
                                required
                                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                                value={formData.nombre}
                                onChange={(e) => handleChange("nombre", e.target.value)}
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Email *
                            </label>
                            <input
                                type="email"
                                required
                                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                                value={formData.email}
                                onChange={(e) => handleChange("email", e.target.value)}
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Teléfono *
                            </label>
                            <input
                                type="tel"
                                required
                                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                                value={formData.telefono}
                                onChange={(e) => handleChange("telefono", e.target.value)}
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Estado
                            </label>
                            <select
                                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                                value={formData.activo ? "true" : "false"}
                                onChange={(e) => handleChange("activo", e.target.value === "true")}
                            >
                                <option value="true">Activo</option>
                                <option value="false">Inactivo</option>
                            </select>
                        </div>
                    </div>
                </div>

                {/* Comisiones */}
                <div className="border-t border-gray-200 pt-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Configuración de Comisiones</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Comisión Venta (%) *
                            </label>
                            <input
                                type="number"
                                required
                                min="0"
                                max="100"
                                step="0.1"
                                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                                value={formData.comisionVenta}
                                onChange={(e) => handleChange("comisionVenta", e.target.value)}
                            />
                            <p className="text-xs text-gray-500 mt-1">Ej: 3% = 3</p>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Comisión Alquiler (%) *
                            </label>
                            <input
                                type="number"
                                required
                                min="0"
                                max="100"
                                step="0.1"
                                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                                value={formData.comisionAlquiler}
                                onChange={(e) => handleChange("comisionAlquiler", e.target.value)}
                            />
                            <p className="text-xs text-gray-500 mt-1">Ej: 50% del primer mes</p>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Comisión Propiedad Propia (%) *
                            </label>
                            <input
                                type="number"
                                required
                                min="0"
                                max="100"
                                step="0.1"
                                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                                value={formData.comisionPropiedadPropia}
                                onChange={(e) => handleChange("comisionPropiedadPropia", e.target.value)}
                            />
                            <p className="text-xs text-gray-500 mt-1">Extra si trae la propiedad</p>
                        </div>
                    </div>

                    <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                        <h4 className="text-sm font-semibold text-blue-900 mb-2">Ejemplo de Cálculo</h4>
                        <div className="text-sm text-blue-800 space-y-1">
                            <p>• Venta de $100,000 (propiedad de la inmobiliaria):</p>
                            <p className="ml-4">Comisión = $100,000 × {formData.comisionVenta || 0}% = ${(100000 * parseFloat(formData.comisionVenta || "0") / 100).toLocaleString()}</p>

                            <p className="mt-2">• Venta de $100,000 (propiedad del agente):</p>
                            <p className="ml-4">Comisión Base = ${(100000 * parseFloat(formData.comisionVenta || "0") / 100).toLocaleString()}</p>
                            <p className="ml-4">Comisión Extra = ${(100000 * parseFloat(formData.comisionPropiedadPropia || "0") / 100).toLocaleString()}</p>
                            <p className="ml-4 font-semibold">Total = ${(100000 * (parseFloat(formData.comisionVenta || "0") + parseFloat(formData.comisionPropiedadPropia || "0")) / 100).toLocaleString()}</p>
                        </div>
                    </div>
                </div>

                {/* Buttons */}
                <div className="flex justify-end gap-3 pt-6 border-t border-gray-200">
                    <Link
                        href="/dashboard/agentes"
                        className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                        Cancelar
                    </Link>
                    <button
                        type="submit"
                        disabled={loading}
                        className="px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50"
                    >
                        {loading ? "Creando..." : "Crear Agente"}
                    </button>
                </div>
            </form>
        </div>
    );
}
