"use client";

import { useState, useEffect } from "react";
import { app, auth } from "@/infrastructure/firebase/client";
import { agentesService } from "@/infrastructure/services/agentesService";
import { Agente } from "@/domain/models/Agente";
import { Users, Plus, TrendingUp, DollarSign, Award } from "lucide-react";
import Link from "next/link";

export default function AgentesPage() {
    const [agentes, setAgentes] = useState<Agente[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchAgentes();
    }, []);

    const fetchAgentes = async () => {
        if (!auth?.currentUser) return;

        try {
            setLoading(true);
            const data = await agentesService.getAgentes(auth.currentUser.uid);
            setAgentes(data);
        } catch (error) {
            console.error("Error fetching agentes:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm("¿Estás seguro de eliminar este agente?")) return;

        try {
            await agentesService.deleteAgente(id);
            setAgentes(prev => prev.filter(a => a.id !== id));
        } catch (error) {
            console.error("Error deleting agente:", error);
            alert("Error al eliminar el agente");
        }
    };

    const totalVentas = agentes.reduce((sum, a) => sum + a.totalVentas, 0);
    const totalAlquileres = agentes.reduce((sum, a) => sum + a.totalAlquileres, 0);
    const totalComisiones = agentes.reduce((sum, a) => sum + a.totalComisiones, 0);
    const agentesActivos = agentes.filter(a => a.activo).length;

    if (loading) {
        return (
            <div className="p-6 flex items-center justify-center min-h-[400px]">
                <div className="text-gray-500">Cargando agentes...</div>
            </div>
        );
    }

    return (
        <div className="p-6 max-w-7xl mx-auto space-y-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Agentes</h1>
                    <p className="text-gray-500">Gestión de agentes y comisiones</p>
                </div>
                <Link
                    href="/dashboard/agentes/nuevo"
                    className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                >
                    <Plus className="w-5 h-5" />
                    Nuevo Agente
                </Link>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-white rounded-xl border border-gray-200 p-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-500">Agentes Activos</p>
                            <p className="text-2xl font-bold text-gray-900 mt-1">{agentesActivos}</p>
                        </div>
                        <div className="p-3 bg-indigo-100 rounded-lg">
                            <Users className="w-6 h-6 text-indigo-600" />
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-xl border border-gray-200 p-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-500">Total Ventas</p>
                            <p className="text-2xl font-bold text-gray-900 mt-1">{totalVentas}</p>
                        </div>
                        <div className="p-3 bg-green-100 rounded-lg">
                            <TrendingUp className="w-6 h-6 text-green-600" />
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-xl border border-gray-200 p-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-500">Total Alquileres</p>
                            <p className="text-2xl font-bold text-gray-900 mt-1">{totalAlquileres}</p>
                        </div>
                        <div className="p-3 bg-blue-100 rounded-lg">
                            <Award className="w-6 h-6 text-blue-600" />
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-xl border border-gray-200 p-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-500">Comisiones Totales</p>
                            <p className="text-2xl font-bold text-gray-900 mt-1">${totalComisiones.toLocaleString()}</p>
                        </div>
                        <div className="p-3 bg-yellow-100 rounded-lg">
                            <DollarSign className="w-6 h-6 text-yellow-600" />
                        </div>
                    </div>
                </div>
            </div>

            {/* Table */}
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-gray-50 border-b border-gray-200">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                    Agente
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                    Email
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                    Ventas
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                    Alquileres
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                    Comisiones
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                    Estado
                                </th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                                    Acciones
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                            {agentes.length === 0 ? (
                                <tr>
                                    <td colSpan={7} className="px-6 py-12 text-center text-gray-500">
                                        No hay agentes registrados
                                    </td>
                                </tr>
                            ) : (
                                agentes.map((agente) => (
                                    <tr key={agente.id} className="hover:bg-gray-50">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center">
                                                    <span className="text-indigo-600 font-semibold">
                                                        {agente.nombre.charAt(0).toUpperCase()}
                                                    </span>
                                                </div>
                                                <div>
                                                    <div className="text-sm font-medium text-gray-900">{agente.nombre}</div>
                                                    <div className="text-xs text-gray-500">{agente.telefono}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-sm text-gray-600">{agente.email}</td>
                                        <td className="px-6 py-4 text-sm text-gray-900 font-medium">{agente.totalVentas}</td>
                                        <td className="px-6 py-4 text-sm text-gray-900 font-medium">{agente.totalAlquileres}</td>
                                        <td className="px-6 py-4 text-sm text-gray-900 font-medium">
                                            ${agente.totalComisiones.toLocaleString()}
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`px-2 py-1 text-xs font-medium rounded-full ${agente.activo
                                                ? 'bg-green-100 text-green-700'
                                                : 'bg-gray-100 text-gray-700'
                                                }`}>
                                                {agente.activo ? 'Activo' : 'Inactivo'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                <Link
                                                    href={`/dashboard/agentes/${agente.id}`}
                                                    className="px-3 py-1 text-sm text-indigo-600 hover:bg-indigo-50 rounded-lg"
                                                >
                                                    Ver Detalle
                                                </Link>
                                                <button
                                                    onClick={() => handleDelete(agente.id)}
                                                    className="px-3 py-1 text-sm text-red-600 hover:bg-red-50 rounded-lg"
                                                >
                                                    Eliminar
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
