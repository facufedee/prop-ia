"use client";

import { Lead, LeadEstado } from "@/domain/models/Lead";
import { Eye, Edit, Trash2, CheckCircle, Mail, Phone, Users } from "lucide-react";

interface LeadsTableProps {
    leads: Lead[];
    onDelete: (id: string) => void;
    onEdit: (lead: Lead) => void;
    onViewDetail: (lead: Lead) => void;
    onConvert: (id: string) => void;
}

const ESTADO_LABELS: Record<LeadEstado, string> = {
    nuevo: "Nuevo",
    contactado: "Contactado",
    seguimiento: "Seguimiento",
    visita_programada: "Visita Programada",
    negociacion: "Negociación",
    cerrado: "Cerrado",
    perdido: "Perdido",
    pendiente: "Pendiente",
    leido: "Leído",
    respondido: "Respondido",
    calificado: "Calificado",
    convertido: "Convertido",
    finalizado: "Finalizado",
    descartado: "Descartado",
};

const ESTADO_COLORS: Record<LeadEstado, string> = {
    nuevo: "bg-indigo-100 text-indigo-700",
    contactado: "bg-blue-100 text-blue-700",
    seguimiento: "bg-amber-100 text-amber-700",
    visita_programada: "bg-teal-100 text-teal-700",
    negociacion: "bg-purple-100 text-purple-700",
    cerrado: "bg-emerald-100 text-emerald-700",
    perdido: "bg-gray-200 text-gray-600",
    pendiente: "bg-orange-100 text-orange-700",
    leido: "bg-blue-50 text-blue-600",
    respondido: "bg-indigo-100 text-indigo-700",
    calificado: "bg-purple-100 text-purple-700",
    convertido: "bg-emerald-100 text-emerald-700",
    finalizado: "bg-gray-200 text-gray-800",
    descartado: "bg-gray-100 text-gray-700",
};

const TIPO_LABELS: Record<string, string> = {
    compra: "Compra",
    venta: "Venta",
    alquiler: "Alquiler",
    consulta: "Consulta",
};

const PRIORIDAD_COLORS: Record<string, string> = {
    alta: "bg-red-100 text-red-700",
    media: "bg-amber-100 text-amber-700",
    baja: "bg-green-100 text-green-700",
};

function getInitials(name: string) {
    return name
        .split(" ")
        .slice(0, 2)
        .map((n) => n[0])
        .join("")
        .toUpperCase();
}

const AVATAR_GRADIENTS = [
    "from-violet-500 to-purple-600",
    "from-blue-500 to-indigo-600",
    "from-amber-500 to-orange-600",
    "from-teal-500 to-cyan-600",
    "from-rose-500 to-pink-600",
];

function getGradient(name: string) {
    const sum = name.split("").reduce((acc, c) => acc + c.charCodeAt(0), 0);
    return AVATAR_GRADIENTS[sum % AVATAR_GRADIENTS.length];
}

export default function LeadsTable({ leads, onDelete, onEdit, onViewDetail, onConvert }: LeadsTableProps) {
    return (
        <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
                <table className="w-full">
                    <thead>
                        <tr className="bg-gray-50 border-b border-gray-100">
                            <th className="px-6 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                                Lead
                            </th>
                            <th className="px-6 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider hidden sm:table-cell">
                                Contacto
                            </th>
                            <th className="px-6 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider hidden md:table-cell">
                                Tipo
                            </th>
                            <th className="px-6 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                                Estado
                            </th>
                            <th className="px-6 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider hidden lg:table-cell">
                                Origen
                            </th>
                            <th className="px-6 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider hidden lg:table-cell">
                                Prioridad
                            </th>
                            <th className="px-6 py-3.5 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">
                                Acciones
                            </th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                        {leads.length === 0 ? (
                            <tr>
                                <td colSpan={7} className="px-6 py-16 text-center">
                                    <div className="flex flex-col items-center gap-3">
                                        <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center">
                                            <Users className="w-6 h-6 text-gray-400" />
                                        </div>
                                        <p className="text-sm text-gray-500 font-medium">No hay leads registrados</p>
                                        <p className="text-xs text-gray-400">Los nuevos leads aparecerán aquí</p>
                                    </div>
                                </td>
                            </tr>
                        ) : (
                            leads.map((lead) => (
                                <tr
                                    key={lead.id}
                                    onClick={() => onViewDetail(lead)}
                                    className="hover:bg-gray-50/70 transition-colors cursor-pointer group"
                                >
                                    {/* Lead name + avatar */}
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            <div className={`w-9 h-9 rounded-full bg-gradient-to-br ${getGradient(lead.nombre)} flex items-center justify-center text-white text-sm font-semibold flex-shrink-0`}>
                                                {getInitials(lead.nombre)}
                                            </div>
                                            <div>
                                                <p className="text-sm font-semibold text-gray-900 group-hover:text-indigo-600 transition-colors">
                                                    {lead.nombre}
                                                </p>
                                                {lead.zona && (
                                                    <p className="text-xs text-gray-400">{lead.zona}</p>
                                                )}
                                            </div>
                                        </div>
                                    </td>

                                    {/* Contact */}
                                    <td className="px-6 py-4 hidden sm:table-cell" onClick={(e) => e.stopPropagation()}>
                                        <div className="flex flex-col gap-1">
                                            {lead.email && (
                                                <a
                                                    href={`mailto:${lead.email}`}
                                                    className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-indigo-600 transition-colors"
                                                >
                                                    <Mail className="w-3.5 h-3.5 flex-shrink-0" />
                                                    <span className="truncate max-w-[160px]">{lead.email}</span>
                                                </a>
                                            )}
                                            {lead.telefono && (
                                                <a
                                                    href={`tel:${lead.telefono}`}
                                                    className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-green-600 transition-colors"
                                                >
                                                    <Phone className="w-3.5 h-3.5 flex-shrink-0" />
                                                    {lead.telefono}
                                                </a>
                                            )}
                                        </div>
                                    </td>

                                    {/* Tipo */}
                                    <td className="px-6 py-4 hidden md:table-cell">
                                        <span className="text-sm text-gray-600">
                                            {TIPO_LABELS[lead.tipo] ?? lead.tipo}
                                        </span>
                                    </td>

                                    {/* Estado */}
                                    <td className="px-6 py-4">
                                        <span className={`inline-flex px-2.5 py-1 text-xs font-semibold rounded-full ${ESTADO_COLORS[lead.estado]}`}>
                                            {ESTADO_LABELS[lead.estado]}
                                        </span>
                                    </td>

                                    {/* Origen */}
                                    <td className="px-6 py-4 hidden lg:table-cell">
                                        <span className="text-sm text-gray-500 capitalize">{lead.origen}</span>
                                    </td>

                                    {/* Prioridad */}
                                    <td className="px-6 py-4 hidden lg:table-cell">
                                        {lead.prioridad ? (
                                            <span className={`inline-flex px-2.5 py-1 text-xs font-semibold rounded-full ${PRIORIDAD_COLORS[lead.prioridad]}`}>
                                                {lead.prioridad.charAt(0).toUpperCase() + lead.prioridad.slice(1)}
                                            </span>
                                        ) : (
                                            <span className="text-xs text-gray-400">—</span>
                                        )}
                                    </td>

                                    {/* Actions */}
                                    <td className="px-6 py-4 text-right" onClick={(e) => e.stopPropagation()}>
                                        <div className="flex items-center justify-end gap-1">
                                            <button
                                                onClick={() => onViewDetail(lead)}
                                                className="p-1.5 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                                                title="Ver detalle"
                                            >
                                                <Eye className="w-4 h-4" />
                                            </button>
                                            <button
                                                onClick={() => onEdit(lead)}
                                                className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                                title="Editar"
                                            >
                                                <Edit className="w-4 h-4" />
                                            </button>
                                            {lead.estado !== "convertido" && lead.estado !== "descartado" && lead.estado !== "cerrado" && (
                                                <button
                                                    onClick={() => onConvert(lead.id)}
                                                    className="p-1.5 text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                                                    title="Convertir a cliente"
                                                >
                                                    <CheckCircle className="w-4 h-4" />
                                                </button>
                                            )}
                                            <button
                                                onClick={() => onDelete(lead.id)}
                                                className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
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

            {leads.length > 0 && (
                <div className="px-6 py-3 border-t border-gray-100 bg-gray-50/50">
                    <p className="text-xs text-gray-500">
                        {leads.length} lead{leads.length !== 1 ? "s" : ""} en total
                    </p>
                </div>
            )}
        </div>
    );
}
