"use client";

import { useState } from "react";
import { DatosGarante } from "@/domain/models/Inquilino";
import { SeguroCaucion } from "@/domain/models/Alquiler";

interface TenantFormProps {
    onSubmit: (data: TenantFormData) => void;
    onCancel?: () => void;
    initialData?: TenantFormData;
}

export interface TenantFormData {
    nombre: string;
    email: string;
    telefono: string;
    dni: string;
    domicilio: string;
    tipoGarantia: 'garante' | 'seguro_caucion';
    datosGarante?: DatosGarante;
    seguroCaucion?: SeguroCaucion;
}

export default function TenantForm({ onSubmit, onCancel, initialData }: TenantFormProps) {
    const [formData, setFormData] = useState<TenantFormData>(
        initialData || {
            nombre: "",
            email: "",
            telefono: "",
            dni: "",
            domicilio: "",
            tipoGarantia: 'garante',
            datosGarante: {
                nombre: "",
                telefono: "",
                email: "",
                dni: "",
                domicilio: "",
            },
        }
    );

    const handleChange = (field: string, value: string) => {
        setFormData((prev) => ({ ...prev, [field]: value }));
    };

    const handleGaranteChange = (field: string, value: string) => {
        setFormData((prev) => ({
            ...prev,
            datosGarante: { ...prev.datosGarante!, [field]: value },
        }));
    };

    const handleSeguroChange = (field: string, value: string | number | Date) => {
        setFormData((prev) => ({
            ...prev,
            seguroCaucion: { ...prev.seguroCaucion!, [field]: value },
        }));
    };

    const handleTipoGarantiaChange = (tipo: 'garante' | 'seguro_caucion') => {
        setFormData((prev) => ({
            ...prev,
            tipoGarantia: tipo,
            // Initialize the selected option if not present
            datosGarante: tipo === 'garante' && !prev.datosGarante ? {
                nombre: "",
                telefono: "",
                email: "",
                dni: "",
                domicilio: "",
            } : prev.datosGarante,
            seguroCaucion: tipo === 'seguro_caucion' && !prev.seguroCaucion ? {
                compania: "",
                numeroPoliza: "",
                montoAsegurado: 0,
                fechaEmision: new Date(),
                fechaVencimiento: new Date(),
                contactoCompania: "",
                observaciones: "",
            } : prev.seguroCaucion,
        }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSubmit(formData);
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            <div className="bg-white rounded-xl border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Datos del Inquilino</h3>

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
                            DNI *
                        </label>
                        <input
                            type="text"
                            required
                            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                            value={formData.dni}
                            onChange={(e) => handleChange("dni", e.target.value)}
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

                    <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Domicilio *
                        </label>
                        <input
                            type="text"
                            required
                            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                            value={formData.domicilio}
                            onChange={(e) => handleChange("domicilio", e.target.value)}
                        />
                    </div>
                </div>
            </div>

            {/* Tipo de Garantía */}
            <div className="bg-white rounded-xl border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Tipo de Garantía</h3>

                <div className="flex gap-4 mb-6">
                    <button
                        type="button"
                        onClick={() => handleTipoGarantiaChange('garante')}
                        className={`flex-1 py-3 px-4 rounded-lg border-2 transition-all ${formData.tipoGarantia === 'garante'
                                ? 'border-indigo-600 bg-indigo-50 text-indigo-700 font-medium'
                                : 'border-gray-200 hover:border-gray-300'
                            }`}
                    >
                        👤 Garante
                    </button>
                    <button
                        type="button"
                        onClick={() => handleTipoGarantiaChange('seguro_caucion')}
                        className={`flex-1 py-3 px-4 rounded-lg border-2 transition-all ${formData.tipoGarantia === 'seguro_caucion'
                                ? 'border-indigo-600 bg-indigo-50 text-indigo-700 font-medium'
                                : 'border-gray-200 hover:border-gray-300'
                            }`}
                    >
                        🛡️ Seguro de Caución
                    </button>
                </div>

                {/* Garante Form */}
                {formData.tipoGarantia === 'garante' && (
                    <div className="space-y-4">
                        <h4 className="text-md font-medium text-gray-700">Datos del Garante</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Nombre Completo *
                                </label>
                                <input
                                    type="text"
                                    required
                                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                                    value={formData.datosGarante?.nombre || ""}
                                    onChange={(e) => handleGaranteChange("nombre", e.target.value)}
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    DNI *
                                </label>
                                <input
                                    type="text"
                                    required
                                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                                    value={formData.datosGarante?.dni || ""}
                                    onChange={(e) => handleGaranteChange("dni", e.target.value)}
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
                                    value={formData.datosGarante?.email || ""}
                                    onChange={(e) => handleGaranteChange("email", e.target.value)}
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
                                    value={formData.datosGarante?.telefono || ""}
                                    onChange={(e) => handleGaranteChange("telefono", e.target.value)}
                                />
                            </div>

                            <div className="md:col-span-2">
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Domicilio
                                </label>
                                <input
                                    type="text"
                                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                                    value={formData.datosGarante?.domicilio || ""}
                                    onChange={(e) => handleGaranteChange("domicilio", e.target.value)}
                                />
                            </div>
                        </div>
                    </div>
                )}

                {/* Seguro de Caución Form */}
                {formData.tipoGarantia === 'seguro_caucion' && (
                    <div className="space-y-4">
                        <h4 className="text-md font-medium text-gray-700">Datos del Seguro de Caución</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Compañía Aseguradora *
                                </label>
                                <input
                                    type="text"
                                    required
                                    placeholder="Ej: Fianzas y Crédito, Berkley, etc."
                                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                                    value={formData.seguroCaucion?.compania || ""}
                                    onChange={(e) => handleSeguroChange("compania", e.target.value)}
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Número de Póliza *
                                </label>
                                <input
                                    type="text"
                                    required
                                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                                    value={formData.seguroCaucion?.numeroPoliza || ""}
                                    onChange={(e) => handleSeguroChange("numeroPoliza", e.target.value)}
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Monto Asegurado *
                                </label>
                                <input
                                    type="number"
                                    required
                                    min="0"
                                    step="0.01"
                                    placeholder="0.00"
                                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                                    value={formData.seguroCaucion?.montoAsegurado || ""}
                                    onChange={(e) => handleSeguroChange("montoAsegurado", parseFloat(e.target.value))}
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Contacto Compañía *
                                </label>
                                <input
                                    type="text"
                                    required
                                    placeholder="Email o teléfono"
                                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                                    value={formData.seguroCaucion?.contactoCompania || ""}
                                    onChange={(e) => handleSeguroChange("contactoCompania", e.target.value)}
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Fecha de Emisión *
                                </label>
                                <input
                                    type="date"
                                    required
                                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                                    value={formData.seguroCaucion?.fechaEmision ? new Date(formData.seguroCaucion.fechaEmision).toISOString().split('T')[0] : ""}
                                    onChange={(e) => handleSeguroChange("fechaEmision", new Date(e.target.value))}
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Fecha de Vencimiento *
                                </label>
                                <input
                                    type="date"
                                    required
                                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                                    value={formData.seguroCaucion?.fechaVencimiento ? new Date(formData.seguroCaucion.fechaVencimiento).toISOString().split('T')[0] : ""}
                                    onChange={(e) => handleSeguroChange("fechaVencimiento", new Date(e.target.value))}
                                />
                            </div>

                            <div className="md:col-span-2">
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Observaciones
                                </label>
                                <textarea
                                    rows={3}
                                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                                    placeholder="Notas adicionales sobre el seguro..."
                                    value={formData.seguroCaucion?.observaciones || ""}
                                    onChange={(e) => handleSeguroChange("observaciones", e.target.value)}
                                />
                            </div>
                        </div>
                    </div>
                )}
            </div>

            <div className="flex justify-end gap-3">
                {onCancel && (
                    <button
                        type="button"
                        onClick={onCancel}
                        className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                        Cancelar
                    </button>
                )}
                <button
                    type="submit"
                    className="px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                >
                    Guardar Inquilino
                </button>
            </div>
        </form>
    );
}
