
import { Lead } from "@/domain/models/Lead";
import { Mail, MessageSquare, Phone, Calendar, User, Clock } from "lucide-react";

interface LeadCardProps {
    lead: Lead;
}

export default function LeadCard({ lead }: LeadCardProps) {
    return (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all duration-300 flex flex-col h-full group">
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
                            {lead.createdAt?.toLocaleDateString()}
                        </p>
                    </div>
                </div>
                <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${lead.estado === 'nuevo' ? 'bg-green-50 text-green-600 border-green-100' :
                        lead.estado === 'contactado' ? 'bg-blue-50 text-blue-600 border-blue-100' :
                            'bg-gray-50 text-gray-500 border-gray-100'
                    }`}>
                    {lead.estado}
                </span>
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
