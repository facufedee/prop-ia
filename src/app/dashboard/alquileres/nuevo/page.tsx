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
import { auditLogService } from "@/infrastructure/services/auditLogService";
import { DNIInput, CUITInput, EmailInput, PhoneInput, TextInput, CBUInput, AliasInput, TextAreaInput } from "@/ui/components/forms";

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

    // Step 3: Owner and Bank data
    const [ownerData, setOwnerData] = useState({
        nombrePropietario: "",
        dniPropietario: "",
        cuitPropietario: "",
        domicilioPropietario: "",
        emailPropietario: "",
        telefonoPropietario: "",
        banco: "",
        cbu: "",
        alias: "",
    });

    // Step 4: Contract details and inventory
    const [contractData, setContractData] = useState({
        fechaInicio: "",
        fechaFin: "",
        montoMensual: "",
        diaVencimiento: "10",
        ajusteTipo: "porcentaje" as 'porcentaje' | 'ICL' | 'IPC' | 'manual',
        ajusteValor: "0",
        tasaPunitorios: "1", // Default 1%
        estadoInmueble: "",
    });

    const handlePropertySelect = (id: string, direccion: string, tipo: string, price?: number, currency?: string) => {
        setSelectedProperty({ id, direccion, tipo });
        if (price) {
            setContractData(prev => ({ ...prev, montoMensual: price.toString() }));
        }
    };

    const handleTenantSubmit = async (data: TenantFormData) => {
        if (!auth?.currentUser) return;

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
                userId: auth.currentUser?.uid || '',
            });
            setInquilinoId(id);
            setTenantData(data);

            // Log Tenant Creation
            auditLogService.createLog(
                auth.currentUser?.uid || '',
                auth.currentUser?.email || '',
                auth.currentUser?.displayName || 'Usuario',
                'client_create',
                'Inquilinos',
                `Se registró al inquilino ${data.nombre}`,
                "default-org-id",
                { tenantId: id, name: data.nombre }
            );

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
        if (!auth?.currentUser || !tenantData) return;

        try {
            setLoading(true);

            const alquiler: Omit<Alquiler, "id" | "createdAt" | "updatedAt"> = {
                propiedadId: selectedProperty.id,
                propiedadTipo: selectedProperty.tipo,
                direccion: selectedProperty.direccion,
                inquilinoId,
                nombreInquilino: tenantData.nombre,
                contactoInquilino: tenantData.email,
                telefonoInquilino: tenantData.telefono,
                whatsappInquilino: tenantData.whatsapp,
                dniInquilino: tenantData.dni,
                cuitInquilino: tenantData.cuit,
                domicilioInquilino: tenantData.domicilio,
                nombrePropietario: ownerData.nombrePropietario,
                dniPropietario: ownerData.dniPropietario,
                cuitPropietario: ownerData.cuitPropietario,
                domicilioPropietario: ownerData.domicilioPropietario,
                emailPropietario: ownerData.emailPropietario,
                telefonoPropietario: ownerData.telefonoPropietario,
                banco: ownerData.banco,
                cbu: ownerData.cbu,
                alias: ownerData.alias,
                tipoGarantia: tenantData.tipoGarantia,
                garante: tenantData.tipoGarantia === 'garante' ? tenantData.datosGarante : null,
                seguroCaucion: tenantData.tipoGarantia === 'seguro_caucion' ? tenantData.seguroCaucion : null,
                fechaInicio: new Date(contractData.fechaInicio),
                fechaFin: new Date(contractData.fechaFin),
                montoMensual: parseFloat(contractData.montoMensual),
                diaVencimiento: parseInt(contractData.diaVencimiento),
                tasaPunitorios: parseFloat(contractData.tasaPunitorios || "0"),
                ajusteTipo: contractData.ajusteTipo,
                ajusteValor: parseFloat(contractData.ajusteValor),
                estadoInmueble: contractData.estadoInmueble,
                historialPagos: [],
                incidencias: [],
                estado: 'activo',
                documentos: [],
                userId: auth.currentUser?.uid || '',
            };

            const id = await alquileresService.createAlquiler(alquiler);

            // Log Rental Creation
            await auditLogService.logRental(
                auth.currentUser?.uid || '',
                auth.currentUser?.email || '',
                auth.currentUser?.displayName || 'Usuario',
                'rental_create',
                id,
                alquiler.direccion,
                "default-org-id",
                { tenantName: alquiler.nombreInquilino, amount: alquiler.montoMensual }
            );

            router.push(`/dashboard/alquileres/${id}`);
        } catch (error) {
            console.error("Error creating contract:", error);
            alert("Error al crear el contrato");
        } finally {
            setLoading(false);
        }
    };

    const handleOwnerChange = (field: string, value: string) => {
        setOwnerData(prev => ({ ...prev, [field]: value }));
    };

    const canProceed = () => {
        if (currentStep === 1) return selectedProperty.id !== "";
        if (currentStep === 2) return tenantData !== null;
        if (currentStep === 3) return ownerData.nombrePropietario !== "";
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
                        { num: 3, label: "Propietario" },
                        { num: 4, label: "Contrato" },
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
                            {idx < 3 && (
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
                    <div>
                        <h2 className="text-lg font-semibold text-gray-900 mb-4">Datos del Propietario y Bancarios</h2>

                        <div className="space-y-6">
                            {/* Datos del Propietario */}
                            <div className="bg-gray-50 rounded-lg p-4">
                                <h3 className="text-md font-medium text-gray-900 mb-4">Información del Propietario</h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="md:col-span-2">
                                        <TextInput
                                            label="Nombre Completo del Propietario"
                                            value={ownerData.nombrePropietario}
                                            onChange={(value) => handleOwnerChange("nombrePropietario", value)}
                                            placeholder="Juan Pérez"
                                            maxLength={100}
                                            required
                                            showCharCount={false}
                                        />
                                    </div>

                                    <DNIInput
                                        label="DNI del Propietario"
                                        value={ownerData.dniPropietario}
                                        onChange={(value) => handleOwnerChange("dniPropietario", value)}
                                        required
                                    />

                                    <CUITInput
                                        label="CUIT/CUIL del Propietario"
                                        value={ownerData.cuitPropietario}
                                        onChange={(value) => handleOwnerChange("cuitPropietario", value)}
                                        required={false}
                                    />

                                    <EmailInput
                                        label="Email del Propietario"
                                        value={ownerData.emailPropietario}
                                        onChange={(value) => handleOwnerChange("emailPropietario", value)}
                                        required={false}
                                    />

                                    <PhoneInput
                                        label="Teléfono del Propietario"
                                        value={ownerData.telefonoPropietario}
                                        onChange={(value) => handleOwnerChange("telefonoPropietario", value)}
                                        required={false}
                                    />

                                    <div className="md:col-span-2">
                                        <TextInput
                                            label="Domicilio del Propietario"
                                            value={ownerData.domicilioPropietario}
                                            onChange={(value) => handleOwnerChange("domicilioPropietario", value)}
                                            placeholder="Av. Corrientes 1234, CABA"
                                            maxLength={200}
                                            required={false}
                                            showCharCount={false}
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Datos Bancarios */}
                            <div className="bg-gray-50 rounded-lg p-4">
                                <h3 className="text-md font-medium text-gray-900 mb-4">Datos Bancarios para Pagos</h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <TextInput
                                        label="Banco"
                                        value={ownerData.banco}
                                        onChange={(value) => handleOwnerChange("banco", value)}
                                        placeholder="Banco Galicia"
                                        maxLength={50}
                                        required={false}
                                        showCharCount={false}
                                    />

                                    <AliasInput
                                        value={ownerData.alias}
                                        onChange={(value) => handleOwnerChange("alias", value)}
                                        required={false}
                                    />

                                    <div className="md:col-span-2">
                                        <CBUInput
                                            value={ownerData.cbu}
                                            onChange={(value) => handleOwnerChange("cbu", value)}
                                            required={false}
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="mt-6 flex justify-between">
                            <button
                                type="button"
                                onClick={() => setCurrentStep(2)}
                                className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                            >
                                Anterior
                            </button>
                            <button
                                type="button"
                                onClick={() => setCurrentStep(4)}
                                disabled={!canProceed()}
                                className="px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50"
                            >
                                Siguiente
                            </button>
                        </div>
                    </div>
                )}

                {currentStep === 4 && (
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
                                    Monto Mensual * (Valor visual aprox: {contractData.montoMensual ? `$${new Intl.NumberFormat('es-AR').format(Number(contractData.montoMensual))}` : ''})
                                </label>
                                <div className="relative">
                                    <span className="absolute left-3 top-3 text-gray-500">$</span>
                                    <input
                                        type="number"
                                        required
                                        min="0"
                                        className="w-full p-3 pl-8 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                                        value={contractData.montoMensual}
                                        onChange={(e) => handleContractChange("montoMensual", e.target.value)}
                                        placeholder="0"
                                    />
                                </div>
                                <p className="text-xs text-gray-400 mt-1">Escribí solo números. Nosotros le ponemos los puntos visualmente.</p>
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
                                    Punitorios por Mora (%) *
                                </label>
                                <div className="flex gap-2 items-center">
                                    <input
                                        type="number"
                                        required
                                        min="0"
                                        step="0.1"
                                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                                        value={contractData.tasaPunitorios}
                                        onChange={(e) => handleContractChange("tasaPunitorios", e.target.value)}
                                        placeholder="1"
                                    />
                                    <span className="text-sm text-gray-500 whitespace-nowrap">diario sobre el monto</span>
                                </div>
                            </div>

                            <div className="hidden md:block"></div> {/* Spacer */}

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
                                    <option value="porcentaje">Porcentaje Fijo</option>
                                    <option value="ICL">ICL (Índice Contratos Locación)</option>
                                    <option value="IPC">IPC (Índice Precios Consumidor)</option>
                                    <option value="manual">Manual / Otro</option>
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
                                    disabled={contractData.ajusteTipo === 'ICL' || contractData.ajusteTipo === 'IPC'}
                                />
                                {(contractData.ajusteTipo === 'ICL' || contractData.ajusteTipo === 'IPC') && (
                                    <p className="text-xs text-gray-400 mt-1">El valor se calculará automáticamente según el índice.</p>
                                )}
                            </div>

                            <div className="md:col-span-2">
                                <TextAreaInput
                                    label="Estado del Inmueble / Inventario"
                                    value={contractData.estadoInmueble}
                                    onChange={(value) => handleContractChange("estadoInmueble", value)}
                                    placeholder="Descripción del estado del inmueble al inicio del contrato, inventario de muebles, electrodomésticos, etc."
                                    maxLength={2000}
                                    required={false}
                                    rows={6}
                                />
                            </div>
                        </div>

                        <div className="mt-6 flex justify-end gap-3">
                            <button
                                type="button"
                                onClick={() => setCurrentStep(3)}
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
