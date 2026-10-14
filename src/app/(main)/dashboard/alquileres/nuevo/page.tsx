"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { app, auth, db } from "@/infrastructure/firebase/client";
import { doc, getDoc } from "firebase/firestore";
import { alquileresService } from "@/infrastructure/services/alquileresService";
import { inquilinosService } from "@/infrastructure/services/inquilinosService";
import PropertySelector from "../components/PropertySelector";
import ClientSelector from "@/ui/components/forms/ClientSelector";
import { ChevronLeft, ChevronRight, Check, Lightbulb } from "lucide-react";
import { Alquiler } from "@/domain/models/Alquiler";
import { auditLogService } from "@/infrastructure/services/auditLogService";
import { TextInput, MoneyInput, TextAreaInput } from "@/ui/components/forms";

export default function NuevoAlquilerPage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [currentStep, setCurrentStep] = useState(1);
    const [loading, setLoading] = useState(false);

    // Step 1: Property
    const [selectedProperty, setSelectedProperty] = useState({
        id: "",
        direccion: "",
        tipo: "",
    });

    // Step 2: Tenant (Now object)
    const [selectedInquilino, setSelectedInquilino] = useState<any | null>(null);

    // Step 3: Owner (Now object)
    const [selectedPropietario, setSelectedPropietario] = useState<any | null>(null);

    // Step 4: Contract details and inventory
    const [contractData, setContractData] = useState({
        fechaInicio: "",
        fechaFin: "",
        montoMensual: "",
        monedaAlquiler: "ARS" as 'ARS' | 'USD',
        diaVencimiento: "10",
        ajusteTipo: "porcentaje" as 'porcentaje' | 'ICL' | 'IPC' | 'casa_propia' | 'manual',
        ajusteValor: "0",
        ajusteFrecuencia: "3", // Default trimestral
        ajusteMesesPrimer: "", // Optional

        // punitorios
        punitoriosTipo: "porcentaje" as 'fijo' | 'porcentaje',
        punitoriosValor: "1",

        // nuevos
        nroPartidaInmobiliaria: "",
        valorDeposito: "",
        monedaDeposito: "ARS" as 'ARS' | 'USD',
        honorariosTipo: "fijo" as 'fijo' | 'porcentaje',
        honorariosValor: "",
        metodoPago: "",

        estadoInmueble: "",

        // garantia
        tipoGarantia: "garante" as 'garante' | 'seguro_caucion',

        // garantes
        garanteNombre: "",
        garanteDni: "",
        garanteEmail: "",
        garanteTelefono: "",

        // seguro
        seguroCompania: "",
        seguroPoliza: "",
    });

    // UI State for Custom Frequency mode
    const [isCustomFrequency, setIsCustomFrequency] = useState(false);

    const [servicios, setServicios] = useState<{ [key: string]: boolean }>({
        luz: false,
        gas: false,
        cochera: false,
        wifi: false,
        expensas: false,
        agua: false,
    });
    const [otroServicio, setOtroServicio] = useState("");

    // Check for createdPropertyId param
    useEffect(() => {
        const createdId = searchParams.get('createdPropertyId');
        if (createdId && createdId !== selectedProperty.id) {
            const fetchCreatedProperty = async () => {
                try {
                    if (!db) return;
                    const docRef = doc(db, "properties", createdId);
                    const docSnap = await getDoc(docRef);
                    if (docSnap.exists()) {
                        const data = docSnap.data();
                        const direccion = `${data.calle} ${data.altura}, ${data.localidad}`;
                        handlePropertySelect(createdId, direccion, data.property_type, data.price, data.currency);
                        setCurrentStep(2); // Auto advance to Tenant step

                        // Optional: Clean URL
                        router.replace('/dashboard/alquileres/nuevo', { scroll: false });
                    }
                } catch (err) {
                    console.error("Error fetching created property:", err);
                }
            };
            fetchCreatedProperty();
        }
    }, [searchParams, router]);


    const handlePropertySelect = (id: string, direccion: string, tipo: string, price?: number, currency?: string) => {
        setSelectedProperty({ id, direccion, tipo });
        if (price) {
            setContractData(prev => ({ ...prev, montoMensual: price.toString() }));
        }
    };

    const handleContractChange = (field: string, value: string) => {
        setContractData(prev => ({ ...prev, [field]: value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!auth?.currentUser || !selectedInquilino || !selectedPropietario) return;

        try {
            // Validations
            if (new Date(contractData.fechaFin) <= new Date(contractData.fechaInicio)) {
                alert("La fecha de fin debe ser posterior a la fecha de inicio");
                return;
            }

            if (parseFloat(contractData.montoMensual) <= 0) {
                alert("El monto mensual debe ser mayor a 0");
                return;
            }

            setLoading(true);

            // Use data from selected entities
            // Inquilino
            const inquilinoData = {
                id: selectedInquilino.id,
                nombre: selectedInquilino.nombre,
                email: selectedInquilino.email,
                telefono: selectedInquilino.telefono,
                dni: selectedInquilino.dni,
                cuit: selectedInquilino.cuit,
                domicilio: selectedInquilino.domicilio,
            };

            // Propietario
            const propietarioData = {
                id: selectedPropietario.id,
                nombre: selectedPropietario.nombre,
                email: selectedPropietario.email,
                telefono: selectedPropietario.telefono,
                dni: selectedPropietario.dni,
                cuit: selectedPropietario.cuit,
                domicilio: selectedPropietario.domicilio,
            };

            const alquiler: Omit<Alquiler, "id" | "createdAt" | "updatedAt"> = {
                propiedadId: selectedProperty.id,
                propiedadTipo: selectedProperty.tipo,
                direccion: selectedProperty.direccion,

                inquilinoId: inquilinoData.id,
                nombreInquilino: inquilinoData.nombre,
                contactoInquilino: inquilinoData.email,
                telefonoInquilino: inquilinoData.telefono,
                whatsappInquilino: selectedInquilino.whatsapp || inquilinoData.telefono,
                dniInquilino: inquilinoData.dni,
                cuitInquilino: inquilinoData.cuit,
                domicilioInquilino: inquilinoData.domicilio,

                propietarioId: propietarioData.id,
                nombrePropietario: propietarioData.nombre,
                dniPropietario: propietarioData.dni,
                cuitPropietario: propietarioData.cuit,
                domicilioPropietario: propietarioData.domicilio,
                emailPropietario: propietarioData.email,
                telefonoPropietario: propietarioData.telefono,

                punitoriosTipo: contractData.punitoriosTipo,
                punitoriosValor: parseFloat(contractData.punitoriosValor),

                nroPartidaInmobiliaria: contractData.nroPartidaInmobiliaria,
                valorDeposito: parseFloat(contractData.valorDeposito || "0"),
                monedaDeposito: contractData.monedaDeposito,
                honorariosTipo: contractData.honorariosTipo,
                honorariosValor: parseFloat(contractData.honorariosValor || "0"),
                metodoPago: contractData.metodoPago,
                serviciosAdicionales: [
                    ...Object.keys(servicios).filter(k => servicios[k]),
                    ...(otroServicio ? [otroServicio] : [])
                ],

                fechaInicio: new Date(contractData.fechaInicio),
                fechaFin: new Date(contractData.fechaFin),
                montoMensual: parseFloat(contractData.montoMensual),
                monedaAlquiler: contractData.monedaAlquiler,
                diaVencimiento: parseInt(contractData.diaVencimiento),
                // tasaPunitorios deprecated
                ajusteTipo: contractData.ajusteTipo,
                ajusteValor: parseFloat(contractData.ajusteValor),
                ajusteFrecuencia: parseInt(contractData.ajusteFrecuencia),
                ajusteMesesPrimer: contractData.ajusteMesesPrimer ? parseInt(contractData.ajusteMesesPrimer) : null,
                estadoInmueble: contractData.estadoInmueble,
                historialPagos: [],
                incidencias: [],
                estado: 'activo',
                documentos: [],
                userId: auth.currentUser?.uid || '',
                // garantia
                tipoGarantia: contractData.tipoGarantia,
                garante: contractData.tipoGarantia === 'garante' ? {
                    nombre: contractData.garanteNombre,
                    dni: contractData.garanteDni,
                    email: contractData.garanteEmail,
                    telefono: contractData.garanteTelefono,
                } : null,
                seguroCaucion: contractData.tipoGarantia === 'seguro_caucion' ? {
                    compania: contractData.seguroCompania,
                    numeroPoliza: contractData.seguroPoliza,
                    montoAsegurado: 0, // Default or ask user?
                    fechaEmision: new Date(),
                    fechaVencimiento: new Date(contractData.fechaFin),
                    contactoCompania: "",
                } : null,
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

    const canProceed = () => {
        if (currentStep === 1) return selectedProperty.id !== "";
        if (currentStep === 2) return selectedInquilino !== null;
        if (currentStep === 3) return selectedPropietario !== null;
        return true;
    };

    return (
        <div className="p-6 max-w-4xl mx-auto">
            {/* Header */}
            <div className="mb-6">
                <h1 className="font-heading text-2xl font-bold text-[var(--color-ink)]">Nuevo Contrato de Alquiler</h1>
                <p className="text-[var(--color-muted)]">Complete los pasos para crear un nuevo contrato y dar de alta a los clientes.</p>
            </div>

            {/* Hint Notice */}
            <div className="mb-8 bg-[var(--color-accent-soft)] border border-[var(--color-accent)]/30 rounded-xl p-4 flex gap-3 text-[var(--color-accent)] shadow-sm">
                <div className="mt-0.5">
                    <Lightbulb strokeWidth={1.5} className="w-5 h-5 text-[var(--color-accent)]" />
                </div>
                <div>
                    <h3 className="font-semibold mb-1">¡Aquí mismo cargas a tus clientes!</h3>
                    <p className="text-sm text-[var(--color-accent)]/90 leading-relaxed">
                        No necesitás crear a los inquilinos y propietarios en otro lado. En los <strong>pasos 2 y 3</strong> podrás buscarlos si ya existen, o <strong>crear clientes nuevos directamente</strong>. El sistema los guardará automáticamente para que puedas gestionarlos después.
                    </p>
                </div>
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
                                        ? "bg-[var(--color-accent)] text-[var(--color-accent-ink)]"
                                        : "bg-[var(--color-paper-4)] text-[var(--color-muted)]"
                                        }`}
                                >
                                    {currentStep > step.num ? <Check strokeWidth={1.5} className="w-5 h-5" /> : step.num}
                                </div>
                                <div className="text-sm mt-2 font-medium text-[var(--color-ink-2)]">{step.label}</div>
                            </div>
                            {idx < 3 && (
                                <div
                                    className={`h-1 flex-1 mx-4 ${currentStep > step.num ? "bg-[var(--color-accent)]" : "bg-[var(--color-paper-4)]"
                                        }`}
                                />
                            )}
                        </div>
                    ))}
                </div>
            </div>

            {/* Step Content */}
            <div className="bg-[var(--color-paper-2)] rounded-xl border border-[var(--color-rule)] p-6 mb-6">
                {currentStep === 1 && (
                    <div>
                        <h2 className="text-lg font-semibold text-[var(--color-ink)] mb-4">Seleccionar Propiedad</h2>
                        <PropertySelector
                            onSelect={handlePropertySelect}
                            selectedId={selectedProperty.id}
                        />
                        <div className="mt-6 flex justify-end">
                            <button
                                type="button"
                                onClick={() => setCurrentStep(2)}
                                disabled={!selectedProperty.id}
                                className="px-6 py-3 bg-[var(--color-ink)] text-[var(--color-paper)] rounded-lg hover:bg-[var(--color-ink-2)] transition-colors disabled:opacity-50"
                            >
                                Siguiente
                            </button>
                        </div>
                    </div>
                )}

                {currentStep === 2 && (
                    <div>
                        <h2 className="text-lg font-semibold text-[var(--color-ink)] mb-4">Datos del Inquilino</h2>
                        <ClientSelector
                            type="inquilinos"
                            selectedId={selectedInquilino?.id}
                            onSelect={(client) => setSelectedInquilino(client)}
                            label="Buscar Inquilino existente o crear nuevo"
                        />
                        {selectedInquilino && (
                            <div className="mt-4 p-4 bg-[var(--color-paper)] rounded-lg">
                                <h3 className="text-sm font-medium text-[var(--color-ink)] mb-2">Detalles Seleccionados:</h3>
                                <p className="text-sm text-[var(--color-ink-2)]">Nombre: {selectedInquilino.nombre}</p>
                                <p className="text-sm text-[var(--color-ink-2)]">DNI: {selectedInquilino.dni}</p>
                                <p className="text-sm text-[var(--color-ink-2)]">Email: {selectedInquilino.email}</p>
                            </div>
                        )}
                        <div className="mt-6 flex justify-between">
                            <button
                                type="button"
                                onClick={() => setCurrentStep(1)}
                                className="px-6 py-3 border border-[var(--color-rule)] text-[var(--color-ink-2)] rounded-lg hover:bg-[var(--color-paper-3)] transition-colors"
                            >
                                Anterior
                            </button>
                            <button
                                type="button"
                                onClick={() => setCurrentStep(3)}
                                disabled={!canProceed()}
                                className="px-6 py-3 bg-[var(--color-ink)] text-[var(--color-paper)] rounded-lg hover:bg-[var(--color-ink-2)] transition-colors disabled:opacity-50"
                            >
                                Siguiente
                            </button>
                        </div>
                    </div>
                )}

                {currentStep === 3 && (
                    <div>
                        <h2 className="text-lg font-semibold text-[var(--color-ink)] mb-4">Datos del Propietario</h2>
                        <ClientSelector
                            type="propietarios"
                            selectedId={selectedPropietario?.id}
                            onSelect={(client) => setSelectedPropietario(client)}
                            label="Buscar Propietario existente o crear nuevo"
                        />
                        {selectedPropietario && (
                            <div className="mt-4 p-4 bg-[var(--color-paper)] rounded-lg">
                                <h3 className="text-sm font-medium text-[var(--color-ink)] mb-2">Detalles Seleccionados:</h3>
                                <p className="text-sm text-[var(--color-ink-2)]">Nombre: {selectedPropietario.nombre}</p>
                                <p className="text-sm text-[var(--color-ink-2)]">DNI: {selectedPropietario.dni}</p>
                                <p className="text-sm text-[var(--color-ink-2)]">Email: {selectedPropietario.email}</p>
                            </div>
                        )}
                        <div className="mt-6 flex justify-between">
                            <button
                                type="button"
                                onClick={() => setCurrentStep(2)}
                                className="px-6 py-3 border border-[var(--color-rule)] text-[var(--color-ink-2)] rounded-lg hover:bg-[var(--color-paper-3)] transition-colors"
                            >
                                Anterior
                            </button>
                            <button
                                type="button"
                                onClick={() => setCurrentStep(4)}
                                disabled={!canProceed()}
                                className="px-6 py-3 bg-[var(--color-ink)] text-[var(--color-paper)] rounded-lg hover:bg-[var(--color-ink-2)] transition-colors disabled:opacity-50"
                            >
                                Siguiente
                            </button>
                        </div>
                    </div>
                )}

                {currentStep === 4 && (
                    <form onSubmit={handleSubmit}>
                        <h2 className="text-lg font-semibold text-[var(--color-ink)] mb-4">Datos del Contrato</h2>

                        <div className="space-y-6">
                            {/* General */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-[var(--color-ink-2)] mb-2">
                                        Fecha de Inicio *
                                    </label>
                                    <input
                                        type="date"
                                        required
                                        className="w-full p-3 border border-[var(--color-rule)] rounded-lg focus:ring-2 focus:ring-[var(--color-accent)]/40 focus:border-[var(--color-accent)] text-[var(--color-ink)]"
                                        value={contractData.fechaInicio}
                                        onChange={(e) => handleContractChange("fechaInicio", e.target.value)}
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-[var(--color-ink-2)] mb-2">
                                        Fecha de Fin *
                                    </label>
                                    <input
                                        type="date"
                                        required
                                        className="w-full p-3 border border-[var(--color-rule)] rounded-lg focus:ring-2 focus:ring-[var(--color-accent)]/40 focus:border-[var(--color-accent)] text-[var(--color-ink)]"
                                        value={contractData.fechaFin}
                                        onChange={(e) => handleContractChange("fechaFin", e.target.value)}
                                    />
                                </div>

                                <div>
                                    <div className="flex gap-2 items-end">
                                        <div className="flex-1">
                                            <MoneyInput
                                                label="Monto Mensual"
                                                value={contractData.montoMensual}
                                                onChange={(val) => handleContractChange("montoMensual", val)}
                                                required
                                                placeholder="0"
                                            />
                                        </div>
                                        <div className="w-24">
                                            <label className="block text-sm font-medium text-[var(--color-ink-2)] mb-2">Moneda</label>
                                            <select
                                                className="w-full p-3 border border-[var(--color-rule)] rounded-lg focus:ring-2 focus:ring-[var(--color-accent)]/40 focus:border-[var(--color-accent)] text-[var(--color-ink)]"
                                                value={contractData.monedaAlquiler}
                                                onChange={(e) => handleContractChange("monedaAlquiler", e.target.value)}
                                            >
                                                <option value="ARS">ARS</option>
                                                <option value="USD">USD</option>
                                            </select>
                                        </div>
                                    </div>
                                </div>

                                <div>
                                    <div className="flex gap-2 items-end">
                                        <div className="flex-1">
                                            <MoneyInput
                                                label="Valor de Depósito"
                                                value={contractData.valorDeposito}
                                                onChange={(val) => handleContractChange("valorDeposito", val)}
                                                placeholder="0"
                                            />
                                        </div>
                                        <div className="w-24">
                                            <label className="block text-sm font-medium text-[var(--color-ink-2)] mb-2">Moneda</label>
                                            <select
                                                className="w-full p-3 border border-[var(--color-rule)] rounded-lg focus:ring-2 focus:ring-[var(--color-accent)]/40 focus:border-[var(--color-accent)] text-[var(--color-ink)]"
                                                value={contractData.monedaDeposito}
                                                onChange={(e) => handleContractChange("monedaDeposito", e.target.value)}
                                            >
                                                <option value="USD">USD</option>
                                                <option value="ARS">ARS</option>
                                            </select>
                                        </div>
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-[var(--color-ink-2)] mb-2">
                                        Día de Vencimiento *
                                    </label>
                                    <input
                                        type="number"
                                        required
                                        min="1"
                                        max="31"
                                        className="w-full p-3 border border-[var(--color-rule)] rounded-lg focus:ring-2 focus:ring-[var(--color-accent)]/40 focus:border-[var(--color-accent)] text-[var(--color-ink)]"
                                        value={contractData.diaVencimiento}
                                        onChange={(e) => handleContractChange("diaVencimiento", e.target.value)}
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-[var(--color-ink-2)] mb-2">
                                        Método de Pago Preferido
                                    </label>
                                    <select
                                        className="w-full p-3 border border-[var(--color-rule)] rounded-lg focus:ring-2 focus:ring-[var(--color-accent)]/40 focus:border-[var(--color-accent)] text-[var(--color-ink)]"
                                        value={contractData.metodoPago}
                                        onChange={(e) => handleContractChange("metodoPago", e.target.value)}
                                    >
                                        <option value="">Seleccionar...</option>
                                        <option value="transferencia">Transferencia Bancaria</option>
                                        <option value="efectivo">Efectivo</option>
                                        <option value="deposito">Depósito Bancario</option>
                                        <option value="cheque">Cheque</option>
                                        <option value="debito_automatico">Débito Automático</option>
                                        <option value="otro">Otro</option>
                                    </select>
                                </div>
                            </div>

                            {/* Partida */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <TextInput
                                    label="Nro de Partida Inmobiliaria"
                                    value={contractData.nroPartidaInmobiliaria}
                                    onChange={(val) => handleContractChange("nroPartidaInmobiliaria", val)}
                                    required={false}
                                    showCharCount={false}
                                />
                            </div>

                            {/* Honorarios */}
                            <div className="bg-[var(--color-paper)] p-4 rounded-lg">
                                <h3 className="text-sm font-medium text-[var(--color-ink)] mb-4">Honorarios de Inmobiliaria</h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-[var(--color-ink-2)] mb-2">
                                            Tipo de Honorarios
                                        </label>
                                        <select
                                            className="w-full p-3 border border-[var(--color-rule)] rounded-lg focus:ring-2 focus:ring-[var(--color-accent)]/40 focus:border-[var(--color-accent)] text-[var(--color-ink)]"
                                            value={contractData.honorariosTipo}
                                            onChange={(e) => handleContractChange("honorariosTipo", e.target.value)}
                                        >
                                            <option value="fijo">Monto Fijo Mensual</option>
                                            <option value="porcentaje">% del Alquiler Mensual</option>
                                        </select>
                                    </div>
                                    <div>
                                        {contractData.honorariosTipo === 'fijo' ? (
                                            <MoneyInput
                                                label="Monto de Honorarios"
                                                value={contractData.honorariosValor}
                                                onChange={(val) => handleContractChange("honorariosValor", val)}
                                                placeholder="0"
                                            />
                                        ) : (
                                            <div>
                                                <label className="block text-sm font-medium text-[var(--color-ink-2)] mb-2">
                                                    % Mensual
                                                </label>
                                                <input
                                                    type="number"
                                                    step="0.1"
                                                    className="w-full p-3 border border-[var(--color-rule)] rounded-lg focus:ring-2 focus:ring-[var(--color-accent)]/40 focus:border-[var(--color-accent)] text-[var(--color-ink)]"
                                                    value={contractData.honorariosValor}
                                                    onChange={(e) => handleContractChange("honorariosValor", e.target.value)}
                                                    placeholder="Ej: 4"
                                                />
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Punitorios */}
                            <div className="bg-[var(--color-paper)] p-4 rounded-lg">
                                <h3 className="text-sm font-medium text-[var(--color-ink)] mb-4">Intereses Punitorios</h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-[var(--color-ink-2)] mb-2">
                                            Tipo de Interés
                                        </label>
                                        <select
                                            className="w-full p-3 border border-[var(--color-rule)] rounded-lg focus:ring-2 focus:ring-[var(--color-accent)]/40 focus:border-[var(--color-accent)] text-[var(--color-ink)]"
                                            value={contractData.punitoriosTipo}
                                            onChange={(e) => handleContractChange("punitoriosTipo", e.target.value)}
                                        >
                                            <option value="porcentaje">Porcentaje Diario</option>
                                            <option value="fijo">Monto Fijo Diario</option>
                                        </select>
                                    </div>
                                    <div>
                                        {contractData.punitoriosTipo === 'fijo' ? (
                                            <MoneyInput
                                                label="Monto Diario por Mora"
                                                value={contractData.punitoriosValor}
                                                onChange={(val) => handleContractChange("punitoriosValor", val)}
                                                placeholder="0"
                                            />
                                        ) : (
                                            <div>
                                                <label className="block text-sm font-medium text-[var(--color-ink-2)] mb-2">
                                                    Porcentaje Diario (%)
                                                </label>
                                                <input
                                                    type="number"
                                                    step="0.01"
                                                    className="w-full p-3 border border-[var(--color-rule)] rounded-lg focus:ring-2 focus:ring-[var(--color-accent)]/40 focus:border-[var(--color-accent)] text-[var(--color-ink)]"
                                                    value={contractData.punitoriosValor}
                                                    onChange={(e) => handleContractChange("punitoriosValor", e.target.value)}
                                                    placeholder="Ej: 0.5"
                                                />
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Ajustes */}
                            <div className="bg-[var(--color-paper)] p-4 rounded-lg">
                                <h3 className="text-sm font-medium text-[var(--color-ink)] mb-4">Actualización / Ajuste</h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-[var(--color-ink-2)] mb-2">
                                            Tipo de Ajuste *
                                        </label>
                                        <select
                                            required
                                            className="w-full p-3 border border-[var(--color-rule)] rounded-lg focus:ring-2 focus:ring-[var(--color-accent)]/40 focus:border-[var(--color-accent)] text-[var(--color-ink)]"
                                            value={contractData.ajusteTipo}
                                            onChange={(e) => handleContractChange("ajusteTipo", e.target.value)}
                                        >
                                            <option value="porcentaje">Porcentaje Fijo</option>
                                            <option value="ICL">ICL (Índice Contratos Locación)</option>
                                            <option value="IPC">IPC (Índice Precios Consumidor)</option>
                                            <option value="casa_propia">Índice Casa Propia</option>
                                            <option value="manual">Otro / Manual</option>
                                        </select>
                                    </div>

                                    {(contractData.ajusteTipo === 'porcentaje' || contractData.ajusteTipo === 'manual') && (
                                        <div>
                                            {contractData.ajusteTipo === 'manual' ? (
                                                <MoneyInput
                                                    label="Valor / Monto"
                                                    value={contractData.ajusteValor}
                                                    onChange={(val) => handleContractChange("ajusteValor", val)}
                                                    placeholder="0"
                                                />
                                            ) : (
                                                <>
                                                    <label className="block text-sm font-medium text-[var(--color-ink-2)] mb-2">
                                                        Valor de Ajuste (%)
                                                    </label>
                                                    <input
                                                        type="number"
                                                        step="0.01"
                                                        className="w-full p-3 border border-[var(--color-rule)] rounded-lg focus:ring-2 focus:ring-[var(--color-accent)]/40 focus:border-[var(--color-accent)] text-[var(--color-ink)]"
                                                        value={contractData.ajusteValor}
                                                        onChange={(e) => handleContractChange("ajusteValor", e.target.value)}
                                                        placeholder="0"
                                                    />
                                                </>
                                            )}
                                        </div>
                                    )}

                                    <div>
                                        <label className="block text-sm font-medium text-[var(--color-ink-2)] mb-2">
                                            Frecuencia de Actualización
                                        </label>
                                        <select
                                            className="w-full p-3 border border-[var(--color-rule)] rounded-lg focus:ring-2 focus:ring-[var(--color-accent)]/40 focus:border-[var(--color-accent)] text-[var(--color-ink)]"
                                            value={isCustomFrequency ? "0" : contractData.ajusteFrecuencia}
                                            onChange={(e) => {
                                                const val = e.target.value;
                                                if (val === "0") {
                                                    setIsCustomFrequency(true);
                                                } else {
                                                    setIsCustomFrequency(false);
                                                    handleContractChange("ajusteFrecuencia", val);
                                                    // Reset special first adjustment if switching to standard
                                                    handleContractChange("ajusteMesesPrimer", "");
                                                }
                                            }}
                                        >
                                            <option value="3">Trimestral (3 meses)</option>
                                            <option value="4">Cuatrimestral (4 meses)</option>
                                            <option value="6">Semestral (6 meses)</option>
                                            <option value="12">Anual (12 meses)</option>
                                            <option value="0">Personalizado</option>
                                        </select>
                                    </div>

                                    {isCustomFrequency && (
                                        <>
                                            <div>
                                                <label className="block text-sm font-medium text-[var(--color-ink-2)] mb-2">
                                                    Primer Ajuste (Meses)
                                                </label>
                                                <input
                                                    type="number"
                                                    min="1"
                                                    className="w-full p-3 border border-[var(--color-rule)] rounded-lg focus:ring-2 focus:ring-[var(--color-accent)]/40 focus:border-[var(--color-accent)] text-[var(--color-ink)]"
                                                    value={contractData.ajusteMesesPrimer}
                                                    onChange={(e) => handleContractChange("ajusteMesesPrimer", e.target.value)}
                                                    placeholder="Ej: 4"
                                                />
                                                <p className="text-xs text-[var(--color-muted)] mt-1">Si difiere del resto.</p>
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-[var(--color-ink-2)] mb-2">
                                                    Ajustes Siguientes (Meses)
                                                </label>
                                                <input
                                                    type="number"
                                                    min="1"
                                                    className="w-full p-3 border border-[var(--color-rule)] rounded-lg focus:ring-2 focus:ring-[var(--color-accent)]/40 focus:border-[var(--color-accent)] text-[var(--color-ink)]"
                                                    value={contractData.ajusteFrecuencia}
                                                    onChange={(e) => handleContractChange("ajusteFrecuencia", e.target.value)}
                                                />
                                            </div>
                                        </>
                                    )}
                                    {(contractData.ajusteTipo === 'ICL' || contractData.ajusteTipo === 'IPC') && (
                                        <div className="flex items-center text-sm text-[var(--color-muted)]">
                                            El valor se calculará automáticamente con el índice oficial ({contractData.ajusteTipo === 'ICL' ? 'BCRA' : 'INDEC'}).
                                        </div>
                                    )}
                                    {contractData.ajusteTipo === 'casa_propia' && (
                                        <div className="flex items-center text-sm text-[var(--color-muted)]">
                                            Este índice todavía no se calcula solo: ajustá el monto a mano al generar cada pago.
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Garantía */}
                            <div className="bg-[var(--color-paper)] p-4 rounded-lg">
                                <h3 className="text-sm font-medium text-[var(--color-ink)] mb-4">Garantía / Aval</h3>
                                <div className="grid grid-cols-1 gap-4 mb-4">
                                    <div>
                                        <label className="block text-sm font-medium text-[var(--color-ink-2)] mb-2">
                                            Tipo de Garantía
                                        </label>
                                        <select
                                            className="w-full p-3 border border-[var(--color-rule)] rounded-lg focus:ring-2 focus:ring-[var(--color-accent)]/40 focus:border-[var(--color-accent)] text-[var(--color-ink)]"
                                            value={contractData.tipoGarantia}
                                            onChange={(e) => handleContractChange("tipoGarantia", e.target.value)}
                                        >
                                            <option value="garante">Garante Personal</option>
                                            <option value="seguro_caucion">Seguro de Caución</option>
                                        </select>
                                    </div>
                                </div>

                                {contractData.tipoGarantia === 'garante' ? (
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <TextInput
                                            label="Nombre del Garante"
                                            value={contractData.garanteNombre}
                                            onChange={(val) => handleContractChange("garanteNombre", val)}
                                            required={true}
                                            showCharCount={false}
                                        />
                                        <TextInput
                                            label="DNI del Garante"
                                            value={contractData.garanteDni}
                                            onChange={(val) => handleContractChange("garanteDni", val)}
                                            required={true}
                                            showCharCount={false}
                                        />
                                        <TextInput
                                            label="Email"
                                            value={contractData.garanteEmail}
                                            onChange={(val) => handleContractChange("garanteEmail", val)}
                                            required={false}
                                            showCharCount={false}
                                        />
                                        <TextInput
                                            label="Teléfono"
                                            value={contractData.garanteTelefono}
                                            onChange={(val) => handleContractChange("garanteTelefono", val)}
                                            required={false}
                                            showCharCount={false}
                                        />
                                    </div>
                                ) : (
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <TextInput
                                            label="Compañía Aseguradora"
                                            value={contractData.seguroCompania}
                                            onChange={(val) => handleContractChange("seguroCompania", val)}
                                            required={true}
                                            showCharCount={false}
                                        />
                                        <TextInput
                                            label="Número de Póliza"
                                            value={contractData.seguroPoliza}
                                            onChange={(val) => handleContractChange("seguroPoliza", val)}
                                            required={true}
                                            showCharCount={false}
                                        />
                                    </div>
                                )}
                            </div>

                            {/* Servicios */}
                            <div className="bg-[var(--color-paper)] p-4 rounded-lg">
                                <h3 className="text-sm font-medium text-[var(--color-ink)] mb-4">Servicios y Expensas a Cargo del Inquilino</h3>
                                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                                    {[
                                        { key: 'luz', label: 'Luz' },
                                        { key: 'gas', label: 'Gas' },
                                        { key: 'agua', label: 'Agua' },
                                        { key: 'wifi', label: 'Internet / Wifi' },
                                        { key: 'cochera', label: 'Cochera' },
                                        { key: 'expensas', label: 'Expensas' },
                                    ].map((sc) => (
                                        <label key={sc.key} className="flex items-center gap-3 p-3 bg-[var(--color-paper-2)] border border-[var(--color-rule)] rounded-lg cursor-pointer hover:border-[var(--color-accent)]/30">
                                            <input
                                                type="checkbox"
                                                className="w-5 h-5 text-[var(--color-accent)] rounded focus:ring-[var(--color-accent)]/40"
                                                checked={servicios[sc.key]}
                                                onChange={(e) => setServicios(prev => ({ ...prev, [sc.key]: e.target.checked }))}
                                            />
                                            <span className="text-[var(--color-ink-2)] font-medium">{sc.label}</span>
                                        </label>
                                    ))}
                                </div>
                                <div className="mt-4">
                                    <label className="block text-sm font-medium text-[var(--color-ink-2)] mb-2">
                                        Otros Servicios / Observaciones
                                    </label>
                                    <input
                                        type="text"
                                        className="w-full p-3 border border-[var(--color-rule)] rounded-lg focus:ring-2 focus:ring-[var(--color-accent)]/40 focus:border-[var(--color-accent)] text-[var(--color-ink)]"
                                        placeholder="Ej: Jardinero, Seguridad Privada, Piletero..."
                                        value={otroServicio}
                                        onChange={(e) => setOtroServicio(e.target.value)}
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-1">
                                <TextAreaInput
                                    label="Estado del Inmueble / Inventario"
                                    value={contractData.estadoInmueble}
                                    onChange={(value) => handleContractChange("estadoInmueble", value)}
                                    placeholder="Descripción del estado del inmueble al inicio del contrato, inventario de muebles, electrodomésticos, etc."
                                    maxLength={500}
                                    required={false}
                                    rows={6}
                                />
                            </div>
                        </div>

                        <div className="mt-6 flex justify-end gap-3">
                            <button
                                type="button"
                                onClick={() => setCurrentStep(3)}
                                className="px-6 py-3 border border-[var(--color-rule)] text-[var(--color-ink-2)] rounded-lg hover:bg-[var(--color-paper-3)] transition-colors"
                            >
                                Anterior
                            </button>
                            <button
                                type="submit"
                                disabled={loading}
                                className="px-6 py-3 bg-[var(--color-ink)] text-[var(--color-paper)] rounded-lg hover:bg-[var(--color-ink-2)] transition-colors disabled:opacity-50"
                            >
                                {loading ? "Creando..." : "Crear Contrato"}
                            </button>
                        </div>
                    </form>
                )}
            </div>
        </div>
    );
}

