"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { visitasService } from "@/infrastructure/services/visitasService";
import { Visita } from "@/domain/models/Visita";
import { ArrowLeft, MapPin, User, Calendar, Clock, Edit, Trash2, CheckCircle, Star, MessageCircle } from "lucide-react";
import Link from "next/link";

export default function VisitaDetailPage() {
    const params = useParams();
    const router = useRouter();
    const [visita, setVisita] = useState<Visita | null>(null);
    const [loading, setLoading] = useState(true);
    const [showPostVisitaForm, setShowPostVisitaForm] = useState(false);

    const [postVisitaData, setPostVisitaData] = useState({
        notasPostVisita: "",
        nivelInteres: 3 as 1 | 2 | 3 | 4 | 5,
        proximosPasos: "",
    });

    useEffect(() => {
        fetchVisita();
    }, [params.id]);

    const fetchVisita = async () => {
        try {
            const data = await visitasService.getVisitaById(params.id as string);
            setVisita(data);
        } catch (error) {
            console.error("Error fetching visita:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleCheckIn = async () => {
        if (!visita) return;

        try {
            await visitasService.checkIn(visita.id);
            await fetchVisita();
        } catch (error) {
            console.error("Error checking in:", error);
            alert("Error al hacer check-in");
        }
    };

    const handleCheckOut = async () => {
        if (!visita) return;

        try {
            await visitasService.checkOut(
                visita.id,
                postVisitaData.notasPostVisita,
                postVisitaData.nivelInteres,
                postVisitaData.proximosPasos
            );
            setShowPostVisitaForm(false);
            await fetchVisita();
        } catch (error) {
            console.error("Error checking out:", error);
            alert("Error al hacer check-out");
        }
    };

    const handleCancelar = async () => {
        if (!visita || !confirm("¿Estás seguro de cancelar esta visita?")) return;

        try {
            await visitasService.updateVisita(visita.id, { estado: 'cancelada' });
            await fetchVisita();
        } catch (error) {
            console.error("Error canceling visita:", error);
            alert("Error al cancelar la visita");
        }
    };

    const handleEliminar = async () => {
        if (!visita || !confirm("¿Estás seguro de eliminar esta visita?")) return;

        try {
            await visitasService.deleteVisita(visita.id);
            router.push("/dashboard/calendario");
        } catch (error) {
            console.error("Error deleting visita:", error);
            alert("Error al eliminar la visita");
        }
    };

    const handleWhatsAppReminder = () => {
        if (!visita || !visita.clienteTelefono) {
            alert("No hay teléfono del cliente disponible");
            return;
        }

        const date = new Date(visita.fechaHora).toLocaleDateString("es-AR", { weekday: 'long', day: 'numeric', month: 'long' });
        const time = new Date(visita.fechaHora).toLocaleTimeString("es-AR", { hour: '2-digit', minute: '2-digit' });

        const message = `Hola ${visita.clienteNombre}, te recordamos tu visita a la propiedad en ${visita.propiedadDireccion} el día ${date} a las ${time} hs. Por favor confirmar asistencia. Saludos, ${visita.agenteNombre}`;

        const whatsappUrl = `https://wa.me/${visita.clienteTelefono.replace(/\D/g, "")}?text=${encodeURIComponent(message)}`;

        window.open(whatsappUrl, "_blank");
    };

    const getEstadoBadge = (estado: string) => {
        const badges = {
            programada: 'bg-blue-100 text-blue-700',
            confirmada: 'bg-green-100 text-green-700',
            en_curso: 'bg-yellow-100 text-yellow-700',
            completada: 'bg-gray-100 text-gray-700',
            cancelada: 'bg-red-100 text-red-700',
            no_asistio: 'bg-orange-100 text-orange-700',
        };
        return badges[estado as keyof typeof badges] || badges.programada;
    };

    if (loading) {
        return (
            <div className="p-6 flex items-center justify-center min-h-[400px]">
                <div className="text-gray-500">Cargando visita...</div>
            </div>
        );
    }

    if (!visita) {
        return (
            <div className="p-6">
                <div className="text-center py-12">
                    <p className="text-gray-500">Visita no encontrada</p>
                    <Link href="/dashboard/calendario" className="text-indigo-600 hover:underline mt-4 inline-block">
                        Volver al calendario
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="p-6 max-w-4xl mx-auto space-y-6">
            {/* Header */}
            <div>
                <Link
                    href="/dashboard/calendario"
                    className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4"
                >
                    <ArrowLeft className="w-5 h-5" />
                    Volver al calendario
                </Link>
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">Detalle de Visita</h1>
                        <p className="text-gray-500">{visita.propiedadDireccion}</p>
                    </div>
                    <span className={`px-3 py-1 text-sm font-medium rounded-full ${getEstadoBadge(visita.estado)}`}>
                        {visita.estado.replace('_', ' ').toUpperCase()}
                    </span>
                </div>
            </div>

            {/* Main Info */}
            <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <h3 className="text-sm font-medium text-gray-500 mb-3">Propiedad</h3>
                        <div className="space-y-2">
                            <div className="flex items-center gap-2">
                                <MapPin className="w-4 h-4 text-gray-400" />
                                <span className="text-gray-900">{visita.propiedadDireccion}</span>
                            </div>
                            <div className="text-sm text-gray-600">Tipo: {visita.propiedadTipo}</div>
                        </div>
                    </div>

                    <div>
                        <h3 className="text-sm font-medium text-gray-500 mb-3">Cliente</h3>
                        <div className="space-y-2">
                            <div className="flex items-center gap-2">
                                <User className="w-4 h-4 text-gray-400" />
                                <span className="text-gray-900">{visita.clienteNombre}</span>
                            </div>
                            <div className="text-sm text-gray-600">{visita.clienteEmail}</div>
                            <div className="text-sm text-gray-600">{visita.clienteTelefono}</div>
                        </div>
                    </div>

                    <div>
                        <h3 className="text-sm font-medium text-gray-500 mb-3">Fecha y Hora</h3>
                        <div className="space-y-2">
                            <div className="flex items-center gap-2">
                                <Calendar className="w-4 h-4 text-gray-400" />
                                <span className="text-gray-900">
                                    {new Date(visita.fechaHora).toLocaleDateString('es-AR', {
                                        weekday: 'long',
                                        year: 'numeric',
                                        month: 'long',
                                        day: 'numeric'
                                    })}
                                </span>
                            </div>
                            <div className="flex items-center gap-2">
                                <Clock className="w-4 h-4 text-gray-400" />
                                <span className="text-gray-900">
                                    {new Date(visita.fechaHora).toLocaleTimeString('es-AR', {
                                        hour: '2-digit',
                                        minute: '2-digit'
                                    })} ({visita.duracion} min)
                                </span>
                            </div>
                        </div>
                    </div>

                    <div>
                        <h3 className="text-sm font-medium text-gray-500 mb-3">Agente</h3>
                        <div className="text-gray-900">{visita.agenteNombre}</div>
                    </div>
                </div>

                {visita.notasPrevias && (
                    <div className="pt-4 border-t border-gray-200">
                        <h3 className="text-sm font-medium text-gray-500 mb-2">Notas Previas</h3>
                        <p className="text-gray-700">{visita.notasPrevias}</p>
                    </div>
                )}
            </div>

            {/* Check-in/Check-out Info */}
            {(visita.checkInHora || visita.checkOutHora) && (
                <div className="bg-white rounded-xl border border-gray-200 p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Registro de Visita</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {visita.checkInHora && (
                            <div>
                                <div className="text-sm text-gray-500">Check-in</div>
                                <div className="text-gray-900">
                                    {new Date(visita.checkInHora).toLocaleTimeString('es-AR')}
                                </div>
                            </div>
                        )}
                        {visita.checkOutHora && (
                            <div>
                                <div className="text-sm text-gray-500">Check-out</div>
                                <div className="text-gray-900">
                                    {new Date(visita.checkOutHora).toLocaleTimeString('es-AR')}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Post-visita Info */}
            {visita.estado === 'completada' && visita.notasPostVisita && (
                <div className="bg-white rounded-xl border border-gray-200 p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Resultado de la Visita</h3>

                    {visita.nivelInteres && (
                        <div className="mb-4">
                            <div className="text-sm text-gray-500 mb-2">Nivel de Interés</div>
                            <div className="flex gap-1">
                                {[1, 2, 3, 4, 5].map(n => (
                                    <Star
                                        key={n}
                                        className={`w-5 h-5 ${n <= visita.nivelInteres!
                                            ? 'text-yellow-400 fill-yellow-400'
                                            : 'text-gray-300'
                                            }`}
                                    />
                                ))}
                            </div>
                        </div>
                    )}

                    <div className="mb-4">
                        <div className="text-sm text-gray-500 mb-2">Notas</div>
                        <p className="text-gray-700">{visita.notasPostVisita}</p>
                    </div>

                    {visita.proximosPasos && (
                        <div>
                            <div className="text-sm text-gray-500 mb-2">Próximos Pasos</div>
                            <p className="text-gray-700">{visita.proximosPasos}</p>
                        </div>
                    )}
                </div>
            )}

            {/* Post-visita Form */}
            {showPostVisitaForm && (
                <div className="bg-white rounded-xl border border-gray-200 p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Completar Visita</h3>

                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Nivel de Interés *
                            </label>
                            <div className="flex gap-2">
                                {[1, 2, 3, 4, 5].map(n => (
                                    <button
                                        key={n}
                                        type="button"
                                        onClick={() => setPostVisitaData(prev => ({ ...prev, nivelInteres: n as any }))}
                                        className="p-2"
                                    >
                                        <Star
                                            className={`w-8 h-8 ${n <= postVisitaData.nivelInteres
                                                ? 'text-yellow-400 fill-yellow-400'
                                                : 'text-gray-300'
                                                }`}
                                        />
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Notas de la Visita *
                            </label>
                            <textarea
                                rows={4}
                                required
                                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 text-gray-900 bg-white"
                                value={postVisitaData.notasPostVisita}
                                onChange={(e) => setPostVisitaData(prev => ({ ...prev, notasPostVisita: e.target.value }))}
                                placeholder="¿Cómo fue la visita? ¿Qué comentó el cliente?"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Próximos Pasos
                            </label>
                            <textarea
                                rows={3}
                                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 text-gray-900 bg-white"
                                value={postVisitaData.proximosPasos}
                                onChange={(e) => setPostVisitaData(prev => ({ ...prev, proximosPasos: e.target.value }))}
                                placeholder="¿Qué sigue? ¿Hay que hacer seguimiento?"
                            />
                        </div>

                        <div className="flex justify-end gap-3">
                            <button
                                onClick={() => setShowPostVisitaForm(false)}
                                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={handleCheckOut}
                                disabled={!postVisitaData.notasPostVisita}
                                className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50"
                            >
                                Completar Visita
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Actions */}
            <div className="bg-white rounded-xl border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Acciones</h3>
                <div className="flex flex-wrap gap-3">
                    {visita.estado === 'programada' && (
                        <button
                            onClick={handleCheckIn}
                            className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                        >
                            <CheckCircle className="w-5 h-5" />
                            Check-in
                        </button>
                    )}

                    {visita.estado === 'en_curso' && (
                        <button
                            onClick={() => setShowPostVisitaForm(true)}
                            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
                        >
                            <CheckCircle className="w-5 h-5" />
                            Check-out
                        </button>
                    )}

                    {visita.estado !== 'completada' && visita.estado !== 'cancelada' && (
                        <button
                            onClick={handleCancelar}
                            className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                        >
                            Cancelar Visita
                        </button>
                    )}


                    <button
                        onClick={handleWhatsAppReminder}
                        className="flex items-center gap-2 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600"
                    >
                        <MessageCircle className="w-5 h-5" />
                        Recordatorio WhatsApp
                    </button>

                    <button
                        onClick={handleEliminar}
                        className="flex items-center gap-2 px-4 py-2 border border-red-300 text-red-700 rounded-lg hover:bg-red-50"
                    >
                        <Trash2 className="w-5 h-5" />
                        Eliminar
                    </button>
                </div>
            </div>
        </div>
    );
}
