"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { alquileresService } from "@/infrastructure/services/alquileresService";
import { Alquiler, Pago, Incidencia } from "@/domain/models/Alquiler";
import { inquilinosService } from "@/infrastructure/services/inquilinosService";
import { Inquilino } from "@/domain/models/Inquilino";
import PaymentPlanTable from "../components/PaymentPlanTable";
import MaintenanceTab from "../components/MaintenanceTab";
import LiquidacionesTab from "./components/LiquidacionesTab";

import { contractDocxService } from "@/infrastructure/services/contractDocxService";
import ContractGeneratorPreviewModal from "@/ui/components/modals/ContractGeneratorPreviewModal";
import { ArrowLeft, FileText, DollarSign, Wrench, Edit, Save, X, Download, Pause, Check, MoreVertical, Trash2, AlertCircle, Printer, Calendar, User, Shield, Percent, Clock, ExternalLink, TrendingUp } from "lucide-react";
import Link from "next/link";
import { TextInput, MoneyInput, TextAreaInput } from "@/ui/components/forms";

export default function AlquilerDetailPage() {
    const params = useParams();
    const router = useRouter();
    const [alquiler, setAlquiler] = useState<Alquiler | null>(null);
    const [inquilino, setInquilino] = useState<Inquilino | null>(null);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'info' | 'pagos' | 'liquidaciones' | 'documentos' | 'mantenimiento'>('pagos');
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
        const isCurrentlyPending = alquiler.historialPagos.find(p => p.id === updatedPayment.id)?.estado !== 'pagado';
        const isNowPaid = updatedPayment.estado === 'pagado';

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
            // Check if we just marked a payment as paid and we're not already on the liquidaciones tab
            if (isCurrentlyPending && isNowPaid && activeTab !== 'liquidaciones') {
                if (window.confirm("El cobro se ha registrado correctamente. ¿Deseas ir ahora a la pestaña de Liquidaciones para generar el pago al propietario?")) {
                    setActiveTab('liquidaciones');
                }
            }
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
                <div className="text-[var(--color-muted)]">Cargando contrato...</div>
            </div>
        );
    }

    if (!alquiler) {
        return (
            <div className="p-6">
                <div className="text-center py-12">
                    <p className="text-[var(--color-muted)]">Contrato no encontrado</p>
                    <Link href="/dashboard/alquileres" className="text-[var(--color-accent)] hover:underline mt-4 inline-block">
                        Volver a Alquileres
                    </Link>
                </div>
            </div>
        );
    }

    const tabs = [
        { id: 'pagos', label: 'Pagos', icon: DollarSign },
        { id: 'liquidaciones', label: 'Liquidaciones', icon: FileText },
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
                        className="p-2 -ml-2 hover:bg-[var(--color-paper-3)] rounded-xl transition-colors text-[var(--color-neutral)] hover:text-[var(--color-ink-2)]"
                    >
                        <ArrowLeft strokeWidth={1.5} className="w-6 h-6" />
                    </Link>
                    <div>
                        <div className="flex items-center gap-3 flex-wrap">
                            <h1 className="font-heading text-2xl sm:text-3xl font-bold text-[var(--color-ink)] tracking-tight leading-tight">
                                {alquiler.direccion}
                            </h1>
                            <span className={`px-2.5 py-1 text-[11px] font-bold rounded-lg uppercase tracking-wider border ${alquiler.estado === 'activo' ? 'bg-[var(--color-positive-soft)] text-[var(--color-positive)] border-[var(--color-positive)]/30' :
                                alquiler.estado === 'pendiente' ? 'bg-[var(--color-warning-soft)] text-[var(--color-warning)] border-[var(--color-warning)]/30' :
                                    alquiler.estado === 'suspendido' ? 'bg-[var(--color-warning-soft)] text-[var(--color-warning)] border-[var(--color-warning)]/30' :
                                        'bg-[var(--color-paper)] text-[var(--color-ink-2)] border-[var(--color-rule)]'
                                }`}>
                                {alquiler.estado}
                            </span>
                        </div>
                        {/* Rental Code Display */}
                        {alquiler.codigoAlquiler ? (
                            <div className="mt-1.5 flex flex-wrap items-center gap-2">
                                <p className="text-[var(--color-muted)] font-mono text-sm tracking-wide uppercase select-all bg-[var(--color-paper)] px-2 py-0.5 rounded border border-[var(--color-rule-2)]">
                                    {alquiler.codigoAlquiler}
                                </p>
                                <button
                                    onClick={() => {
                                        const domain = window.location.origin;
                                        const text = `Hola! Podés ver el estado de tu alquiler en: ${domain}/inquilino\n\nTu código de acceso es: *${alquiler.codigoAlquiler}*\nTu usuario es tu DNI.`;
                                        const url = `https://wa.me/?text=${encodeURIComponent(text)}`;
                                        window.open(url, '_blank');
                                    }}
                                    className="flex items-center gap-1 pl-2 pr-3 py-1 bg-[var(--color-positive-soft)] text-[var(--color-positive)] text-[10px] font-bold uppercase tracking-wider rounded-full hover:bg-[var(--color-positive-soft)] transition-colors border border-[var(--color-positive)]/30"
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
                                className="mt-1 text-xs border border-[var(--color-rule)] text-[var(--color-ink)] px-2 py-1 rounded border border-[var(--color-accent)]/30 hover:bg-[var(--color-paper-3)] transition-colors"
                            >
                                Generar Código Inquilino
                            </button>
                        )}
                        <p className="text-[var(--color-muted)] font-medium mt-1 flex items-center gap-2 text-sm">
                            <span className="w-1.5 h-1.5 rounded-full bg-[var(--color-paper-4)]"></span>
                            {alquiler.propiedadTipo}
                        </p>
                    </div>
                </div>

                <div className="relative">
                    <button
                        onClick={() => setShowMenu(!showMenu)}
                        className="p-2 hover:bg-[var(--color-paper-3)] rounded-xl transition-colors text-[var(--color-muted)] hover:text-[var(--color-ink)]"
                        title="Opciones"
                    >
                        <MoreVertical strokeWidth={1.5} className="w-5 h-5" />
                    </button>

                    {showMenu && (
                        <div className="absolute right-0 mt-2 w-56 bg-[var(--color-paper-2)] rounded-xl shadow-xl border border-[var(--color-rule-2)] py-1.5 z-50 animate-in fade-in zoom-in-95 duration-200 origin-top-right">
                            <div className="px-3 py-2 border-b border-[var(--color-rule-2)] mb-1">
                                <span className="text-xs font-semibold text-[var(--color-neutral)] uppercase tracking-wider">Acciones</span>
                            </div>
                            <button
                                onClick={() => { setShowMenu(false); handleDownloadContract(); }}
                                className="w-full text-left px-4 py-2.5 text-sm text-[var(--color-ink-2)] hover:bg-[var(--color-paper-3)] flex items-center gap-3 transition-colors"
                            >
                                <Download strokeWidth={1.5} className="w-4 h-4 text-[var(--color-neutral)]" />
                                Descargar Docx
                            </button>

                            <button
                                onClick={() => { setShowMenu(false); setShowContractPreview(true); }}
                                className="w-full text-left px-4 py-2.5 text-sm text-[var(--color-ink-2)] hover:bg-[var(--color-paper-3)] flex items-center gap-3 transition-colors"
                            >
                                <Printer strokeWidth={1.5} className="w-4 h-4 text-[var(--color-neutral)]" />
                                Vista Previa
                            </button>

                            {alquiler.estado === 'activo' && (
                                <button
                                    onClick={() => { setShowMenu(false); handleSuspender(); }}
                                    className="w-full text-left px-4 py-2.5 text-sm text-[var(--color-warning)] hover:bg-[var(--color-warning-soft)] flex items-center gap-3 transition-colors"
                                >
                                    <Pause strokeWidth={1.5} className="w-4 h-4" />
                                    Suspender Contrato
                                </button>
                            )}

                            {alquiler.estado === 'suspendido' && (
                                <button
                                    onClick={() => { setShowMenu(false); handleActivar(); }}
                                    className="w-full text-left px-4 py-2.5 text-sm text-[var(--color-positive)] hover:bg-[var(--color-positive-soft)] flex items-center gap-3 transition-colors"
                                >
                                    <Check strokeWidth={1.5} className="w-4 h-4" />
                                    Reactivar Contrato
                                </button>
                            )}

                            <div className="border-t border-[var(--color-rule-2)] my-1"></div>

                            <button
                                onClick={() => { setShowMenu(false); handleFinalizarContrato(); }}
                                className="w-full text-left px-4 py-2.5 text-sm text-[var(--color-danger)] hover:bg-[var(--color-danger-soft)] flex items-center gap-3 transition-colors"
                            >
                                <Trash2 strokeWidth={1.5} className="w-4 h-4" />
                                Finalizar Contrato
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {/* Tabs */}
            <div className="border-b border-[var(--color-rule)]">
                <div className="flex gap-4 overflow-x-auto">
                    {tabs.map(tab => {
                        const Icon = tab.icon;
                        return (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`flex items-center gap-2 px-4 py-3 border-b-2 transition-colors whitespace-nowrap ${activeTab === tab.id
                                    ? 'border-[var(--color-accent)] text-[var(--color-accent)] font-medium'
                                    : 'border-transparent text-[var(--color-ink-2)] hover:text-[var(--color-ink)]'
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
                        <div className="bg-[var(--color-paper-2)] rounded-xl border border-[var(--color-rule)] p-6">
                            <div className="mb-6 flex justify-between items-center">
                                <h2 className="text-lg font-semibold text-[var(--color-ink)]">Información del Contrato</h2>
                                <div>
                                    {isEditing ? (
                                        <div className="flex gap-2">
                                            <button onClick={handleCancelEdit} className="px-3 py-1.5 text-sm border rounded hover:bg-[var(--color-paper-3)] text-[var(--color-ink-2)]">Cancelar</button>
                                            <button onClick={handleSaveEdit} className="px-3 py-1.5 text-sm bg-[var(--color-positive)] text-[var(--color-accent-ink)] rounded hover:bg-[var(--color-positive)] flex items-center gap-1">
                                                <Save strokeWidth={1.5} size={14} /> Guardar
                                            </button>
                                        </div>
                                    ) : (
                                        <button
                                            onClick={() => { setIsEditing(true); setEditData({ ...alquiler }); }}
                                            className="px-3 py-1.5 text-sm border border-[var(--color-accent)]/30 text-[var(--color-accent)] bg-[var(--color-accent-soft)] rounded hover:bg-[var(--color-accent-soft)] flex items-center gap-2"
                                        >
                                            <Edit strokeWidth={1.5} size={14} /> Editar Contrato
                                        </button>
                                    )}
                                </div>
                            </div>

                            {isEditing ? (
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
                                                value={editData.fechaInicio ? new Date(editData.fechaInicio).toISOString().split('T')[0] : ''}
                                                onChange={(e) => handleEditChange("fechaInicio", new Date(e.target.value))}
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
                                                    <label className="block text-sm font-medium text-[var(--color-ink-2)] mb-2">Moneda</label>
                                                    <select
                                                        className="w-full p-3 border border-[var(--color-rule)] rounded-lg focus:ring-2 focus:ring-[var(--color-accent)]/40 focus:border-[var(--color-accent)] text-[var(--color-ink)]"
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
                                                    <label className="block text-sm font-medium text-[var(--color-ink-2)] mb-2">Moneda</label>
                                                    <select
                                                        className="w-full p-3 border border-[var(--color-rule)] rounded-lg focus:ring-2 focus:ring-[var(--color-accent)]/40 focus:border-[var(--color-accent)] text-[var(--color-ink)]"
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
                                            <label className="block text-sm font-medium text-[var(--color-ink-2)] mb-2">
                                                Día de Vencimiento *
                                            </label>
                                            <input
                                                type="number"
                                                required
                                                min="1"
                                                max="31"
                                                className="w-full p-3 border border-[var(--color-rule)] rounded-lg focus:ring-2 focus:ring-[var(--color-accent)]/40 focus:border-[var(--color-accent)] text-[var(--color-ink)]"
                                                value={editData.diaVencimiento}
                                                onChange={(e) => handleEditChange("diaVencimiento", parseInt(e.target.value))}
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-[var(--color-ink-2)] mb-2">
                                                Método de Pago Preferido
                                            </label>
                                            <select
                                                className="w-full p-3 border border-[var(--color-rule)] rounded-lg focus:ring-2 focus:ring-[var(--color-accent)]/40 focus:border-[var(--color-accent)] text-[var(--color-ink)]"
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
                                    <div className="bg-[var(--color-paper)] p-4 rounded-lg">
                                        <h3 className="text-sm font-medium text-[var(--color-ink)] mb-4">Honorarios de Inmobiliaria</h3>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-sm font-medium text-[var(--color-ink-2)] mb-2">
                                                    Tipo de Honorarios
                                                </label>
                                                <select
                                                    className="w-full p-3 border border-[var(--color-rule)] rounded-lg focus:ring-2 focus:ring-[var(--color-accent)]/40 focus:border-[var(--color-accent)] text-[var(--color-ink)]"
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
                                                        <label className="block text-sm font-medium text-[var(--color-ink-2)] mb-2">
                                                            % Mensual
                                                        </label>
                                                        <input
                                                            type="number"
                                                            step="0.1"
                                                            className="w-full p-3 border border-[var(--color-rule)] rounded-lg focus:ring-2 focus:ring-[var(--color-accent)]/40 focus:border-[var(--color-accent)] text-[var(--color-ink)]"
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
                                    <div className="bg-[var(--color-paper)] p-4 rounded-lg">
                                        <h3 className="text-sm font-medium text-[var(--color-ink)] mb-4">Intereses Punitorios</h3>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-sm font-medium text-[var(--color-ink-2)] mb-2">
                                                    Tipo de Interés
                                                </label>
                                                <select
                                                    className="w-full p-3 border border-[var(--color-rule)] rounded-lg focus:ring-2 focus:ring-[var(--color-accent)]/40 focus:border-[var(--color-accent)] text-[var(--color-ink)]"
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
                                                        <label className="block text-sm font-medium text-[var(--color-ink-2)] mb-2">
                                                            Porcentaje Diario (%)
                                                        </label>
                                                        <input
                                                            type="number"
                                                            step="0.01"
                                                            className="w-full p-3 border border-[var(--color-rule)] rounded-lg focus:ring-2 focus:ring-[var(--color-accent)]/40 focus:border-[var(--color-accent)] text-[var(--color-ink)]"
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
                                                            <label className="block text-sm font-medium text-[var(--color-ink-2)] mb-2">
                                                                Valor de Ajuste (%)
                                                            </label>
                                                            <input
                                                                type="number"
                                                                step="0.01"
                                                                className="w-full p-3 border border-[var(--color-rule)] rounded-lg focus:ring-2 focus:ring-[var(--color-accent)]/40 focus:border-[var(--color-accent)] text-[var(--color-ink)]"
                                                                value={editData.ajusteValor || ''}
                                                                onChange={(e) => handleEditChange("ajusteValor", parseFloat(e.target.value))}
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
                                                        <label className="block text-sm font-medium text-[var(--color-ink-2)] mb-2">
                                                            Primer Ajuste (Meses)
                                                        </label>
                                                        <input
                                                            type="number"
                                                            min="1"
                                                            className="w-full p-3 border border-[var(--color-rule)] rounded-lg focus:ring-2 focus:ring-[var(--color-accent)]/40 focus:border-[var(--color-accent)] text-[var(--color-ink)]"
                                                            value={editData.ajusteMesesPrimer || ''}
                                                            onChange={(e) => handleEditChange("ajusteMesesPrimer", parseInt(e.target.value) || null)}
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
                                                            value={editData.ajusteFrecuencia || ''}
                                                            onChange={(e) => handleEditChange("ajusteFrecuencia", parseInt(e.target.value))}
                                                        />
                                                    </div>
                                                </>
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
                                                        onChange={(e) => handleServiceChange(sc.key, e.target.checked)}
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
                                <div className="animate-in fade-in duration-300 space-y-8">
                                    {/* Key Metrics */}
                                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                                        <div className="bg-[var(--color-accent-soft)] p-4 rounded-xl border border-[var(--color-accent)]/30 flex flex-col justify-between group hover:border-[var(--color-accent)]/30 transition-colors">
                                            <div className="flex items-center gap-3 mb-2">
                                                <div className="p-2 bg-[var(--color-paper-2)] rounded-lg shadow-sm text-[var(--color-accent)] group-hover:scale-110 transition-transform">
                                                    <DollarSign strokeWidth={1.5} size={18} />
                                                </div>
                                                <span className="text-xs font-bold uppercase text-[var(--color-accent)] tracking-wider">Monto Mensual</span>
                                            </div>
                                            <div>
                                                <p className="text-2xl font-bold text-[var(--color-ink)] tracking-tight">${alquiler.montoMensual?.toLocaleString()}</p>
                                                <p className="text-xs text-[var(--color-muted)] font-medium mt-1">{alquiler.monedaAlquiler}</p>
                                            </div>
                                        </div>

                                        <div className="bg-[var(--color-accent-soft)] p-4 rounded-xl border border-[var(--color-accent)]/30 flex flex-col justify-between group hover:border-[var(--color-accent)]/30 transition-colors">
                                            <div className="flex items-center gap-3 mb-2">
                                                <div className="p-2 bg-[var(--color-paper-2)] rounded-lg shadow-sm text-[var(--color-accent)] group-hover:scale-110 transition-transform">
                                                    <Calendar strokeWidth={1.5} size={18} />
                                                </div>
                                                <span className="text-xs font-bold uppercase text-[var(--color-accent)] tracking-wider">Vencimiento</span>
                                            </div>
                                            <div>
                                                <p className="text-2xl font-bold text-[var(--color-ink)] tracking-tight">Día {alquiler.diaVencimiento}</p>
                                                <p className="text-xs text-[var(--color-muted)] font-medium mt-1">de cada mes</p>
                                            </div>
                                        </div>

                                        <div className="bg-[var(--color-positive-soft)] p-4 rounded-xl border border-[var(--color-positive)]/30 flex flex-col justify-between group hover:border-[var(--color-positive)]/30 transition-colors">
                                            <div className="flex items-center gap-3 mb-2">
                                                <div className="p-2 bg-[var(--color-paper-2)] rounded-lg shadow-sm text-[var(--color-positive)] group-hover:scale-110 transition-transform">
                                                    <TrendingUp strokeWidth={1.5} size={18} />
                                                </div>
                                                <span className="text-xs font-bold uppercase text-[var(--color-positive)] tracking-wider">Ajuste</span>
                                            </div>
                                            <div>
                                                <p className="text-lg font-bold text-[var(--color-ink)] tracking-tight leading-tight">
                                                    {alquiler.ajusteTipo === 'ICL' ? 'ICL' : alquiler.ajusteTipo === 'IPC' ? 'IPC' : alquiler.ajusteValor ? `${alquiler.ajusteValor}%` : alquiler.ajusteTipo}
                                                </p>
                                                <p className="text-xs text-[var(--color-muted)] font-medium mt-1">Cada {alquiler.ajusteFrecuencia} meses</p>
                                            </div>
                                        </div>

                                        <div className="bg-[var(--color-accent-soft)] p-4 rounded-xl border border-[var(--color-accent)]/30 flex flex-col justify-between group hover:border-[var(--color-accent)]/30 transition-colors">
                                            <div className="flex items-center gap-3 mb-2">
                                                <div className="p-2 bg-[var(--color-paper-2)] rounded-lg shadow-sm text-[var(--color-accent)] group-hover:scale-110 transition-transform">
                                                    <Clock strokeWidth={1.5} size={18} />
                                                </div>
                                                <span className="text-xs font-bold uppercase text-[var(--color-accent)] tracking-wider">Vigencia</span>
                                            </div>
                                            <div>
                                                <p className="text-sm font-semibold text-[var(--color-ink)]">{new Date(alquiler.fechaFin).toLocaleDateString()}</p>
                                                <p className="text-xs text-[var(--color-muted)] font-medium mt-1">Finaliza contrato</p>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                                        {/* Involucrados */}
                                        <div className="space-y-4">
                                            <h3 className="flex items-center gap-2 text-sm font-bold text-[var(--color-ink)] uppercase tracking-widest pl-1">
                                                <User strokeWidth={1.5} size={16} className="text-[var(--color-neutral)]" />
                                                Involucrados
                                            </h3>

                                            {/* Inquilino Card */}
                                            <div className="bg-[var(--color-paper-2)] border border-[var(--color-rule-2)] shadow-sm rounded-xl p-4 flex items-center gap-4 hover:shadow-md transition-shadow">
                                                <div className="w-12 h-12 rounded-full bg-[var(--color-paper-3)] flex items-center justify-center text-[var(--color-muted)] font-bold text-lg border-2 border-[var(--color-paper-2)] shadow-sm ring-1 ring-[var(--color-rule)]">
                                                    {inquilino?.nombre.charAt(0) || alquiler.nombreInquilino?.charAt(0) || "I"}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-[10px] text-[var(--color-accent)] font-bold uppercase tracking-wider mb-0.5">Inquilino</p>
                                                    <p className="font-semibold text-[var(--color-ink)] truncate">{inquilino?.nombre || alquiler.nombreInquilino}</p>
                                                    <p className="text-sm text-[var(--color-muted)] font-mono">{inquilino?.dni || alquiler.dniInquilino || '-'}</p>
                                                </div>
                                                <Link href="/dashboard/clientes" className="p-2 text-[var(--color-neutral)] hover:text-[var(--color-accent-2)] hover:bg-[var(--color-paper-3)] rounded-lg transition-colors" title="Ver perfil">
                                                    <ExternalLink strokeWidth={1.5} size={18} />
                                                </Link>
                                            </div>

                                            {/* Garantía Card */}
                                            <div className="bg-[var(--color-paper-2)] border border-[var(--color-rule-2)] shadow-sm rounded-xl p-4 flex items-center gap-4 hover:shadow-md transition-shadow">
                                                <div className="w-12 h-12 rounded-full bg-[var(--color-paper-3)] flex items-center justify-center text-[var(--color-muted)] font-bold border-2 border-[var(--color-paper-2)] ring-1 ring-[var(--color-warning)]/15">
                                                    <Shield strokeWidth={1.5} size={20} />
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-[10px] text-[var(--color-warning)] font-bold uppercase tracking-wider mb-0.5">
                                                        {alquiler.tipoGarantia === 'seguro_caucion' ? 'Seguro de Caución' : 'Garante'}
                                                    </p>
                                                    {alquiler.tipoGarantia === 'garante' ? (
                                                        <>
                                                            <p className="font-semibold text-[var(--color-ink)] truncate">{alquiler.garante?.nombre || 'Sin nombre'}</p>
                                                            <p className="text-sm text-[var(--color-muted)] font-mono">{alquiler.garante?.dni || '-'}</p>
                                                        </>
                                                    ) : (
                                                        <>
                                                            <p className="font-semibold text-[var(--color-ink)] truncate">{alquiler.seguroCaucion?.compania || 'Sin compañía'}</p>
                                                            <p className="text-sm text-[var(--color-muted)]">Póliza: {alquiler.seguroCaucion?.numeroPoliza || '-'}</p>
                                                        </>
                                                    )}
                                                </div>
                                            </div>
                                        </div>

                                        {/* Financial & Services */}
                                        <div className="space-y-4">
                                            <h3 className="flex items-center gap-2 text-sm font-bold text-[var(--color-ink)] uppercase tracking-widest pl-1">
                                                <FileText strokeWidth={1.5} size={16} className="text-[var(--color-neutral)]" />
                                                Condiciones y Servicios
                                            </h3>

                                            <div className="bg-[var(--color-paper)]/50 rounded-xl p-5 border border-[var(--color-rule-2)] space-y-4">
                                                {/* Honorarios */}
                                                <div className="flex justify-between items-center pb-3 border-b border-[var(--color-rule)]/60 last:border-0 last:pb-0">
                                                    <div className="flex items-center gap-3">
                                                        <div className="p-1.5 bg-[var(--color-paper-2)] rounded text-[var(--color-muted)] shadow-sm">
                                                            <Percent strokeWidth={1.5} size={14} />
                                                        </div>
                                                        <span className="text-sm text-[var(--color-ink-2)] font-medium">Honorarios</span>
                                                    </div>
                                                    <span className="text-sm font-semibold text-[var(--color-ink)]">
                                                        {alquiler.honorariosTipo === 'fijo'
                                                            ? `$${alquiler.honorariosValor?.toLocaleString()}`
                                                            : `${alquiler.honorariosValor}%`}
                                                        <span className="text-xs text-[var(--color-neutral)] font-normal ml-1">/ mes</span>
                                                    </span>
                                                </div>

                                                {/* Punitorios */}
                                                <div className="flex justify-between items-center pb-3 border-b border-[var(--color-rule)]/60 last:border-0 last:pb-0">
                                                    <div className="flex items-center gap-3">
                                                        <div className="p-1.5 bg-[var(--color-paper-2)] rounded text-[var(--color-muted)] shadow-sm">
                                                            <AlertCircle strokeWidth={1.5} size={14} />
                                                        </div>
                                                        <span className="text-sm text-[var(--color-ink-2)] font-medium">Punitorios (Diario)</span>
                                                    </div>
                                                    <span className="text-sm font-semibold text-[var(--color-ink)]">
                                                        {alquiler.punitoriosTipo === 'fijo'
                                                            ? `$${alquiler.punitoriosValor?.toLocaleString()}`
                                                            : `${alquiler.punitoriosValor}%`}
                                                    </span>
                                                </div>

                                                {/* Servicios */}
                                                <div className="pt-2">
                                                    <span className="text-xs font-semibold text-[var(--color-neutral)] uppercase tracking-wider block mb-3">Servicios Incluidos</span>
                                                    <div className="flex flex-wrap gap-2">
                                                        {alquiler.serviciosAdicionales && alquiler.serviciosAdicionales.length > 0 ? (
                                                            alquiler.serviciosAdicionales.map((s, i) => (
                                                                <span key={i} className="inline-flex items-center gap-1.5 px-3 py-1 bg-[var(--color-paper-2)] text-[var(--color-ink-2)] text-xs font-medium rounded-full border border-[var(--color-rule)] shadow-sm">
                                                                    <Check strokeWidth={1.5} size={10} className="text-[var(--color-muted)]" />
                                                                    {s}
                                                                </span>
                                                            ))
                                                        ) : (
                                                            <span className="text-xs text-[var(--color-neutral)] italic">No hay servicios adicionales especificados.</span>
                                                        )}
                                                    </div>
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

                {activeTab === 'liquidaciones' && alquiler && (
                    <div className="space-y-6">
                        <LiquidacionesTab
                            alquiler={alquiler}
                            onUpdateAlquiler={async (updates) => {
                                await handleUpdateContract(updates);
                            }}
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
