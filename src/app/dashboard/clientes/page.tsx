"use client";

import { useState, useEffect } from "react";
import { app, auth } from "@/infrastructure/firebase/client";
import { inquilinosService } from "@/infrastructure/services/inquilinosService";
import { propietariosService } from "@/infrastructure/services/propietariosService";
import { leadsService } from "@/infrastructure/services/leadsService";
import { Inquilino } from "@/domain/models/Inquilino";
import { Propietario } from "@/domain/models/Propietario";
import { Lead } from "@/domain/models/Lead";
import InquilinosTable from "./components/InquilinosTable";
import PropietariosTable from "./components/PropietariosTable";
import LeadsTable from "./components/LeadsTable";
import ClientFormModal from "./components/ClientFormModal";
import { Users, Building2, UserPlus, Plus, Search } from "lucide-react";

type TabType = 'inquilinos' | 'propietarios' | 'leads';

export default function ClientesPage() {
    const [activeTab, setActiveTab] = useState<TabType>('inquilinos');
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");

    // Modal state
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingClient, setEditingClient] = useState<Inquilino | Propietario | Lead | null>(null);

    // Data states
    const [inquilinos, setInquilinos] = useState<Inquilino[]>([]);
    const [propietarios, setPropietarios] = useState<Propietario[]>([]);
    const [leads, setLeads] = useState<Lead[]>([]);

    useEffect(() => {
        if (!auth) {
            setLoading(false);
            return;
        }

        const unsubscribe = auth.onAuthStateChanged((user) => {
            if (user) {
                fetchAllData(user.uid);
            } else {
                setLoading(false);
            }
        });

        return () => unsubscribe();
    }, []);

    const fetchAllData = async (uid: string) => {
        try {
            setLoading(true);
            const [inquilinosData, propietariosData, leadsData] = await Promise.all([
                inquilinosService.getInquilinos(uid),
                propietariosService.getPropietarios(uid),
                leadsService.getLeads(uid),
            ]);

            setInquilinos(inquilinosData);
            setPropietarios(propietariosData);
            setLeads(leadsData);
        } catch (error) {
            console.error("Error fetching data:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleSuccess = (type: TabType) => {
        if (auth?.currentUser) {
            setActiveTab(type);
            fetchAllData(auth.currentUser.uid);
        }
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setEditingClient(null);
    };

    // --- Create ---
    const handleNewClient = () => {
        setEditingClient(null);
        setIsModalOpen(true);
    };

    // --- Inquilinos Handlers ---
    const handleDeleteInquilino = async (id: string) => {
        if (!confirm("¿Estás seguro de eliminar este inquilino?")) return;
        try {
            await inquilinosService.deleteInquilino(id);
            setInquilinos(prev => prev.filter(i => i.id !== id));
        } catch (error) {
            console.error("Error deleting inquilino:", error);
            alert("Error al eliminar el inquilino");
        }
    };

    const handleEditInquilino = (inquilino: Inquilino) => {
        setEditingClient(inquilino);
        setActiveTab('inquilinos'); // Ensure correct tab context if needed
        setIsModalOpen(true);
    };

    const handleViewInquilinoDetail = (inquilino: Inquilino) => {
        // Reuse edit for view detail for now, or just log
        handleEditInquilino(inquilino);
    };

    // --- Propietarios Handlers ---
    const handleDeletePropietario = async (id: string) => {
        if (!confirm("¿Estás seguro de eliminar este propietario?")) return;
        try {
            await propietariosService.deletePropietario(id);
            setPropietarios(prev => prev.filter(p => p.id !== id));
        } catch (error) {
            console.error("Error deleting propietario:", error);
            alert("Error al eliminar el propietario");
        }
    };

    const handleEditPropietario = (propietario: Propietario) => {
        setEditingClient(propietario);
        setActiveTab('propietarios');
        setIsModalOpen(true);
    };

    const handleViewPropietarioDetail = (propietario: Propietario) => {
        handleEditPropietario(propietario);
    };

    // --- Leads Handlers ---
    const handleDeleteLead = async (id: string) => {
        if (!confirm("¿Estás seguro de eliminar este lead?")) return;
        try {
            await leadsService.deleteLead(id);
            setLeads(prev => prev.filter(l => l.id !== id));
        } catch (error) {
            console.error("Error deleting lead:", error);
            alert("Error al eliminar el lead");
        }
    };

    const handleEditLead = (lead: Lead) => {
        setEditingClient(lead);
        setActiveTab('leads');
        setIsModalOpen(true);
    };

    const handleViewLeadDetail = (lead: Lead) => {
        handleEditLead(lead);
    };

    const handleConvertLead = async (id: string) => {
        if (!confirm("¿Marcar este lead como convertido?")) return;
        try {
            await leadsService.convertLead(id);
            if (auth?.currentUser) {
                const updated = await leadsService.getLeads(auth.currentUser.uid);
                setLeads(updated);
            }
        } catch (error) {
            console.error("Error converting lead:", error);
            alert("Error al convertir el lead");
        }
    };

    // --- Filters ---
    const filteredInquilinos = inquilinos.filter(i =>
        i.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
        i.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        i.dni.includes(searchTerm)
    );

    const filteredPropietarios = propietarios.filter(p =>
        p.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.dni.includes(searchTerm)
    );

    const filteredLeads = leads.filter(l =>
        l.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
        l.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        l.telefono.includes(searchTerm)
    );

    const tabs = [
        { id: 'inquilinos', label: 'Inquilinos', icon: Users, count: inquilinos.length },
        { id: 'propietarios', label: 'Propietarios', icon: Building2, count: propietarios.length },
        { id: 'leads', label: 'Leads', icon: UserPlus, count: leads.length },
    ] as const;

    if (loading) {
        return (
            <div className="p-6 flex items-center justify-center min-h-[400px]">
                <div className="text-gray-500">Cargando clientes...</div>
            </div>
        );
    }

    return (
        <div className="p-6 max-w-7xl mx-auto space-y-6">
            <ClientFormModal
                isOpen={isModalOpen}
                onClose={handleCloseModal}
                onSuccess={handleSuccess}
                initialType={activeTab}
                initialData={editingClient}
            />

            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Clientes</h1>
                    <p className="text-gray-500">Gestión de inquilinos, propietarios y leads</p>
                </div>
                <button
                    onClick={handleNewClient}
                    className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors shadow-sm shadow-indigo-200"
                >
                    <Plus className="w-5 h-5" />
                    Nuevo Cliente
                </button>
            </div>

            {/* Search */}
            <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                    type="text"
                    placeholder="Buscar por nombre, email o DNI..."
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>

            {/* Tabs */}
            <div className="border-b border-gray-200">
                <div className="flex gap-4 overflow-x-auto">
                    {tabs.map(tab => {
                        const Icon = tab.icon;
                        return (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`flex items-center gap-2 px-4 py-3 border-b-2 transition-colors whitespace-nowrap ${activeTab === tab.id
                                    ? 'border-indigo-600 text-indigo-600 font-medium'
                                    : 'border-transparent text-gray-600 hover:text-gray-900'
                                    }`}
                            >
                                <Icon className="w-5 h-5" />
                                {tab.label}
                                <span className={`px-2 py-0.5 text-xs rounded-full ${activeTab === tab.id
                                    ? 'bg-indigo-100 text-indigo-700'
                                    : 'bg-gray-100 text-gray-600'
                                    }`}>
                                    {tab.count}
                                </span>
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* Tab Content */}
            <div>
                {activeTab === 'inquilinos' && (
                    <InquilinosTable
                        inquilinos={filteredInquilinos}
                        onDelete={handleDeleteInquilino}
                        onEdit={handleEditInquilino}
                        onViewDetail={handleViewInquilinoDetail}
                    />
                )}

                {activeTab === 'propietarios' && (
                    <PropietariosTable
                        propietarios={filteredPropietarios}
                        onDelete={handleDeletePropietario}
                        onEdit={handleEditPropietario}
                        onViewDetail={handleViewPropietarioDetail}
                    />
                )}

                {activeTab === 'leads' && (
                    <LeadsTable
                        leads={filteredLeads}
                        onDelete={handleDeleteLead}
                        onEdit={handleEditLead}
                        onViewDetail={handleViewLeadDetail}
                        onConvert={handleConvertLead}
                    />
                )}
            </div>
        </div>
    );
}
