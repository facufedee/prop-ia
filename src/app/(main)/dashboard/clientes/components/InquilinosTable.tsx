"use client";

import { Inquilino } from "@/domain/models/Inquilino";
import { Eye, Edit, Trash2, FileText } from "lucide-react";
import Link from "next/link";

interface InquilinosTableProps {
    inquilinos: Inquilino[];
    onDelete: (id: string) => void;
    onEdit: (inquilino: Inquilino) => void;
    onViewDetail: (inquilino: Inquilino) => void;
}

export default function InquilinosTable({ inquilinos, onDelete, onEdit, onViewDetail }: InquilinosTableProps) {
    return (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto">
                <table className="w-full">
                    <thead className="bg-gray-50 border-b border-gray-200">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Nombre
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                DNI
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Email
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Teléfono
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Domicilio
                            </th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Acciones
                            </th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {inquilinos.length === 0 ? (
                            <tr>
                                <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                                    No hay inquilinos registrados
                                </td>
                            </tr>
                        ) : (
                            inquilinos.map((inquilino) => (
                                <tr key={inquilino.id} className="hover:bg-gray-50 transition-colors">
                                    <td className="px-6 py-4">
                                        <div className="text-sm font-medium text-gray-900">{inquilino.nombre}</div>
                                    </td>
                                    <td className="px-6 py-4 text-sm text-gray-600">{inquilino.dni}</td>
                                    <td className="px-6 py-4 text-sm text-gray-600">{inquilino.email}</td>
                                    <td className="px-6 py-4 text-sm text-gray-600">{inquilino.telefono}</td>
                                    <td className="px-6 py-4 text-sm text-gray-600">{inquilino.domicilio}</td>
                                    <td className="px-6 py-4 text-right">
                                        <div className="flex items-center justify-end gap-2">
                                            <button
                                                onClick={() => onViewDetail(inquilino)}
                                                className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                                                title="Ver detalle"
                                            >
                                                <Eye className="w-4 h-4" />
                                            </button>
                                            <button
                                                onClick={() => onEdit(inquilino)}
                                                className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                                title="Editar"
                                            >
                                                <Edit className="w-4 h-4" />
                                            </button>
                                            <button
                                                onClick={() => onDelete(inquilino.id)}
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
