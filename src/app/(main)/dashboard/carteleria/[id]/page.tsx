"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "@/infrastructure/firebase/client";
import {
    ArrowLeft, Loader2, Edit2, Trash2, Camera, Plus, Home, Package,
    Wrench, AlertTriangle, XCircle, Ban, Clock, MapPin, DollarSign,
} from "lucide-react";
import { carteleriaService } from "@/infrastructure/services/carteleriaService";
import {
    Cartel, CartelEstado, CARTEL_ESTADO_LABELS, CARTEL_TIPO_LABELS,
    CARTEL_MATERIAL_LABELS, CARTEL_MEDIDA_LABELS,
} from "@/domain/models/Cartel";
import CartelModal from "../components/CartelModal";
import CartelPropertySelector from "../components/CartelPropertySelector";

const ESTADO_BADGE: Record<CartelEstado, string> = {
    instalado: "bg-green-100 text-green-700 border-green-200",
    almacen: "bg-gray-100 text-gray-700 border-gray-200",
    reparacion: "bg-amber-100 text-amber-700 border-amber-200",
    retirar: "bg-orange-100 text-orange-700 border-orange-200",
    roto: "bg-red-100 text-red-700 border-red-200",
    perdido: "bg-red-100 text-red-700 border-red-200",
};

const formatCurrency = (value: number) =>
    new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS", maximumFractionDigits: 0 }).format(value);

const formatDate = (date: Date) =>
    new Date(date).toLocaleDateString("es-AR", { day: "2-digit", month: "short", year: "numeric" });

type Tab = "info" | "fotos" | "historial";

export default function CartelDetailPage() {
    const { id } = useParams<{ id: string }>();
    const router = useRouter();
    const [userId, setUserId] = useState<string | null>(null);
    const [cartel, setCartel] = useState<Cartel | null>(null);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<Tab>("info");
    const [editModalOpen, setEditModalOpen] = useState(false);
    const [showInstalarSelector, setShowInstalarSelector] = useState(false);
    const [showAlmacenPrompt, setShowAlmacenPrompt] = useState(false);
    const [ubicacionAlmacenInput, setUbicacionAlmacenInput] = useState("");
    const [uploadingPhoto, setUploadingPhoto] = useState(false);
    const [actionLoading, setActionLoading] = useState(false);

    useEffect(() => {
        if (!auth) return;
        const unsub = onAuthStateChanged(auth, (u) => {
            if (u) setUserId(u.uid);
        });
        return () => unsub();
    }, []);

    useEffect(() => {
        if (id) load();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [id]);

    const load = async () => {
        setLoading(true);
        try {
            const data = await carteleriaService.getCartelById(id);
            setCartel(data);
        } catch (error) {
            console.error("Error loading cartel:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleCambiarEstado = async (nuevoEstado: CartelEstado, opts: any = {}) => {
        if (!cartel) return;
        setActionLoading(true);
        try {
            await carteleriaService.cambiarEstado(cartel.id, nuevoEstado, opts);
            await load();
            setShowInstalarSelector(false);
            setShowAlmacenPrompt(false);
            setUbicacionAlmacenInput("");
        } catch (error) {
            console.error("Error changing state:", error);
            alert("Error al cambiar el estado");
        } finally {
            setActionLoading(false);
        }
    };

    const handleDelete = async () => {
        if (!cartel) return;
        if (!confirm(`¿Eliminar el cartel ${cartel.codigo}? Esta acción no se puede deshacer.`)) return;
        try {
            await carteleriaService.deleteCartel(cartel.id);
            router.push("/dashboard/carteleria");
        } catch (error) {
            console.error("Error deleting cartel:", error);
        }
    };

    const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file || !cartel) return;
        setUploadingPhoto(true);
        try {
            const url = await carteleriaService.uploadFoto(file, cartel.id);
            await carteleriaService.updateCartel(cartel.id, { fotos: [...cartel.fotos, url] });
            await load();
        } catch (error) {
            console.error("Error uploading photo:", error);
        } finally {
            setUploadingPhoto(false);
        }
    };

    if (loading) {
        return (
            <div className="p-8 flex items-center justify-center h-64">
                <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
            </div>
        );
    }

    if (!cartel) {
        return (
            <div className="p-8 text-center text-gray-500">
                Cartel no encontrado.
                <br />
                <button onClick={() => router.push("/dashboard/carteleria")} className="text-indigo-600 font-semibold mt-2 hover:underline">
                    Volver a Cartelería
                </button>
            </div>
        );
    }

    return (
        <div className="p-6 max-w-5xl mx-auto space-y-6">
            {/* Header */}
            <div className="flex items-start justify-between flex-wrap gap-4">
                <div className="flex items-start gap-3">
                    <button
                        onClick={() => router.push("/dashboard/carteleria")}
                        className="mt-1 p-2 hover:bg-gray-100 rounded-lg text-gray-500 transition"
                    >
                        <ArrowLeft size={18} />
                    </button>
                    <div>
                        <div className="flex items-center gap-2 mb-1">
                            <h1 className="text-2xl font-bold text-gray-900">{cartel.codigo}</h1>
                            <span className={`text-xs font-bold uppercase tracking-wide px-2.5 py-1 rounded-full border ${ESTADO_BADGE[cartel.estado]}`}>
                                {CARTEL_ESTADO_LABELS[cartel.estado]}
                            </span>
                        </div>
                        <p className="text-gray-500 text-sm">
                            {CARTEL_TIPO_LABELS[cartel.tipo]} · {CARTEL_MEDIDA_LABELS[cartel.medida]}
                            {cartel.medida === "personalizada" && cartel.medidaPersonalizada ? ` (${cartel.medidaPersonalizada})` : ""}
                        </p>
                    </div>
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={() => setEditModalOpen(true)}
                        className="flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-xl text-sm font-semibold text-gray-700 hover:bg-gray-50 transition"
                    >
                        <Edit2 size={14} /> Editar
                    </button>
                    <button
                        onClick={handleDelete}
                        className="flex items-center gap-2 px-4 py-2 border border-red-100 text-red-600 rounded-xl text-sm font-semibold hover:bg-red-50 transition"
                    >
                        <Trash2 size={14} /> Eliminar
                    </button>
                </div>
            </div>

            {/* Ubicación actual */}
            <div className="bg-white rounded-2xl border border-gray-100 p-5 flex items-center gap-3 shadow-sm">
                <div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center flex-shrink-0">
                    <MapPin size={18} className="text-indigo-600" />
                </div>
                <div>
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Ubicación actual</p>
                    <p className="font-semibold text-gray-900">
                        {cartel.estado === "instalado" && cartel.propiedadDireccion
                            ? cartel.propiedadDireccion
                            : cartel.estado === "almacen" && cartel.ubicacionAlmacen
                                ? cartel.ubicacionAlmacen
                                : cartel.estado === "almacen"
                                    ? "Almacén (sin ubicación específica)"
                                    : "Sin ubicación registrada"}
                    </p>
                </div>
            </div>

            {/* Quick actions */}
            <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
                <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">Cambiar estado</p>
                <div className="flex flex-wrap gap-2">
                    <ActionButton
                        icon={Home}
                        label="Marcar instalado"
                        disabled={actionLoading || cartel.estado === "instalado"}
                        onClick={() => setShowInstalarSelector(true)}
                    />
                    <ActionButton
                        icon={Package}
                        label="Enviar a almacén"
                        disabled={actionLoading || cartel.estado === "almacen"}
                        onClick={() => {
                            setUbicacionAlmacenInput(cartel.ubicacionAlmacen || "");
                            setShowAlmacenPrompt(true);
                        }}
                    />
                    <ActionButton
                        icon={Wrench}
                        label="Enviar a reparación"
                        disabled={actionLoading || cartel.estado === "reparacion"}
                        onClick={() => handleCambiarEstado("reparacion")}
                    />
                    <ActionButton
                        icon={AlertTriangle}
                        label="Marcar a retirar"
                        disabled={actionLoading || cartel.estado === "retirar"}
                        onClick={() => handleCambiarEstado("retirar")}
                    />
                    <ActionButton
                        icon={Ban}
                        label="Marcar roto"
                        disabled={actionLoading || cartel.estado === "roto"}
                        onClick={() => handleCambiarEstado("roto")}
                        danger
                    />
                    <ActionButton
                        icon={XCircle}
                        label="Marcar perdido"
                        disabled={actionLoading || cartel.estado === "perdido"}
                        onClick={() => handleCambiarEstado("perdido")}
                        danger
                    />
                </div>

                {showInstalarSelector && (
                    <div className="mt-4 p-4 bg-indigo-50/50 border border-indigo-100 rounded-xl">
                        <p className="text-sm font-semibold text-gray-700 mb-2">Seleccioná la propiedad donde se instala</p>
                        <div className="flex gap-2 items-start">
                            <div className="flex-1">
                                <CartelPropertySelector
                                    userId={cartel.userId}
                                    value=""
                                    onSelect={(propId, direccion) =>
                                        handleCambiarEstado("instalado", { propiedadId: propId, propiedadDireccion: direccion })
                                    }
                                />
                            </div>
                            <button
                                onClick={() => setShowInstalarSelector(false)}
                                className="px-3 py-2 text-sm text-gray-500 hover:text-gray-700"
                            >
                                Cancelar
                            </button>
                        </div>
                    </div>
                )}

                {showAlmacenPrompt && (
                    <div className="mt-4 p-4 bg-gray-50 border border-gray-200 rounded-xl">
                        <p className="text-sm font-semibold text-gray-700 mb-2">¿Dónde lo guardás? (opcional)</p>
                        <div className="flex gap-2 items-start">
                            <input
                                type="text"
                                autoFocus
                                placeholder="Ej: Depósito Oeste, estante 3"
                                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 text-gray-900 text-sm"
                                value={ubicacionAlmacenInput}
                                onChange={(e) => setUbicacionAlmacenInput(e.target.value)}
                            />
                            <button
                                onClick={() => handleCambiarEstado("almacen", { ubicacionAlmacen: ubicacionAlmacenInput || null })}
                                disabled={actionLoading}
                                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-semibold disabled:opacity-60"
                            >
                                Confirmar
                            </button>
                            <button
                                onClick={() => setShowAlmacenPrompt(false)}
                                className="px-3 py-2 text-sm text-gray-500 hover:text-gray-700"
                            >
                                Cancelar
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* Tabs */}
            <div className="flex gap-1 bg-gray-100 p-1 rounded-xl w-fit">
                {([
                    ["info", "Información"],
                    ["fotos", `Fotos (${cartel.fotos.length})`],
                    ["historial", `Historial (${cartel.historial.length})`],
                ] as [Tab, string][]).map(([key, label]) => (
                    <button
                        key={key}
                        onClick={() => setActiveTab(key)}
                        className={`px-4 py-2 text-sm font-medium rounded-lg transition-all ${activeTab === key ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"
                            }`}
                    >
                        {label}
                    </button>
                ))}
            </div>

            {activeTab === "info" && (
                <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm grid grid-cols-2 sm:grid-cols-3 gap-6">
                    <InfoField label="Material" value={cartel.materialPersonalizado || CARTEL_MATERIAL_LABELS[cartel.material]} />
                    <InfoField label="Medida" value={cartel.medidaPersonalizada || CARTEL_MEDIDA_LABELS[cartel.medida]} />
                    <InfoField label="Sucursal" value={cartel.branchId || "Sin asignar"} />
                    <InfoField label="Proveedor" value={cartel.proveedor || "—"} />
                    <InfoField label="Costo de adquisición" value={cartel.costoAdquisicion ? formatCurrency(cartel.costoAdquisicion) : "—"} />
                    <InfoField label="Costo de instalación" value={cartel.costoInstalacion ? formatCurrency(cartel.costoInstalacion) : "—"} />
                    <InfoField label="Fecha de instalación" value={cartel.fechaInstalacion ? formatDate(cartel.fechaInstalacion) : "—"} />
                    <InfoField label="Creado" value={formatDate(cartel.createdAt)} />
                    {cartel.notas && (
                        <div className="col-span-full">
                            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Notas</p>
                            <p className="text-sm text-gray-700">{cartel.notas}</p>
                        </div>
                    )}
                </div>
            )}

            {activeTab === "fotos" && (
                <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                        {cartel.fotos.map((foto, i) => (
                            <a key={i} href={foto} target="_blank" rel="noopener noreferrer" className="relative aspect-square rounded-xl overflow-hidden bg-gray-100 group">
                                <img src={foto} alt={`Foto ${i + 1}`} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                            </a>
                        ))}
                        <label className="relative aspect-square rounded-xl border-2 border-dashed border-gray-300 flex flex-col items-center justify-center gap-1 cursor-pointer hover:border-indigo-400 text-gray-400 hover:text-indigo-500 transition">
                            {uploadingPhoto ? <Loader2 size={20} className="animate-spin" /> : <Plus size={20} />}
                            <span className="text-xs font-medium">Agregar foto</span>
                            <input type="file" accept="image/*" className="hidden" onChange={handlePhotoUpload} disabled={uploadingPhoto} />
                        </label>
                    </div>
                    {cartel.fotos.length === 0 && (
                        <p className="text-center text-sm text-gray-400 mt-4">
                            <Camera size={24} className="mx-auto mb-2 text-gray-300" />
                            Todavía no hay fotos de este cartel.
                        </p>
                    )}
                </div>
            )}

            {activeTab === "historial" && (
                <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
                    <div className="space-y-4">
                        {[...cartel.historial].reverse().map((mov, i) => (
                            <div key={i} className="flex gap-3">
                                <div className="flex flex-col items-center">
                                    <div className="w-8 h-8 rounded-full bg-indigo-50 flex items-center justify-center flex-shrink-0">
                                        <Clock size={14} className="text-indigo-600" />
                                    </div>
                                    {i < cartel.historial.length - 1 && <div className="w-px flex-1 bg-gray-100 mt-1" />}
                                </div>
                                <div className="pb-4">
                                    <p className="text-sm font-semibold text-gray-900">
                                        {mov.estadoAnterior ? (
                                            <>
                                                {CARTEL_ESTADO_LABELS[mov.estadoAnterior]} → {CARTEL_ESTADO_LABELS[mov.estadoNuevo]}
                                            </>
                                        ) : (
                                            <>Alta como {CARTEL_ESTADO_LABELS[mov.estadoNuevo]}</>
                                        )}
                                    </p>
                                    {mov.propiedadDireccionNuevo && (
                                        <p className="text-xs text-gray-500">📍 {mov.propiedadDireccionNuevo}</p>
                                    )}
                                    {mov.nota && <p className="text-xs text-gray-500">{mov.nota}</p>}
                                    <p className="text-xs text-gray-400 mt-0.5">{formatDate(mov.fecha)}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {editModalOpen && userId && (
                <CartelModal
                    userId={userId}
                    editingCartel={cartel}
                    onClose={() => setEditModalOpen(false)}
                    onSaved={() => {
                        setEditModalOpen(false);
                        load();
                    }}
                />
            )}
        </div>
    );
}

function InfoField({ label, value }: { label: string; value: string }) {
    return (
        <div>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">{label}</p>
            <p className="text-sm font-semibold text-gray-900">{value}</p>
        </div>
    );
}

function ActionButton({
    icon: Icon, label, onClick, disabled, danger,
}: { icon: any; label: string; onClick: () => void; disabled?: boolean; danger?: boolean }) {
    return (
        <button
            onClick={onClick}
            disabled={disabled}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-sm font-medium border transition disabled:opacity-40 disabled:cursor-not-allowed ${danger
                    ? "border-red-100 text-red-600 hover:bg-red-50"
                    : "border-gray-200 text-gray-700 hover:bg-gray-50"
                }`}
        >
            <Icon size={14} /> {label}
        </button>
    );
}
