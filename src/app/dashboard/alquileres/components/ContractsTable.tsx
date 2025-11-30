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
        const { vencido, diasRestantes } = alquileresService.calcularVencimiento(alquiler);

        if (vencido) {
            return <span className="text-red-600 font-medium">Vencido</span>;
        }
        if (diasRestantes <= 3) {
            return <span className="text-orange-600 font-medium">En {diasRestantes} días</span>;
        }
        return <span className="text-gray-600">En {diasRestantes} días</span>;
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
