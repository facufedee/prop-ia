"use client";

import { useState } from "react";
import { DatosGarante } from "@/domain/models/Inquilino";
import { SeguroCaucion } from "@/domain/models/Alquiler";
import { DNIInput, CUITInput, EmailInput, PhoneInput, TextInput } from "@/ui/components/forms";

interface TenantFormProps {
    onSubmit: (data: TenantFormData) => void;
    onCancel?: () => void;
    initialData?: TenantFormData;
}

export interface TenantFormData {
    nombre: string;
    email: string;
    telefono: string;
    whatsapp?: string;
    dni: string;
    cuit?: string;
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
            whatsapp: "",
            dni: "",
            cuit: "",
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
                    <div className="md:col-span-2">
                        <TextInput
                            label="Nombre Completo"
                            value={formData.nombre}
                            onChange={(value) => handleChange("nombre", value)}
                            placeholder="Juan Pérez"
                            maxLength={100}
                            required
                            showCharCount={false}
                        />
                    </div>

                    <DNIInput
                        value={formData.dni}
                        onChange={(value) => handleChange("dni", value)}
                        required
                    />

                    <CUITInput
                        value={formData.cuit || ""}
                        onChange={(value) => handleChange("cuit", value)}
                        required={false}
                    />

                    <EmailInput
                        value={formData.email}
                        onChange={(value) => handleChange("email", value)}
                        required
                    />

                    <PhoneInput
                        label="Teléfono"
                        value={formData.telefono}
                        onChange={(value) => handleChange("telefono", value)}
                        required
                    />

                    <PhoneInput
                        label="WhatsApp"
                        value={formData.whatsapp || ""}
                        onChange={(value) => handleChange("whatsapp", value)}
                        required={false}
                    />

                    <div className="md:col-span-2">
                        <TextInput
                            label="Domicilio Actual"
                            value={formData.domicilio}
                            onChange={(value) => handleChange("domicilio", value)}
                            placeholder="Av. Corrientes 1234, CABA"
                            maxLength={200}
                            required
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
                            <div className="md:col-span-2">
                                <TextInput
                                    label="Nombre Completo"
                                    value={formData.datosGarante?.nombre || ""}
                                    onChange={(value) => handleGaranteChange("nombre", value)}
                                    placeholder="María González"
                                    maxLength={100}
                                    required
                                    showCharCount={false}
                                />
                            </div>

                            <DNIInput
                                label="DNI del Garante"
                                value={formData.datosGarante?.dni || ""}
                                onChange={(value) => handleGaranteChange("dni", value)}
                                required
                            />

                            <EmailInput
                                label="Email del Garante"
                                value={formData.datosGarante?.email || ""}
                                onChange={(value) => handleGaranteChange("email", value)}
                                required
                            />

                            <PhoneInput
                                label="Teléfono del Garante"
                                value={formData.datosGarante?.telefono || ""}
                                onChange={(value) => handleGaranteChange("telefono", value)}
                                required
                            />

                            <div className="md:col-span-2">
                                <TextInput
                                    label="Domicilio del Garante"
                                    value={formData.datosGarante?.domicilio || ""}
                                    onChange={(value) => handleGaranteChange("domicilio", value)}
                                    placeholder="Av. Santa Fe 5678, CABA"
                                    maxLength={200}
                                    required={false}
                                    showCharCount={false}
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
                                    maxLength={100}
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
                                    maxLength={50}
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
                                    maxLength={100}
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
                                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 resize-none"
                                    placeholder="Notas adicionales sobre el seguro..."
                                    value={formData.seguroCaucion?.observaciones || ""}
                                    onChange={(e) => handleSeguroChange("observaciones", e.target.value)}
                                    maxLength={500}
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
