"use client";

import { Lead, LeadEstado } from "@/domain/models/Lead";
import { Draggable } from "@hello-pangea/dnd";
import { MessageSquare, Mail, Phone, Clock, Building2, Trash2, ArrowRight, Copy } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

interface KanbanCardProps {
    lead: Lead;
    index: number;
    onDelete?: (id: string) => void;
    onStatusChange?: (id: string, newStatus: LeadEstado) => void;
}

const timeAgo = (date: Date) => {
    const seconds = Math.floor((new Date().getTime() - new Date(date).getTime()) / 1000);
    let interval = seconds / 31536000;
    if (interval > 1) return Math.floor(interval) + "a";
    interval = seconds / 2592000;
    if (interval > 1) return Math.floor(interval) + "m";
    interval = seconds / 86400;
    if (interval > 1) return Math.floor(interval) + "d";
    interval = seconds / 3600;
    if (interval > 1) return Math.floor(interval) + "h";
    interval = seconds / 60;
    if (interval > 1) return Math.floor(interval) + "min";
    return "ahora";
};

const getInitials = (name: string) => {
    if (!name) return "?";
    const parts = name.trim().split(" ");
    return parts.length > 1
        ? (parts[0][0] + parts[1][0]).toUpperCase()
        : parts[0][0].toUpperCase();
};

const AVATAR_COLORS = [
    "from-indigo-400 to-blue-500",
    "from-violet-400 to-purple-500",
    "from-emerald-400 to-teal-500",
    "from-rose-400 to-pink-500",
    "from-amber-400 to-orange-500",
    "from-cyan-400 to-sky-500",
];

const getAvatarColor = (name: string) => {
    const index = (name?.charCodeAt(0) || 0) % AVATAR_COLORS.length;
    return AVATAR_COLORS[index];
};

export default function KanbanCard({ lead, index, onDelete, onStatusChange }: KanbanCardProps) {
    const [showActions, setShowActions] = useState(false);
    const hasConsultas = lead.consultas && lead.consultas.length > 0;
    const consultaCount = hasConsultas ? lead.consultas!.length : 1;
    const latestMsg = hasConsultas
        ? lead.consultas![lead.consultas!.length - 1].mensaje
        : lead.mensaje;

    return (
        <Draggable draggableId={lead.id} index={index}>
            {(provided, snapshot) => (
                <div
                    ref={provided.innerRef}
                    {...provided.draggableProps}
                    {...provided.dragHandleProps}
                    className={`bg-white rounded-2xl border border-gray-100 shadow-sm transition-all duration-200 select-none mb-3 group relative
                        ${snapshot.isDragging
                            ? "shadow-2xl rotate-[1.5deg] scale-[1.02] border-indigo-200 ring-2 ring-indigo-200 z-50"
                            : "hover:shadow-md hover:border-indigo-100"
                        }
                    `}
                    onMouseEnter={() => setShowActions(true)}
                    onMouseLeave={() => setShowActions(false)}
                >
                    {/* Drag Handle Bar */}
                    <div className="absolute top-0 left-0 right-0 h-1 rounded-t-2xl bg-gradient-to-r from-transparent via-gray-200 to-transparent opacity-0 group-hover:opacity-100 cursor-grab active:cursor-grabbing transition-opacity" />

                    {/* Delete hover button */}
                    {onDelete && showActions && (
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                if (confirm("¿Eliminar esta consulta?")) onDelete(lead.id);
                            }}
                            className="absolute top-2.5 right-2.5 p-1.5 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all z-20"
                            title="Eliminar"
                        >
                            <Trash2 size={13} />
                        </button>
                    )}

                    <div className="p-4">
                        {/* Header: Avatar + Name + Time */}
                        <div className="flex items-center gap-3 mb-3">
                            <div className={`w-9 h-9 rounded-full bg-gradient-to-br ${getAvatarColor(lead.nombre)} text-white flex items-center justify-center font-bold text-sm flex-shrink-0 shadow-sm`}>
                                {getInitials(lead.nombre)}
                            </div>
                            <div className="flex-1 min-w-0">
                                <Link
                                    href={`/dashboard/clientes/leads/${lead.id}`}
                                    className="font-bold text-gray-900 text-sm hover:text-indigo-600 transition-colors flex items-center gap-1 group/link"
                                >
                                    <span className="truncate">{lead.nombre || "Sin nombre"}</span>
                                    <ArrowRight size={12} className="opacity-0 group-hover/link:opacity-100 transition-opacity flex-shrink-0 text-indigo-400" />
                                </Link>
                                <p className="text-[11px] text-gray-400 flex items-center gap-1 mt-0.5">
                                    <Clock size={9} />
                                    {timeAgo(lead.createdAt)}
                                </p>
                            </div>
                        </div>

                        {/* Property tag */}
                        {lead.propertyTitle && (
                            <div className="mb-3 flex items-center gap-1.5 text-[11px] text-indigo-600 bg-indigo-50 border border-indigo-100 rounded-lg px-2.5 py-1.5 truncate">
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

                        {/* Footer: Contact chips + consultas counter */}
                        <div className="flex items-center justify-between gap-2">
                            <div className="flex items-center gap-1.5">
                                {lead.telefono && (
                                    <a
                                        href={`https://wa.me/${lead.telefono.replace(/\D/g, "")}?text=${encodeURIComponent(`Hola ${lead.nombre}, me comunico desde Zeta Prop.`)}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        onClick={(e) => e.stopPropagation()}
                                        title="Contactar por WhatsApp"
                                        className="w-7 h-7 flex items-center justify-center rounded-lg bg-green-50 hover:bg-green-100 text-green-600 transition-colors"
                                    >
                                        <Phone size={12} />
                                    </a>
                                )}
                                {lead.email && (
                                    <a
                                        href={`mailto:${lead.email}`}
                                        onClick={(e) => e.stopPropagation()}
                                        title="Enviar email"
                                        className="w-7 h-7 flex items-center justify-center rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-600 transition-colors"
                                    >
                                        <Mail size={12} />
                                    </a>
                                )}
                            </div>

                            {/* Inquiry Count Badge */}
                            {consultaCount > 1 && (
                                <div
                                    title={`${consultaCount} consultas del mismo contacto`}
                                    className="flex items-center gap-1 text-[10px] font-bold text-violet-600 bg-violet-50 border border-violet-100 rounded-full px-2 py-0.5"
                                >
                                    <Copy size={9} />
                                    {consultaCount} consultas
                                </div>
                            )}

                            {/* Origin tag */}
                            <span className="text-[10px] text-gray-400 capitalize font-medium">{lead.origen || "web"}</span>
                        </div>
                    </div>
                </div>
            )}
        </Draggable>
    );
}
