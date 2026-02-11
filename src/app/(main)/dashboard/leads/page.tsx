"use client";

import { useEffect, useState } from "react";
import { Info, MessageSquare, Phone, Mail, Loader2, Calendar, Search, Filter } from "lucide-react";
import { auth } from "@/infrastructure/firebase/client";
import { leadsService } from "@/infrastructure/services/leadsService";
import { Lead, LeadEstado } from "@/domain/models/Lead";
import { useAuth } from "@/ui/context/AuthContext";
import LeadCard from "./components/LeadCard";
import { toast } from "sonner"; // Assuming Sonner is used for toasts based on layout.tsx

export default function LeadsPage() {
    const [leads, setLeads] = useState<Lead[]>([]);
    const [loading, setLoading] = useState(true);
    const { userRole } = useAuth();
    const [searchTerm, setSearchTerm] = useState("");
    const [filter, setFilter] = useState<'Todos' | LeadEstado>('Todos');
    const [filteredLeads, setFilteredLeads] = useState<Lead[]>([]);

    useEffect(() => {
        let result = leads;

        // Filter by Status
        if (filter !== 'Todos') {
            result = result.filter(l => l.estado === filter);
        }

        // Filter by Search
        if (searchTerm.trim()) {
            const lowerTerm = searchTerm.toLowerCase();
            result = result.filter(l =>
                (l.nombre && l.nombre.toLowerCase().includes(lowerTerm)) ||
                (l.email && l.email.toLowerCase().includes(lowerTerm)) ||
                (l.propertyTitle && l.propertyTitle.toLowerCase().includes(lowerTerm))
            );
        }

        setFilteredLeads(result);
    }, [leads, filter, searchTerm]);

    useEffect(() => {
        fetchLeads();
    }, []);

    const fetchLeads = async () => {
        if (!auth?.currentUser) return;
        try {
            setLoading(true);

            let data: Lead[] = [];

            if (userRole?.name === 'Super Admin') {
                // If Super Admin, fetch SYSTEM leads (Platform inquiries)
                data = await leadsService.getLeads('SYSTEM_ZETA_PROP');
            } else {
                // Regular users fetch their own leads
                data = await leadsService.getLeads(auth.currentUser.uid);
            }

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
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Leads y Consultas</h1>
                    <p className="text-gray-500">Gestioná las consultas recibidas de tus propiedades</p>
                </div>
            </div>

            {/* Filters and Search */}
            <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm flex flex-col md:flex-row gap-4 justify-between items-center">
                {/* Search Bar */}
                <div className="relative w-full md:w-96">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                        type="text"
                        placeholder="Buscar por nombre, email, propiedad..."
                        className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 focus:bg-white transition-all shadow-sm text-gray-900 placeholder-gray-500"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>

                {/* Filter Tabs */}
                <div className="flex items-center gap-2 overflow-x-auto w-full md:w-auto pb-1 md:pb-0">
                    <Filter className="w-5 h-5 text-gray-400 shrink-0 hidden md:block" />
                    <div className="flex p-1 bg-gray-100 rounded-lg">
                        {(['Todos', 'nuevo', 'contactado', 'leido', 'respondido', 'finalizado'] as const).map((f) => (
                            <button
                                key={f}
                                onClick={() => setFilter(f)}
                                className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all whitespace-nowrap capitalize ${filter === f
                                    ? 'bg-white text-indigo-600 shadow-sm'
                                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-200/50'
                                    }`}
                            >
                                {f}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* Content */}
            {filteredLeads.length === 0 ? (
                <div className="text-center py-16 bg-gray-50 rounded-xl border border-gray-200 border-dashed">
                    <MessageSquare className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-500 text-lg">No se encontraron consultas</p>
                    <p className="text-gray-400 text-sm">Intentá cambiando los filtros o esperá nuevas consultas.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredLeads.map((lead) => (
                        <LeadCard
                            key={lead.id}
                            lead={lead}
                            onStatusChange={async (id, newStatus) => {
                                // Optimistic update
                                setLeads(prev => prev.map(l => l.id === id ? { ...l, estado: newStatus } : l));
                                try {
                                    await leadsService.updateLead(id, { estado: newStatus });
                                    toast.success('Estado actualizado');
                                } catch (error) {
                                    console.error('Failed to update status', error);
                                    fetchLeads(); // Revert on error
                                    toast.error('Error al actualizar estado');
                                }
                            }}
                            onDelete={async (id) => {
                                // Optimistic update
                                setLeads(prev => prev.filter(l => l.id !== id));
                                try {
                                    await leadsService.deleteLead(id);
                                    toast.success('Consulta eliminada');
                                } catch (error) {
                                    console.error('Failed to delete lead', error);
                                    fetchLeads(); // Revert on error
                                    toast.error('Error al eliminar consulta');
                                }
                            }}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}
