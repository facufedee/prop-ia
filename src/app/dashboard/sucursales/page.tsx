"use client";

import { useState, useEffect } from "react";
import { Building2, Plus, MapPin, Phone, Mail, Trash2, Edit2, X, Loader2 } from "lucide-react";
import { branchService } from "@/infrastructure/services/branchService";
import { Branch } from "@/domain/models/Branch";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "@/infrastructure/firebase/client";

export default function SucursalesPage() {
    const [branches, setBranches] = useState<Branch[]>([]);
    const [loading, setLoading] = useState(true);
    const [userId, setUserId] = useState<string | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingBranch, setEditingBranch] = useState<Branch | null>(null);

    // Form State
    const [formData, setFormData] = useState({
        name: "",
        address: "",
        phone: "",
        email: ""
    });

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (user) => {
            if (user) {
                setUserId(user.uid);
                loadBranches(user.uid);
            } else {
                setLoading(false);
            }
        });
        return () => unsubscribe();
    }, []);

    const loadBranches = async (uid: string) => {
        try {
            const data = await branchService.getBranches(uid);
            setBranches(data);
        } catch (error) {
            console.error("Error loading branches:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleOpenModal = (branch?: Branch) => {
        if (branch) {
            setEditingBranch(branch);
            setFormData({
                name: branch.name,
                address: branch.address,
                phone: branch.phone || "",
                email: branch.email || ""
            });
        } else {
            setEditingBranch(null);
            setFormData({ name: "", address: "", phone: "", email: "" });
        }
        setIsModalOpen(true);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!userId) return;

        try {
            if (editingBranch) {
                await branchService.updateBranch(editingBranch.id, {
                    ...formData,
                    organizationId: userId
                });
            } else {
                await branchService.createBranch({
                    ...formData,
                    organizationId: userId,
                    isActive: true, // Default
                } as any);
            }
            setIsModalOpen(false);
            loadBranches(userId);
        } catch (error) {
            console.error("Error saving branch:", error);
            alert("Error al guardar la sucursal");
        }
    };

    const handleDelete = async (id: string) => {
        if (confirm("¿Estás seguro de eliminar esta sucursal?")) {
            try {
                await branchService.deleteBranch(id);
                if (userId) loadBranches(userId);
            } catch (error) {
                console.error("Error deleting branch:", error);
            }
        }
    };

    if (loading) return <div className="p-8"><Loader2 className="w-8 h-8 animate-spin text-indigo-600" /></div>;

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-2xl font-bold text-gray-800">Sucursales</h1>
                <button
                    onClick={() => handleOpenModal()}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
                >
                    <Plus className="w-4 h-4" />
                    Nueva Sucursal
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {branches.length === 0 && (
                    <div className="col-span-full text-center py-12 text-gray-500">
                        No tienes sucursales registradas. ¡Crea la primera!
                    </div>
                )}

                {branches.map(branch => (
                    <div key={branch.id} className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow relative group">

                        <div className="flex items-start justify-between mb-4">
                            <div className="bg-indigo-50 p-3 rounded-lg text-indigo-600">
                                <Building2 className="w-6 h-6" />
                            </div>
                            <span className={`text-xs px-2 py-1 rounded-full font-medium ${branch.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'}`}>
                                {branch.isActive ? 'Activa' : 'Inactiva'}
                            </span>
                        </div>

                        <h3 className="font-semibold text-lg text-gray-900 mb-2">{branch.name}</h3>

                        <div className="space-y-2 text-sm text-gray-500">
                            <div className="flex items-center gap-2">
                                <MapPin className="w-4 h-4 flex-shrink-0" />
                                <span className="truncate">{branch.address}</span>
                            </div>
                            {branch.phone && (
                                <div className="flex items-center gap-2">
                                    <Phone className="w-4 h-4 flex-shrink-0" />
                                    {branch.phone}
                                </div>
                            )}
                            {branch.email && (
                                <div className="flex items-center gap-2">
                                    <Mail className="w-4 h-4 flex-shrink-0" />
                                    <span className="truncate">{branch.email}</span>
                                </div>
                            )}
                        </div>

                        <div className="mt-6 flex gap-2 border-t pt-4 border-gray-50">
                            <button
                                onClick={() => handleOpenModal(branch)}
                                className="flex-1 text-sm flex items-center justify-center gap-2 bg-white border border-gray-200 text-gray-700 py-2 rounded hover:bg-gray-50 transition-colors"
                            >
                                <Edit2 className="w-3 h-3" /> Editar
                            </button>
                            <button
                                onClick={() => handleDelete(branch.id)}
                                className="text-sm bg-white border border-red-100 text-red-600 px-3 py-2 rounded hover:bg-red-50 transition-colors"
                                title="Eliminar"
                            >
                                <Trash2 className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                ))}
            </div>

            {/* Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
                    <div className="bg-white rounded-xl shadow-xl w-full max-w-lg overflow-hidden">
                        <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                            <h2 className="text-lg font-bold text-gray-800">
                                {editingBranch ? 'Editar Sucursal' : 'Nueva Sucursal'}
                            </h2>
                            <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <form onSubmit={handleSubmit} className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Nombre de la Sucursal</label>
                                <input
                                    type="text"
                                    required
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                                    placeholder="Ej: Casa Central"
                                    value={formData.name}
                                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Dirección</label>
                                <input
                                    type="text"
                                    required
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                                    placeholder="Ej: Av. Libertador 1234"
                                    value={formData.address}
                                    onChange={e => setFormData({ ...formData, address: e.target.value })}
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Teléfono</label>
                                    <input
                                        type="tel"
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                                        placeholder="Opcional"
                                        value={formData.phone}
                                        onChange={e => setFormData({ ...formData, phone: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                                    <input
                                        type="email"
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                                        placeholder="Opcional"
                                        value={formData.email}
                                        onChange={e => setFormData({ ...formData, email: e.target.value })}
                                    />
                                </div>
                            </div>

                            <div className="pt-4 flex justify-end gap-3">
                                <button
                                    type="button"
                                    onClick={() => setIsModalOpen(false)}
                                    className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg"
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2 rounded-lg font-medium shadow-sm shadow-indigo-200"
                                >
                                    {editingBranch ? 'Guardar Cambios' : 'Crear Sucursal'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
