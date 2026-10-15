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
            programada: 'bg-[var(--color-accent-soft)] text-[var(--color-accent)]',
            confirmada: 'bg-[var(--color-positive-soft)] text-[var(--color-positive)]',
            en_curso: 'bg-[var(--color-warning-soft)] text-[var(--color-warning)]',
            completada: 'bg-[var(--color-paper-3)] text-[var(--color-ink-2)]',
            cancelada: 'bg-[var(--color-danger-soft)] text-[var(--color-danger)]',
            no_asistio: 'bg-[var(--color-warning-soft)] text-[var(--color-warning)]',
        };
        return badges[estado as keyof typeof badges] || badges.programada;
    };

    if (loading) {
        return (
            <div className="p-6 flex items-center justify-center min-h-[400px]">
                <div className="text-[var(--color-muted)]">Cargando visita...</div>
            </div>
        );
    }

    if (!visita) {
        return (
            <div className="p-6">
                <div className="text-center py-12">
                    <p className="text-[var(--color-muted)]">Visita no encontrada</p>
                    <Link href="/dashboard/calendario" className="text-[var(--color-accent)] hover:underline mt-4 inline-block">
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
                    className="flex items-center gap-2 text-[var(--color-ink-2)] hover:text-[var(--color-ink)] mb-4"
                >
                    <ArrowLeft strokeWidth={1.5} className="w-5 h-5" />
                    Volver al calendario
                </Link>
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="font-heading text-2xl font-bold text-[var(--color-ink)]">Detalle de Visita</h1>
                        <p className="text-[var(--color-muted)]">{visita.propiedadDireccion}</p>
                    </div>
                    <span className={`px-3 py-1 text-sm font-medium rounded-full ${getEstadoBadge(visita.estado)}`}>
                        {visita.estado.replace('_', ' ').toUpperCase()}
                    </span>
                </div>
            </div>

            {/* Main Info */}
            <div className="bg-[var(--color-paper-2)] rounded-xl border border-[var(--color-rule)] p-6 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <h3 className="text-sm font-medium text-[var(--color-muted)] mb-3">Propiedad</h3>
                        <div className="space-y-2">
                            <div className="flex items-center gap-2">
                                <MapPin strokeWidth={1.5} className="w-4 h-4 text-[var(--color-neutral)]" />
                                <span className="text-[var(--color-ink)]">{visita.propiedadDireccion}</span>
                            </div>
                            <div className="text-sm text-[var(--color-ink-2)]">Tipo: {visita.propiedadTipo}</div>
                        </div>
                    </div>

                    <div>
                        <h3 className="text-sm font-medium text-[var(--color-muted)] mb-3">Cliente</h3>
                        <div className="space-y-2">
                            <div className="flex items-center gap-2">
                                <User strokeWidth={1.5} className="w-4 h-4 text-[var(--color-neutral)]" />
                                <span className="text-[var(--color-ink)]">{visita.clienteNombre}</span>
                            </div>
                            <div className="text-sm text-[var(--color-ink-2)]">{visita.clienteEmail}</div>
                            <div className="text-sm text-[var(--color-ink-2)]">{visita.clienteTelefono}</div>
                        </div>
                    </div>

                    <div>
                        <h3 className="text-sm font-medium text-[var(--color-muted)] mb-3">Fecha y Hora</h3>
                        <div className="space-y-2">
                            <div className="flex items-center gap-2">
                                <Calendar strokeWidth={1.5} className="w-4 h-4 text-[var(--color-neutral)]" />
                                <span className="text-[var(--color-ink)]">
                                    {new Date(visita.fechaHora).toLocaleDateString('es-AR', {
                                        weekday: 'long',
                                        year: 'numeric',
                                        month: 'long',
                                        day: 'numeric'
                                    })}
                                </span>
                            </div>
                            <div className="flex items-center gap-2">
                                <Clock strokeWidth={1.5} className="w-4 h-4 text-[var(--color-neutral)]" />
                                <span className="text-[var(--color-ink)]">
                                    {new Date(visita.fechaHora).toLocaleTimeString('es-AR', {
                                        hour: '2-digit',
                                        minute: '2-digit'
                                    })} ({visita.duracion} min)
                                </span>
                            </div>
                        </div>
                    </div>

                    <div>
                        <h3 className="text-sm font-medium text-[var(--color-muted)] mb-3">Agente</h3>
                        <div className="text-[var(--color-ink)]">{visita.agenteNombre}</div>
                    </div>
                </div>

                {visita.notasPrevias && (
                    <div className="pt-4 border-t border-[var(--color-rule)]">
                        <h3 className="text-sm font-medium text-[var(--color-muted)] mb-2">Notas Previas</h3>
                        <p className="text-[var(--color-ink-2)]">{visita.notasPrevias}</p>
                    </div>
                )}
            </div>

            {/* Check-in/Check-out Info */}
            {(visita.checkInHora || visita.checkOutHora) && (
                <div className="bg-[var(--color-paper-2)] rounded-xl border border-[var(--color-rule)] p-6">
                    <h3 className="text-lg font-semibold text-[var(--color-ink)] mb-4">Registro de Visita</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {visita.checkInHora && (
                            <div>
                                <div className="text-sm text-[var(--color-muted)]">Check-in</div>
                                <div className="text-[var(--color-ink)]">
                                    {new Date(visita.checkInHora).toLocaleTimeString('es-AR')}
                                </div>
                            </div>
                        )}
                        {visita.checkOutHora && (
                            <div>
                                <div className="text-sm text-[var(--color-muted)]">Check-out</div>
                                <div className="text-[var(--color-ink)]">
                                    {new Date(visita.checkOutHora).toLocaleTimeString('es-AR')}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Post-visita Info */}
            {visita.estado === 'completada' && visita.notasPostVisita && (
                <div className="bg-[var(--color-paper-2)] rounded-xl border border-[var(--color-rule)] p-6">
                    <h3 className="text-lg font-semibold text-[var(--color-ink)] mb-4">Resultado de la Visita</h3>

                    {visita.nivelInteres && (
                        <div className="mb-4">
                            <div className="text-sm text-[var(--color-muted)] mb-2">Nivel de Interés</div>
                            <div className="flex gap-1">
                                {[1, 2, 3, 4, 5].map(n => (
                                    <Star
                                        key={n}
                                        className={`w-5 h-5 ${n <= visita.nivelInteres!
                                            ? 'text-[var(--color-warning)] fill-[var(--color-warning)]'
                                            : 'text-[var(--color-neutral)]'
                                            }`}
                                    />
                                ))}
                            </div>
                        </div>
                    )}

                    <div className="mb-4">
                        <div className="text-sm text-[var(--color-muted)] mb-2">Notas</div>
                        <p className="text-[var(--color-ink-2)]">{visita.notasPostVisita}</p>
                    </div>

                    {visita.proximosPasos && (
                        <div>
                            <div className="text-sm text-[var(--color-muted)] mb-2">Próximos Pasos</div>
                            <p className="text-[var(--color-ink-2)]">{visita.proximosPasos}</p>
                        </div>
                    )}
                </div>
            )}

            {/* Post-visita Form */}
            {showPostVisitaForm && (
                <div className="bg-[var(--color-paper-2)] rounded-xl border border-[var(--color-rule)] p-6">
                    <h3 className="text-lg font-semibold text-[var(--color-ink)] mb-4">Completar Visita</h3>

                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-[var(--color-ink-2)] mb-2">
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
                                                ? 'text-[var(--color-warning)] fill-[var(--color-warning)]'
                                                : 'text-[var(--color-neutral)]'
                                                }`}
                                        />
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-[var(--color-ink-2)] mb-2">
                                Notas de la Visita *
                            </label>
                            <textarea
                                rows={4}
                                required
                                className="w-full p-3 border border-[var(--color-rule)] rounded-lg focus:ring-2 focus:ring-[var(--color-accent)]/40 text-[var(--color-ink)] bg-[var(--color-paper-2)]"
                                value={postVisitaData.notasPostVisita}
                                onChange={(e) => setPostVisitaData(prev => ({ ...prev, notasPostVisita: e.target.value }))}
                                placeholder="¿Cómo fue la visita? ¿Qué comentó el cliente?"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-[var(--color-ink-2)] mb-2">
                                Próximos Pasos
                            </label>
                            <textarea
                                rows={3}
                                className="w-full p-3 border border-[var(--color-rule)] rounded-lg focus:ring-2 focus:ring-[var(--color-accent)]/40 text-[var(--color-ink)] bg-[var(--color-paper-2)]"
                                value={postVisitaData.proximosPasos}
                                onChange={(e) => setPostVisitaData(prev => ({ ...prev, proximosPasos: e.target.value }))}
                                placeholder="¿Qué sigue? ¿Hay que hacer seguimiento?"
                            />
                        </div>

                        <div className="flex justify-end gap-3">
                            <button
                                onClick={() => setShowPostVisitaForm(false)}
                                className="px-4 py-2 border border-[var(--color-rule)] text-[var(--color-ink-2)] rounded-lg hover:bg-[var(--color-paper-3)]"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={handleCheckOut}
                                disabled={!postVisitaData.notasPostVisita}
                                className="px-4 py-2 bg-[var(--color-ink)] text-[var(--color-paper)] rounded-lg hover:bg-[var(--color-ink-2)] disabled:opacity-50"
                            >
                                Completar Visita
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Actions */}
            <div className="bg-[var(--color-paper-2)] rounded-xl border border-[var(--color-rule)] p-6">
                <h3 className="text-lg font-semibold text-[var(--color-ink)] mb-4">Acciones</h3>
                <div className="flex flex-wrap gap-3">
                    {visita.estado === 'programada' && (
                        <button
                            onClick={handleCheckIn}
                            className="flex items-center gap-2 px-4 py-2 bg-[var(--color-positive)] text-[var(--color-accent-ink)] rounded-lg hover:bg-[var(--color-positive)]"
                        >
                            <CheckCircle strokeWidth={1.5} className="w-5 h-5" />
                            Check-in
                        </button>
                    )}

                    {visita.estado === 'en_curso' && (
                        <button
                            onClick={() => setShowPostVisitaForm(true)}
                            className="flex items-center gap-2 px-4 py-2 bg-[var(--color-ink)] text-[var(--color-paper)] rounded-lg hover:bg-[var(--color-ink-2)]"
                        >
                            <CheckCircle strokeWidth={1.5} className="w-5 h-5" />
                            Check-out
                        </button>
                    )}

                    {visita.estado !== 'completada' && visita.estado !== 'cancelada' && (
                        <button
                            onClick={handleCancelar}
                            className="flex items-center gap-2 px-4 py-2 bg-[var(--color-danger)] text-[var(--color-accent-ink)] rounded-lg hover:bg-[var(--color-danger)]"
                        >
                            Cancelar Visita
                        </button>
                    )}


                    <button
                        onClick={handleWhatsAppReminder}
                        className="flex items-center gap-2 px-4 py-2 bg-[var(--color-positive)] text-[var(--color-accent-ink)] rounded-lg hover:bg-[var(--color-positive)]"
                    >
                        <MessageCircle strokeWidth={1.5} className="w-5 h-5" />
                        Recordatorio WhatsApp
                    </button>

                    <button
                        onClick={handleEliminar}
                        className="flex items-center gap-2 px-4 py-2 border border-[var(--color-danger)]/30 text-[var(--color-danger)] rounded-lg hover:bg-[var(--color-danger-soft)]"
                    >
                        <Trash2 strokeWidth={1.5} className="w-5 h-5" />
                        Eliminar
                    </button>
                </div>
            </div>
        </div>
    );
}
