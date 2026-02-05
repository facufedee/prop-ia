"use client";

import { useEffect, useState } from "react";
import { adminService } from "@/infrastructure/services/adminService";
import { User } from "@/domain/models/User";
import { RoleProtection } from "@/ui/components/auth/RoleProtection";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { Shield, User as UserIcon, Calendar, Mail, Search, Trash2, Ban, CheckCircle, Clock } from "lucide-react";
import { toast } from "sonner";
import { PlanTier } from "@/domain/models/Subscription";

export default function PlatformManagementPage() {
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");

    useEffect(() => {
        loadUsers();
    }, []);

    const loadUsers = async () => {
        try {
            const data = await adminService.getAllUsers();
            // Sort by createdAt descending (newest first)
            const sortedData = [...data].sort((a, b) => {
                const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
                const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
                return dateB - dateA;
            });
            setUsers(sortedData);
        } catch (error) {
            console.error("Error loading users:", error);
            toast.error("Error al cargar los usuarios");
        } finally {
            setLoading(false);
        }
    };

    const handleToggleStatus = async (uid: string, currentStatus: boolean | undefined) => {
        const newStatus = !currentStatus;
        const action = newStatus ? "deshabilitar" : "habilitar";

        if (!confirm(`¿Estás seguro de que querés ${action} a este usuario?`)) return;

        try {
            await adminService.toggleUserStatus(uid, newStatus);
            setUsers(prev => prev.map(u => u.uid === uid ? { ...u, disabled: newStatus } : u));
            toast.success(`Usuario ${newStatus ? 'deshabilitado' : 'habilitado'} correctamente`);
        } catch (error) {
            console.error("Error toggling user status:", error);
            toast.error("Error al actualizar el estado del usuario");
        }
    };

    const handleDelete = async (uid: string) => {
        if (!confirm("¿Estás seguro de eliminar este usuario permanentemente? Esta acción no se puede deshacer.")) return;

        try {
            await adminService.deleteUser(uid);
            setUsers(prev => prev.filter(u => u.uid !== uid));
            toast.success("Usuario eliminado correctamente");
        } catch (error) {
            console.error("Error deleting user:", error);
            toast.error("Error al eliminar el usuario");
        }
    };

    const handleUpdatePlan = async (uid: string, newPlan: string) => {
        // Optimistic update
        const previousUsers = [...users];
        setUsers(prev => prev.map(u => {
            if (u.uid === uid) {
                return {
                    ...u,
                    subscription: {
                        ...u.subscription,
                        planId: newPlan,
                        planTier: newPlan as PlanTier,
                        status: u.subscription?.status || 'active',
                        billingPeriod: u.subscription?.billingPeriod || 'monthly'
                    }
                };
            }
            return u;
        }));

        try {
            await adminService.updateUserPlan(uid, newPlan as PlanTier);
            toast.success("Plan actualizado correctamente");
        } catch (error) {
            console.error("Error updating plan:", error);
            setUsers(previousUsers); // Rollback
            toast.error("Error al actualizar el plan");
        }
    };

    const filteredUsers = users.filter(user =>
        user.displayName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <RoleProtection requiredPermission="/dashboard/gestion-plataforma">
            <div className="space-y-6">
                {/* Header */}
                <div className="flex flex-col gap-2">
                    <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                        <Shield className="text-indigo-600" />
                        Gestión de Plataforma
                    </h1>
                    <p className="text-gray-500">
                        Administra los usuarios y accesos de la plataforma.
                    </p>
                </div>

                {/* Stats / Controls */}
                <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex flex-col md:flex-row gap-4 justify-between items-center">
                    <div className="text-sm text-gray-600">
                        Total Usuarios: <span className="font-bold text-gray-900">{users.length}</span>
                    </div>
                    <div className="relative w-full md:w-64">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                        <input
                            type="text"
                            placeholder="Buscar usuarios..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
                        />
                    </div>
                </div>

                {/* Users Table */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm text-gray-600">
                            <thead className="bg-gray-50 border-b border-gray-100">
                                <tr>
                                    <th className="px-6 py-4 font-semibold text-gray-900">Usuario</th>
                                    <th className="px-6 py-4 font-semibold text-gray-900">Rol</th>
                                    <th className="px-6 py-4 font-semibold text-gray-900">Plan</th>
                                    <th className="px-6 py-4 font-semibold text-gray-900">Registro</th>
                                    <th className="px-6 py-4 font-semibold text-gray-900">Último Acceso</th>
                                    <th className="px-6 py-4 font-semibold text-gray-900">Estado</th>
                                    <th className="px-6 py-4 font-semibold text-gray-900 text-right">Acciones</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {loading ? (
                                    <tr>
                                        <td colSpan={7} className="px-6 py-8 text-center text-gray-500">
                                            Cargando usuarios...
                                        </td>
                                    </tr>
                                ) : filteredUsers.length === 0 ? (
                                    <tr>
                                        <td colSpan={7} className="px-6 py-8 text-center text-gray-500">
                                            No se encontraron usuarios
                                        </td>
                                    </tr>
                                ) : (
                                    filteredUsers.map((user) => (
                                        <tr key={user.uid} className={`hover:bg-gray-50 transition-colors ${user.disabled ? 'bg-gray-50 opacity-75' : ''}`}>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-3">
                                                    <div className={`w-10 h-10 rounded-full flex items-center justify-center overflow-hidden ${user.disabled ? 'bg-gray-200 text-gray-400' : 'bg-indigo-100 text-indigo-600'}`}>
                                                        {user.photoURL ? (
                                                            <img src={user.photoURL} alt={user.displayName || "User"} className="w-full h-full object-cover" />
                                                        ) : (
                                                            <UserIcon size={20} />
                                                        )}
                                                    </div>
                                                    <div>
                                                        <div className="font-medium text-gray-900">
                                                            {user.displayName || "Sin nombre"}
                                                            {user.disabled && <span className="ml-2 text-xs text-red-500 font-medium">(Inhabilitado)</span>}
                                                        </div>
                                                        <div className="text-xs text-gray-500 flex items-center gap-1">
                                                            <Mail size={12} />
                                                            {user.email}
                                                        </div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                                    {user.roleId || "Sin Rol"}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <select
                                                    value={user.subscription?.planTier || 'basic'}
                                                    onChange={(e) => handleUpdatePlan(user.uid, e.target.value)}
                                                    className="px-2 py-1 bg-white border border-gray-200 rounded text-xs font-medium text-gray-700 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                                                >
                                                    <option value="basic">Plan Básico</option>
                                                    <option value="professional">Professional</option>
                                                    <option value="enterprise">Enterprise</option>
                                                </select>
                                                <div className="text-[10px] text-gray-400 mt-1 uppercase">
                                                    {user.subscription?.planTier || "Basic"}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-2 text-gray-500">
                                                    <Calendar size={14} />
                                                    {user.createdAt ? (
                                                        format(new Date(user.createdAt), "dd MMM yyyy", { locale: es })
                                                    ) : (
                                                        "N/A"
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-2 text-gray-500">
                                                    <Clock size={14} />
                                                    {user.lastLogin ? (
                                                        format(new Date(user.lastLogin), "dd MMM yyyy HH:mm", { locale: es })
                                                    ) : (
                                                        "N/A"
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${user.disabled
                                                    ? "bg-red-100 text-red-800"
                                                    : "bg-green-100 text-green-800"
                                                    }`}>
                                                    {user.disabled ? "Inhabilitado" : "Activo"}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <div className="flex items-center justify-end gap-2">
                                                    <button
                                                        onClick={() => handleToggleStatus(user.uid, user.disabled)}
                                                        className={`p-2 rounded-lg transition-colors ${user.disabled
                                                            ? "text-green-600 hover:bg-green-50"
                                                            : "text-amber-600 hover:bg-amber-50"
                                                            }`}
                                                        title={user.disabled ? "Habilitar Acceso" : "Inhabilitar Acceso"}
                                                    >
                                                        {user.disabled ? <CheckCircle size={18} /> : <Ban size={18} />}
                                                    </button>
                                                    <button
                                                        onClick={() => handleDelete(user.uid)}
                                                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                                        title="Eliminar Usuario Permanentemente"
                                                    >
                                                        <Trash2 size={18} />
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
        </RoleProtection>
    );
}
