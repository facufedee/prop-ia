"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { app, auth } from "@/infrastructure/firebase/client";
import { alquileresService } from "@/infrastructure/services/alquileresService";
import { Alquiler } from "@/domain/models/Alquiler";
import RentalCard from "./components/RentalCard";
import { Plus, Filter, Search } from "lucide-react";
import Link from "next/link";

export default function AlquileresPage() {
    const router = useRouter();
    const [contracts, setContracts] = useState<Alquiler[]>([]);
    const [filteredContracts, setFilteredContracts] = useState<Alquiler[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState<'todos' | 'activo' | 'pendiente' | 'finalizado' | 'suspendido'>('activo');
    const [searchTerm, setSearchTerm] = useState("");

    useEffect(() => {
        const fetchContracts = async () => {
            if (!auth?.currentUser) return;

            try {
                const data = await alquileresService.getAlquileres(auth.currentUser.uid);
                setContracts(data);
                // Initial filter application handled by useEffect dependency
            } catch (error) {
                console.error("Error fetching contracts:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchContracts();
    }, []);

    useEffect(() => {
        let result = contracts;

        // 1. Filter by Status
        if (filter !== 'todos') {
            result = result.filter(c => c.estado === filter);
        }

        // 2. Filter by Search Term
        if (searchTerm.trim()) {
            const lowerTerm = searchTerm.toLowerCase();
            result = result.filter(c =>
                c.direccion.toLowerCase().includes(lowerTerm) ||
                c.nombreInquilino.toLowerCase().includes(lowerTerm)
            );
        }

        setFilteredContracts(result);
    }, [filter, searchTerm, contracts]);

    const handleDelete = async (id: string) => {
        if (!confirm("¿Estás seguro de eliminar este contrato?")) return;

        try {
            await alquileresService.deleteAlquiler(id);
            setContracts(prev => prev.filter(c => c.id !== id));
        } catch (error) {
            console.error("Error deleting contract:", error);
            alert("Error al eliminar el contrato");
        }
    };

    const stats = {
        total: contracts.length,
        activos: contracts.filter(c => c.estado === 'activo').length,
        porVencer: contracts.filter(c => {
            if (c.estado !== 'activo') return false;
            const { diasRestantes } = alquileresService.calcularVencimiento(c);
            return diasRestantes <= 5 && diasRestantes >= 0;
        }).length,
    };

    if (loading) {
        return (
            <div className="p-6 flex items-center justify-center min-h-[400px]">
                <div className="text-gray-500">Cargando alquileres...</div>
            </div>
        );
    }

    return (
        <div className="p-6 max-w-7xl mx-auto space-y-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Alquileres</h1>
                    <p className="text-gray-500">Gestión de contratos de alquiler</p>
                </div>
                <Link
                    href="/dashboard/alquileres/nuevo"
                    className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                >
                    <Plus className="w-5 h-5" />
                    Nuevo Contrato
                </Link>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white rounded-xl border border-gray-200 p-6">
                    <div className="text-sm text-gray-500 mb-1">Activos</div>
                    <div className="text-3xl font-bold text-green-600">{stats.activos}</div>
                </div>
                <div className="bg-white rounded-xl border border-gray-200 p-6">
                    <div className="text-sm text-gray-500 mb-1">Por Vencer (5 días)</div>
                    <div className="text-3xl font-bold text-orange-600">{stats.porVencer}</div>
                </div>
                <div className="bg-white rounded-xl border border-gray-200 p-6">
                    <div className="text-sm text-gray-500 mb-1">Total Contratos</div>
                    <div className="text-3xl font-bold text-gray-900">{stats.total}</div>
                </div>
            </div>

            {/* Filters and Search Container */}
            <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm flex flex-col md:flex-row gap-4 justify-between items-center">
                {/* Search Bar */}
                <div className="relative w-full md:w-96">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                    <input
                        type="text"
                        placeholder="Buscar por inquilino, dirección..."
                        className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 focus:bg-white transition-all shadow-sm text-gray-900 placeholder-gray-500"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>

                {/* Filter Tabs */}
                <div className="flex items-center gap-2 overflow-x-auto w-full md:w-auto pb-1 md:pb-0">
                    <Filter className="w-5 h-5 text-gray-400 shrink-0 hidden md:block" />
                    <div className="flex p-1 bg-gray-100 rounded-lg">
                        {(['activo', 'pendiente', 'finalizado', 'todos'] as const).map((f) => (
                            <button
                                key={f}
                                onClick={() => setFilter(f)}
                                className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all whitespace-nowrap ${filter === f
                                    ? 'bg-white text-indigo-600 shadow-sm'
                                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-200/50'
                                    }`}
                            >
                                {f.charAt(0).toUpperCase() + f.slice(1)}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* Grid of Cards */}
            {filteredContracts.length === 0 ? (
                <div className="text-center py-12 bg-gray-50 rounded-xl border border-gray-200 border-dashed">
                    <p className="text-gray-500">No se encontraron contratos en esta categoría.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredContracts.map(contract => (
                        <RentalCard
                            key={contract.id}
                            contract={contract}
                            onDelete={handleDelete}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}
