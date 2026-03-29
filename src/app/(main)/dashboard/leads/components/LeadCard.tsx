"use client";

import { Lead, LeadEstado, LeadOrigen, LeadPrioridad, normalizarEstado } from "@/domain/models/Lead";
import { Mail, MessageSquare, Phone, Clock, Trash2, ArrowRight, AlertTriangle, AlertCircle, Zap } from "lucide-react";
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
            <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-red-100 text-red-700 rounded-full text-[10px] font-bold border border-red-200">
                <AlertCircle size={10} className="animate-pulse" />
                🚨 {time} sin respuesta
            </span>
        );
    }
    if (hours >= 24) {
        return (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-orange-100 text-orange-700 rounded-full text-[10px] font-bold border border-orange-200">
                <AlertTriangle size={10} />
                ⚠ {time} sin respuesta
            </span>
        );
    }
    return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-gray-100 text-gray-500 rounded-full text-[10px] border">
            <Clock size={10} />
            ⏱ {time}
        </span>
    );
}

const ORIGEN_CONFIG: Record<LeadOrigen, { label: string; emoji: string; color: string }> = {
    web: { label: 'Web', emoji: '🌐', color: 'bg-blue-50 text-blue-600' },
    whatsapp: { label: 'WhatsApp', emoji: '💬', color: 'bg-green-50 text-green-600' },
    instagram: { label: 'Instagram', emoji: '📷', color: 'bg-pink-50 text-pink-600' },
    facebook: { label: 'Facebook', emoji: '📘', color: 'bg-blue-50 text-blue-700' },
    portal: { label: 'Portal', emoji: '🏠', color: 'bg-amber-50 text-amber-700' },
    referido: { label: 'Referido', emoji: '🤝', color: 'bg-teal-50 text-teal-600' },
    telefono: { label: 'Teléfono', emoji: '📞', color: 'bg-slate-50 text-slate-600' },
    email: { label: 'Email', emoji: '✉️', color: 'bg-gray-50 text-gray-600' },
    otro: { label: 'Otro', emoji: '❓', color: 'bg-gray-50 text-gray-500' },
};

const PRIORIDAD_CONFIG: Record<LeadPrioridad, { emoji: string; label: string; color: string }> = {
    alta: { emoji: '🔴', label: 'Alta', color: 'bg-red-50 text-red-700 border-red-200' },
    media: { emoji: '🟡', label: 'Media', color: 'bg-amber-50 text-amber-700 border-amber-200' },
    baja: { emoji: '🟢', label: 'Baja', color: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
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

    // Avatar color based on name hash
    const colors = ["bg-indigo-100 text-indigo-700", "bg-purple-100 text-purple-700", "bg-green-100 text-green-700", "bg-amber-100 text-amber-700", "bg-rose-100 text-rose-700"];
    const colorIdx = lead.nombre.charCodeAt(0) % colors.length;
    const avatarColor = colors[colorIdx];

    const whatsappText = encodeURIComponent(
        `Hola ${lead.nombre || ''}, me comunico desde Zeta Prop por tu consulta${lead.propertyTitle ? ` sobre la propiedad ${lead.propertyTitle}` : ''}. ¿En qué te puedo ayudar?`
    );

    return (
        <div 
            onClick={() => router.push(`/dashboard/clientes/leads/${lead.id}`)}
            className={`bg-white rounded-2xl border shadow-sm transition-all duration-200 flex flex-col group relative select-none cursor-pointer
            ${isUrgent ? 'border-orange-200 shadow-orange-50' : 'border-gray-100'}
            ${isDragging ? 'shadow-xl rotate-1 scale-105 opacity-90 border-indigo-300' : 'hover:shadow-md hover:-translate-y-0.5'}
        `}>
            {/* Urgency accent bar */}
            {isUrgent && (
                <div className={`absolute top-0 left-0 right-0 h-0.5 rounded-t-2xl ${hoursAgo >= 48 ? 'bg-red-400' : 'bg-orange-400'}`} />
            )}

            {/* Delete Button */}
            {onDelete && (
                <button
                    onClick={() => { if (confirm('¿Eliminar este lead?')) onDelete(lead.id); }}
                    className="absolute top-3 right-3 p-1.5 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all opacity-0 group-hover:opacity-100 z-20"
                >
                    <Trash2 size={14} />
                </button>
            )}

            {/* Header */}
            <div className="p-4 flex items-start gap-3">
                <div className="flex-shrink-0">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm ${avatarColor} border border-white shadow-sm hover:scale-105 transition-transform`}>
                        {initials}
                    </div>
                </div>
                <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-gray-900 text-sm leading-tight line-clamp-1 group-hover:text-indigo-600 transition-colors flex items-center gap-1">
                        {lead.nombre}
                        <ArrowRight size={12} className="opacity-0 group-hover:opacity-100 transition-opacity text-indigo-400 flex-shrink-0" />
                    </h3>
                    {/* Badges row */}
                    <div className="flex flex-wrap items-center gap-1 mt-1">
                        {/* Source badge */}
                        <span className={`inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] font-semibold ${origenConfig.color}`}>
                            {origenConfig.emoji} {origenConfig.label}
                        </span>
                        {/* Priority badge */}
                        {prioridadConfig && (
                            <span className={`inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] font-semibold border ${prioridadConfig.color}`}>
                                {prioridadConfig.emoji}
                            </span>
                        )}
                    </div>
                </div>
            </div>

            {/* Property */}
            {lead.propertyTitle && (
                <div className="px-4 pb-2">
                    <div className="bg-indigo-50/60 rounded-lg px-3 py-1.5 border border-indigo-100/50">
                        <p className="text-[10px] uppercase tracking-wide text-indigo-400 font-bold mb-0.5">Interesado en</p>
                        <p className="text-xs font-semibold text-indigo-800 line-clamp-1">{lead.propertyTitle}</p>
                    </div>
                </div>
            )}

            {/* Message */}
            <div className="px-4 pb-3">
                <p className="text-xs text-gray-500 line-clamp-2 leading-relaxed bg-gray-50 rounded-lg px-2.5 py-2 italic">
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
                            className="flex-1 flex items-center justify-center gap-1.5 py-2 bg-green-500 hover:bg-green-600 text-white rounded-xl text-xs font-bold transition active:scale-95"
                        >
                            <MessageSquare size={12} /> WA
                        </a>
                        <a
                            href={`tel:${lead.telefono.replace(/\D/g, '')}`}
                            onClick={(e) => { e.stopPropagation(); onStatusChange && onStatusChange(lead.id, 'contactado'); }}
                            className="flex-1 flex items-center justify-center gap-1.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition active:scale-95"
                        >
                            <Phone size={12} /> Llamar
                        </a>
                    </>
                ) : lead.email ? (
                    <a
                        href={`mailto:${lead.email}?subject=Respuesta%20a%20tu%20consulta%20en%20Zeta%20Prop`}
                        onClick={() => onStatusChange && lead.estado === 'nuevo' && onStatusChange(lead.id, 'contactado')}
                        className="flex-1 flex items-center justify-center gap-1.5 py-2 bg-gray-800 hover:bg-black text-white rounded-xl text-xs font-bold transition active:scale-95"
                    >
                        <Mail size={12} /> Email
                    </a>
                ) : (
                    <button disabled className="flex-1 flex items-center justify-center gap-1.5 py-2 bg-gray-100 text-gray-400 rounded-xl text-xs font-bold cursor-not-allowed">
                        Sin contacto
                    </button>
                )}
                <button
                    onClick={(e) => { e.stopPropagation(); router.push(`/dashboard/clientes/leads/${lead.id}`); }}
                    className="w-9 flex items-center justify-center py-2 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-xl text-xs font-bold transition"
                    title="Ver historial"
                >
                    <ArrowRight size={14} />
                </button>
            </div>
        </div>
    );
}
