"use client";

import { useEffect, useState } from "react";
import { Development, developmentService } from "@/infrastructure/services/developmentService";
import { Plus, Building2, MapPin, Edit, Trash2, Eye, Calendar, HardHat } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function DevelopmentsPage() {
    const [developments, setDevelopments] = useState<Development[]>([]);
    const [loading, setLoading] = useState(true);
    const router = useRouter();

    const fetchDevelopments = async () => {
        setLoading(true);
        const data = await developmentService.getAll(false); // Get all, including inactive
        setDevelopments(data);
        setLoading(false);
    };

    useEffect(() => {
        fetchDevelopments();
    }, []);

    const handleDelete = async (id: string) => {
        if (confirm("¿Estás seguro de que querés eliminar este emprendimiento? Esta acción no se puede deshacer.")) {
            await developmentService.delete(id);
            fetchDevelopments();
        }
    };

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'en-pozo': return <span className="px-2 py-1 bg-[var(--color-accent-soft)] text-[var(--color-accent)] rounded-full text-xs font-bold border border-[var(--color-accent)]/30">En Pozo</span>;
            case 'en-construccion': return <span className="px-2 py-1 bg-[var(--color-warning-soft)] text-[var(--color-warning)] rounded-full text-xs font-bold border border-[var(--color-warning)]/30">En Obra</span>;
            case 'terminado': return <span className="px-2 py-1 bg-[var(--color-positive-soft)] text-[var(--color-positive)] rounded-full text-xs font-bold border border-[var(--color-positive)]/30">Terminado</span>;
            default: return <span className="px-2 py-1 bg-[var(--color-paper-3)] text-[var(--color-ink-2)] rounded-full text-xs border border-[var(--color-rule)]">{status}</span>;
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="font-heading text-2xl font-bold text-[var(--color-ink)] flex items-center gap-2">
                        <Building2 strokeWidth={1.5} className="text-[var(--color-accent)]" /> Emprendimientos
                    </h1>
                    <p className="text-[var(--color-muted)] text-sm">Gestioná tus proyectos y desarrollos inmobiliarios.</p>
                </div>
                <Link
                    href="/dashboard/emprendimientos/nuevo"
                    className="flex items-center justify-center gap-2 bg-[var(--color-ink)] text-[var(--color-paper)] px-4 py-2 rounded-xl hover:bg-[var(--color-ink-2)] transition shadow-sm font-medium"
                >
                    <Plus strokeWidth={1.5} size={18} /> Nuevo Proyecto
                </Link>
            </div>

            {loading ? (
                <div className="flex justify-center p-12">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[var(--color-accent)]"></div>
                </div>
            ) : developments.length === 0 ? (
                <div className="bg-[var(--color-paper-2)] p-12 rounded-2xl border border-[var(--color-rule-2)] text-center shadow-sm">
                    <div className="w-16 h-16 bg-[var(--color-paper)] rounded-full flex items-center justify-center mx-auto mb-4">
                        <HardHat strokeWidth={1.5} className="w-8 h-8 text-[var(--color-neutral)]" />
                    </div>
                    <h3 className="text-lg font-medium text-[var(--color-ink)] mb-2">No hay emprendimientos</h3>
                    <p className="text-[var(--color-muted)] mb-6">Comenzá a cargar tu primer desarrollo inmobiliario.</p>
                    <Link
                        href="/dashboard/emprendimientos/nuevo"
                        className="inline-flex items-center gap-2 text-[var(--color-accent)] font-medium hover:underline"
                    >
                        Crear nuevo <Plus strokeWidth={1.5} size={16} />
                    </Link>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {developments.map((dev) => (
                        <div key={dev.id} className="bg-[var(--color-paper-2)] rounded-2xl border border-[var(--color-rule)] overflow-hidden hover:shadow-lg transition group">
                            <div className="relative h-48 bg-[var(--color-paper-3)]">
                                {dev.imageUrls && dev.imageUrls.length > 0 ? (
                                    <img src={dev.imageUrls[0]} alt={dev.name} className="w-full h-full object-cover" />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center text-[var(--color-neutral)]">
                                        <Building2 strokeWidth={1.5} size={32} opacity={0.5} />
                                    </div>
                                )}
                                <div className="absolute top-3 right-3 flex gap-2">
                                    {!dev.active && (
                                        <span className="bg-[var(--color-ink)] text-[var(--color-paper)] text-xs px-2 py-1 rounded-md font-medium">Borrador</span>
                                    )}
                                </div>
                            </div>
                            <div className="p-5">
                                <div className="flex justify-between items-start mb-2">
                                    <h3 className="font-bold text-lg text-[var(--color-ink)] line-clamp-1">{dev.name}</h3>
                                    {getStatusBadge(dev.status)}
                                </div>
                                <div className="text-sm text-[var(--color-muted)] flex items-center gap-1 mb-4">
                                    <MapPin strokeWidth={1.5} size={14} /> {dev.city}, {dev.province}
                                </div>

                                <div className="grid grid-cols-2 gap-4 py-3 border-t border-[var(--color-rule-2)] text-sm mb-4">
                                    <div>
                                        <p className="text-xs text-[var(--color-neutral)] mb-1">Unidades</p>
                                        <p className="font-semibold">{dev.units?.length || 0} Tipologías</p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-[var(--color-neutral)] mb-1">Entrega</p>
                                        <p className="font-semibold">{dev.delivery_date ? new Date(dev.delivery_date).toLocaleDateString() : 'A confirmar'}</p>
                                    </div>
                                </div>

                                <div className="flex items-center gap-2 pt-2">
                                    <Link
                                        href={`/dashboard/emprendimientos/editar/${dev.id}`}
                                        className="flex-1 flex items-center justify-center gap-2 py-2 rounded-lg border border-[var(--color-rule)] text-[var(--color-ink-2)] hover:bg-[var(--color-paper-3)] font-medium text-sm"
                                    >
                                        <Edit strokeWidth={1.5} size={16} /> Editar
                                    </Link>
                                    <button
                                        onClick={() => handleDelete(dev.id)}
                                        className="p-2 rounded-lg border border-[var(--color-danger)]/30 text-[var(--color-danger)] hover:bg-[var(--color-danger-soft)]"
                                        title="Eliminar"
                                    >
                                        <Trash2 strokeWidth={1.5} size={18} />
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
