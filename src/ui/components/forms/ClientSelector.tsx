"use client";

import { useState, useEffect } from "react";
import { User, Plus, Search, Check, X } from "lucide-react";
import { Inquilino } from "@/domain/models/Inquilino";
import { Propietario } from "@/domain/models/Propietario";
import { inquilinosService } from "@/infrastructure/services/inquilinosService";
import { propietariosService } from "@/infrastructure/services/propietariosService";
import { auth } from "@/infrastructure/firebase/client";
import ClientFormModal from "@/app/(main)/dashboard/clientes/components/ClientFormModal";

interface ClientSelectorProps {
    type: 'inquilinos' | 'propietarios';
    selectedId?: string;
    onSelect: (client: Inquilino | Propietario) => void;
    label?: string;
}

export default function ClientSelector({ type, selectedId, onSelect, label }: ClientSelectorProps) {
    const [searchTerm, setSearchTerm] = useState("");
    const [results, setResults] = useState<(Inquilino | Propietario)[]>([]);
    const [selectedClient, setSelectedClient] = useState<Inquilino | Propietario | null>(null);
    const [loading, setLoading] = useState(false);
    const [showResults, setShowResults] = useState(false);

    // Modal state for creating new client inline
    const [isModalOpen, setIsModalOpen] = useState(false);

    // Initial load of selected client
    useEffect(() => {
        const fetchSelected = async () => {
            if (!selectedId) return;
            try {
                let client = null;
                if (type === 'inquilinos') {
                    client = await inquilinosService.getInquilinoById(selectedId);
                } else {
                    client = await propietariosService.getPropietarioById(selectedId);
                }
                if (client) setSelectedClient(client);
            } catch (error) {
                console.error("Error fetching selected client:", error);
            }
        };
        fetchSelected();
    }, [selectedId, type]);

    // Search logic
    useEffect(() => {
        const search = async () => {
            if (!auth?.currentUser || searchTerm.length < 2) {
                setResults([]);
                return;
            }

            setLoading(true);
            try {
                let found: (Inquilino | Propietario)[] = [];
                if (type === 'inquilinos') {
                    const all = await inquilinosService.getInquilinos(auth.currentUser.uid);
                    found = all.filter(c =>
                        c.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
                        c.dni?.includes(searchTerm)
                    );
                } else {
                    const all = await propietariosService.getPropietarios(auth.currentUser.uid);
                    found = all.filter(c =>
                        c.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
                        c.dni?.includes(searchTerm)
                    );
                }
                setResults(found.slice(0, 5)); // Limit to 5
                setShowResults(true);
            } catch (error) {
                console.error("Error searching clients:", error);
            } finally {
                setLoading(false);
            }
        };

        const timeoutId = setTimeout(search, 300);
        return () => clearTimeout(timeoutId);
    }, [searchTerm, type]);

    const handleSelect = (client: Inquilino | Propietario) => {
        setSelectedClient(client);
        onSelect(client);
        setSearchTerm("");
        setShowResults(false);
    };

    const handleClear = () => {
        setSelectedClient(null);
        setSearchTerm("");
        // Optionally notify parent of clear? Assuming parent handles null logic if needed, 
        // but prop says onSelect(client). We might need to handle clear better if parent expects valid obj.
        // For now, reload strictly requires selection to proceed.
    };

    const handleSuccessCreate = async (createdType: any, createdId?: string) => {
        if (createdId && createdType === type) {
            // Fetch and select the newly created client
            try {
                let client = null;
                if (type === 'inquilinos') {
                    client = await inquilinosService.getInquilinoById(createdId);
                } else {
                    client = await propietariosService.getPropietarioById(createdId);
                }
                if (client) {
                    handleSelect(client);
                }
            } catch (error) {
                console.error("Error fetching created client:", error);
            }
        }
    };

    return (
        <div className="relative">
            <label className="block text-sm font-medium text-gray-700 mb-2">
                {label || (type === 'inquilinos' ? 'Seleccionar Inquilino' : 'Seleccionar Propietario')}
            </label>

            {selectedClient ? (
                <div className="flex items-center justify-between p-4 bg-indigo-50 border border-indigo-100 rounded-lg">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-600">
                            <User size={20} />
                        </div>
                        <div>
                            <p className="font-medium text-gray-900">{selectedClient.nombre}</p>
                            <p className="text-sm text-gray-500">{selectedClient.dni || selectedClient.email}</p>
                        </div>
                    </div>
                    <button onClick={handleClear} className="p-2 hover:bg-indigo-100 rounded-full text-indigo-600 transition-colors">
                        <X size={18} />
                    </button>
                </div>
            ) : (
                <div className="relative">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                        <input
                            type="text"
                            placeholder={type === 'inquilinos' ? "Buscar inquilino por nombre o DNI..." : "Buscar propietario..."}
                            className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-shadow"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            onFocus={() => { if (searchTerm) setShowResults(true); }}
                        />
                    </div>

                    {showResults && searchTerm.length >= 2 && (
                        <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                            {loading ? (
                                <div className="p-4 text-center text-gray-500">Buscando...</div>
                            ) : results.length > 0 ? (
                                <ul>
                                    {results.map(client => (
                                        <li
                                            key={client.id}
                                            onClick={() => handleSelect(client)}
                                            className="px-4 py-3 hover:bg-gray-50 cursor-pointer flex items-center justify-between border-b border-gray-50 last:border-0"
                                        >
                                            <div>
                                                <p className="font-medium text-gray-900">{client.nombre}</p>
                                                <p className="text-xs text-gray-500">{client.dni} • {client.email}</p>
                                            </div>
                                            <div className="text-indigo-600 opacity-0 group-hover:opacity-100">
                                                <Check size={16} />
                                            </div>
                                        </li>
                                    ))}
                                </ul>
                            ) : (
                                <div className="p-4 text-center text-gray-500">
                                    No se encontraron resultados.
                                </div>
                            )}

                            <button
                                onClick={() => { setIsModalOpen(true); setShowResults(false); }}
                                className="w-full p-3 text-left text-indigo-600 font-medium hover:bg-indigo-50 transition-colors flex items-center gap-2 border-t border-gray-100"
                            >
                                <Plus size={18} />
                                Crear nuevo {type === 'inquilinos' ? 'inquilino' : 'propietario'}
                            </button>
                        </div>
                    )}

                    {!searchTerm && !selectedClient && (
                        <div className="mt-2 text-right">
                            <button
                                onClick={() => setIsModalOpen(true)}
                                type="button"
                                className="text-sm text-indigo-600 hover:text-indigo-800 font-medium hover:underline"
                            >
                                + Crear nuevo {type === 'inquilinos' ? 'inquilino' : 'propietario'}
                            </button>
                        </div>
                    )}
                </div>
            )}

            <ClientFormModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSuccess={handleSuccessCreate}
                initialType={type}
            />
        </div>
    );
}
