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
            case 'en-pozo': return <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-bold border border-blue-200">En Pozo</span>;
            case 'en-construccion': return <span className="px-2 py-1 bg-yellow-100 text-yellow-700 rounded-full text-xs font-bold border border-yellow-200">En Obra</span>;
            case 'terminado': return <span className="px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs font-bold border border-green-200">Terminado</span>;
            default: return <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded-full text-xs border border-gray-200">{status}</span>;
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                        <Building2 className="text-indigo-600" /> Emprendimientos
                    </h1>
                    <p className="text-gray-500 text-sm">Gestioná tus proyectos y desarrollos inmobiliarios.</p>
                </div>
                <Link
                    href="/dashboard/emprendimientos/nuevo"
                    className="flex items-center justify-center gap-2 bg-black text-white px-4 py-2 rounded-xl hover:bg-gray-800 transition shadow-sm font-medium"
                >
                    <Plus size={18} /> Nuevo Proyecto
                </Link>
            </div>

            {loading ? (
                <div className="flex justify-center p-12">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
                </div>
            ) : developments.length === 0 ? (
                <div className="bg-white p-12 rounded-2xl border border-gray-100 text-center shadow-sm">
                    <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
                        <HardHat className="w-8 h-8 text-gray-300" />
                    </div>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No hay emprendimientos</h3>
                    <p className="text-gray-500 mb-6">Comenzá a cargar tu primer desarrollo inmobiliario.</p>
                    <Link
                        href="/dashboard/emprendimientos/nuevo"
                        className="inline-flex items-center gap-2 text-indigo-600 font-medium hover:underline"
                    >
                        Crear nuevo <Plus size={16} />
                    </Link>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {developments.map((dev) => (
                        <div key={dev.id} className="bg-white rounded-2xl border border-gray-200 overflow-hidden hover:shadow-lg transition group">
                            <div className="relative h-48 bg-gray-100">
                                {dev.imageUrls && dev.imageUrls.length > 0 ? (
                                    <img src={dev.imageUrls[0]} alt={dev.name} className="w-full h-full object-cover" />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center text-gray-400">
                                        <Building2 size={32} opacity={0.5} />
                                    </div>
                                )}
                                <div className="absolute top-3 right-3 flex gap-2">
                                    {!dev.active && (
                                        <span className="bg-gray-800 text-white text-xs px-2 py-1 rounded-md font-medium">Borrador</span>
                                    )}
                                </div>
                            </div>
                            <div className="p-5">
                                <div className="flex justify-between items-start mb-2">
                                    <h3 className="font-bold text-lg text-gray-900 line-clamp-1">{dev.name}</h3>
                                    {getStatusBadge(dev.status)}
                                </div>
                                <div className="text-sm text-gray-500 flex items-center gap-1 mb-4">
                                    <MapPin size={14} /> {dev.city}, {dev.province}
                                </div>

                                <div className="grid grid-cols-2 gap-4 py-3 border-t border-gray-100 text-sm mb-4">
                                    <div>
                                        <p className="text-xs text-gray-400 mb-1">Unidades</p>
                                        <p className="font-semibold">{dev.units?.length || 0} Tipologías</p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-gray-400 mb-1">Entrega</p>
                                        <p className="font-semibold">{dev.delivery_date ? new Date(dev.delivery_date).toLocaleDateString() : 'A confirmar'}</p>
                                    </div>
                                </div>

                                <div className="flex items-center gap-2 pt-2">
                                    <Link
                                        href={`/dashboard/emprendimientos/editar/${dev.id}`}
                                        className="flex-1 flex items-center justify-center gap-2 py-2 rounded-lg border border-gray-200 text-gray-700 hover:bg-gray-50 font-medium text-sm"
                                    >
                                        <Edit size={16} /> Editar
                                    </Link>
                                    <button
                                        onClick={() => handleDelete(dev.id)}
                                        className="p-2 rounded-lg border border-red-100 text-red-600 hover:bg-red-50"
                                        title="Eliminar"
                                    >
                                        <Trash2 size={18} />
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
