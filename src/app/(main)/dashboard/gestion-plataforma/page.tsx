"use client";

import { useEffect, useState, useMemo } from "react";
import { adminService } from "@/infrastructure/services/adminService";
import { User } from "@/domain/models/User";
import { RoleProtection } from "@/ui/components/auth/RoleProtection";
import { format, addDays } from "date-fns";
import { es } from "date-fns/locale";
import {
    Shield, User as UserIcon, Calendar, Mail, Search,
    Trash2, Ban, CheckCircle, Clock, Eye, AlertCircle,
    ChevronUp, ChevronDown, ChevronsUpDown, MailX, Home, Key
} from "lucide-react";
import { toast } from "sonner";
import { PlanTier } from "@/domain/models/Subscription";
import { useRouter } from "next/navigation";

type SortField = "nombre" | "plan" | "registro" | "ultimoAcceso" | "vencimiento" | "alquileres" | "estado";
type SortDirection = "asc" | "desc";

function getExpirationDate(user: User): Date | null {
    if (user.subscription?.endDate) return new Date(user.subscription.endDate);
    if (user.createdAt) return addDays(new Date(user.createdAt), 14);
    return null;
}

function isExpired(user: User): boolean {
    if (user.disabled) return false;
    const expDate = getExpirationDate(user);
    if (!expDate) return false;
    return new Date() > expDate;
}

function isExpiringSoon(user: User): boolean {
    if (user.disabled) return false;
    const expDate = getExpirationDate(user);
    if (!expDate) return false;
    const now = new Date();
    if (now > expDate) return false;
    return expDate.getTime() - now.getTime() < 7 * 24 * 60 * 60 * 1000;
}

export default function PlatformManagementPage() {
    const router = useRouter();
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [onlyNoMails, setOnlyNoMails] = useState(false);
    const [sortField, setSortField] = useState<SortField>("registro");
    const [sortDirection, setSortDirection] = useState<SortDirection>("desc");

    useEffect(() => {
        loadUsers();
    }, []);

    const loadUsers = async () => {
        try {
            const data = await adminService.getAllUsers();
            setUsers(data);
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
            setUsers(previousUsers);
            toast.error("Error al actualizar el plan");
        }
    };

    const handleSort = (field: SortField) => {
        if (sortField === field) {
            setSortDirection(prev => prev === "asc" ? "desc" : "asc");
        } else {
            setSortField(field);
            setSortDirection("asc");
        }
    };

    const filteredAndSortedUsers = useMemo(() => {
        let result = users.filter(user =>
            user.displayName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            user.email?.toLowerCase().includes(searchTerm.toLowerCase())
        );

        if (onlyNoMails) {
            result = result.filter(u => u.unsubscribedMarketing);
        }

        result = [...result].sort((a, b) => {
            let valA: string | number = 0;
            let valB: string | number = 0;

            switch (sortField) {
                case "nombre":
                    valA = (a.displayName || a.email || "").toLowerCase();
                    valB = (b.displayName || b.email || "").toLowerCase();
                    break;
                case "plan":
                    valA = (a.subscription?.planTier || "basic").toLowerCase();
                    valB = (b.subscription?.planTier || "basic").toLowerCase();
                    break;
                case "registro":
                    valA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
                    valB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
                    break;
                case "ultimoAcceso":
                    valA = a.lastLogin ? new Date(a.lastLogin).getTime() : 0;
                    valB = b.lastLogin ? new Date(b.lastLogin).getTime() : 0;
                    break;
                case "vencimiento":
                    valA = getExpirationDate(a)?.getTime() ?? 0;
                    valB = getExpirationDate(b)?.getTime() ?? 0;
                    break;
                case "alquileres":
                    valA = a.alquileresCount || 0;
                    valB = b.alquileresCount || 0;
                    break;
                case "estado":
                    valA = a.disabled ? 2 : isExpired(a) ? 1 : 0;
                    valB = b.disabled ? 2 : isExpired(b) ? 1 : 0;
                    break;
            }

            if (typeof valA === "string" && typeof valB === "string") {
                return sortDirection === "asc" ? valA.localeCompare(valB) : valB.localeCompare(valA);
            }
            return sortDirection === "asc" ? (valA as number) - (valB as number) : (valB as number) - (valA as number);
        });

        return result;
    }, [users, searchTerm, onlyNoMails, sortField, sortDirection]);

    const SortIcon = ({ field }: { field: SortField }) => {
        if (sortField !== field) return <ChevronsUpDown size={14} className="text-gray-300 ml-1 inline" />;
        return sortDirection === "asc"
            ? <ChevronUp size={14} className="text-indigo-500 ml-1 inline" />
            : <ChevronDown size={14} className="text-indigo-500 ml-1 inline" />;
    };

    const noMailsCount = users.filter(u => u.unsubscribedMarketing).length;

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
                <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex flex-col md:flex-row gap-3 justify-between items-center">
                    <div className="flex items-center gap-4">
                        <div className="text-sm text-gray-600">
                            Total Usuarios: <span className="font-bold text-gray-900">{users.length}</span>
                        </div>
                        {noMailsCount > 0 && (
                            <button
                                onClick={() => setOnlyNoMails(prev => !prev)}
                                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
                                    onlyNoMails
                                        ? "bg-amber-100 text-amber-800 border-amber-300 shadow-sm"
                                        : "bg-white text-gray-600 border-gray-200 hover:border-amber-300 hover:bg-amber-50 hover:text-amber-700"
                                }`}
                                title="Filtrar usuarios sin suscripción a mails"
                            >
                                <MailX size={13} />
                                Sin mails {onlyNoMails ? `(${filteredAndSortedUsers.length})` : `(${noMailsCount})`}
                            </button>
                        )}
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
                            <thead className="bg-gray-50 border-b border-gray-200">
                                <tr>
                                    <th
                                        className="px-6 py-3 font-semibold text-gray-700 cursor-pointer select-none hover:bg-gray-100 transition-colors whitespace-nowrap"
                                        onClick={() => handleSort("nombre")}
                                    >
                                        Usuario <SortIcon field="nombre" />
                                    </th>
                                    <th
                                        className="px-6 py-3 font-semibold text-gray-700 cursor-pointer select-none hover:bg-gray-100 transition-colors whitespace-nowrap"
                                        onClick={() => handleSort("plan")}
                                    >
                                        Plan <SortIcon field="plan" />
                                    </th>
                                    <th
                                        className="px-6 py-3 font-semibold text-gray-700 cursor-pointer select-none hover:bg-gray-100 transition-colors whitespace-nowrap"
                                        onClick={() => handleSort("registro")}
                                    >
                                        Registro <SortIcon field="registro" />
                                    </th>
                                    <th
                                        className="px-6 py-3 font-semibold text-gray-700 cursor-pointer select-none hover:bg-gray-100 transition-colors whitespace-nowrap"
                                        onClick={() => handleSort("ultimoAcceso")}
                                    >
                                        Último Acceso <SortIcon field="ultimoAcceso" />
                                    </th>
                                    <th
                                        className="px-6 py-3 font-semibold text-gray-700 cursor-pointer select-none hover:bg-gray-100 transition-colors whitespace-nowrap"
                                        onClick={() => handleSort("vencimiento")}
                                    >
                                        Vencimiento <SortIcon field="vencimiento" />
                                    </th>
                                    <th
                                        className="px-6 py-3 font-semibold text-gray-700 cursor-pointer select-none hover:bg-gray-100 transition-colors whitespace-nowrap text-center"
                                        onClick={() => handleSort("alquileres")}
                                    >
                                        Prop. / Alq. <SortIcon field="alquileres" />
                                    </th>
                                    <th
                                        className="px-6 py-3 font-semibold text-gray-700 cursor-pointer select-none hover:bg-gray-100 transition-colors whitespace-nowrap"
                                        onClick={() => handleSort("estado")}
                                    >
                                        Estado <SortIcon field="estado" />
                                    </th>
                                    <th className="px-6 py-3 font-semibold text-gray-700 text-right whitespace-nowrap">
                                        Acciones
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {loading ? (
                                    <tr>
                                        <td colSpan={8} className="px-6 py-10 text-center text-gray-400">
                                            <div className="flex flex-col items-center gap-2">
                                                <div className="w-6 h-6 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin" />
                                                Cargando usuarios...
                                            </div>
                                        </td>
                                    </tr>
                                ) : filteredAndSortedUsers.length === 0 ? (
                                    <tr>
                                        <td colSpan={8} className="px-6 py-10 text-center text-gray-400">
                                            No se encontraron usuarios
                                        </td>
                                    </tr>
                                ) : (
                                    filteredAndSortedUsers.map((user) => {
                                        const expired = isExpired(user);
                                        const expiringSoon = isExpiringSoon(user);
                                        const expDate = getExpirationDate(user);
                                        const isTrial = !user.subscription?.endDate && !!user.createdAt;

                                        return (
                                            <tr
                                                key={user.uid}
                                                className={`hover:bg-indigo-50/30 transition-colors ${user.disabled ? 'bg-gray-50 opacity-70' : ''}`}
                                            >
                                                {/* Usuario */}
                                                <td className="px-6 py-3.5">
                                                    <div className="flex items-center gap-3">
                                                        <div className={`w-9 h-9 rounded-full flex items-center justify-center overflow-hidden flex-shrink-0 ${user.disabled ? 'bg-gray-200 text-gray-400' : 'bg-indigo-100 text-indigo-600'}`}>
                                                            {user.photoURL ? (
                                                                <img src={user.photoURL} alt={user.displayName || "User"} className="w-full h-full object-cover" />
                                                            ) : (
                                                                <UserIcon size={17} />
                                                            )}
                                                        </div>
                                                        <div className="min-w-0">
                                                            <div className="font-medium text-gray-900 truncate leading-tight">
                                                                {user.displayName || "Sin nombre"}
                                                                {user.disabled && <span className="ml-2 text-xs text-red-500 font-medium">(Inh.)</span>}
                                                            </div>
                                                            <div className="text-xs text-gray-400 flex items-center gap-1 mt-0.5 truncate">
                                                                <Mail size={11} />
                                                                {user.email}
                                                            </div>
                                                            {user.unsubscribedMarketing && (
                                                                <span className="inline-flex items-center gap-1 mt-0.5 text-[10px] font-medium text-amber-700 bg-amber-50 border border-amber-200 rounded-full px-1.5 py-0.5">
                                                                    <MailX size={9} /> Sin mails
                                                                </span>
                                                            )}
                                                        </div>
                                                    </div>
                                                </td>

                                                {/* Plan */}
                                                <td className="px-6 py-3.5">
                                                    <select
                                                        value={user.subscription?.planTier || 'basic'}
                                                        onChange={(e) => handleUpdatePlan(user.uid, e.target.value)}
                                                        className="px-2 py-1 bg-white border border-gray-200 rounded-lg text-xs font-medium text-gray-700 focus:outline-none focus:ring-1 focus:ring-indigo-500 cursor-pointer"
                                                    >
                                                        <option value="basic">Plan Básico</option>
                                                        <option value="professional">Professional</option>
                                                        <option value="enterprise">Enterprise</option>
                                                    </select>
                                                </td>

                                                {/* Registro */}
                                                <td className="px-6 py-3.5">
                                                    <div className="flex items-center gap-1.5 text-gray-500 text-xs">
                                                        <Calendar size={13} />
                                                        {user.createdAt ? format(new Date(user.createdAt), "dd MMM yyyy", { locale: es }) : "N/A"}
                                                    </div>
                                                </td>

                                                {/* Último Acceso */}
                                                <td className="px-6 py-3.5">
                                                    <div className="flex items-center gap-1.5 text-gray-500 text-xs">
                                                        <Clock size={13} />
                                                        {user.lastLogin ? format(new Date(user.lastLogin), "dd MMM yyyy HH:mm", { locale: es }) : "N/A"}
                                                    </div>
                                                </td>

                                                {/* Vencimiento */}
                                                <td className="px-6 py-3.5">
                                                    {expDate ? (
                                                        <div className={`flex items-center gap-1.5 text-xs font-medium ${
                                                            expired ? "text-red-600" :
                                                            expiringSoon ? "text-amber-600" :
                                                            "text-gray-600"
                                                        }`}>
                                                            {(expired || expiringSoon) && <AlertCircle size={13} />}
                                                            <span>
                                                                {isTrial && <span className="text-gray-400 mr-1">Prueba</span>}
                                                                {format(expDate, "dd MMM yyyy", { locale: es })}
                                                            </span>
                                                        </div>
                                                    ) : (
                                                        <span className="text-xs text-gray-400">—</span>
                                                    )}
                                                </td>

                                                {/* Propiedades / Alquileres */}
                                                <td className="px-6 py-3.5">
                                                    <div className="flex items-center justify-center gap-2">
                                                        <div className="flex items-center gap-1 bg-blue-50 text-blue-700 px-2.5 py-1 rounded-md text-xs font-semibold border border-blue-100" title="Propiedades">
                                                            <Home size={12} strokeWidth={2.5} />
                                                            {user.propiedadesCount || 0}
                                                        </div>
                                                        <div className="flex items-center gap-1 bg-indigo-50 text-indigo-700 px-2.5 py-1 rounded-md text-xs font-semibold border border-indigo-100" title="Alquileres">
                                                            <Key size={12} strokeWidth={2.5} />
                                                            {user.alquileresCount || 0}
                                                        </div>
                                                    </div>
                                                </td>

                                                {/* Estado */}
                                                <td className="px-6 py-3.5">
                                                    {user.disabled ? (
                                                        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-red-100 text-red-700">
                                                            Inhabilitado
                                                        </span>
                                                    ) : expired ? (
                                                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-700">
                                                            <AlertCircle size={11} /> Vencido
                                                        </span>
                                                    ) : expiringSoon ? (
                                                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-700">
                                                            <AlertCircle size={11} /> Por vencer
                                                        </span>
                                                    ) : (
                                                        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">
                                                            Activo
                                                        </span>
                                                    )}
                                                </td>

                                                {/* Acciones */}
                                                <td className="px-6 py-3.5 text-right">
                                                    <div className="flex items-center justify-end gap-1.5">
                                                        <button
                                                            onClick={() => router.push(`/dashboard/gestion-plataforma/${user.uid}`)}
                                                            className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                                                            title="Ver Perfil Detallado"
                                                        >
                                                            <Eye size={17} />
                                                        </button>
                                                        <button
                                                            onClick={() => handleToggleStatus(user.uid, user.disabled)}
                                                            className={`p-2 rounded-lg transition-colors ${user.disabled
                                                                ? "text-green-600 hover:bg-green-50"
                                                                : "text-amber-600 hover:bg-amber-50"
                                                            }`}
                                                            title={user.disabled ? "Habilitar Acceso" : "Inhabilitar Acceso"}
                                                        >
                                                            {user.disabled ? <CheckCircle size={17} /> : <Ban size={17} />}
                                                        </button>
                                                        <button
                                                            onClick={() => handleDelete(user.uid)}
                                                            className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                                            title="Eliminar Usuario Permanentemente"
                                                        >
                                                            <Trash2 size={17} />
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </RoleProtection>
    );
}
