"use client";

import { Alquiler } from "@/domain/models/Alquiler";
import { formatCurrency } from "@/ui/utils/format";
import { Loader2, Trash2, Edit, MapPin, User, Calendar, DollarSign } from "lucide-react";
import Link from "next/link";

interface RentalsTableProps {
    contracts: Alquiler[];
    loading: boolean;
    onDelete: (id: string) => void;
}

export default function RentalsTable({ contracts, loading, onDelete }: RentalsTableProps) {
    if (loading) {
        return (
            <div className="flex justify-center items-center p-8 bg-white border rounded-2xl shadow-sm">
                <Loader2 className="animate-spin text-gray-400" />
            </div>
        );
    }

    if (contracts.length === 0) {
        return (
            <div className="p-8 text-center bg-white border rounded-2xl shadow-sm text-gray-500">
                No hay contratos que coincidan con los filtros.
            </div>
        );
    }

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'activo': return 'bg-green-100 text-green-800';
            case 'pendiente': return 'bg-yellow-100 text-yellow-800';
            case 'finalizado': return 'bg-gray-100 text-gray-800';
            default: return 'bg-gray-100 text-gray-800';
        }
    };

    return (
        <div className="bg-white border rounded-2xl shadow-sm overflow-hidden">
            <table className="w-full text-left border-collapse">
                <thead>
                    <tr className="bg-gray-100 text-gray-700 text-sm">
                        <th className="p-4">Propiedad</th>
                        <th className="p-4">Inquilino</th>
                        <th className="p-4">Vencimiento</th>
                        <th className="p-4">Monto Mensual</th>
                        <th className="p-4">Estado</th>
                        <th className="p-4 text-right">Acciones</th>
                    </tr>
                </thead>
                <tbody>
                    {contracts.map((c) => (
                        <tr key={c.id} className="border-t text-black hover:bg-gray-50 transition">
                            <td className="p-4">
                                <Link href={`/dashboard/alquileres/${c.id}`} className="hover:text-indigo-600 block">
                                    <div className="flex items-center gap-2">
                                        <MapPin className="w-4 h-4 text-gray-400" />
                                        <span className="font-medium truncate max-w-[200px]">{c.direccion}</span>
                                    </div>
                                    <span className="text-xs text-gray-500 ml-6">{c.propiedadTipo}</span>
                                </Link>
                            </td>
                            <td className="p-4">
                                <div className="flex items-center gap-2 text-sm text-gray-700">
                                    <User className="w-4 h-4 text-gray-400" />
                                    {c.nombreInquilino}
                                </div>
                            </td>
                            <td className="p-4 text-sm text-gray-600">
                                <div className="flex items-center gap-2">
                                    <Calendar className="w-4 h-4 text-gray-400" />
                                    {new Date(c.fechaFin).toLocaleDateString()}
                                </div>
                            </td>
                            <td className="p-4 font-medium text-sm">
                                <div className="flex items-center gap-2">
                                    <DollarSign className="w-4 h-4 text-gray-400" />
                                    {formatCurrency(c.montoMensual)}
                                    {c.ajusteTipo === 'ICL' && <span className="text-[10px] text-gray-500">(ICL)</span>}
                                </div>
                            </td>
                            <td className="p-4">
                                <span className={`px-2 py-1 rounded-full text-xs font-medium capitalize ${getStatusColor(c.estado)}`}>
                                    {c.estado}
                                </span>
                            </td>
                            <td className="p-4 text-right">
                                <div className="flex items-center justify-end gap-2">
                                    <Link href={`/dashboard/alquileres/${c.id}`} className="p-2 hover:bg-gray-100 rounded-full text-gray-500 transition">
                                        <Edit size={16} />
                                    </Link>
                                    <button
                                        onClick={() => onDelete(c.id)}
                                        className="p-2 hover:bg-red-50 rounded-full text-red-500 transition"
                                        title="Eliminar contrato"
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}