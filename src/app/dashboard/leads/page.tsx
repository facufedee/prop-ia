"use client";

import { useEffect, useState } from "react";
import { Info, MessageSquare, Phone, Mail, Loader2, Calendar } from "lucide-react";
import { auth } from "@/infrastructure/firebase/client";
import { leadsService } from "@/infrastructure/services/leadsService";
import { Lead } from "@/domain/models/Lead";
import { useAuth } from "@/ui/context/AuthContext";

export default function LeadsPage() {
    const [leads, setLeads] = useState<Lead[]>([]);
    const [loading, setLoading] = useState(true);
    const { userRole } = useAuth(); // Might need this for permission based viewing later

    useEffect(() => {
        fetchLeads();
    }, []);

    const fetchLeads = async () => {
        if (!auth?.currentUser) return;
        try {
            setLoading(true);
            const data = await leadsService.getLeads(auth.currentUser.uid);
            // Sort by date desc
            const sorted = data.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
            setLeads(sorted);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="text-gray-500 flex items-center gap-2">
                    <Loader2 className="animate-spin" /> Cargando consultas...
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Leads y Consultas</h1>
                    <p className="text-gray-500">Gestiona las consultas recibidas de tus propiedades</p>
                </div>
                {/* <button className="px-4 py-2 bg-black text-white rounded-lg text-sm font-medium">Exportar CSV</button> */}
            </div>

            <div className="grid gap-4">
                {leads.length === 0 ? (
                    <div className="text-center py-12 bg-white rounded-xl border border-gray-200">
                        <MessageSquare className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                        <h3 className="text-lg font-medium text-gray-900">No hay consultas aún</h3>
                        <p className="text-gray-500">Las consultas que recibas de tus propiedades aparecerán aquí.</p>
                    </div>
                ) : (
                    leads.map((lead) => (
                        <div key={lead.id} className="bg-white border rounded-xl p-6 hover:shadow-md transition-shadow">
                            <div className="flex flex-col md:flex-row justify-between items-start mb-4 gap-4">
                                <div className="flex items-start gap-4">
                                    <div className="w-12 h-12 bg-indigo-50 rounded-full flex items-center justify-center text-indigo-600 font-bold text-lg shrink-0">
                                        {(lead.nombre || "?").charAt(0).toUpperCase()}
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-gray-900 text-lg">{lead.nombre}</h3>
                                        {lead.propertyTitle && (
                                            <div className="flex items-center gap-2 text-indigo-600 font-medium text-sm mt-0.5">
                                                <span>🏠 {lead.propertyTitle}</span>
                                            </div>
                                        )}
                                        <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
                                            {lead.email && <span className="flex items-center gap-1"><Mail size={14} /> {lead.email}</span>}
                                            {lead.telefono && <span className="flex items-center gap-1"><Phone size={14} /> {lead.telefono}</span>}
                                        </div>
                                    </div>
                                </div>

                                <div className="flex flex-col items-end gap-2">
                                    <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider
                                        ${lead.estado === 'nuevo' ? 'bg-green-100 text-green-700' :
                                            lead.estado === 'contactado' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-700'}`}>
                                        {lead.estado}
                                    </span>
                                    <span className="text-xs text-gray-400 flex items-center gap-1">
                                        <Calendar size={12} />
                                        {lead.createdAt?.toLocaleDateString()} {lead.createdAt?.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </span>
                                </div>
                            </div>

                            <div className="bg-gray-50 p-4 rounded-xl text-gray-700 text-sm mb-4 border border-gray-100 italic">
                                "{lead.mensaje}"
                            </div>

                            {/* Actions could be added here later: Change status, Add note, etc. */}
                            <div className="flex justify-end gap-2 border-t pt-4">
                                {lead.telefono && (
                                    <a
                                        href={`https://wa.me/${lead.telefono.replace(/\D/g, '')}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="flex items-center gap-2 px-4 py-2 bg-green-500 text-white rounded-lg text-sm font-bold hover:bg-green-600 transition"
                                    >
                                        <MessageSquare size={16} /> WhatsApp
                                    </a>
                                )}
                                <a
                                    href={`mailto:${lead.email}`}
                                    className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm font-bold hover:bg-gray-200 transition"
                                >
                                    <Mail size={16} /> Email
                                </a>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}
