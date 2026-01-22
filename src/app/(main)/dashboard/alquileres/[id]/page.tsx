"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { alquileresService } from "@/infrastructure/services/alquileresService";
import { Alquiler, Pago, Incidencia } from "@/domain/models/Alquiler";
import { inquilinosService } from "@/infrastructure/services/inquilinosService";
import { Inquilino } from "@/domain/models/Inquilino";
import PaymentPlanTable from "../components/PaymentPlanTable";
import MaintenanceTab from "../components/MaintenanceTab";

import { contractDocxService } from "@/infrastructure/services/contractDocxService";
import ContractGeneratorPreviewModal from "@/ui/components/modals/ContractGeneratorPreviewModal";
import { ArrowLeft, FileText, DollarSign, Wrench, Edit, Save, X, Download, Pause, Check, MoreVertical, Trash2, AlertCircle, Printer } from "lucide-react";
import Link from "next/link";
import { TextInput, MoneyInput, TextAreaInput } from "@/ui/components/forms";

export default function AlquilerDetailPage() {
    const params = useParams();
    const router = useRouter();
    const [alquiler, setAlquiler] = useState<Alquiler | null>(null);
    const [inquilino, setInquilino] = useState<Inquilino | null>(null);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'info' | 'pagos' | 'documentos' | 'mantenimiento'>('pagos');
    const [isEditing, setIsEditing] = useState(false);
    const [editData, setEditData] = useState<Partial<Alquiler>>({});
    const [showContractModal, setShowContractModal] = useState(false);
    const [showContractPreview, setShowContractPreview] = useState(false);
    const [showMenu, setShowMenu] = useState(false);

    // Form states matching nuevo/page.tsx behavior
    const [servicios, setServicios] = useState<Record<string, boolean>>({
        luz: false, gas: false, agua: false, wifi: false, cochera: false, expensas: false
    });
    const [otroServicio, setOtroServicio] = useState("");
    const [isCustomFrequency, setIsCustomFrequency] = useState(false);

    // Sync services when entering edit mode or loading data
    useEffect(() => {
        if (isEditing && editData) {
            // Sync checkboxes based on current editData.serviciosAdicionales
            // We do a case-insensitive check to be robust
            const currentServices = editData.serviciosAdicionales || [];

            const isServiceActive = (name: string) => {
                return currentServices.some(s => s.toLowerCase() === name.toLowerCase());
            };

            const newServicios = {
                luz: isServiceActive('Luz'),
                gas: isServiceActive('Gas'),
                agua: isServiceActive('Agua'),
                wifi: isServiceActive('Internet / Wifi') || isServiceActive('Wifi') || isServiceActive('Internet'),
                cochera: isServiceActive('Cochera'),
                expensas: isServiceActive('Expensas'),
            };
            setServicios(newServicios);

            // Find other services
            const known = ['luz', 'gas', 'agua', 'internet / wifi', 'wifi', 'internet', 'cochera', 'expensas'];
            const others = currentServices.filter(s => !known.includes(s.toLowerCase()));
            setOtroServicio(others.join(', '));

            // Sync Adjustment Frequency custom state
            const freq = editData.ajusteFrecuencia;
            if (freq && ![3, 4, 6, 12].includes(freq)) {
                setIsCustomFrequency(true);
            } else {
                setIsCustomFrequency(false);
            }
        }
    }, [isEditing, editData.serviciosAdicionales, editData.ajusteFrecuencia]);

    // Update editData.serviciosAdicionales when checkboxes or text changes
    useEffect(() => {
        if (!isEditing) return;

        const activeServices = [
            servicios.luz && 'Luz',
            servicios.gas && 'Gas',
            servicios.agua && 'Agua',
            servicios.wifi && 'Internet / Wifi',
            servicios.cochera && 'Cochera',
            servicios.expensas && 'Expensas',
            ...otroServicio.split(',').map(s => s.trim()).filter(Boolean)
        ].filter(Boolean) as string[];

        // Only update if different to avoid infinite loops if generic compare
        // But simply updating editData might cause re-render loop if included in dependency.
        // We will do this update in a specific handler or just before save? 
        // Better to update `editData` via effect might be risky. 
        // Let's create a specific function to sync back to editData and call it on change of these local states
        // OR better: Update editData immediately on change of these inputs.
    }, [servicios, otroServicio, isEditing]);

    const handleServiceChange = (key: string, checked: boolean) => {
        const newServicios = { ...servicios, [key]: checked };
        setServicios(newServicios);
        updateServicesInEditData(newServicios, otroServicio);
    }

    const handleOtroServicioChange = (val: string) => {
        setOtroServicio(val);
        updateServicesInEditData(servicios, val);
    }

    const updateServicesInEditData = (currentServicios: Record<string, boolean>, currentOtro: string) => {
        const activeServices = [
            currentServicios.luz && 'Luz',
            currentServicios.gas && 'Gas',
            currentServicios.agua && 'Agua',
            currentServicios.wifi && 'Internet / Wifi',
            currentServicios.cochera && 'Cochera',
            currentServicios.expensas && 'Expensas',
            ...currentOtro.split(',').map(s => s.trim()).filter(Boolean)
        ].filter(Boolean) as string[];

        setEditData(prev => ({ ...prev, serviciosAdicionales: activeServices }));
    }

    useEffect(() => {
        const fetchAlquiler = async () => {
            try {
                const data = await alquileresService.getAlquilerById(params.id as string);
                setAlquiler(data);
                setEditData(data || {});

                if (data?.inquilinoId) {
                    try {
                        const inq = await inquilinosService.getInquilinoById(data.inquilinoId);
                        setInquilino(inq);
                    } catch (error) {
                        console.error("Error fetching inquilino:", error);
                    }
                }
            } catch (error) {
                console.error("Error fetching contract:", error);
                // Ensure loading is set to false even on error
            } finally {
                setLoading(false);
            }
        };

        if (params.id) {
            fetchAlquiler();
        }
    }, [params.id]);

    const handleUpdatePayment = async (updatedPayment: Pago) => {
        if (!alquiler) return;

        // Find if payment exists in history
        const message = updatedPayment.estado === 'pagado' ? "Pago registrado" : "Pago actualizado";

        // Remove old entry if exists and add new one (or just update)
        // Since we are handling an array of objects, we can filter out the old one and add the new one
        // To ensure order, maybe we should sort, but key is ID or Month.

        let newHistory = alquiler.historialPagos.filter(p => p.id !== updatedPayment.id);

        // If the ID was virtual (starts with virtual-), we should have generated a new ID in the component
        // But the component generates a new ID if it was virtual. 
        // Let's assume the component passed a clean Pago object with a real ID.
        // Wait, if I'm editing an existing "virtual" pay, the component assigns a randomUUID.
        // So filter by ID won't match "virtual-..." because ID in updatedPayment is new.
        // BUT if I'm editing a REAL payment, ID matches.
        // The component logic: const periodId = format(periodDate, "yyyy-MM");
        // We really should check by 'mes' to be safe if ID changed?
        // Let's match by ID first.

        // Actually, if we are editing a "virtual" payment, it's not in the array yet.
        // So `filter` removes nothing. We just add `updatedPayment`.
        // However, if we are editing a REAL payment, `filter` removes the old version.

        newHistory.push(updatedPayment);

        // Sort by date (optional but good)
        newHistory.sort((a, b) => new Date(a.fechaVencimiento).getTime() - new Date(b.fechaVencimiento).getTime());

        try {
            await alquileresService.updateAlquiler(alquiler.id, { historialPagos: newHistory });
            const updated = await alquileresService.getAlquilerById(alquiler.id);
            if (updated) {
                setAlquiler(updated);
            }
            // alert(message); // Optional
        } catch (error) {
            console.error("Error updating payment:", error);
            alert("Error al actualizar el pago");
        }
    };

    // New handler for bulk updates (e.g. IPC adjustment)
    const handleUpdateContract = async (updates: Partial<Alquiler>) => {
        if (!alquiler) return;

        try {
            await alquileresService.updateAlquiler(alquiler.id, updates);
            // Optimization: Apply partial updates locally right away
            if (updates.montoMensual) {
                // If amount changed, we might have updated history too in the 'updates' object
            }

            // Re-fetch to be safe and get consistent state
            const updated = await alquileresService.getAlquilerById(alquiler.id);
            if (updated) {
                setAlquiler(updated);
            }
        } catch (error) {
            console.error("Error updating contract:", error);
            alert("Error al actualizar el contrato");
        }
    };

    const handleUpdateIncidenciaStatus = async (id: string, newStatus: 'abierto' | 'en_proceso' | 'resuelto') => {
        if (!alquiler) return;

        const incidencias = alquiler.incidencias.map(inc => {
            if (inc.id === id) {
                return {
                    ...inc,
                    estado: newStatus,
                    fechaResolucion: newStatus === 'resuelto' ? new Date() : inc.fechaResolucion,
                };
            }
            return inc;
        });

        try {
            await alquileresService.updateAlquiler(alquiler.id, { incidencias });
            const updated = await alquileresService.getAlquilerById(alquiler.id);
            if (updated) {
                setAlquiler(updated);
            }
        } catch (error) {
            console.error("Error updating incidencia:", error);
            alert("Error al actualizar la incidencia");
        }
    };

    const handleFinalizarContrato = async () => {
        if (!alquiler || !confirm("¿Estás seguro de finalizar este contrato?")) return;

        try {
            await alquileresService.updateAlquiler(alquiler.id, { estado: 'finalizado' });
            const updated = await alquileresService.getAlquilerById(alquiler.id);
            if (updated) {
                setAlquiler(updated);
            }
        } catch (error) {
            console.error("Error finalizing contract:", error);
            alert("Error al finalizar el contrato");
        }
    };

    const handleCreateIncidencia = async (incidencia: Omit<Incidencia, 'id' | 'fechaCreacion' | 'comentarios'>) => {
        if (!alquiler) return;

        const nuevaIncidencia: Incidencia = {
            ...incidencia,
            id: crypto.randomUUID(),
            fechaCreacion: new Date(),
            comentarios: [],
            estado: 'abierto'
        };

        const updatedIncidencias = [...(alquiler.incidencias || []), nuevaIncidencia];

        try {
            await alquileresService.updateAlquiler(alquiler.id, { incidencias: updatedIncidencias });
            const updated = await alquileresService.getAlquilerById(alquiler.id);
            if (updated) {
                setAlquiler(updated);
            }
        } catch (error) {
            console.error("Error creating incidencia:", error);
            alert("Error al crear la incidencia");
        }
    };



    const handleSaveEdit = async () => {
        if (!alquiler) return;

        try {
            await alquileresService.updateAlquiler(alquiler.id, editData);
            const updated = await alquileresService.getAlquilerById(alquiler.id);
            if (updated) {
                setAlquiler(updated);
                setEditData(updated);
            }
            setIsEditing(false);
        } catch (error) {
            console.error("Error updating contract:", error);
            alert("Error al actualizar el contrato");
        }
    };

    const handleCancelEdit = () => {
        setEditData(alquiler || {});
        setIsEditing(false);
    };

    const handleSuspender = async () => {
        if (!alquiler || !confirm("¿Estás seguro de suspender este contrato?")) return;

        try {
            await alquileresService.updateAlquiler(alquiler.id, { estado: 'suspendido' });
            const updated = await alquileresService.getAlquilerById(alquiler.id);
            if (updated) {
                setAlquiler(updated);
            }
        } catch (error) {
            console.error("Error suspending contract:", error);
            alert("Error al suspender el contrato");
        }
    };

    const handleActivar = async () => {
        if (!alquiler || !confirm("¿Estás seguro de activar este contrato?")) return;

        try {
            await alquileresService.updateAlquiler(alquiler.id, { estado: 'activo' });
            const updated = await alquileresService.getAlquilerById(alquiler.id);
            if (updated) {
                setAlquiler(updated);
            }
        } catch (error) {
            console.error("Error activating contract:", error);
            alert("Error al activar el contrato");
        }
    };

    const handleDownloadContract = () => {
        setShowContractModal(true);
    };

    const confirmDownloadContract = async () => {
        setShowContractModal(false);
        if (!alquiler) return;
        try {
            await contractDocxService.generateAndDownload(alquiler);
        } catch (error) {
            console.error("Error generating contract:", error);
            alert("Error al generar el contrato");
        }
    };

    const handleEditChange = (field: string, value: any) => {
        setEditData(prev => ({ ...prev, [field]: value }));
    };

    if (loading) {
        return (
            <div className="p-6 flex items-center justify-center min-h-[400px]">
                <div className="text-gray-500">Cargando contrato...</div>
            </div>
        );
    }

    if (!alquiler) {
        return (
            <div className="p-6">
                <div className="text-center py-12">
                    <p className="text-gray-500">Contrato no encontrado</p>
                    <Link href="/dashboard/alquileres" className="text-indigo-600 hover:underline mt-4 inline-block">
                        Volver a Alquileres
                    </Link>
                </div>
            </div>
        );
    }

    const tabs = [
        { id: 'pagos', label: 'Pagos', icon: DollarSign },
        { id: 'mantenimiento', label: 'Mantenimiento', icon: Wrench },
        { id: 'info', label: 'Información', icon: FileText },
    ] as const;

    return (
        <div className="p-6 max-w-7xl mx-auto space-y-6">
            {/* Header */}
            <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-4">
                    <Link
                        href="/dashboard/alquileres"
                        className="p-2 -ml-2 hover:bg-gray-100 rounded-xl transition-colors text-gray-400 hover:text-gray-600"
                    >
                        <ArrowLeft className="w-6 h-6" />
                    </Link>
                    <div>
                        <div className="flex items-center gap-3 flex-wrap">
                            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 tracking-tight leading-tight">
                                {alquiler.direccion}
                            </h1>
                            <span className={`px-2.5 py-1 text-[11px] font-bold rounded-lg uppercase tracking-wider border ${alquiler.estado === 'activo' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' :
                                alquiler.estado === 'pendiente' ? 'bg-amber-50 text-amber-700 border-amber-100' :
                                    alquiler.estado === 'suspendido' ? 'bg-orange-50 text-orange-700 border-orange-100' :
                                        'bg-gray-50 text-gray-600 border-gray-200'
                                }`}>
                                {alquiler.estado}
                            </span>
                        </div>
                        {/* Rental Code Display */}
                        {alquiler.codigoAlquiler ? (
                            <div className="mt-1.5 flex flex-wrap items-center gap-2">
                                <p className="text-gray-500 font-mono text-sm tracking-wide uppercase select-all bg-gray-50 px-2 py-0.5 rounded border border-gray-100">
                                    {alquiler.codigoAlquiler}
                                </p>
                                <button
                                    onClick={() => {
                                        const domain = window.location.origin;
                                        const text = `Hola! Podés ver el estado de tu alquiler en: ${domain}/inquilino\n\nTu código de acceso es: *${alquiler.codigoAlquiler}*\nTu usuario es tu DNI.`;
                                        const url = `https://wa.me/?text=${encodeURIComponent(text)}`;
                                        window.open(url, '_blank');
                                    }}
                                    className="flex items-center gap-1 pl-2 pr-3 py-1 bg-green-50 text-green-700 text-[10px] font-bold uppercase tracking-wider rounded-full hover:bg-green-100 transition-colors border border-green-200/50"
                                    title="Enviar por WhatsApp"
                                >
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="w-3 h-3"><path d="M3 21l1.65-3.8a9 9 0 1 1 3.4 2.9L3 21" /><path d="M9 10a.5.5 0 0 0 1 0V9a.5.5 0 0 0 1 0v1a5 5 0 0 0 5 5h1a.5.5 0 0 0 0-1h-1a.5.5 0 0 0 0 1" /></svg>
                                    Compartir
                                </button>
                            </div>
                        ) : (
                            <button
                                onClick={async () => {
                                    if (confirm('¿Generar código de acceso para inquilino?')) {
                                        try {
                                            await alquileresService.generateCodeForExistingAlquiler(alquiler.id);
                                            // Refresh
                                            const updated = await alquileresService.getAlquilerById(alquiler.id);
                                            if (updated) setAlquiler(updated);
                                        } catch (e) { console.error(e); alert('Error al generar'); }
                                    }
                                }}
                                className="mt-1 text-xs bg-indigo-50 text-indigo-600 px-2 py-1 rounded border border-indigo-200 hover:bg-indigo-100 transition-colors"
                            >
                                Generar Código Inquilino
                            </button>
                        )}
                        <p className="text-gray-500 font-medium mt-1 flex items-center gap-2 text-sm">
                            <span className="w-1.5 h-1.5 rounded-full bg-gray-300"></span>
                            {alquiler.propiedadTipo}
                        </p>
                    </div>
                </div>

                <div className="relative">
                    <button
                        onClick={() => setShowMenu(!showMenu)}
                        className="p-2 hover:bg-gray-100 rounded-xl transition-colors text-gray-500 hover:text-gray-900"
                        title="Opciones"
                    >
                        <MoreVertical className="w-5 h-5" />
                    </button>

                    {showMenu && (
                        <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-xl border border-gray-100 py-1.5 z-50 animate-in fade-in zoom-in-95 duration-200 origin-top-right">
                            <div className="px-3 py-2 border-b border-gray-50 mb-1">
                                <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Acciones</span>
                            </div>
                            <button
                                onClick={() => { setShowMenu(false); handleDownloadContract(); }}
                                className="w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-3 transition-colors"
                            >
                                <Download className="w-4 h-4 text-gray-400" />
                                Descargar Docx
                            </button>

                            <button
                                onClick={() => { setShowMenu(false); setShowContractPreview(true); }}
                                className="w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-3 transition-colors"
                            >
                                <Printer className="w-4 h-4 text-gray-400" />
                                Vista Previa
                            </button>

                            {alquiler.estado === 'activo' && (
                                <button
                                    onClick={() => { setShowMenu(false); handleSuspender(); }}
                                    className="w-full text-left px-4 py-2.5 text-sm text-orange-700 hover:bg-orange-50 flex items-center gap-3 transition-colors"
                                >
                                    <Pause className="w-4 h-4" />
                                    Suspender Contrato
                                </button>
                            )}

                            {alquiler.estado === 'suspendido' && (
                                <button
                                    onClick={() => { setShowMenu(false); handleActivar(); }}
                                    className="w-full text-left px-4 py-2.5 text-sm text-emerald-700 hover:bg-emerald-50 flex items-center gap-3 transition-colors"
                                >
                                    <Check className="w-4 h-4" />
                                    Reactivar Contrato
                                </button>
                            )}

                            <div className="border-t border-gray-100 my-1"></div>

                            <button
                                onClick={() => { setShowMenu(false); handleFinalizarContrato(); }}
                                className="w-full text-left px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 flex items-center gap-3 transition-colors"
                            >
                                <Trash2 className="w-4 h-4" />
                                Finalizar Contrato
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {/* Tabs */}
            <div className="border-b border-gray-200">
                <div className="flex gap-4 overflow-x-auto">
                    {tabs.map(tab => {
                        const Icon = tab.icon;
                        return (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`flex items-center gap-2 px-4 py-3 border-b-2 transition-colors whitespace-nowrap ${activeTab === tab.id
                                    ? 'border-indigo-600 text-indigo-600 font-medium'
                                    : 'border-transparent text-gray-600 hover:text-gray-900'
                                    }`}
                            >
                                <Icon className="w-5 h-5" />
                                {tab.label}
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* Tab Content */}
            <div>
                {activeTab === 'info' && (
                    <div className="space-y-6">
                        <div className="bg-white rounded-xl border border-gray-200 p-6">
                            <div className="mb-6 flex justify-between items-center">
                                <h2 className="text-lg font-semibold text-gray-900">Información del Contrato</h2>
                                <div>
                                    {isEditing ? (
                                        <div className="flex gap-2">
                                            <button onClick={handleCancelEdit} className="px-3 py-1.5 text-sm border rounded hover:bg-gray-50 text-gray-700">Cancelar</button>
                                            <button onClick={handleSaveEdit} className="px-3 py-1.5 text-sm bg-green-600 text-white rounded hover:bg-green-700 flex items-center gap-1">
                                                <Save size={14} /> Guardar
                                            </button>
                                        </div>
                                    ) : (
                                        <button
                                            onClick={() => { setIsEditing(true); setEditData({ ...alquiler }); }}
                                            className="px-3 py-1.5 text-sm border border-indigo-200 text-indigo-700 bg-indigo-50 rounded hover:bg-indigo-100 flex items-center gap-2"
                                        >
                                            <Edit size={14} /> Editar Contrato
                                        </button>
                                    )}
                                </div>
                            </div>

                            {isEditing ? (
                                <div className="space-y-6">
                                    {/* General */}
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                Fecha de Inicio *
                                            </label>
                                            <input
                                                type="date"
                                                required
                                                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-gray-900"
                                                value={editData.fechaInicio ? new Date(editData.fechaInicio).toISOString().split('T')[0] : ''}
                                                onChange={(e) => handleEditChange("fechaInicio", new Date(e.target.value))}
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                Fecha de Fin *
                                            </label>
                                            <input
                                                type="date"
                                                required
                                                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-gray-900"
                                                value={editData.fechaFin ? new Date(editData.fechaFin).toISOString().split('T')[0] : ''}
                                                onChange={(e) => handleEditChange("fechaFin", new Date(e.target.value))}
                                            />
                                        </div>

                                        <div>
                                            <div className="flex gap-2 items-end">
                                                <div className="flex-1">
                                                    <MoneyInput
                                                        label="Monto Mensual"
                                                        value={editData.montoMensual?.toString() || ''}
                                                        onChange={(val: string) => handleEditChange("montoMensual", parseFloat(val))}
                                                        required
                                                        placeholder="0"
                                                    />
                                                </div>
                                                <div className="w-24">
                                                    <label className="block text-sm font-medium text-gray-700 mb-2">Moneda</label>
                                                    <select
                                                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-gray-900"
                                                        value={editData.monedaAlquiler}
                                                        onChange={(e) => handleEditChange("monedaAlquiler", e.target.value)}
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
                                                        value={editData.valorDeposito?.toString() || ''}
                                                        onChange={(val: string) => handleEditChange("valorDeposito", parseFloat(val))}
                                                        placeholder="0"
                                                    />
                                                </div>
                                                <div className="w-24">
                                                    <label className="block text-sm font-medium text-gray-700 mb-2">Moneda</label>
                                                    <select
                                                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-gray-900"
                                                        value={editData.monedaDeposito}
                                                        onChange={(e) => handleEditChange("monedaDeposito", e.target.value)}
                                                    >
                                                        <option value="USD">USD</option>
                                                        <option value="ARS">ARS</option>
                                                    </select>
                                                </div>
                                            </div>
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
                                                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-gray-900"
                                                value={editData.diaVencimiento}
                                                onChange={(e) => handleEditChange("diaVencimiento", parseInt(e.target.value))}
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                Método de Pago Preferido
                                            </label>
                                            <select
                                                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-gray-900"
                                                value={editData.metodoPago || ''}
                                                onChange={(e) => handleEditChange("metodoPago", e.target.value)}
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
                                            value={editData.nroPartidaInmobiliaria || ''}
                                            onChange={(val: string) => handleEditChange("nroPartidaInmobiliaria", val)}
                                            required={false}
                                            showCharCount={false}
                                        />
                                    </div>

                                    {/* Honorarios */}
                                    <div className="bg-gray-50 p-4 rounded-lg">
                                        <h3 className="text-sm font-medium text-gray-900 mb-4">Honorarios de Inmobiliaria</h3>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                                    Tipo de Honorarios
                                                </label>
                                                <select
                                                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-gray-900"
                                                    value={editData.honorariosTipo || 'fijo'}
                                                    onChange={(e) => handleEditChange("honorariosTipo", e.target.value)}
                                                >
                                                    <option value="fijo">Monto Fijo Mensual</option>
                                                    <option value="porcentaje">% del Alquiler Mensual</option>
                                                </select>
                                            </div>
                                            <div>
                                                {editData.honorariosTipo === 'fijo' ? (
                                                    <MoneyInput
                                                        label="Monto de Honorarios"
                                                        value={editData.honorariosValor?.toString() || ''}
                                                        onChange={(val: string) => handleEditChange("honorariosValor", parseFloat(val))}
                                                        placeholder="0"
                                                    />
                                                ) : (
                                                    <div>
                                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                                            % Mensual
                                                        </label>
                                                        <input
                                                            type="number"
                                                            step="0.1"
                                                            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-gray-900"
                                                            value={editData.honorariosValor || ''}
                                                            onChange={(e) => handleEditChange("honorariosValor", parseFloat(e.target.value))}
                                                            placeholder="Ej: 4"
                                                        />
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Punitorios */}
                                    <div className="bg-gray-50 p-4 rounded-lg">
                                        <h3 className="text-sm font-medium text-gray-900 mb-4">Intereses Punitorios</h3>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                                    Tipo de Interés
                                                </label>
                                                <select
                                                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-gray-900"
                                                    value={editData.punitoriosTipo || 'porcentaje'}
                                                    onChange={(e) => handleEditChange("punitoriosTipo", e.target.value)}
                                                >
                                                    <option value="porcentaje">Porcentaje Diario</option>
                                                    <option value="fijo">Monto Fijo Diario</option>
                                                </select>
                                            </div>
                                            <div>
                                                {editData.punitoriosTipo === 'fijo' ? (
                                                    <MoneyInput
                                                        label="Monto Diario por Mora"
                                                        value={editData.punitoriosValor?.toString() || ''}
                                                        onChange={(val: string) => handleEditChange("punitoriosValor", parseFloat(val))}
                                                        placeholder="0"
                                                    />
                                                ) : (
                                                    <div>
                                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                                            Porcentaje Diario (%)
                                                        </label>
                                                        <input
                                                            type="number"
                                                            step="0.01"
                                                            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-gray-900"
                                                            value={editData.punitoriosValor || ''}
                                                            onChange={(e) => handleEditChange("punitoriosValor", parseFloat(e.target.value))}
                                                            placeholder="Ej: 0.5"
                                                        />
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Ajustes */}
                                    <div className="bg-gray-50 p-4 rounded-lg">
                                        <h3 className="text-sm font-medium text-gray-900 mb-4">Actualización / Ajuste</h3>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                                    Tipo de Ajuste *
                                                </label>
                                                <select
                                                    required
                                                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-gray-900"
                                                    value={editData.ajusteTipo}
                                                    onChange={(e) => handleEditChange("ajusteTipo", e.target.value)}
                                                >
                                                    <option value="porcentaje">Porcentaje Fijo</option>
                                                    <option value="ICL">ICL (Índice Contratos Locación)</option>
                                                    <option value="IPC">IPC (Índice Precios Consumidor)</option>
                                                    <option value="casa_propia">Índice Casa Propia</option>
                                                    <option value="manual">Otro / Manual</option>
                                                </select>
                                            </div>

                                            {(editData.ajusteTipo === 'porcentaje' || editData.ajusteTipo === 'manual') && (
                                                <div>
                                                    {editData.ajusteTipo === 'manual' ? (
                                                        <MoneyInput
                                                            label="Valor / Monto"
                                                            value={editData.ajusteValor?.toString() || ''}
                                                            onChange={(val: string) => handleEditChange("ajusteValor", parseFloat(val))}
                                                            placeholder="0"
                                                        />
                                                    ) : (
                                                        <>
                                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                                Valor de Ajuste (%)
                                                            </label>
                                                            <input
                                                                type="number"
                                                                step="0.01"
                                                                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-gray-900"
                                                                value={editData.ajusteValor || ''}
                                                                onChange={(e) => handleEditChange("ajusteValor", parseFloat(e.target.value))}
                                                                placeholder="0"
                                                            />
                                                        </>
                                                    )}
                                                </div>
                                            )}

                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                                    Frecuencia de Actualización
                                                </label>
                                                <select
                                                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-gray-900"
                                                    value={isCustomFrequency ? "0" : editData.ajusteFrecuencia?.toString() || "3"}
                                                    onChange={(e) => {
                                                        const val = e.target.value;
                                                        if (val === "0") {
                                                            setIsCustomFrequency(true);
                                                        } else {
                                                            setIsCustomFrequency(false);
                                                            handleEditChange("ajusteFrecuencia", parseInt(val));
                                                            handleEditChange("ajusteMesesPrimer", null);
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
                                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                                            Primer Ajuste (Meses)
                                                        </label>
                                                        <input
                                                            type="number"
                                                            min="1"
                                                            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-gray-900"
                                                            value={editData.ajusteMesesPrimer || ''}
                                                            onChange={(e) => handleEditChange("ajusteMesesPrimer", parseInt(e.target.value) || null)}
                                                            placeholder="Ej: 4"
                                                        />
                                                        <p className="text-xs text-gray-500 mt-1">Si difiere del resto.</p>
                                                    </div>
                                                    <div>
                                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                                            Ajustes Siguientes (Meses)
                                                        </label>
                                                        <input
                                                            type="number"
                                                            min="1"
                                                            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-gray-900"
                                                            value={editData.ajusteFrecuencia || ''}
                                                            onChange={(e) => handleEditChange("ajusteFrecuencia", parseInt(e.target.value))}
                                                        />
                                                    </div>
                                                </>
                                            )}
                                        </div>
                                    </div>

                                    {/* Garantía */}
                                    <div className="bg-gray-50 p-4 rounded-lg">
                                        <h3 className="text-sm font-medium text-gray-900 mb-4">Garantía / Aval</h3>
                                        <div className="grid grid-cols-1 gap-4 mb-4">
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                                    Tipo de Garantía
                                                </label>
                                                <select
                                                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-gray-900"
                                                    value={editData.tipoGarantia || 'garante'}
                                                    onChange={(e) => handleEditChange("tipoGarantia", e.target.value)}
                                                >
                                                    <option value="garante">Garante Personal</option>
                                                    <option value="seguro_caucion">Seguro de Caución</option>
                                                </select>
                                            </div>
                                        </div>

                                        {editData.tipoGarantia === 'garante' ? (
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                <TextInput
                                                    label="Nombre del Garante"
                                                    value={editData.garante?.nombre || ''}
                                                    onChange={(val: string) => handleEditChange("garante", { ...editData.garante, nombre: val })}
                                                    required={true}
                                                    showCharCount={false}
                                                />
                                                <TextInput
                                                    label="DNI del Garante"
                                                    value={editData.garante?.dni || ''}
                                                    onChange={(val: string) => handleEditChange("garante", { ...editData.garante, dni: val })}
                                                    required={true}
                                                    showCharCount={false}
                                                />
                                                <TextInput
                                                    label="Email"
                                                    value={editData.garante?.email || ''}
                                                    onChange={(val: string) => handleEditChange("garante", { ...editData.garante, email: val })}
                                                    required={false}
                                                    showCharCount={false}
                                                />
                                                <TextInput
                                                    label="Teléfono"
                                                    value={editData.garante?.telefono || ''}
                                                    onChange={(val: string) => handleEditChange("garante", { ...editData.garante, telefono: val })}
                                                    required={false}
                                                    showCharCount={false}
                                                />
                                            </div>
                                        ) : (
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                <TextInput
                                                    label="Compañía Aseguradora"
                                                    value={editData.seguroCaucion?.compania || ''}
                                                    onChange={(val: string) => handleEditChange("seguroCaucion", { ...editData.seguroCaucion, compania: val })}
                                                    required={true}
                                                    showCharCount={false}
                                                />
                                                <TextInput
                                                    label="Número de Póliza"
                                                    value={editData.seguroCaucion?.numeroPoliza || ''}
                                                    onChange={(val: string) => handleEditChange("seguroCaucion", { ...editData.seguroCaucion, numeroPoliza: val })}
                                                    required={true}
                                                    showCharCount={false}
                                                />
                                            </div>
                                        )}
                                    </div>

                                    {/* Servicios */}
                                    <div className="bg-gray-50 p-4 rounded-lg">
                                        <h3 className="text-sm font-medium text-gray-900 mb-4">Servicios y Expensas a Cargo del Inquilino</h3>
                                        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                                            {[
                                                { key: 'luz', label: 'Luz' },
                                                { key: 'gas', label: 'Gas' },
                                                { key: 'agua', label: 'Agua' },
                                                { key: 'wifi', label: 'Internet / Wifi' },
                                                { key: 'cochera', label: 'Cochera' },
                                                { key: 'expensas', label: 'Expensas' },
                                            ].map((sc) => (
                                                <label key={sc.key} className="flex items-center gap-3 p-3 bg-white border border-gray-200 rounded-lg cursor-pointer hover:border-indigo-300">
                                                    <input
                                                        type="checkbox"
                                                        className="w-5 h-5 text-indigo-600 rounded focus:ring-indigo-500"
                                                        checked={servicios[sc.key]}
                                                        onChange={(e) => handleServiceChange(sc.key, e.target.checked)}
                                                    />
                                                    <span className="text-gray-700 font-medium">{sc.label}</span>
                                                </label>
                                            ))}
                                        </div>
                                        <div className="mt-4">
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                Otros Servicios / Observaciones
                                            </label>
                                            <input
                                                type="text"
                                                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-gray-900"
                                                placeholder="Ej: Jardinero, Seguridad Privada, Piletero..."
                                                value={otroServicio}
                                                onChange={(e) => handleOtroServicioChange(e.target.value)}
                                            />
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1">
                                        <TextAreaInput
                                            label="Estado del Inmueble / Inventario"
                                            value={editData.estadoInmueble || ''}
                                            onChange={(value: string) => handleEditChange("estadoInmueble", value)}
                                            placeholder="Descripción del estado del inmueble al inicio del contrato, inventario de muebles, electrodomésticos, etc."
                                            maxLength={500}
                                            required={false}
                                            rows={6}
                                        />
                                    </div>
                                </div>
                            ) : (
                                /* READ ONLY VIEW */
                                <div className="space-y-6">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                        {/* COLUMN 1 */}
                                        <div className="space-y-6">
                                            <div className="pb-4 border-b border-gray-100">
                                                <h3 className="text-sm font-semibold text-indigo-600 mb-4 uppercase tracking-wider">Detalles Principales</h3>
                                                <div className="space-y-4 text-sm">
                                                    <p><span className="text-gray-500">Fecha Inicio:</span> <span className="font-medium text-gray-900 ml-2">{new Date(alquiler.fechaInicio).toLocaleDateString()}</span></p>
                                                    <p><span className="text-gray-500">Fecha Fin:</span> <span className="font-medium text-gray-900 ml-2">{new Date(alquiler.fechaFin).toLocaleDateString()}</span></p>
                                                    <p><span className="text-gray-500">Monto Mensual:</span> <span className="font-medium text-gray-900 ml-2">${alquiler.montoMensual?.toLocaleString()} {alquiler.monedaAlquiler}</span></p>
                                                    <p><span className="text-gray-500">Vencimiento:</span> <span className="font-medium text-gray-900 ml-2">Día {alquiler.diaVencimiento}</span></p>
                                                    <p><span className="text-gray-500">Ajuste:</span> <span className="font-medium text-gray-900 ml-2">{alquiler.ajusteTipo} {alquiler.ajusteValor ? `(${alquiler.ajusteValor}%)` : ''} ({alquiler.ajusteFrecuencia} meses)</span></p>
                                                </div>
                                            </div>

                                            <div className="pb-4 border-b border-gray-100">
                                                <h3 className="text-sm font-semibold text-indigo-600 mb-4 uppercase tracking-wider">Honorarios y Punitorios</h3>
                                                <div className="space-y-4 text-sm">
                                                    <p>
                                                        <span className="text-gray-500">Honorarios:</span>
                                                        <span className="font-medium text-gray-900 ml-2">
                                                            {alquiler.honorariosTipo === 'fijo'
                                                                ? `$${alquiler.honorariosValor?.toLocaleString()} (Mensual)`
                                                                : `${alquiler.honorariosValor}% (Mensual)`}
                                                        </span>
                                                    </p>
                                                    <p>
                                                        <span className="text-gray-500">Punitorios (Mora):</span>
                                                        <span className="font-medium text-gray-900 ml-2">
                                                            {alquiler.punitoriosTipo === 'fijo'
                                                                ? `$${alquiler.punitoriosValor?.toLocaleString()} (Diario)`
                                                                : `${alquiler.punitoriosValor}% (Diario)`}
                                                        </span>
                                                    </p>
                                                </div>
                                            </div>

                                            <div>
                                                <h3 className="text-sm font-semibold text-indigo-600 mb-4 uppercase tracking-wider">Inquilino</h3>
                                                <div className="bg-gray-50 p-4 rounded-lg space-y-2 text-sm">
                                                    <p><span className="text-gray-500">Nombre:</span> <span className="font-medium text-gray-900 ml-2">{inquilino?.nombre || alquiler.nombreInquilino}</span></p>
                                                    <p><span className="text-gray-500">DNI:</span> <span className="font-medium text-gray-900 ml-2">{inquilino?.dni || alquiler.dniInquilino || '-'}</span></p>
                                                    <p className="text-gray-500 text-xs mt-2 pt-2 border-t border-gray-200">Editar datos en <Link href="/dashboard/clientes" className="text-indigo-600">Clientes</Link></p>
                                                </div>
                                            </div>
                                        </div>

                                        {/* COLUMN 2 */}
                                        <div className="space-y-6">
                                            <div className="pb-4 border-b border-gray-100">
                                                <h3 className="text-sm font-semibold text-indigo-600 mb-4 uppercase tracking-wider">Garantía</h3>
                                                <div className="space-y-2 text-sm">
                                                    <p><span className="text-gray-500">Tipo:</span> <span className="font-medium text-gray-900 capitalize ml-2">{alquiler.tipoGarantia?.replace('_', ' ')}</span></p>
                                                    {alquiler.tipoGarantia === 'garante' ? (
                                                        <>
                                                            <p><span className="text-gray-500">Nombre:</span> <span className="font-medium text-gray-900 ml-2">{alquiler.garante?.nombre}</span></p>
                                                            <p><span className="text-gray-500">DNI:</span> <span className="font-medium text-gray-900 ml-2">{alquiler.garante?.dni}</span></p>
                                                        </>
                                                    ) : (
                                                        <>
                                                            <p><span className="text-gray-500">Compañía:</span> <span className="font-medium text-gray-900 ml-2">{alquiler.seguroCaucion?.compania}</span></p>
                                                            <p><span className="text-gray-500">Póliza:</span> <span className="font-medium text-gray-900 ml-2">{alquiler.seguroCaucion?.numeroPoliza}</span></p>
                                                        </>
                                                    )}
                                                </div>
                                            </div>

                                            <div className="pb-4 border-b border-gray-100">
                                                <h3 className="text-sm font-semibold text-indigo-600 mb-4 uppercase tracking-wider">Servicios</h3>
                                                <div className="flex flex-wrap gap-2">
                                                    {alquiler.serviciosAdicionales && alquiler.serviciosAdicionales.length > 0 ? (
                                                        alquiler.serviciosAdicionales.map((s, i) => (
                                                            <span key={i} className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-full border border-gray-200">
                                                                {s}
                                                            </span>
                                                        ))
                                                    ) : <span className="text-gray-400 text-sm italic">Sin servicios adicionales</span>}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {activeTab === 'pagos' && alquiler && (
                    <div className="space-y-6">
                        <PaymentPlanTable
                            alquiler={alquiler}
                            inquilino={inquilino}
                            onUpdatePayment={handleUpdatePayment}
                            onUpdateContract={handleUpdateContract}
                        />
                    </div>
                )}



                {activeTab === 'mantenimiento' && (
                    <MaintenanceTab
                        incidencias={alquiler.incidencias || []}
                        onUpdateStatus={handleUpdateIncidenciaStatus}
                        onCreateIncidencia={handleCreateIncidencia}
                    />
                )}
            </div>
            {alquiler && (
                <ContractGeneratorPreviewModal
                    isOpen={showContractPreview}
                    onClose={() => setShowContractPreview(false)}
                    contract={alquiler}
                />
            )}
        </div>
    );
}
