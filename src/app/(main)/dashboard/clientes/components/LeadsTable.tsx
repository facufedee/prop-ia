"use client";

import { Lead, LeadEstado } from "@/domain/models/Lead";
import { Eye, Edit, Trash2, CheckCircle } from "lucide-react";

interface LeadsTableProps {
    leads: Lead[];
    onDelete: (id: string) => void;
    onEdit: (lead: Lead) => void;
    onViewDetail: (lead: Lead) => void;
    onConvert: (id: string) => void;
}

const ESTADO_LABELS: Record<LeadEstado, string> = {
    nuevo: 'Nuevo',
    contactado: 'Contactado',
    calificado: 'Calificado',
    convertido: 'Convertido',
    descartado: 'Descartado',
};

const ESTADO_COLORS: Record<LeadEstado, string> = {
    nuevo: 'bg-blue-100 text-blue-700',
    contactado: 'bg-yellow-100 text-yellow-700',
    calificado: 'bg-purple-100 text-purple-700',
    convertido: 'bg-green-100 text-green-700',
    descartado: 'bg-gray-100 text-gray-700',
};

export default function LeadsTable({ leads, onDelete, onEdit, onViewDetail, onConvert }: LeadsTableProps) {
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
                                Email
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Teléfono
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Tipo
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Estado
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Origen
                            </th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Acciones
                            </th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {leads.length === 0 ? (
                            <tr>
                                <td colSpan={7} className="px-6 py-12 text-center text-gray-500">
                                    No hay leads registrados
                                </td>
                            </tr>
                        ) : (
                            leads.map((lead) => (
                                <tr key={lead.id} className="hover:bg-gray-50 transition-colors">
                                    <td className="px-6 py-4">
                                        <div className="text-sm font-medium text-gray-900">{lead.nombre}</div>
                                    </td>
                                    <td className="px-6 py-4 text-sm text-gray-600">{lead.email}</td>
                                    <td className="px-6 py-4 text-sm text-gray-600">{lead.telefono}</td>
                                    <td className="px-6 py-4">
                                        <span className="text-sm text-gray-600 capitalize">{lead.tipo}</span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${ESTADO_COLORS[lead.estado]}`}>
                                            {ESTADO_LABELS[lead.estado]}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className="text-sm text-gray-600 capitalize">{lead.origen}</span>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <div className="flex items-center justify-end gap-2">
                                            <button
                                                onClick={() => onViewDetail(lead)}
                                                className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                                                title="Ver detalle"
                                            >
                                                <Eye className="w-4 h-4" />
                                            </button>
                                            <button
                                                onClick={() => onEdit(lead)}
                                                className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                                title="Editar"
                                            >
                                                <Edit className="w-4 h-4" />
                                            </button>
                                            {lead.estado !== 'convertido' && lead.estado !== 'descartado' && (
                                                <button
                                                    onClick={() => onConvert(lead.id)}
                                                    className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                                                    title="Convertir a cliente"
                                                >
                                                    <CheckCircle className="w-4 h-4" />
                                                </button>
                                            )}
                                            <button
                                                onClick={() => onDelete(lead.id)}
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
