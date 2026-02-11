
import { Lead, LeadEstado } from "@/domain/models/Lead";
import { Mail, MessageSquare, Phone, Calendar, User, Clock, Trash2, MoreVertical, CheckCircle2, XCircle, AlertCircle } from "lucide-react";
import { useState } from "react";

interface LeadCardProps {
    lead: Lead;
    onStatusChange?: (id: string, newStatus: LeadEstado) => void;
    onDelete?: (id: string) => void;
}

export default function LeadCard({ lead, onStatusChange, onDelete }: LeadCardProps) {
    const [isMenuOpen, setIsMenuOpen] = useState(false);

    const timeAgo = (date: Date) => {
        const seconds = Math.floor((new Date().getTime() - new Date(date).getTime()) / 1000);
        let interval = seconds / 31536000;
        if (interval > 1) return Math.floor(interval) + " años";
        interval = seconds / 2592000;
        if (interval > 1) return Math.floor(interval) + " meses";
        interval = seconds / 86400;
        if (interval > 1) return Math.floor(interval) + " días";
        interval = seconds / 3600;
        if (interval > 1) return Math.floor(interval) + " horas";
        interval = seconds / 60;
        if (interval > 1) return Math.floor(interval) + " minutos";
        return Math.floor(seconds) + " segundos";
    };

    const getStatusColor = (status: LeadEstado) => {
        switch (status) {
            case 'nuevo': return 'bg-green-50 text-green-600 border-green-100';
            case 'contactado': return 'bg-blue-50 text-blue-600 border-blue-100';
            case 'leido': return 'bg-indigo-50 text-indigo-600 border-indigo-100';
            case 'respondido': return 'bg-purple-50 text-purple-600 border-purple-100';
            case 'finalizado': return 'bg-gray-100 text-gray-600 border-gray-200';
            case 'descartado': return 'bg-red-50 text-red-600 border-red-100';
            default: return 'bg-gray-50 text-gray-500 border-gray-100';
        }
    };

    const getStatusLabel = (status: LeadEstado) => {
        return status.charAt(0).toUpperCase() + status.slice(1);
    }

    return (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all duration-300 flex flex-col h-full group relative">
            {/* Delete Button (Hover) */}
            {onDelete && (
                <button
                    onClick={() => {
                        if (confirm('¿Estás seguro de eliminar esta consulta?')) onDelete(lead.id);
                    }}
                    className="absolute top-4 right-4 p-1.5 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all opacity-0 group-hover:opacity-100 z-20"
                    title="Eliminar consulta"
                >
                    <Trash2 size={16} />
                </button>
            )}

            {/* Header */}
            <div className="p-5 border-b border-gray-50 flex items-start justify-between gap-4">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-50 to-blue-50 text-indigo-600 flex items-center justify-center font-bold text-lg border border-indigo-100 shadow-inner">
                        {(lead.nombre || "?").charAt(0).toUpperCase()}
                    </div>
                    <div>
                        <h3 className="font-bold text-gray-900 leading-tight line-clamp-1 group-hover:text-indigo-600 transition-colors">
                            {lead.nombre}
                        </h3>
                        <p className="text-xs text-gray-400 mt-0.5 flex items-center gap-1">
                            <Clock size={10} />
                            Hace {timeAgo(lead.createdAt)}
                        </p>
                    </div>
                </div>
            </div>

            {/* Status Bar */}
            <div className="px-5 py-2 bg-gray-50/50 flex items-center justify-between border-b border-gray-50">
                <div className="flex items-center gap-2">
                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${getStatusColor(lead.estado)}`}>
                        {lead.estado}
                    </span>
                </div>

                {/* Status Actions */}
                {onStatusChange && (
                    <div className="flex items-center gap-1">
                        {lead.estado === 'nuevo' && (
                            <button
                                onClick={() => onStatusChange(lead.id, 'leido')}
                                className="text-[10px] font-medium text-indigo-600 hover:underline hover:text-indigo-800"
                            >
                                Marcar leído
                            </button>
                        )}
                        {(lead.estado === 'leido' || lead.estado === 'contactado') && (
                            <button
                                onClick={() => onStatusChange(lead.id, 'respondido')}
                                className="text-[10px] font-medium text-purple-600 hover:underline hover:text-purple-800"
                            >
                                Marcar respondido
                            </button>
                        )}
                        {lead.estado === 'respondido' && (
                            <button
                                onClick={() => onStatusChange(lead.id, 'finalizado')}
                                className="text-[10px] font-medium text-gray-600 hover:underline hover:text-gray-800"
                            >
                                Finalizar
                            </button>
                        )}
                    </div>
                )}
            </div>

            {/* Content */}
            <div className="p-5 flex-1 flex flex-col gap-4">
                {lead.propertyTitle && (
                    <div className="bg-indigo-50/50 rounded-lg p-3 border border-indigo-100/50">
                        <p className="text-[10px] uppercase tracking-wide text-indigo-400 font-bold mb-1">Interesado en</p>
                        <p className="text-sm font-semibold text-indigo-900 line-clamp-1">
                            {lead.propertyTitle}
                        </p>
                    </div>
                )}

                <div className="bg-gray-50 rounded-xl p-4 text-sm text-gray-600 italic relative">
                    <span className="absolute top-2 left-2 text-gray-300 text-2xl leading-none">"</span>
                    <p className="relative z-10 pt-2 px-2 line-clamp-4">
                        {lead.mensaje || "Sin mensaje"}
                    </p>
                </div>
            </div>

            {/* Contact Actions */}
            <div className="p-4 pt-0 mt-auto grid grid-cols-2 gap-3">
                {lead.telefono ? (
                    <a
                        href={`https://wa.me/${lead.telefono.replace(/\D/g, '')}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center justify-center gap-2 px-3 py-2.5 bg-green-500 hover:bg-green-600 text-white rounded-xl text-xs font-bold transition shadow-sm hover:shadow active:scale-95"
                        onClick={() => onStatusChange && lead.estado === 'nuevo' && onStatusChange(lead.id, 'contactado')}
                    >
                        <MessageSquare size={14} /> WhatsApp
                    </a>
                ) : (
                    <button disabled className="flex items-center justify-center gap-2 px-3 py-2.5 bg-gray-100 text-gray-400 rounded-xl text-xs font-bold cursor-not-allowed">
                        <MessageSquare size={14} /> No disp.
                    </button>
                )}

                {lead.email ? (
                    <a
                        href={`mailto:${lead.email}`}
                        className="flex items-center justify-center gap-2 px-3 py-2.5 bg-gray-900 hover:bg-black text-white rounded-xl text-xs font-bold transition shadow-sm hover:shadow active:scale-95"
                        onClick={() => onStatusChange && lead.estado === 'nuevo' && onStatusChange(lead.id, 'contactado')}
                    >
                        <Mail size={14} /> Email
                    </a>
                ) : (
                    <button disabled className="flex items-center justify-center gap-2 px-3 py-2.5 bg-gray-100 text-gray-400 rounded-xl text-xs font-bold cursor-not-allowed">
                        <Mail size={14} /> No disp.
                    </button>
                )}
            </div>
        </div>
    );
}
