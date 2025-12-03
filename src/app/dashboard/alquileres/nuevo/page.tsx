"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { app, auth } from "@/infrastructure/firebase/client";
import { alquileresService } from "@/infrastructure/services/alquileresService";
import { inquilinosService } from "@/infrastructure/services/inquilinosService";
import PropertySelector from "../components/PropertySelector";
import TenantForm, { TenantFormData } from "../components/TenantForm";
import { ChevronLeft, ChevronRight, Check } from "lucide-react";
import { Alquiler } from "@/domain/models/Alquiler";

export default function NuevoAlquilerPage() {
    const router = useRouter();
    const [currentStep, setCurrentStep] = useState(1);
    const [loading, setLoading] = useState(false);

    // Step 1: Property
    const [selectedProperty, setSelectedProperty] = useState({
        id: "",
        direccion: "",
        tipo: "",
    });

    // Step 2: Tenant
    const [tenantData, setTenantData] = useState<TenantFormData | null>(null);
    const [inquilinoId, setInquilinoId] = useState("");

    // Step 3: Contract details
    const [contractData, setContractData] = useState({
        fechaInicio: "",
        fechaFin: "",
        montoMensual: "",
        diaVencimiento: "10",
        ajusteTipo: "porcentaje" as 'porcentaje' | 'ICL' | 'manual',
        ajusteValor: "0",
    });

    const handlePropertySelect = (id: string, direccion: string, tipo: string) => {
        setSelectedProperty({ id, direccion, tipo });
    };

    const handleTenantSubmit = async (data: TenantFormData) => {
        if (!auth.currentUser) return;

        try {
            setLoading(true);
            const id = await inquilinosService.createInquilino({
                nombre: data.nombre,
                email: data.email,
                telefono: data.telefono,
                dni: data.dni,
                domicilio: data.domicilio,
                datosGarante: data.datosGarante || {
                    nombre: "",
                    telefono: "",
                    email: "",
                    dni: "",
                },
                documentos: [],
                userId: auth.currentUser.uid,
            });
            setInquilinoId(id);
            setTenantData(data);
            setCurrentStep(3);
        } catch (error) {
            console.error("Error creating tenant:", error);
            alert("Error al crear el inquilino");
        } finally {
            setLoading(false);
        }
    };

    const handleContractChange = (field: string, value: string) => {
        setContractData(prev => ({ ...prev, [field]: value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!auth.currentUser || !tenantData) return;

        try {
            setLoading(true);

            const alquiler: Omit<Alquiler, "id" | "createdAt" | "updatedAt"> = {
                propiedadId: selectedProperty.id,
                propiedadTipo: selectedProperty.tipo,
                direccion: selectedProperty.direccion,
                inquilinoId,
                nombreInquilino: tenantData.nombre,
                contactoInquilino: tenantData.email,
                tipoGarantia: tenantData.tipoGarantia,
                garante: tenantData.tipoGarantia === 'garante' ? tenantData.datosGarante : undefined,
                seguroCaucion: tenantData.tipoGarantia === 'seguro_caucion' ? tenantData.seguroCaucion : undefined,
                fechaInicio: new Date(contractData.fechaInicio),
                fechaFin: new Date(contractData.fechaFin),
                montoMensual: parseFloat(contractData.montoMensual),
                diaVencimiento: parseInt(contractData.diaVencimiento),
                ajusteTipo: contractData.ajusteTipo,
                ajusteValor: parseFloat(contractData.ajusteValor),
                historialPagos: [],
                incidencias: [],
                estado: 'activo',
                documentos: [],
                userId: auth.currentUser.uid,
            };

            const id = await alquileresService.createAlquiler(alquiler);
            router.push(`/dashboard/alquileres/${id}`);
        } catch (error) {
            console.error("Error creating contract:", error);
            alert("Error al crear el contrato");
        } finally {
            setLoading(false);
        }
    };

    const canProceed = () => {
        if (currentStep === 1) return selectedProperty.id !== "";
        if (currentStep === 2) return tenantData !== null;
        return true;
    };

    return (
        <div className="p-6 max-w-4xl mx-auto">
            {/* Header */}
            <div className="mb-6">
                <h1 className="text-2xl font-bold text-gray-900">Nuevo Contrato de Alquiler</h1>
                <p className="text-gray-500">Complete los pasos para crear un nuevo contrato</p>
            </div>

            {/* Step Indicator */}
            <div className="mb-8">
                <div className="flex items-center justify-between">
                    {[
                        { num: 1, label: "Propiedad" },
                        { num: 2, label: "Inquilino" },
                        { num: 3, label: "Contrato" },
                    ].map((step, idx) => (
                        <div key={step.num} className="flex items-center flex-1">
                            <div className="flex flex-col items-center flex-1">
                                <div
                                    className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold ${currentStep >= step.num
                                        ? "bg-indigo-600 text-white"
                                        : "bg-gray-200 text-gray-500"
                                        }`}
                                >
                                    {currentStep > step.num ? <Check className="w-5 h-5" /> : step.num}
                                </div>
                                <div className="text-sm mt-2 font-medium text-gray-700">{step.label}</div>
                            </div>
                            {idx < 2 && (
                                <div
                                    className={`h-1 flex-1 mx-4 ${currentStep > step.num ? "bg-indigo-600" : "bg-gray-200"
                                        }`}
                                />
                            )}
                        </div>
                    ))}
                </div>
            </div>

            {/* Step Content */}
            <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
                {currentStep === 1 && (
                    <div>
                        <h2 className="text-lg font-semibold text-gray-900 mb-4">Seleccionar Propiedad</h2>
                        <PropertySelector
                            onSelect={handlePropertySelect}
                            selectedId={selectedProperty.id}
                        />
                    </div>
                )}

                {currentStep === 2 && (
                    <div>
                        <h2 className="text-lg font-semibold text-gray-900 mb-4">Datos del Inquilino</h2>
                        <TenantForm
                            onSubmit={handleTenantSubmit}
                            onCancel={() => setCurrentStep(1)}
                        />
                    </div>
                )}

                {currentStep === 3 && (
                    <form onSubmit={handleSubmit}>
                        <h2 className="text-lg font-semibold text-gray-900 mb-4">Datos del Contrato</h2>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Fecha de Inicio *
                                </label>
                                <input
                                    type="date"
                                    required
                                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                                    value={contractData.fechaInicio}
                                    onChange={(e) => handleContractChange("fechaInicio", e.target.value)}
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Fecha de Fin *
                                </label>
                                <input
                                    type="date"
                                    required
                                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                                    value={contractData.fechaFin}
                                    onChange={(e) => handleContractChange("fechaFin", e.target.value)}
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Monto Mensual *
                                </label>
                                <input
                                    type="number"
                                    required
                                    min="0"
                                    step="0.01"
                                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                                    value={contractData.montoMensual}
                                    onChange={(e) => handleContractChange("montoMensual", e.target.value)}
                                    placeholder="0.00"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Día de Vencimiento *
                                </label>
                                <input
                                    type="number"
                                    required
                                    min="1"
                                    max="31"
                                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                                    value={contractData.diaVencimiento}
                                    onChange={(e) => handleContractChange("diaVencimiento", e.target.value)}
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Tipo de Ajuste *
                                </label>
                                <select
                                    required
                                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                                    value={contractData.ajusteTipo}
                                    onChange={(e) => handleContractChange("ajusteTipo", e.target.value)}
                                >
                                    <option value="porcentaje">Porcentaje</option>
                                    <option value="ICL">ICL</option>
                                    <option value="manual">Manual</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Valor de Ajuste {contractData.ajusteTipo === 'porcentaje' ? '(%)' : ''}
                                </label>
                                <input
                                    type="number"
                                    step="0.01"
                                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                                    value={contractData.ajusteValor}
                                    onChange={(e) => handleContractChange("ajusteValor", e.target.value)}
                                    placeholder="0"
                                />
                            </div>
                        </div>

                        <div className="mt-6 flex justify-end gap-3">
                            <button
                                type="button"
                                onClick={() => setCurrentStep(2)}
                                className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                            >
                                Anterior
                            </button>
                            <button
                                type="submit"
                                disabled={loading}
                                className="px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50"
                            >
                                {loading ? "Creando..." : "Crear Contrato"}
                            </button>
                        </div>
                    </form>
                )}
            </div>

            {/* Navigation Buttons (for steps 1 and 2) */}
            {currentStep < 3 && (
                <div className="flex justify-between">
                    <button
                        onClick={() => setCurrentStep(prev => Math.max(1, prev - 1))}
                        disabled={currentStep === 1}
                        className="flex items-center gap-2 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <ChevronLeft className="w-5 h-5" />
                        Anterior
                    </button>

                    {currentStep === 1 && (
                        <button
                            onClick={() => setCurrentStep(2)}
                            disabled={!canProceed()}
                            className="flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            Siguiente
                            <ChevronRight className="w-5 h-5" />
                        </button>
                    )}
                </div>
            )}
        </div>
    );
}
