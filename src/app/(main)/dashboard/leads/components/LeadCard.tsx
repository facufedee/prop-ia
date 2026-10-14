"use client";

import { Lead, LeadEstado, LeadOrigen, LeadPrioridad, normalizarEstado } from "@/domain/models/Lead";
import { Mail, MessageSquare, Phone, Clock, Trash2, ArrowRight, AlertTriangle, AlertCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

interface LeadCardProps {
    lead: Lead;
    onStatusChange?: (id: string, newStatus: LeadEstado) => void;
    onDelete?: (id: string) => void;
    isDragging?: boolean;
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function getHoursAgo(date: Date | undefined): number {
    if (!date) return 0;
    return (Date.now() - new Date(date).getTime()) / (1000 * 60 * 60);
}

function formatTimeAgo(date: Date | undefined): string {
    if (!date) return "—";
    const seconds = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
    if (seconds < 60) return `${seconds}s`;
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}min`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h`;
    const days = Math.floor(hours / 24);
    return `${days}d`;
}

function UrgencyBadge({ ultimaActividad }: { ultimaActividad?: Date }) {
    const hours = getHoursAgo(ultimaActividad);
    const time = formatTimeAgo(ultimaActividad);

    if (hours >= 48) {
        return (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-[var(--color-danger-soft)] text-[var(--color-danger)] rounded-full text-[10px] font-bold border border-[var(--color-danger)]/30">
                <AlertCircle strokeWidth={1.5} size={10} className="animate-pulse" />
                {time} sin respuesta
            </span>
        );
    }
    if (hours >= 24) {
        return (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-[var(--color-warning-soft)] text-[var(--color-warning)] rounded-full text-[10px] font-bold border border-[var(--color-warning)]/30">
                <AlertTriangle strokeWidth={1.5} size={10} />
                {time} sin respuesta
            </span>
        );
    }
    return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-[var(--color-paper-3)] text-[var(--color-muted)] rounded-full text-[10px] border border-[var(--color-rule)]">
            <Clock strokeWidth={1.5} size={10} />
            {time}
        </span>
    );
}

const ORIGEN_CONFIG: Record<LeadOrigen, { label: string; color: string }> = {
    web: { label: 'Web', color: 'bg-[var(--color-paper-3)] text-[var(--color-ink-2)]' },
    whatsapp: { label: 'WhatsApp', color: 'bg-[var(--color-paper-3)] text-[var(--color-ink-2)]' },
    instagram: { label: 'Instagram', color: 'bg-[var(--color-paper-3)] text-[var(--color-ink-2)]' },
    facebook: { label: 'Facebook', color: 'bg-[var(--color-paper-3)] text-[var(--color-ink-2)]' },
    portal: { label: 'Portal', color: 'bg-[var(--color-paper-3)] text-[var(--color-ink-2)]' },
    referido: { label: 'Referido', color: 'bg-[var(--color-paper-3)] text-[var(--color-ink-2)]' },
    telefono: { label: 'Teléfono', color: 'bg-[var(--color-paper-3)] text-[var(--color-ink-2)]' },
    email: { label: 'Email', color: 'bg-[var(--color-paper-3)] text-[var(--color-ink-2)]' },
    otro: { label: 'Otro', color: 'bg-[var(--color-paper-3)] text-[var(--color-ink-2)]' },
};

const PRIORIDAD_CONFIG: Record<LeadPrioridad, { label: string; dot: string; color: string }> = {
    alta: { label: 'Alta', dot: 'bg-[var(--color-danger)]', color: 'bg-[var(--color-danger-soft)] text-[var(--color-danger)] border-[var(--color-danger)]/30' },
    media: { label: 'Media', dot: 'bg-[var(--color-warning)]', color: 'bg-[var(--color-warning-soft)] text-[var(--color-warning)] border-[var(--color-warning)]/30' },
    baja: { label: 'Baja', dot: 'bg-[var(--color-positive)]', color: 'bg-[var(--color-positive-soft)] text-[var(--color-positive)] border-[var(--color-positive)]/30' },
};

// ── Component ─────────────────────────────────────────────────────────────────

export default function LeadCard({ lead, onStatusChange, onDelete, isDragging }: LeadCardProps) {
    const router = useRouter();
    const hoursAgo = getHoursAgo(lead.ultimaActividad ?? lead.createdAt);
    const isUrgent = hoursAgo >= 24;
    const origenConfig = ORIGEN_CONFIG[lead.origen] ?? ORIGEN_CONFIG.otro;
    const prioridadConfig = lead.prioridad ? PRIORIDAD_CONFIG[lead.prioridad] : null;

    // Initials
    const initials = (lead.nombre || "?")
        .split(" ")
        .slice(0, 2)
        .map(w => w[0])
        .join("")
        .toUpperCase();

    // Neutral avatar (no per-name color coding)
    const avatarColor = "bg-[var(--color-paper-3)] text-[var(--color-ink-2)]";

    const whatsappText = encodeURIComponent(
        `Hola ${lead.nombre || ''}, me comunico desde Zeta Prop por tu consulta${lead.propertyTitle ? ` sobre la propiedad ${lead.propertyTitle}` : ''}. ¿En qué te puedo ayudar?`
    );

    return (
        <div 
            onClick={() => router.push(`/dashboard/clientes/leads/${lead.id}`)}
            className={`bg-[var(--color-paper-2)] rounded-2xl border shadow-sm transition-all duration-200 flex flex-col group relative select-none cursor-pointer
            ${isUrgent ? 'border-[var(--color-warning)]/30' : 'border-[var(--color-rule-2)]'}
            ${isDragging ? 'shadow-xl rotate-1 scale-105 opacity-90 border-[var(--color-accent)]/30' : 'hover:shadow-md hover:-translate-y-0.5'}
        `}>
            {/* Urgency accent bar */}
            {isUrgent && (
                <div className={`absolute top-0 left-0 right-0 h-0.5 rounded-t-2xl ${hoursAgo >= 48 ? 'bg-[var(--color-danger)]' : 'bg-[var(--color-warning)]'}`} />
            )}

            {/* Delete Button */}
            {onDelete && (
                <button
                    onClick={() => { if (confirm('¿Eliminar este lead?')) onDelete(lead.id); }}
                    className="absolute top-3 right-3 p-1.5 text-[var(--color-neutral)] hover:text-[var(--color-danger)] hover:bg-[var(--color-danger-soft)] rounded-lg transition-all opacity-0 group-hover:opacity-100 z-20"
                >
                    <Trash2 strokeWidth={1.5} size={14} />
                </button>
            )}

            {/* Header */}
            <div className="p-4 flex items-start gap-3">
                <div className="flex-shrink-0">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm ${avatarColor} border border-[var(--color-paper-2)] shadow-sm hover:scale-105 transition-transform`}>
                        {initials}
                    </div>
                </div>
                <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-[var(--color-ink)] text-sm leading-tight line-clamp-1 group-hover:text-[var(--color-accent)] transition-colors flex items-center gap-1">
                        {lead.nombre}
                        <ArrowRight strokeWidth={1.5} size={12} className="opacity-0 group-hover:opacity-100 transition-opacity text-[var(--color-accent)] flex-shrink-0" />
                    </h3>
                    {/* Badges row */}
                    <div className="flex flex-wrap items-center gap-1 mt-1">
                        {/* Source badge */}
                        <span className={`inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] font-semibold ${origenConfig.color}`}>
                            {origenConfig.label}
                        </span>
                        {/* Priority badge */}
                        {prioridadConfig && (
                            <span title={prioridadConfig.label} className={`inline-flex items-center gap-0.5 px-1.5 py-1 rounded text-[10px] font-semibold border ${prioridadConfig.color}`}>
                                <span className={`w-1.5 h-1.5 rounded-full ${prioridadConfig.dot}`} aria-label={prioridadConfig.label} />
                            </span>
                        )}
                    </div>
                </div>
            </div>

            {/* Property */}
            {lead.propertyTitle && (
                <div className="px-4 pb-2">
                    <div className="bg-[var(--color-paper-3)] rounded-lg px-3 py-1.5 border border-[var(--color-rule)]">
                        <p className="text-[10px] uppercase tracking-wide text-[var(--color-muted)] font-bold mb-0.5">Interesado en</p>
                        <p className="text-xs font-semibold text-[var(--color-ink)] line-clamp-1">{lead.propertyTitle}</p>
                    </div>
                </div>
            )}

            {/* Message */}
            <div className="px-4 pb-3">
                <p className="text-xs text-[var(--color-muted)] line-clamp-2 leading-relaxed bg-[var(--color-paper)] rounded-lg px-2.5 py-2 italic">
                    "{lead.mensaje || 'Sin mensaje'}"
                </p>
            </div>

            {/* Urgency */}
            <div className="px-4 pb-3">
                <UrgencyBadge ultimaActividad={lead.ultimaActividad ?? lead.createdAt} />
            </div>

            {/* Quick Actions */}
            <div className="px-4 pb-4 flex gap-2">
                {lead.telefono ? (
                    <>
                        <a
                            href={`https://wa.me/${lead.telefono.replace(/\D/g, '')}?text=${whatsappText}`}
                            target="_blank" rel="noopener noreferrer"
                            onClick={(e) => { e.stopPropagation(); onStatusChange && lead.estado === 'nuevo' && onStatusChange(lead.id, 'contactado'); }}
                            className="flex-1 flex items-center justify-center gap-1.5 py-2 bg-[var(--color-positive)] hover:opacity-90 text-[var(--color-accent-ink)] rounded-xl text-xs font-bold transition active:scale-95"
                        >
                            <MessageSquare strokeWidth={1.5} size={12} /> WA
                        </a>
                        <a
                            href={`tel:${lead.telefono.replace(/\D/g, '')}`}
                            onClick={(e) => { e.stopPropagation(); onStatusChange && onStatusChange(lead.id, 'contactado'); }}
                            className="flex-1 flex items-center justify-center gap-1.5 py-2 bg-[var(--color-ink)] hover:bg-[var(--color-ink-2)] text-[var(--color-paper)] rounded-xl text-xs font-bold transition active:scale-95"
                        >
                            <Phone strokeWidth={1.5} size={12} /> Llamar
                        </a>
                    </>
                ) : lead.email ? (
                    <a
                        href={`mailto:${lead.email}?subject=Respuesta%20a%20tu%20consulta%20en%20Zeta%20Prop`}
                        onClick={() => onStatusChange && lead.estado === 'nuevo' && onStatusChange(lead.id, 'contactado')}
                        className="flex-1 flex items-center justify-center gap-1.5 py-2 bg-[var(--color-ink)] hover:bg-[var(--color-ink-2)] text-[var(--color-paper)] rounded-xl text-xs font-bold transition active:scale-95"
                    >
                        <Mail strokeWidth={1.5} size={12} /> Email
                    </a>
                ) : (
                    <button disabled className="flex-1 flex items-center justify-center gap-1.5 py-2 bg-[var(--color-paper-3)] text-[var(--color-neutral)] rounded-xl text-xs font-bold cursor-not-allowed">
                        Sin contacto
                    </button>
                )}
                <button
                    onClick={(e) => { e.stopPropagation(); router.push(`/dashboard/clientes/leads/${lead.id}`); }}
                    className="w-9 flex items-center justify-center py-2 bg-[var(--color-paper-3)] hover:bg-[var(--color-paper-4)] text-[var(--color-ink-2)] rounded-xl text-xs font-bold transition"
                    title="Ver historial"
                >
                    <ArrowRight strokeWidth={1.5} size={14} />
                </button>
            </div>
        </div>
    );
}
