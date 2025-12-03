"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { app, auth } from "@/infrastructure/firebase/client";
import { alquileresService } from "@/infrastructure/services/alquileresService";
import { Alquiler } from "@/domain/models/Alquiler";
import ContractsTable from "./components/ContractsTable";
import { Plus, Filter } from "lucide-react";
import Link from "next/link";

export default function AlquileresPage() {
    const router = useRouter();
    const [contracts, setContracts] = useState<Alquiler[]>([]);
    const [filteredContracts, setFilteredContracts] = useState<Alquiler[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState<'todos' | 'activo' | 'pendiente' | 'finalizado'>('todos');

    useEffect(() => {
        const fetchContracts = async () => {
            if (!auth.currentUser) return;

            try {
                const data = await alquileresService.getAlquileres(auth.currentUser.uid);
                setContracts(data);
                setFilteredContracts(data);
            } catch (error) {
                console.error("Error fetching contracts:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchContracts();
    }, []);

    useEffect(() => {
        if (filter === 'todos') {
            setFilteredContracts(contracts);
        } else {
            setFilteredContracts(contracts.filter(c => c.estado === filter));
        }
    }, [filter, contracts]);

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
                <div className="text-gray-500">Cargando contratos...</div>
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
                    <div className="text-sm text-gray-500 mb-1">Total Contratos</div>
                    <div className="text-3xl font-bold text-gray-900">{stats.total}</div>
                </div>
                <div className="bg-white rounded-xl border border-gray-200 p-6">
                    <div className="text-sm text-gray-500 mb-1">Activos</div>
                    <div className="text-3xl font-bold text-green-600">{stats.activos}</div>
                </div>
                <div className="bg-white rounded-xl border border-gray-200 p-6">
                    <div className="text-sm text-gray-500 mb-1">Por Vencer (5 días)</div>
                    <div className="text-3xl font-bold text-orange-600">{stats.porVencer}</div>
                </div>
            </div>

            {/* Filters */}
            <div className="flex items-center gap-3">
                <Filter className="w-5 h-5 text-gray-400" />
                <div className="flex gap-2">
                    {(['todos', 'activo', 'pendiente', 'finalizado'] as const).map((f) => (
                        <button
                            key={f}
                            onClick={() => setFilter(f)}
                            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${filter === f
                                ? 'bg-indigo-600 text-white'
                                : 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-50'
                                }`}
                        >
                            {f.charAt(0).toUpperCase() + f.slice(1)}
                        </button>
                    ))}
                </div>
            </div>

            {/* Table */}
            <ContractsTable contracts={filteredContracts} onDelete={handleDelete} />
        </div>
    );
}
