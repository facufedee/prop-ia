"use client";

import { useState, useEffect } from "react";
import { roleService, Role, PERMISSIONS, Permission } from "@/infrastructure/services/roleService";
import { Plus, Edit2, Trash2, Check, X, Shield, User as UserIcon, Save } from "lucide-react";
import { collection, getDocs } from "firebase/firestore";
import { db } from "@/infrastructure/firebase/client";

interface UserData {
    uid: string;
    email: string;
    displayName: string;
    roleId?: string;
}

export default function RolesPage() {
    const [roles, setRoles] = useState<Role[]>([]);
    const [users, setUsers] = useState<UserData[]>([]);
    const [loading, setLoading] = useState(true);
    const [editingRole, setEditingRole] = useState<Role | null>(null);
    const [isCreating, setIsCreating] = useState(false);
    const [newRoleName, setNewRoleName] = useState("");
    const [selectedPermissions, setSelectedPermissions] = useState<string[]>([]);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setLoading(true);
        try {
            // Initialize default roles if needed
            await roleService.initializeDefaultRoles();

            const rolesData = await roleService.getRoles();
            setRoles(rolesData);

            // Fetch users
            const usersSnap = await getDocs(collection(db, "users"));
            const usersData = usersSnap.docs.map(doc => ({ uid: doc.id, ...doc.data() } as UserData));
            setUsers(usersData);
        } catch (error) {
            console.error("Error loading data:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleCreateRole = () => {
        setIsCreating(true);
        setEditingRole(null);
        setNewRoleName("");
        setSelectedPermissions([]);
    };

    const handleEditRole = (role: Role) => {
        setEditingRole(role);
        setIsCreating(false);
        setNewRoleName(role.name);
        setSelectedPermissions(role.permissions);
    };

    const handleSaveRole = async () => {
        if (!newRoleName.trim()) return;

        try {
            if (isCreating) {
                await roleService.createRole({
                    name: newRoleName,
                    permissions: selectedPermissions,
                });
            } else if (editingRole) {
                await roleService.updateRole(editingRole.id, {
                    name: newRoleName,
                    permissions: selectedPermissions,
                });
            }

            setIsCreating(false);
            setEditingRole(null);
            loadData();
        } catch (error) {
            console.error("Error saving role:", error);
        }
    };

    const handleDeleteRole = async (roleId: string) => {
        if (confirm("¿Estás seguro de que querés eliminar este rol?")) {
            try {
                await roleService.deleteRole(roleId);
                loadData();
            } catch (error) {
                console.error("Error deleting role:", error);
            }
        }
    };

    const togglePermission = (permissionId: string) => {
        setSelectedPermissions(prev =>
            prev.includes(permissionId)
                ? prev.filter(id => id !== permissionId)
                : [...prev, permissionId]
        );
    };

    const handleAssignRole = async (userId: string, roleId: string) => {
        try {
            await roleService.assignRoleToUser(userId, roleId);
            loadData(); // Reload to update UI
        } catch (error) {
            console.error("Error assigning role:", error);
        }
    };

    return (
        <div className="p-8 max-w-7xl mx-auto">
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Roles y Permisos</h1>
                    <p className="text-gray-500">Gestioná los roles de usuario y sus niveles de acceso.</p>
                </div>
                <button
                    onClick={handleCreateRole}
                    className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-xl hover:bg-indigo-700 transition"
                >
                    <Plus size={18} /> Nuevo Rol
                </button>
            </div>

            {loading ? (
                <div className="text-center py-12">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto mb-4"></div>
                    <p className="text-gray-500">Cargando datos...</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Roles List */}
                    <div className="lg:col-span-1 space-y-4">
                        <h2 className="font-semibold text-gray-700 mb-4">Roles Disponibles</h2>
                        {roles.length === 0 ? (
                            <div className="p-4 rounded-xl border border-dashed border-gray-300 text-center text-gray-500">
                                No hay roles creados.
                            </div>
                        ) : (
                            roles.map((role) => (
                                <div
                                    key={role.id}
                                    className={`p-4 rounded-xl border transition-all ${editingRole?.id === role.id ? 'border-indigo-600 bg-indigo-50' : 'border-gray-200 bg-white hover:border-indigo-300'
                                        }`}
                                >
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <h3 className="font-medium text-gray-900 flex items-center gap-2">
                                                <Shield size={16} className="text-indigo-600" />
                                                {role.name}
                                            </h3>
                                            <p className="text-xs text-gray-500 mt-1">
                                                {role.permissions.length} permisos activos
                                            </p>
                                        </div>
                                        <div className="flex gap-1">
                                            <button
                                                onClick={() => handleEditRole(role)}
                                                className="p-1.5 text-gray-500 hover:text-indigo-600 hover:bg-indigo-100 rounded-lg transition"
                                            >
                                                <Edit2 size={14} />
                                            </button>
                                            {!role.isSystem && (
                                                <button
                                                    onClick={() => handleDeleteRole(role.id)}
                                                    className="p-1.5 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
                                                >
                                                    <Trash2 size={14} />
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>

                    {/* Editor / Users */}
                    <div className="lg:col-span-2 space-y-8">

                        {/* Role Editor */}
                        {(isCreating || editingRole) ? (
                            <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
                                <div className="flex justify-between items-center mb-6">
                                    <h2 className="text-lg font-semibold text-gray-900">
                                        {isCreating ? "Crear Nuevo Rol" : `Editando: ${editingRole?.name}`}
                                    </h2>
                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => { setIsCreating(false); setEditingRole(null); }}
                                            className="px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-100 rounded-lg"
                                        >
                                            Cancelar
                                        </button>
                                        <button
                                            onClick={handleSaveRole}
                                            className="flex items-center gap-2 px-4 py-1.5 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700"
                                        >
                                            <Save size={16} /> Guardar
                                        </button>
                                    </div>
                                </div>

                                <div className="mb-6">
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Nombre del Rol</label>
                                    <input
                                        type="text"
                                        value={newRoleName}
                                        onChange={(e) => setNewRoleName(e.target.value)}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                                        placeholder="Ej: Agente de Ventas"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-3">Permisos de Acceso</label>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                        {PERMISSIONS.map((perm) => (
                                            <label
                                                key={perm.id}
                                                className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-all ${selectedPermissions.includes(perm.id)
                                                    ? 'border-indigo-600 bg-indigo-50'
                                                    : 'border-gray-200 hover:bg-gray-50'
                                                    }`}
                                            >
                                                <div className={`mt-0.5 w-5 h-5 rounded border flex items-center justify-center transition-colors ${selectedPermissions.includes(perm.id)
                                                    ? 'bg-indigo-600 border-indigo-600'
                                                    : 'border-gray-300 bg-white'
                                                    }`}>
                                                    {selectedPermissions.includes(perm.id) && <Check size={12} className="text-white" />}
                                                </div>
                                                <input
                                                    type="checkbox"
                                                    className="hidden"
                                                    checked={selectedPermissions.includes(perm.id)}
                                                    onChange={() => togglePermission(perm.id)}
                                                />
                                                <div>
                                                    <span className={`block text-sm font-medium ${selectedPermissions.includes(perm.id) ? 'text-indigo-900' : 'text-gray-700'
                                                        }`}>
                                                        {perm.label}
                                                    </span>
                                                    <span className="text-xs text-gray-500">{perm.description}</span>
                                                </div>
                                            </label>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="bg-gray-50 p-8 rounded-2xl border border-dashed border-gray-300 text-center">
                                <Shield className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                                <p className="text-gray-500">Seleccioná un rol para editar o creá uno nuevo.</p>
                            </div>
                        )}

                        {/* User Assignment */}
                        <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
                            <h2 className="text-lg font-semibold text-gray-900 mb-4">Asignación de Roles</h2>
                            <div className="overflow-x-auto">
                                <table className="w-full text-left">
                                    <thead>
                                        <tr className="border-b border-gray-100">
                                            <th className="pb-3 text-sm font-medium text-gray-500">Usuario</th>
                                            <th className="pb-3 text-sm font-medium text-gray-500">Email</th>
                                            <th className="pb-3 text-sm font-medium text-gray-500">Rol Actual</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-50">
                                        {users.map((user) => (
                                            <tr key={user.uid} className="group hover:bg-gray-50">
                                                <td className="py-3 pr-4">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-500">
                                                            <UserIcon size={16} />
                                                        </div>
                                                        <span className="font-medium text-gray-900">{user.displayName || "Sin nombre"}</span>
                                                    </div>
                                                </td>
                                                <td className="py-3 pr-4 text-sm text-gray-600">{user.email}</td>
                                                <td className="py-3">
                                                    <select
                                                        value={user.roleId || ""}
                                                        onChange={(e) => handleAssignRole(user.uid, e.target.value)}
                                                        className="px-3 py-1.5 bg-white border border-gray-200 rounded-lg text-sm text-gray-700 focus:ring-2 focus:ring-indigo-500 outline-none cursor-pointer hover:border-indigo-300 transition-colors"
                                                    >
                                                        <option value="">Sin Rol</option>
                                                        {roles.map(role => (
                                                            <option key={role.id} value={role.id}>{role.name}</option>
                                                        ))}
                                                    </select>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                    </div>
                </div>
            )}
        </div>
    );
}
