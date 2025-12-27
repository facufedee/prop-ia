"use client";

import { useState, useEffect } from "react";
import { Alquiler } from "@/domain/models/Alquiler";
import { Trash2, Edit, Eye, AlertCircle } from "lucide-react";
import Link from "next/link";
import { alquileresService } from "@/infrastructure/services/alquileresService";

interface ContractsTableProps {
    contracts: Alquiler[];
    onDelete: (id: string) => void;
}

export default function ContractsTable({ contracts, onDelete }: ContractsTableProps) {
    const getEstadoBadge = (estado: string) => {
        const styles = {
            activo: "bg-green-100 text-green-700",
            pendiente: "bg-yellow-100 text-yellow-700",
            finalizado: "bg-gray-100 text-gray-700",
        };
        return styles[estado as keyof typeof styles] || styles.pendiente;
    };

    const calcularProximoVencimiento = (alquiler: Alquiler) => {
        const hoy = new Date();
        const currentPeriod = new Date(hoy.getFullYear(), hoy.getMonth(), 1).toISOString().slice(0, 7); // YYYY-MM

        // Check if current period is paid
        const isCurrentPaid = alquiler.historialPagos?.some(p => p.mes === currentPeriod && p.estado === 'pagado');

        let targetDate = new Date(hoy.getFullYear(), hoy.getMonth(), alquiler.diaVencimiento);

        // If paid or if we are past due date but it's not strictly "vencido" in terms of logic (optional, but requested behavior is: if paid, show next)
        // Actually, if today > due date, and NOT paid, it is Vencido.
        // If today > due date, and PAID, we look at next month.

        if (isCurrentPaid) {
            targetDate.setMonth(targetDate.getMonth() + 1);
        }

        const diffTime = targetDate.getTime() - hoy.getTime();
        const diasRestantes = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        if (diasRestantes < 0) {
            return <span className="text-red-600 font-medium font-bold">Vencido</span>;
        }

        if (diasRestantes === 0) {
            return <span className="text-orange-600 font-medium">Vence hoy</span>;
        }

        if (diasRestantes <= 5) {
            return <span className="text-orange-600 font-medium">En {diasRestantes} días</span>;
        }

        // Format: 10/01/2026
        const dateStr = targetDate.toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric' });

        return (
            <div className="flex flex-col">
                <span className="font-medium text-gray-900">{dateStr}</span>
                <span className={`text-xs ${diasRestantes <= 5 ? 'text-orange-600 font-medium' : 'text-gray-500'}`}>
                    {diasRestantes === 0 ? "Vence hoy" : `Faltan ${diasRestantes} días`}
                </span>
            </div>
        );
    };

    return (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto">
                <table className="w-full">
                    <thead className="bg-gray-50 border-b border-gray-200">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Propiedad
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Inquilino
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Monto
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Estado
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Próximo Vencimiento
                            </th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Acciones
                            </th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {contracts.length === 0 ? (
                            <tr>
                                <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                                    No hay contratos registrados
                                </td>
                            </tr>
                        ) : (
                            contracts.map((contract) => (
                                <tr key={contract.id} className="hover:bg-gray-50 transition-colors">
                                    <td className="px-6 py-4">
                                        <div>
                                            <div className="font-medium text-gray-900">{contract.direccion}</div>
                                            <div className="text-sm text-gray-500">{contract.propiedadTipo}</div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="text-sm text-gray-900">{contract.nombreInquilino}</div>
                                        <div className="text-xs text-gray-500">{contract.contactoInquilino}</div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="text-sm font-medium text-gray-900">
                                            ${contract.montoMensual.toLocaleString()}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${getEstadoBadge(contract.estado)}`}>
                                            {contract.estado}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-sm">
                                        {contract.estado === 'activo' ? calcularProximoVencimiento(contract) : '-'}
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <div className="flex items-center justify-end gap-2">
                                            <Link
                                                href={`/dashboard/alquileres/${contract.id}`}
                                                className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                                                title="Ver detalle"
                                            >
                                                <Eye className="w-4 h-4" />
                                            </Link>
                                            <button
                                                onClick={() => onDelete(contract.id)}
                                                className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                                title="Eliminar"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
