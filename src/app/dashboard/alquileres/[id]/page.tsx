"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { alquileresService } from "@/infrastructure/services/alquileresService";
import { Alquiler, Pago, Incidencia } from "@/domain/models/Alquiler";
import PaymentTable from "../components/PaymentTable";
import MaintenanceList from "../components/MaintenanceList";
import UploadDocuments from "../components/UploadDocuments";
import { ArrowLeft, FileText, DollarSign, Wrench, RefreshCw, Edit, Save, X } from "lucide-react";
import Link from "next/link";

export default function AlquilerDetailPage() {
    const params = useParams();
    const router = useRouter();
    const [alquiler, setAlquiler] = useState<Alquiler | null>(null);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'info' | 'pagos' | 'documentos' | 'mantenimiento' | 'renovacion'>('info');
    const [isEditing, setIsEditing] = useState(false);
    const [editData, setEditData] = useState<Partial<Alquiler>>({});

    useEffect(() => {
        const fetchAlquiler = async () => {
            try {
                const data = await alquileresService.getAlquilerById(params.id as string);
                setAlquiler(data);
                setEditData(data);
            } catch (error) {
                console.error("Error fetching contract:", error);
            } finally {
                setLoading(false);
            }
        };

        if (params.id) {
            fetchAlquiler();
        }
    }, [params.id]);

    const handleRegisterPayment = async (pagoId: string) => {
        if (!alquiler) return;

        const pago = alquiler.historialPagos.find(p => p.id === pagoId);
        if (!pago) return;

        const updatedPago: Pago = {
            ...pago,
            estado: 'pagado',
            fechaPago: new Date(),
        };

        try {
            await alquileresService.registrarPago(alquiler.id, updatedPago);
            const updated = await alquileresService.getAlquilerById(alquiler.id);
            setAlquiler(updated);
        } catch (error) {
            console.error("Error registering payment:", error);
            alert("Error al registrar el pago");
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
            setAlquiler(updated);
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
            setAlquiler(updated);
        } catch (error) {
            console.error("Error finalizing contract:", error);
            alert("Error al finalizar el contrato");
        }
    };

    const handleDocumentsUploaded = async (urls: string[]) => {
        if (!alquiler) return;

        try {
            const updatedDocuments = [...alquiler.documentos, ...urls];
            await alquileresService.updateAlquiler(alquiler.id, { documentos: updatedDocuments });
            const updated = await alquileresService.getAlquilerById(alquiler.id);
            setAlquiler(updated);
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
            setAlquiler(updated);
            setEditData(updated);
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
        { id: 'renovacion', label: 'Renovación', icon: RefreshCw },
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
                <span className={`px-3 py-1 text-sm font-medium rounded-full ${alquiler.estado === 'activo' ? 'bg-green-100 text-green-700' :
                        alquiler.estado === 'pendiente' ? 'bg-yellow-100 text-yellow-700' :
                            'bg-gray-100 text-gray-700'
                    }`}>
                    {alquiler.estado}
                </span>
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
                            <div className="flex items-center justify-between mb-6">
                                <h2 className="text-lg font-semibold text-gray-900">Información General</h2>
                                <div className="flex gap-2">
                                    {isEditing ? (
                                        <>
                                            <button
                                                onClick={handleCancelEdit}
                                                className="flex items-center gap-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm"
                                            >
                                                <X className="w-4 h-4" />
                                                Cancelar
                                            </button>
                                            <button
                                                onClick={handleSaveEdit}
                                                className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors text-sm"
                                            >
                                                <Save className="w-4 h-4" />
                                                Guardar
                                            </button>
                                        </>
                                    ) : (
                                        <>
                                            <button
                                                onClick={() => setIsEditing(true)}
                                                className="flex items-center gap-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm"
                                            >
                                                <Edit className="w-4 h-4" />
                                                Editar
                                            </button>
                                            {alquiler.estado === 'activo' && (
                                                <button
                                                    onClick={handleFinalizarContrato}
                                                    className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm"
                                                >
                                                    Finalizar Contrato
                                                </button>
                                            )}
                                        </>
                                    )}
                                </div>
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

                                {/* Datos del Inquilino y Garantía */}
                                <div>
                                    <h3 className="text-sm font-medium text-gray-500 mb-3">Datos del Inquilino</h3>
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
                        <PaymentTable
                            payments={alquiler.historialPagos}
                            onRegisterPayment={handleRegisterPayment}
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
                    <div className="space-y-6">
                        <MaintenanceList
                            incidencias={alquiler.incidencias || []}
                            onUpdateStatus={handleUpdateIncidenciaStatus}
                        />
                    </div>
                )}

                {activeTab === 'renovacion' && (
                    <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
                        <RefreshCw className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                        <p className="text-gray-500 mb-4">Funcionalidad de renovación próximamente</p>
                        <button className="px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors">
                            Generar Propuesta de Renovación
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
