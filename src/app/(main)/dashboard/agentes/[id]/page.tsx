"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { auth } from "@/infrastructure/firebase/client";
import { agentesService } from "@/infrastructure/services/agentesService";
import { useBranchContext } from "@/infrastructure/context/BranchContext";
import { Agente } from "@/domain/models/Agente";
import { ArrowLeft, Save, Building2, Mail, Phone, User as UserIcon, ShieldAlert } from "lucide-react";
import Link from "next/link";
import { useAuth } from "@/ui/context/AuthContext";

export default function AgentDetailPage() {
    const { id } = useParams();
    const router = useRouter();
    const { userRole } = useAuth();
    const { branches } = useBranchContext();

    const [agente, setAgente] = useState<Agente | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [selectedBranch, setSelectedBranch] = useState<string>("");

    // Permission Check
    const canEdit = userRole?.name === "Super Admin" || userRole?.name === "Administrador";

    useEffect(() => {
        const load = async () => {
            if (!id || typeof id !== 'string') return;
            try {
                // Fetch all agents for the current user (or all if we implemented that for super admin)
                // For now, consistent with other pages, fetch by auth.currentUser.uid
                // If Super Admin needs to see ALL, service needs update. 
                // Assuming Super Admin might be inspecting a specific org's agent? 
                // Code matches AgentesPage logic.
                const allAgentes = await agentesService.getAgentes(auth?.currentUser?.uid || "");
                const found = allAgentes.find(a => a.id === id);

                if (found) {
                    setAgente(found);
                    setSelectedBranch(found.branchId || "");
                } else {
                    // Try getting by ID directly if the user is Super Admin but the agent belongs to another user
                    if (userRole?.name === 'Super Admin') {
                        const directAgent = await agentesService.getAgenteById(id);
                        if (directAgent) {
                            setAgente(directAgent);
                            setSelectedBranch(directAgent.branchId || "");
                        }
                    }
                }
            } catch (error) {
                console.error(error);
            } finally {
                setLoading(false);
            }
        };
        load();
    }, [id, userRole]);

    const handleSave = async () => {
        if (!agente || !id) return;
        setSaving(true);
        try {
            await agentesService.updateAgente(agente.id, { branchId: selectedBranch });

            // Update local state to reflect change immediately ("Renovar arriba")
            setAgente(prev => prev ? { ...prev, branchId: selectedBranch } : null);

            alert("Sucursal actualizada correctamente");
            router.refresh(); // Refresh server stats if any
        } catch (error) {
            console.error(error);
            alert("Error al actualizar");
        } finally {
            setSaving(false);
        }
    };

    if (loading) return <div className="p-8 text-center text-gray-500">Cargando agente...</div>;

    if (!agente) return (
        <div className="p-8 flex flex-col items-center justify-center text-gray-500">
            <ShieldAlert size={48} className="mb-4 text-red-500" />
            <h2 className="text-xl font-bold text-gray-900">Agente no encontrado</h2>
            <p className="mb-4">El agente que buscas no existe o no tienes permisos para verlo.</p>
            <Link href="/dashboard/agentes" className="text-indigo-600 hover:underline">Volver a Agentes</Link>
        </div>
    );

    if (!canEdit) return (
        <div className="p-8 flex flex-col items-center justify-center text-gray-500">
            <ShieldAlert size={48} className="mb-4 text-red-500" />
            <h2 className="text-xl font-bold text-gray-900">Acceso Denegado</h2>
            <p className="mb-4">No tienes permisos para editar agentes.</p>
            <Link href="/dashboard/agentes" className="text-indigo-600 hover:underline">Volver a Agentes</Link>
        </div>
    );

    return (
        <div className="max-w-4xl mx-auto p-6 md:p-8">
            <div className="flex items-center gap-4 mb-8">
                <Link href="/dashboard/agentes" className="p-2 hover:bg-gray-100 rounded-full transition">
                    <ArrowLeft size={20} className="text-gray-600" />
                </Link>
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">{agente.nombre}</h1>
                    <p className="text-gray-500 text-sm">Editar información del agente</p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {/* Main Info */}
                <div className="md:col-span-2 space-y-6">
                    <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm space-y-4">
                        <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                            <UserIcon size={20} /> Información Personal
                        </h2>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Nombre Completo</label>
                                <div className="p-2 bg-gray-50 rounded-lg text-gray-900">{agente.nombre}</div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                                <div className="p-2 bg-gray-50 rounded-lg text-gray-900 flex items-center gap-2">
                                    <Mail size={14} className="text-gray-400" /> {agente.email}
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Teléfono</label>
                                <div className="p-2 bg-gray-50 rounded-lg text-gray-900 flex items-center gap-2">
                                    <Phone size={14} className="text-gray-400" /> {agente.telefono || "No registrado"}
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
                        <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                            <Building2 size={20} /> Asignación de Sucursal
                        </h2>
                        <div className="flex items-center justify-between mb-4">
                            <p className="text-sm text-gray-500">
                                Sucursal actual: <span className="font-bold text-indigo-600">{branches.find(b => b.id === agente.branchId)?.name || "Sin asignar"}</span>
                            </p>
                        </div>
                        <p className="text-sm text-gray-500 mb-4">
                            Selecciona la nueva sucursal a la que pertenece este agente.
                        </p>

                        <div className="max-w-md">
                            <label className="block text-sm font-medium text-gray-700 mb-1">Sucursal</label>
                            <select
                                value={selectedBranch}
                                onChange={(e) => setSelectedBranch(e.target.value)}
                                className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                            >
                                <option value="">Sin Asignar</option>
                                {branches.map(branch => (
                                    <option key={branch.id} value={branch.id}>{branch.name}</option>
                                ))}
                            </select>
                        </div>
                    </div>
                </div>

                {/* Sidebar Stats */}
                <div className="space-y-6">
                    <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
                        <h3 className="font-bold text-gray-900 mb-4">Rendimiento</h3>
                        <div className="space-y-4">
                            <div className="flex justify-between items-center pb-2 border-b border-gray-100">
                                <span className="text-sm text-gray-500">Ventas Totales</span>
                                <span className="font-bold text-gray-900">{agente.totalVentas}</span>
                            </div>
                            <div className="flex justify-between items-center pb-2 border-b border-gray-100">
                                <span className="text-sm text-gray-500">Alquileres</span>
                                <span className="font-bold text-gray-900">{agente.totalAlquileres}</span>
                            </div>
                            <div className="flex justify-between items-center pt-2">
                                <span className="text-sm text-gray-500">Comisiones</span>
                                <span className="font-bold text-green-600">${agente.totalComisiones.toLocaleString()}</span>
                            </div>
                        </div>
                    </div>

                    <button
                        onClick={handleSave}
                        disabled={saving}
                        className="w-full py-3 px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl transition flex items-center justify-center gap-2 shadow-lg shadow-indigo-200 disabled:opacity-70"
                    >
                        {saving ? "Guardando..." : <><Save size={20} /> Guardar Cambios</>}
                    </button>
                </div>
            </div>
        </div>
    );
}
