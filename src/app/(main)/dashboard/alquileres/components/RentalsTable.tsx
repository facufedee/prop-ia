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
            <div className="flex justify-center items-center p-8 bg-[var(--color-paper-2)] border rounded-2xl shadow-sm">
                <Loader2 strokeWidth={1.5} className="animate-spin text-[var(--color-neutral)]" />
            </div>
        );
    }

    if (contracts.length === 0) {
        return (
            <div className="p-8 text-center bg-[var(--color-paper-2)] border rounded-2xl shadow-sm text-[var(--color-muted)]">
                No hay contratos que coincidan con los filtros.
            </div>
        );
    }

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'activo': return 'bg-[var(--color-positive-soft)] text-[var(--color-positive)]';
            case 'pendiente': return 'bg-[var(--color-warning-soft)] text-[var(--color-warning)]';
            case 'finalizado': return 'bg-[var(--color-paper-3)] text-[var(--color-ink)]';
            default: return 'bg-[var(--color-paper-3)] text-[var(--color-ink)]';
        }
    };

    return (
        <div className="bg-[var(--color-paper-2)] border rounded-2xl shadow-sm overflow-hidden">
            <table className="w-full text-left border-collapse">
                <thead>
                    <tr className="bg-[var(--color-paper-3)] text-[var(--color-ink-2)] text-sm">
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
                        <tr key={c.id} className="border-t text-[var(--color-ink)] hover:bg-[var(--color-paper-3)] transition">
                            <td className="p-4">
                                <Link href={`/dashboard/alquileres/${c.id}`} className="hover:text-[var(--color-accent-2)] block">
                                    <div className="flex items-center gap-2">
                                        <MapPin strokeWidth={1.5} className="w-4 h-4 text-[var(--color-neutral)]" />
                                        <span className="font-medium truncate max-w-[200px]">{c.direccion}</span>
                                    </div>
                                    <span className="text-xs text-[var(--color-muted)] ml-6">{c.propiedadTipo}</span>
                                </Link>
                            </td>
                            <td className="p-4">
                                <div className="flex items-center gap-2 text-sm text-[var(--color-ink-2)]">
                                    <User strokeWidth={1.5} className="w-4 h-4 text-[var(--color-neutral)]" />
                                    {c.nombreInquilino}
                                </div>
                            </td>
                            <td className="p-4 text-sm text-[var(--color-ink-2)]">
                                <div className="flex items-center gap-2">
                                    <Calendar strokeWidth={1.5} className="w-4 h-4 text-[var(--color-neutral)]" />
                                    {new Date(c.fechaFin).toLocaleDateString()}
                                </div>
                            </td>
                            <td className="p-4 font-medium text-sm">
                                <div className="flex items-center gap-2">
                                    <DollarSign strokeWidth={1.5} className="w-4 h-4 text-[var(--color-neutral)]" />
                                    {formatCurrency(c.montoMensual)}
                                    {c.ajusteTipo === 'ICL' && <span className="text-[10px] text-[var(--color-muted)]">(ICL)</span>}
                                </div>
                            </td>
                            <td className="p-4">
                                <span className={`px-2 py-1 rounded-full text-xs font-medium capitalize ${getStatusColor(c.estado)}`}>
                                    {c.estado}
                                </span>
                            </td>
                            <td className="p-4 text-right">
                                <div className="flex items-center justify-end gap-2">
                                    <Link href={`/dashboard/alquileres/${c.id}`} className="p-2 hover:bg-[var(--color-paper-3)] rounded-full text-[var(--color-muted)] transition">
                                        <Edit strokeWidth={1.5} size={16} />
                                    </Link>
                                    <button
                                        onClick={() => onDelete(c.id)}
                                        className="p-2 hover:bg-[var(--color-danger-soft)] rounded-full text-[var(--color-danger)] transition"
                                        title="Eliminar contrato"
                                    >
                                        <Trash2 strokeWidth={1.5} size={16} />
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