"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { alquileresService } from "@/infrastructure/services/alquileresService";
import { Alquiler, Pago, Incidencia } from "@/domain/models/Alquiler";
import PaymentPlanTable from "../components/PaymentPlanTable";
import MaintenanceTab from "../components/MaintenanceTab";
import UploadDocuments from "../components/UploadDocuments";
import { contractDocxService } from "@/infrastructure/services/contractDocxService";
import { ArrowLeft, FileText, DollarSign, Wrench, Edit, Save, X, Download, Pause, Check, MoreVertical, Trash2, AlertCircle } from "lucide-react";
import Link from "next/link";

export default function AlquilerDetailPage() {
    const params = useParams();
    const router = useRouter();
    const [alquiler, setAlquiler] = useState<Alquiler | null>(null);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'info' | 'pagos' | 'documentos' | 'mantenimiento'>('info');
    const [isEditing, setIsEditing] = useState(false);
    const [editData, setEditData] = useState<Partial<Alquiler>>({});
    const [showContractModal, setShowContractModal] = useState(false);
    const [showMenu, setShowMenu] = useState(false);

    useEffect(() => {
        const fetchAlquiler = async () => {
            try {
                const data = await alquileresService.getAlquilerById(params.id as string);
                setAlquiler(data);
                // Fix: Handle null data safely. If data is null, default to empty object.
                setEditData(data || {});
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

    const handleDocumentsUploaded = async (urls: string[]) => {
        if (!alquiler) return;

        try {
            const updatedDocuments = [...alquiler.documentos, ...urls];
            await alquileresService.updateAlquiler(alquiler.id, { documentos: updatedDocuments });
            const updated = await alquileresService.getAlquilerById(alquiler.id);
            if (updated) {
                setAlquiler(updated);
            }
        } catch (error) {
            console.error("Error updating documents:", error);
            alert("Error al actualizar documentos");
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
        { id: 'info', label: 'Información', icon: FileText },
        { id: 'pagos', label: 'Pagos', icon: DollarSign },
        { id: 'documentos', label: 'Documentos', icon: FileText },
        { id: 'mantenimiento', label: 'Mantenimiento', icon: Wrench },
    ] as const;

    return (
        <div className="p-6 max-w-7xl mx-auto space-y-6">
            {/* Header */}
            <div className="flex items-center gap-4">
                <Link
                    href="/dashboard/alquileres"
                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                    <ArrowLeft className="w-5 h-5" />
                </Link>
                <div className="flex-1">
                    <h1 className="text-2xl font-bold text-gray-900">{alquiler.direccion}</h1>
                    <p className="text-gray-500">{alquiler.propiedadTipo}</p>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                    {isEditing ? (
                        <>
                            <button
                                onClick={handleCancelEdit}
                                className="flex items-center gap-2 px-3 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium whitespace-nowrap"
                            >
                                <X className="w-4 h-4" />
                                Cancelar
                            </button>
                            <button
                                onClick={handleSaveEdit}
                                className="flex items-center gap-2 px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-medium whitespace-nowrap"
                            >
                                <Save className="w-4 h-4" />
                                Guardar
                            </button>
                        </>
                    ) : (
                        <>
                            <button
                                onClick={() => { setIsEditing(true); setEditData({ ...alquiler }); }}
                                className="flex items-center gap-2 px-3 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium whitespace-nowrap"
                            >
                                <Edit className="w-4 h-4" />
                                Editar
                            </button>

                            <div className="relative">
                                <button
                                    onClick={() => setShowMenu(!showMenu)}
                                    className="p-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                                    title="Más acciones"
                                >
                                    <MoreVertical className="w-5 h-5" />
                                </button>

                                {showMenu && (
                                    <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-100 py-1 z-50">
                                        <button
                                            onClick={() => { setShowMenu(false); handleDownloadContract(); }}
                                            className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                                        >
                                            <Download className="w-4 h-4" />
                                            Descargar Contrato
                                        </button>

                                        {alquiler.estado === 'activo' && (
                                            <button
                                                onClick={() => { setShowMenu(false); handleSuspender(); }}
                                                className="w-full text-left px-4 py-2 text-sm text-orange-700 hover:bg-orange-50 flex items-center gap-2"
                                            >
                                                <Pause className="w-4 h-4" />
                                                Suspender
                                            </button>
                                        )}

                                        {alquiler.estado === 'suspendido' && (
                                            <button
                                                onClick={() => { setShowMenu(false); handleActivar(); }}
                                                className="w-full text-left px-4 py-2 text-sm text-green-700 hover:bg-green-50 flex items-center gap-2"
                                            >
                                                <Check className="w-4 h-4" />
                                                Activar
                                            </button>
                                        )}

                                        <div className="border-t border-gray-100 my-1"></div>

                                        <button
                                            onClick={() => { setShowMenu(false); handleFinalizarContrato(); }}
                                            className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                            Finalizar Contrato
                                        </button>
                                    </div>
                                )}
                            </div>
                        </>
                    )}

                    <span className={`px-3 py-1 text-sm font-medium rounded-full whitespace-nowrap ${alquiler.estado === 'activo' ? 'bg-green-100 text-green-700' :
                        alquiler.estado === 'pendiente' ? 'bg-yellow-100 text-yellow-700' :
                            alquiler.estado === 'suspendido' ? 'bg-orange-100 text-orange-700' :
                                'bg-gray-100 text-gray-700'
                        }`}>
                        {alquiler.estado}
                    </span>
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
                            <div className="mb-6">
                                <h2 className="text-lg font-semibold text-gray-900">Información General</h2>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {/* Datos del Contrato */}
                                <div>
                                    <h3 className="text-sm font-medium text-gray-500 mb-3">Datos del Contrato</h3>
                                    <div className="space-y-2">
                                        <div className="flex justify-between">
                                            <span className="text-gray-600">Fecha Inicio:</span>
                                            {isEditing ? (
                                                <input
                                                    type="date"
                                                    className="px-2 py-1 border rounded"
                                                    value={editData.fechaInicio ? new Date(editData.fechaInicio).toISOString().split('T')[0] : ''}
                                                    onChange={(e) => setEditData({ ...editData, fechaInicio: new Date(e.target.value) })}
                                                />
                                            ) : (
                                                <span className="font-medium">{new Date(alquiler.fechaInicio).toLocaleDateString()}</span>
                                            )}
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-gray-600">Fecha Fin:</span>
                                            {isEditing ? (
                                                <input
                                                    type="date"
                                                    className="px-2 py-1 border rounded"
                                                    value={editData.fechaFin ? new Date(editData.fechaFin).toISOString().split('T')[0] : ''}
                                                    onChange={(e) => setEditData({ ...editData, fechaFin: new Date(e.target.value) })}
                                                />
                                            ) : (
                                                <span className="font-medium">{new Date(alquiler.fechaFin).toLocaleDateString()}</span>
                                            )}
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-gray-600">Monto Mensual:</span>
                                            {isEditing ? (
                                                <input
                                                    type="number"
                                                    className="px-2 py-1 border rounded w-32"
                                                    value={editData.montoMensual || ''}
                                                    onChange={(e) => setEditData({ ...editData, montoMensual: parseFloat(e.target.value) })}
                                                />
                                            ) : (
                                                <span className="font-medium text-lg">${alquiler.montoMensual.toLocaleString()}</span>
                                            )}
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-gray-600">Día Vencimiento:</span>
                                            {isEditing ? (
                                                <input
                                                    type="number"
                                                    min="1"
                                                    max="31"
                                                    className="px-2 py-1 border rounded w-20"
                                                    value={editData.diaVencimiento || ''}
                                                    onChange={(e) => setEditData({ ...editData, diaVencimiento: parseInt(e.target.value) })}
                                                />
                                            ) : (
                                                <span className="font-medium">{alquiler.diaVencimiento}</span>
                                            )}
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-gray-600">Tipo Ajuste:</span>
                                            <span className="font-medium">{alquiler.ajusteTipo}</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Datos del Inquilino - SOLO LECTURA */}
                                <div>
                                    <h3 className="text-sm font-medium text-gray-500 mb-3">Datos del Inquilino</h3>
                                    <p className="text-xs text-gray-400 mb-2">Los datos del inquilino se editan en el módulo Clientes</p>
                                    <div className="space-y-2">
                                        <div className="flex justify-between">
                                            <span className="text-gray-600">Nombre:</span>
                                            <span className="font-medium">{alquiler.nombreInquilino}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-gray-600">Contacto:</span>
                                            <span className="font-medium">{alquiler.contactoInquilino}</span>
                                        </div>
                                    </div>

                                    {/* Mostrar Garante o Seguro según corresponda */}
                                    {alquiler.tipoGarantia === 'garante' && alquiler.garante && (
                                        <>
                                            <h3 className="text-sm font-medium text-gray-500 mb-3 mt-6">Datos del Garante</h3>
                                            <div className="space-y-2">
                                                <div className="flex justify-between">
                                                    <span className="text-gray-600">Nombre:</span>
                                                    <span className="font-medium">{alquiler.garante.nombre}</span>
                                                </div>
                                                <div className="flex justify-between">
                                                    <span className="text-gray-600">Teléfono:</span>
                                                    <span className="font-medium">{alquiler.garante.telefono}</span>
                                                </div>
                                                <div className="flex justify-between">
                                                    <span className="text-gray-600">Email:</span>
                                                    <span className="font-medium">{alquiler.garante.email}</span>
                                                </div>
                                            </div>
                                        </>
                                    )}

                                    {alquiler.tipoGarantia === 'seguro_caucion' && alquiler.seguroCaucion && (
                                        <>
                                            <h3 className="text-sm font-medium text-gray-500 mb-3 mt-6">🛡️ Seguro de Caución</h3>
                                            <div className="space-y-2">
                                                <div className="flex justify-between">
                                                    <span className="text-gray-600">Compañía:</span>
                                                    <span className="font-medium">{alquiler.seguroCaucion.compania}</span>
                                                </div>
                                                <div className="flex justify-between">
                                                    <span className="text-gray-600">Póliza:</span>
                                                    <span className="font-medium">{alquiler.seguroCaucion.numeroPoliza}</span>
                                                </div>
                                                <div className="flex justify-between">
                                                    <span className="text-gray-600">Monto Asegurado:</span>
                                                    <span className="font-medium">${alquiler.seguroCaucion.montoAsegurado.toLocaleString()}</span>
                                                </div>
                                                <div className="flex justify-between">
                                                    <span className="text-gray-600">Vencimiento:</span>
                                                    <span className="font-medium">{new Date(alquiler.seguroCaucion.fechaVencimiento).toLocaleDateString()}</span>
                                                </div>
                                                <div className="flex justify-between">
                                                    <span className="text-gray-600">Contacto:</span>
                                                    <span className="font-medium">{alquiler.seguroCaucion.contactoCompania}</span>
                                                </div>
                                            </div>
                                        </>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'pagos' && (
                    <div className="space-y-6">
                        <PaymentPlanTable
                            alquiler={alquiler}
                            onUpdatePayment={handleUpdatePayment}
                        />
                    </div>
                )}

                {activeTab === 'documentos' && (
                    <UploadDocuments
                        alquilerId={alquiler.id}
                        inquilinoId={alquiler.inquilinoId}
                        onDocumentsUploaded={handleDocumentsUploaded}
                        existingDocuments={alquiler.documentos}
                    />
                )}

                {activeTab === 'mantenimiento' && (
                    <MaintenanceTab
                        incidencias={alquiler.incidencias || []}
                        onUpdateStatus={handleUpdateIncidenciaStatus}
                        onCreateIncidencia={handleCreateIncidencia}
                    />
                )}
            </div>
        </div>
    );
}
