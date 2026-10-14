"use client";

import { Lead, LeadEstado, LeadOrigen, LeadPrioridad } from "@/domain/models/Lead";
import { Draggable } from "@hello-pangea/dnd";
import { MessageSquare, Mail, Phone, Clock, Building2, Trash2, ArrowRight, Copy, AlertTriangle, AlertCircle } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

interface KanbanCardProps {
    lead: Lead;
    index: number;
    onDelete?: (id: string) => void;
    onStatusChange?: (id: string, newStatus: LeadEstado) => void;
}

// ── Helpers ──────────────────────────────────────────────────────────────────

const timeAgo = (date: Date): string => {
    const seconds = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
    if (seconds < 60) return `${seconds}s`;
    const mins = Math.floor(seconds / 60);
    if (mins < 60) return `${mins}min`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h`;
    return `${Math.floor(hrs / 24)}d`;
};

const getHoursAgo = (date: Date | undefined): number =>
    date ? (Date.now() - new Date(date).getTime()) / (1000 * 60 * 60) : 0;

const getInitials = (name: string) => {
    if (!name) return "?";
    const parts = name.trim().split(" ");
    return (parts.length > 1 ? parts[0][0] + parts[1][0] : parts[0][0]).toUpperCase();
};

const PRIORIDAD_CONFIG: Record<LeadPrioridad, { label: string; dot: string; border: string }> = {
    alta: { label: 'Alta', dot: 'bg-[var(--color-danger)]', border: 'border-l-4 border-l-[var(--color-danger)]' },
    media: { label: 'Media', dot: 'bg-[var(--color-warning)]', border: 'border-l-4 border-l-[var(--color-warning)]' },
    baja: { label: 'Baja', dot: 'bg-[var(--color-positive)]', border: 'border-l-4 border-l-[var(--color-positive)]' },
};

// ── Component ─────────────────────────────────────────────────────────────────

export default function KanbanCard({ lead, index, onDelete, onStatusChange }: KanbanCardProps) {
    const router = useRouter();
    const [showActions, setShowActions] = useState(false);
    const consultaCount = lead.consultas?.length ?? 1;
    const latestMsg = lead.consultas?.length
        ? lead.consultas[lead.consultas.length - 1].mensaje
        : lead.mensaje;

    const refDate = lead.ultimaActividad ?? lead.createdAt;
    const hoursAgo = getHoursAgo(refDate);
    const isUrgent48 = hoursAgo >= 48;
    const isUrgent24 = hoursAgo >= 24 && !isUrgent48;

    const prioridadConfig = lead.prioridad ? PRIORIDAD_CONFIG[lead.prioridad] : null;

    const waText = encodeURIComponent(`Hola ${lead.nombre}, me comunico desde Zeta Prop.`);

    return (
        <Draggable draggableId={lead.id} index={index}>
            {(provided, snapshot) => (
                <div
                    ref={provided.innerRef}
                    {...provided.draggableProps}
                    {...provided.dragHandleProps}
                    className={`bg-[var(--color-paper-2)] rounded-2xl border border-[var(--color-rule-2)] shadow-sm transition-all duration-200 select-none mb-3 group relative overflow-hidden cursor-pointer
                        ${prioridadConfig?.border ?? ''}
                        ${snapshot.isDragging
                            ? "shadow-2xl rotate-[1.5deg] scale-[1.02] border-[var(--color-accent)]/30 ring-2 ring-[var(--color-accent)]/30 z-50"
                            : "hover:shadow-md hover:border-[var(--color-accent)]/30"
                        }
                        ${isUrgent48 ? 'ring-1 ring-[var(--color-danger)]/30' : isUrgent24 ? 'ring-1 ring-[var(--color-warning)]/30' : ''}
                    `}
                    onMouseEnter={() => setShowActions(true)}
                    onMouseLeave={() => setShowActions(false)}
                    onClick={() => router.push(`/dashboard/clientes/leads/${lead.id}`)}
                >
                    {/* Urgency top bar */}
                    {(isUrgent24 || isUrgent48) && (
                        <div className={`h-0.5 w-full ${isUrgent48 ? 'bg-[var(--color-danger)]' : 'bg-[var(--color-warning)]'}`} />
                    )}

                    {/* Delete button */}
                    {onDelete && showActions && (
                        <button
                            onClick={(e) => { e.stopPropagation(); if (confirm("¿Eliminar esta consulta?")) onDelete(lead.id); }}
                            className="absolute top-2.5 right-2.5 p-1.5 text-[var(--color-neutral)] hover:text-[var(--color-danger)] hover:bg-[var(--color-danger-soft)] rounded-lg transition-all z-20"
                        >
                            <Trash2 strokeWidth={1.5} size={13} />
                        </button>
                    )}

                    <div className="p-4">
                        {/* Header: Avatar + Name + Time */}
                        <div className="flex items-center gap-3 mb-2.5">
                            <div className={`w-9 h-9 rounded-full bg-[var(--color-paper-3)] text-[var(--color-ink-2)] flex items-center justify-center font-bold text-sm flex-shrink-0`}>
                                {getInitials(lead.nombre)}
                            </div>
                            <div className="flex-1 min-w-0">
                                <span className="font-bold text-[var(--color-ink)] text-sm flex items-center gap-1 group/link">
                                    <span className="truncate">{lead.nombre || "Sin nombre"}</span>
                                    <ArrowRight strokeWidth={1.5} size={12} className="opacity-0 group-hover/link:opacity-100 transition-opacity flex-shrink-0 text-[var(--color-accent)]" />
                                </span>
                                <div className="flex items-center gap-1.5 mt-0.5">
                                    <span className="text-[10px] text-[var(--color-neutral)] flex items-center gap-0.5">
                                        <Clock strokeWidth={1.5} size={9} /> {timeAgo(lead.createdAt)}
                                    </span>
                                    {/* Source */}
                                    <span className="text-[10px] text-[var(--color-neutral)]">
                                        {lead.origen ?? 'web'}
                                    </span>
                                    {/* Priority */}
                                    {lead.prioridad && (
                                        <span
                                            title={PRIORIDAD_CONFIG[lead.prioridad].label}
                                            aria-label={PRIORIDAD_CONFIG[lead.prioridad].label}
                                            className={`w-1.5 h-1.5 rounded-full ${PRIORIDAD_CONFIG[lead.prioridad].dot}`}
                                        />
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Urgency indicator */}
                        {(isUrgent24 || isUrgent48) && (
                            <div className={`flex items-center gap-1 text-[10px] font-bold mb-2 ${isUrgent48 ? 'text-[var(--color-danger)]' : 'text-[var(--color-warning)]'}`}>
                                {isUrgent48
                                    ? <><AlertCircle strokeWidth={1.5} size={10} className="animate-pulse" /> {timeAgo(refDate)} sin respuesta</>
                                    : <><AlertTriangle strokeWidth={1.5} size={10} /> {timeAgo(refDate)} sin respuesta</>
                                }
                            </div>
                        )}

                        {/* Property tag */}
                        {lead.propertyTitle && (
                            <div className="mb-2.5 flex items-center gap-1.5 text-[11px] text-[var(--color-ink-2)] bg-[var(--color-paper-3)] border border-[var(--color-rule)] rounded-lg px-2.5 py-1.5 truncate">
                                <Building2 size={11} strokeWidth={1.5} className="flex-shrink-0 text-[var(--color-muted)]" />
                                <span className="truncate font-medium">{lead.propertyTitle}</span>
                            </div>
                        )}

                        {/* Message preview */}
                        {latestMsg && (
                            <div className="bg-[var(--color-paper)] rounded-xl px-3 py-2.5 mb-3 relative">
                                <span className="absolute top-1 left-1.5 text-[var(--color-neutral)] text-lg leading-none">"</span>
                                <p className="text-[12px] text-[var(--color-muted)] italic line-clamp-2 pt-1 px-1.5 relative z-10">
                                    {latestMsg}
                                </p>
                            </div>
                        )}

                        {/* Footer: quick actions */}
                        <div className="flex items-center justify-between gap-2">
                            <div className="flex items-center gap-1.5">
                                {lead.telefono && (
                                    <>
                                        <a
                                            href={`https://wa.me/${lead.telefono.replace(/\D/g, "")}?text=${waText}`}
                                            target="_blank" rel="noopener noreferrer"
                                            onClick={(e) => { e.stopPropagation(); onStatusChange && lead.estado === 'nuevo' && onStatusChange(lead.id, 'contactado'); }}
                                            title="WhatsApp"
                                            className="w-7 h-7 flex items-center justify-center rounded-lg bg-[var(--color-paper-3)] hover:bg-[var(--color-positive-soft)] text-[var(--color-positive)] transition-colors"
                                        >
                                            <MessageSquare strokeWidth={1.5} size={12} />
                                        </a>
                                        <a
                                            href={`tel:${lead.telefono.replace(/\D/g, "")}`}
                                            onClick={(e) => { e.stopPropagation(); onStatusChange && onStatusChange(lead.id, 'contactado'); }}
                                            title="Llamar"
                                            className="w-7 h-7 flex items-center justify-center rounded-lg bg-[var(--color-paper-3)] hover:bg-[var(--color-paper-4)] text-[var(--color-ink-2)] transition-colors"
                                        >
                                            <Phone strokeWidth={1.5} size={12} />
                                        </a>
                                    </>
                                )}
                                {lead.email && (
                                    <a
                                        href={`mailto:${lead.email}`}
                                        onClick={(e) => e.stopPropagation()}
                                        title="Email"
                                        className="w-7 h-7 flex items-center justify-center rounded-lg bg-[var(--color-paper-3)] hover:bg-[var(--color-paper-4)] text-[var(--color-ink-2)] transition-colors"
                                    >
                                        <Mail strokeWidth={1.5} size={12} />
                                    </a>
                                )}
                            </div>

                            {/* Consultas badge */}
                            {consultaCount > 1 && (
                                <div title={`${consultaCount} consultas`} className="flex items-center gap-1 text-[10px] font-bold text-[var(--color-accent)] bg-[var(--color-accent-soft)] border border-[var(--color-accent)]/30 rounded-full px-2 py-0.5">
                                    <Copy strokeWidth={1.5} size={9} /> {consultaCount}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </Draggable>
    );
}
