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
        if (!auth) {
            setLoading(false);
            return;
        }

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

    if (loading) return <div className="p-8"><Loader2 strokeWidth={1.5} className="w-8 h-8 animate-spin text-[var(--color-accent)]" /></div>;

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="font-heading text-2xl font-bold text-[var(--color-ink)]">Sucursales</h1>
                <button
                    onClick={() => handleOpenModal()}
                    className="bg-[var(--color-ink)] hover:bg-[var(--color-ink-2)] text-[var(--color-paper)] px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
                >
                    <Plus strokeWidth={1.5} className="w-4 h-4" />
                    Nueva Sucursal
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {branches.length === 0 && (
                    <div className="col-span-full text-center py-12 text-[var(--color-muted)]">
                        No tienes sucursales registradas. ¡Crea la primera!
                    </div>
                )}

                {branches.map(branch => (
                    <div key={branch.id} className="bg-[var(--color-paper-2)] p-6 rounded-xl shadow-sm border border-[var(--color-rule-2)] hover:shadow-md transition-shadow relative group">

                        <div className="flex items-start justify-between mb-4">
                            <div className="bg-[var(--color-paper-3)] p-3 rounded-full text-[var(--color-muted)]">
                                <Building2 strokeWidth={1.5} className="w-6 h-6" />
                            </div>
                            <span className={`text-xs px-2 py-1 rounded-full font-medium ${branch.isActive ? 'bg-[var(--color-positive-soft)] text-[var(--color-positive)]' : 'bg-[var(--color-paper-3)] text-[var(--color-ink-2)]'}`}>
                                {branch.isActive ? 'Activa' : 'Inactiva'}
                            </span>
                        </div>

                        <h3 className="font-semibold text-lg text-[var(--color-ink)] mb-2">{branch.name}</h3>

                        <div className="space-y-2 text-sm text-[var(--color-muted)]">
                            <div className="flex items-center gap-2">
                                <MapPin strokeWidth={1.5} className="w-4 h-4 flex-shrink-0" />
                                <span className="truncate">{branch.address}</span>
                            </div>
                            {branch.phone && (
                                <div className="flex items-center gap-2">
                                    <Phone strokeWidth={1.5} className="w-4 h-4 flex-shrink-0" />
                                    {branch.phone}
                                </div>
                            )}
                            {branch.email && (
                                <div className="flex items-center gap-2">
                                    <Mail strokeWidth={1.5} className="w-4 h-4 flex-shrink-0" />
                                    <span className="truncate">{branch.email}</span>
                                </div>
                            )}
                        </div>

                        <div className="mt-6 flex gap-2 border-t pt-4 border-[var(--color-rule-2)]">
                            <button
                                onClick={() => handleOpenModal(branch)}
                                className="flex-1 text-sm flex items-center justify-center gap-2 bg-[var(--color-paper-2)] border border-[var(--color-rule)] text-[var(--color-ink-2)] py-2 rounded hover:bg-[var(--color-paper-3)] transition-colors"
                            >
                                <Edit2 strokeWidth={1.5} className="w-3 h-3" /> Editar
                            </button>
                            <button
                                onClick={() => handleDelete(branch.id)}
                                className="text-sm bg-[var(--color-paper-2)] border border-[var(--color-danger)]/30 text-[var(--color-danger)] px-3 py-2 rounded hover:bg-[var(--color-danger-soft)] transition-colors"
                                title="Eliminar"
                            >
                                <Trash2 strokeWidth={1.5} className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                ))}
            </div>

            {/* Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
                    <div className="bg-[var(--color-paper-2)] rounded-xl shadow-xl w-full max-w-lg overflow-hidden">
                        <div className="px-6 py-4 border-b border-[var(--color-rule-2)] flex justify-between items-center bg-[var(--color-paper)]">
                            <h2 className="text-lg font-bold text-[var(--color-ink)]">
                                {editingBranch ? 'Editar Sucursal' : 'Nueva Sucursal'}
                            </h2>
                            <button onClick={() => setIsModalOpen(false)} className="text-[var(--color-neutral)] hover:text-[var(--color-ink-2)]">
                                <X strokeWidth={1.5} className="w-5 h-5" />
                            </button>
                        </div>
                        <form onSubmit={handleSubmit} className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-[var(--color-ink-2)] mb-1">Nombre de la Sucursal</label>
                                <input
                                    type="text"
                                    required
                                    className="w-full px-3 py-2 border border-[var(--color-rule)] rounded-lg focus:ring-2 focus:ring-[var(--color-accent)]/40"
                                    placeholder="Ej: Casa Central"
                                    value={formData.name}
                                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-[var(--color-ink-2)] mb-1">Dirección</label>
                                <input
                                    type="text"
                                    required
                                    className="w-full px-3 py-2 border border-[var(--color-rule)] rounded-lg focus:ring-2 focus:ring-[var(--color-accent)]/40"
                                    placeholder="Ej: Av. Libertador 1234"
                                    value={formData.address}
                                    onChange={e => setFormData({ ...formData, address: e.target.value })}
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-[var(--color-ink-2)] mb-1">Teléfono</label>
                                    <input
                                        type="tel"
                                        className="w-full px-3 py-2 border border-[var(--color-rule)] rounded-lg focus:ring-2 focus:ring-[var(--color-accent)]/40"
                                        placeholder="Opcional"
                                        value={formData.phone}
                                        onChange={e => setFormData({ ...formData, phone: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-[var(--color-ink-2)] mb-1">Email</label>
                                    <input
                                        type="email"
                                        className="w-full px-3 py-2 border border-[var(--color-rule)] rounded-lg focus:ring-2 focus:ring-[var(--color-accent)]/40"
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
                                    className="px-4 py-2 text-[var(--color-ink-2)] hover:bg-[var(--color-paper-3)] rounded-lg"
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    className="bg-[var(--color-ink)] hover:bg-[var(--color-ink-2)] text-[var(--color-paper)] px-6 py-2 rounded-lg font-medium shadow-sm"
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
