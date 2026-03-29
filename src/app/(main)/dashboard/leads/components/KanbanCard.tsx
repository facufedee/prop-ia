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

const AVATAR_COLORS = [
    "from-indigo-400 to-blue-500",
    "from-violet-400 to-purple-500",
    "from-emerald-400 to-teal-500",
    "from-rose-400 to-pink-500",
    "from-amber-400 to-orange-500",
    "from-cyan-400 to-sky-500",
];
const getAvatarColor = (name: string) => AVATAR_COLORS[(name?.charCodeAt(0) || 0) % AVATAR_COLORS.length];

const ORIGEN_EMOJI: Record<string, string> = {
    web: '🌐', whatsapp: '💬', instagram: '📷', facebook: '📘',
    portal: '🏠', referido: '🤝', telefono: '📞', email: '✉️', otro: '❓'
};

const PRIORIDAD_CONFIG: Record<LeadPrioridad, { emoji: string; border: string }> = {
    alta: { emoji: '🔴', border: 'border-l-4 border-l-red-400' },
    media: { emoji: '🟡', border: 'border-l-4 border-l-amber-400' },
    baja: { emoji: '🟢', border: 'border-l-4 border-l-emerald-400' },
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
                    className={`bg-white rounded-2xl border border-gray-100 shadow-sm transition-all duration-200 select-none mb-3 group relative overflow-hidden cursor-pointer
                        ${prioridadConfig?.border ?? ''}
                        ${snapshot.isDragging
                            ? "shadow-2xl rotate-[1.5deg] scale-[1.02] border-indigo-200 ring-2 ring-indigo-200 z-50"
                            : "hover:shadow-md hover:border-indigo-100"
                        }
                        ${isUrgent48 ? 'ring-1 ring-red-200' : isUrgent24 ? 'ring-1 ring-orange-200' : ''}
                    `}
                    onMouseEnter={() => setShowActions(true)}
                    onMouseLeave={() => setShowActions(false)}
                    onClick={() => router.push(`/dashboard/clientes/leads/${lead.id}`)}
                >
                    {/* Urgency top bar */}
                    {(isUrgent24 || isUrgent48) && (
                        <div className={`h-0.5 w-full ${isUrgent48 ? 'bg-red-400' : 'bg-orange-400'}`} />
                    )}

                    {/* Delete button */}
                    {onDelete && showActions && (
                        <button
                            onClick={(e) => { e.stopPropagation(); if (confirm("¿Eliminar esta consulta?")) onDelete(lead.id); }}
                            className="absolute top-2.5 right-2.5 p-1.5 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all z-20"
                        >
                            <Trash2 size={13} />
                        </button>
                    )}

                    <div className="p-4">
                        {/* Header: Avatar + Name + Time */}
                        <div className="flex items-center gap-3 mb-2.5">
                            <div className={`w-9 h-9 rounded-full bg-gradient-to-br ${getAvatarColor(lead.nombre)} text-white flex items-center justify-center font-bold text-sm flex-shrink-0 shadow-sm`}>
                                {getInitials(lead.nombre)}
                            </div>
                            <div className="flex-1 min-w-0">
                                <span className="font-bold text-gray-900 text-sm flex items-center gap-1 group/link">
                                    <span className="truncate">{lead.nombre || "Sin nombre"}</span>
                                    <ArrowRight size={12} className="opacity-0 group-hover/link:opacity-100 transition-opacity flex-shrink-0 text-indigo-400" />
                                </span>
                                <div className="flex items-center gap-1.5 mt-0.5">
                                    <span className="text-[10px] text-gray-400 flex items-center gap-0.5">
                                        <Clock size={9} /> {timeAgo(lead.createdAt)}
                                    </span>
                                    {/* Source */}
                                    <span className="text-[10px] text-gray-400">
                                        {ORIGEN_EMOJI[lead.origen] ?? '❓'} {lead.origen ?? 'web'}
                                    </span>
                                    {/* Priority */}
                                    {lead.prioridad && (
                                        <span className="text-[10px]">
                                            {PRIORIDAD_CONFIG[lead.prioridad].emoji}
                                        </span>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Urgency indicator */}
                        {(isUrgent24 || isUrgent48) && (
                            <div className={`flex items-center gap-1 text-[10px] font-bold mb-2 ${isUrgent48 ? 'text-red-600' : 'text-orange-600'}`}>
                                {isUrgent48
                                    ? <><AlertCircle size={10} className="animate-pulse" /> 🚨 {timeAgo(refDate)} sin respuesta</>
                                    : <><AlertTriangle size={10} /> ⚠ {timeAgo(refDate)} sin respuesta</>
                                }
                            </div>
                        )}

                        {/* Property tag */}
                        {lead.propertyTitle && (
                            <div className="mb-2.5 flex items-center gap-1.5 text-[11px] text-indigo-600 bg-indigo-50 border border-indigo-100 rounded-lg px-2.5 py-1.5 truncate">
                                <Building2 size={11} className="flex-shrink-0" />
                                <span className="truncate font-medium">{lead.propertyTitle}</span>
                            </div>
                        )}

                        {/* Message preview */}
                        {latestMsg && (
                            <div className="bg-gray-50 rounded-xl px-3 py-2.5 mb-3 relative">
                                <span className="absolute top-1 left-1.5 text-gray-300 text-lg leading-none">"</span>
                                <p className="text-[12px] text-gray-500 italic line-clamp-2 pt-1 px-1.5 relative z-10">
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
                                            className="w-7 h-7 flex items-center justify-center rounded-lg bg-green-50 hover:bg-green-100 text-green-600 transition-colors"
                                        >
                                            <MessageSquare size={12} />
                                        </a>
                                        <a
                                            href={`tel:${lead.telefono.replace(/\D/g, "")}`}
                                            onClick={(e) => { e.stopPropagation(); onStatusChange && onStatusChange(lead.id, 'contactado'); }}
                                            title="Llamar"
                                            className="w-7 h-7 flex items-center justify-center rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-600 transition-colors"
                                        >
                                            <Phone size={12} />
                                        </a>
                                    </>
                                )}
                                {lead.email && (
                                    <a
                                        href={`mailto:${lead.email}`}
                                        onClick={(e) => e.stopPropagation()}
                                        title="Email"
                                        className="w-7 h-7 flex items-center justify-center rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-600 transition-colors"
                                    >
                                        <Mail size={12} />
                                    </a>
                                )}
                            </div>

                            {/* Consultas badge */}
                            {consultaCount > 1 && (
                                <div title={`${consultaCount} consultas`} className="flex items-center gap-1 text-[10px] font-bold text-violet-600 bg-violet-50 border border-violet-100 rounded-full px-2 py-0.5">
                                    <Copy size={9} /> {consultaCount}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </Draggable>
    );
}
