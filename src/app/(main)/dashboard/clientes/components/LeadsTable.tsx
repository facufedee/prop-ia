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
    nuevo: "bg-[var(--color-accent-soft)] text-[var(--color-accent)]",
    contactado: "bg-[var(--color-accent-soft)] text-[var(--color-accent)]",
    seguimiento: "bg-[var(--color-warning-soft)] text-[var(--color-warning)]",
    visita_programada: "bg-[var(--color-accent-soft)] text-[var(--color-accent)]",
    negociacion: "bg-[var(--color-accent-soft)] text-[var(--color-accent)]",
    cerrado: "bg-[var(--color-positive-soft)] text-[var(--color-positive)]",
    perdido: "bg-[var(--color-paper-4)] text-[var(--color-ink-2)]",
    pendiente: "bg-[var(--color-warning-soft)] text-[var(--color-warning)]",
    leido: "bg-[var(--color-accent-soft)] text-[var(--color-accent)]",
    respondido: "bg-[var(--color-accent-soft)] text-[var(--color-accent)]",
    calificado: "bg-[var(--color-accent-soft)] text-[var(--color-accent)]",
    convertido: "bg-[var(--color-positive-soft)] text-[var(--color-positive)]",
    finalizado: "bg-[var(--color-paper-4)] text-[var(--color-ink)]",
    descartado: "bg-[var(--color-paper-3)] text-[var(--color-ink-2)]",
};

const TIPO_LABELS: Record<string, string> = {
    compra: "Compra",
    venta: "Venta",
    alquiler: "Alquiler",
    consulta: "Consulta",
};

const PRIORIDAD_COLORS: Record<string, string> = {
    alta: "bg-[var(--color-danger-soft)] text-[var(--color-danger)]",
    media: "bg-[var(--color-warning-soft)] text-[var(--color-warning)]",
    baja: "bg-[var(--color-positive-soft)] text-[var(--color-positive)]",
};

function getInitials(name: string) {
    return name
        .split(" ")
        .slice(0, 2)
        .map((n) => n[0])
        .join("")
        .toUpperCase();
}

export default function LeadsTable({ leads, onDelete, onEdit, onViewDetail, onConvert }: LeadsTableProps) {
    return (
        <div className="bg-[var(--color-paper-2)] rounded-2xl border border-[var(--color-rule)] overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
                <table className="w-full">
                    <thead>
                        <tr className="bg-[var(--color-paper)] border-b border-[var(--color-rule-2)]">
                            <th className="px-6 py-3.5 text-left text-xs font-semibold text-[var(--color-muted)] uppercase tracking-wider">
                                Lead
                            </th>
                            <th className="px-6 py-3.5 text-left text-xs font-semibold text-[var(--color-muted)] uppercase tracking-wider hidden sm:table-cell">
                                Contacto
                            </th>
                            <th className="px-6 py-3.5 text-left text-xs font-semibold text-[var(--color-muted)] uppercase tracking-wider hidden md:table-cell">
                                Tipo
                            </th>
                            <th className="px-6 py-3.5 text-left text-xs font-semibold text-[var(--color-muted)] uppercase tracking-wider">
                                Estado
                            </th>
                            <th className="px-6 py-3.5 text-left text-xs font-semibold text-[var(--color-muted)] uppercase tracking-wider hidden lg:table-cell">
                                Origen
                            </th>
                            <th className="px-6 py-3.5 text-left text-xs font-semibold text-[var(--color-muted)] uppercase tracking-wider hidden lg:table-cell">
                                Prioridad
                            </th>
                            <th className="px-6 py-3.5 text-right text-xs font-semibold text-[var(--color-muted)] uppercase tracking-wider">
                                Acciones
                            </th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-[var(--color-rule-2)]">
                        {leads.length === 0 ? (
                            <tr>
                                <td colSpan={7} className="px-6 py-16 text-center">
                                    <div className="flex flex-col items-center gap-3">
                                        <div className="w-12 h-12 bg-[var(--color-paper-3)] rounded-full flex items-center justify-center">
                                            <Users strokeWidth={1.5} className="w-6 h-6 text-[var(--color-neutral)]" />
                                        </div>
                                        <p className="text-sm text-[var(--color-muted)] font-medium">No hay leads registrados</p>
                                        <p className="text-xs text-[var(--color-neutral)]">Los nuevos leads aparecerán aquí</p>
                                    </div>
                                </td>
                            </tr>
                        ) : (
                            leads.map((lead) => (
                                <tr
                                    key={lead.id}
                                    onClick={() => onViewDetail(lead)}
                                    className="hover:bg-[var(--color-paper-3)] transition-colors cursor-pointer group"
                                >
                                    {/* Lead name + avatar */}
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            <div className={`w-9 h-9 rounded-full bg-[var(--color-paper-3)] flex items-center justify-center text-[var(--color-ink-2)] text-sm font-semibold flex-shrink-0`}>
                                                {getInitials(lead.nombre)}
                                            </div>
                                            <div>
                                                <p className="text-sm font-semibold text-[var(--color-ink)] group-hover:text-[var(--color-accent-2)] transition-colors">
                                                    {lead.nombre}
                                                </p>
                                                {lead.zona && (
                                                    <p className="text-xs text-[var(--color-neutral)]">{lead.zona}</p>
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
                                                    className="flex items-center gap-1.5 text-xs text-[var(--color-muted)] hover:text-[var(--color-accent-2)] transition-colors"
                                                >
                                                    <Mail strokeWidth={1.5} className="w-3.5 h-3.5 flex-shrink-0" />
                                                    <span className="truncate max-w-[160px]">{lead.email}</span>
                                                </a>
                                            )}
                                            {lead.telefono && (
                                                <a
                                                    href={`tel:${lead.telefono}`}
                                                    className="flex items-center gap-1.5 text-xs text-[var(--color-muted)] hover:text-[var(--color-positive)] transition-colors"
                                                >
                                                    <Phone strokeWidth={1.5} className="w-3.5 h-3.5 flex-shrink-0" />
                                                    {lead.telefono}
                                                </a>
                                            )}
                                        </div>
                                    </td>

                                    {/* Tipo */}
                                    <td className="px-6 py-4 hidden md:table-cell">
                                        <span className="text-sm text-[var(--color-ink-2)]">
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
                                        <span className="text-sm text-[var(--color-muted)] capitalize">{lead.origen}</span>
                                    </td>

                                    {/* Prioridad */}
                                    <td className="px-6 py-4 hidden lg:table-cell">
                                        {lead.prioridad ? (
                                            <span className={`inline-flex px-2.5 py-1 text-xs font-semibold rounded-full ${PRIORIDAD_COLORS[lead.prioridad]}`}>
                                                {lead.prioridad.charAt(0).toUpperCase() + lead.prioridad.slice(1)}
                                            </span>
                                        ) : (
                                            <span className="text-xs text-[var(--color-neutral)]">—</span>
                                        )}
                                    </td>

                                    {/* Actions */}
                                    <td className="px-6 py-4 text-right" onClick={(e) => e.stopPropagation()}>
                                        <div className="flex items-center justify-end gap-1">
                                            <button
                                                onClick={() => onViewDetail(lead)}
                                                className="p-1.5 text-[var(--color-neutral)] hover:text-[var(--color-ink)] hover:bg-[var(--color-paper-3)] rounded-lg transition-colors"
                                                title="Ver detalle"
                                            >
                                                <Eye strokeWidth={1.5} className="w-4 h-4" />
                                            </button>
                                            <button
                                                onClick={() => onEdit(lead)}
                                                className="p-1.5 text-[var(--color-neutral)] hover:text-[var(--color-ink)] hover:bg-[var(--color-paper-3)] rounded-lg transition-colors"
                                                title="Editar"
                                            >
                                                <Edit strokeWidth={1.5} className="w-4 h-4" />
                                            </button>
                                            {lead.estado !== "convertido" && lead.estado !== "descartado" && lead.estado !== "cerrado" && (
                                                <button
                                                    onClick={() => onConvert(lead.id)}
                                                    className="p-1.5 text-[var(--color-neutral)] hover:text-[var(--color-positive)] hover:bg-[var(--color-positive-soft)] rounded-lg transition-colors"
                                                    title="Convertir a cliente"
                                                >
                                                    <CheckCircle strokeWidth={1.5} className="w-4 h-4" />
                                                </button>
                                            )}
                                            <button
                                                onClick={() => onDelete(lead.id)}
                                                className="p-1.5 text-[var(--color-neutral)] hover:text-[var(--color-danger)] hover:bg-[var(--color-danger-soft)] rounded-lg transition-colors"
                                                title="Eliminar"
                                            >
                                                <Trash2 strokeWidth={1.5} className="w-4 h-4" />
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
                <div className="px-6 py-3 border-t border-[var(--color-rule-2)] bg-[var(--color-paper)]/50">
                    <p className="text-xs text-[var(--color-muted)]">
                        {leads.length} lead{leads.length !== 1 ? "s" : ""} en total
                    </p>
                </div>
            )}
        </div>
    );
}
