"use client";

import { useState } from "react";
import { X, User, Phone, Mail, Building2, Zap, Globe } from "lucide-react";
import { Lead, LeadOrigen, LeadPrioridad, LeadTipo } from "@/domain/models/Lead";
import { leadsService } from "@/infrastructure/services/leadsService";
import { toast } from "sonner";

interface NewLeadModalProps {
    userId: string;
    onClose: () => void;
    onCreated: (lead: Lead) => void;
}

const ORIGENES: { value: LeadOrigen; label: string; emoji: string }[] = [
    { value: 'web', label: 'Web', emoji: '🌐' },
    { value: 'whatsapp', label: 'WhatsApp', emoji: '💬' },
    { value: 'instagram', label: 'Instagram', emoji: '📷' },
    { value: 'facebook', label: 'Facebook', emoji: '📘' },
    { value: 'portal', label: 'Portal', emoji: '🏠' },
    { value: 'referido', label: 'Referido', emoji: '🤝' },
    { value: 'telefono', label: 'Teléfono', emoji: '📞' },
    { value: 'email', label: 'Email', emoji: '✉️' },
    { value: 'otro', label: 'Otro', emoji: '❓' },
];

export default function NewLeadModal({ userId, onClose, onCreated }: NewLeadModalProps) {
    const [saving, setSaving] = useState(false);
    const [form, setForm] = useState({
        nombre: '',
        telefono: '',
        email: '',
        propertyTitle: '',
        mensaje: '',
        origen: 'web' as LeadOrigen,
        prioridad: 'media' as LeadPrioridad,
        tipo: 'consulta' as LeadTipo,
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!form.nombre.trim()) return;
        setSaving(true);
        try {
            const now = new Date();
            const id = await leadsService.createLead({
                ...form,
                notas: [],
                estado: 'nuevo',
                userId,
                createdAt: now,
                updatedAt: now,
                ultimaActividad: now,
            } as any);
            const newLead = await leadsService.getLeadById(id);
            if (newLead) onCreated(newLead);
            toast.success("Lead creado correctamente");
            onClose();
        } catch (err) {
            toast.error("Error al crear el lead");
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto">
                {/* Header */}
                <div className="flex items-center justify-between p-5 border-b border-gray-100">
                    <div>
                        <h2 className="text-lg font-bold text-gray-900">Nuevo Lead</h2>
                        <p className="text-sm text-gray-500">Agregar un contacto manualmente</p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-xl text-gray-400">
                        <X size={18} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-5 space-y-4">
                    {/* Nombre */}
                    <div>
                        <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1.5 flex items-center gap-1">
                            <User size={12} /> Nombre *
                        </label>
                        <input
                            required
                            type="text"
                            value={form.nombre}
                            onChange={e => setForm(f => ({ ...f, nombre: e.target.value }))}
                            placeholder="Ej: Juan García"
                            className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
                        />
                    </div>

                    {/* Tel + Email */}
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1.5 flex items-center gap-1">
                                <Phone size={12} /> Teléfono
                            </label>
                            <input
                                type="tel"
                                value={form.telefono}
                                onChange={e => setForm(f => ({ ...f, telefono: e.target.value }))}
                                placeholder="11 2345-6789"
                                className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                            />
                        </div>
                        <div>
                            <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1.5 flex items-center gap-1">
                                <Mail size={12} /> Email
                            </label>
                            <input
                                type="email"
                                value={form.email}
                                onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                                placeholder="juan@mail.com"
                                className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                            />
                        </div>
                    </div>

                    {/* Propiedad */}
                    <div>
                        <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1.5 flex items-center gap-1">
                            <Building2 size={12} /> Propiedad de interés
                        </label>
                        <input
                            type="text"
                            value={form.propertyTitle}
                            onChange={e => setForm(f => ({ ...f, propertyTitle: e.target.value }))}
                            placeholder="Ej: Depto 2 amb. Palermo"
                            className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                        />
                    </div>

                    {/* Mensaje */}
                    <div>
                        <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1.5">Mensaje</label>
                        <textarea
                            rows={3}
                            value={form.mensaje}
                            onChange={e => setForm(f => ({ ...f, mensaje: e.target.value }))}
                            placeholder="Mensaje del cliente..."
                            className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none resize-none"
                        />
                    </div>

                    {/* Fuente + Prioridad */}
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1.5 flex items-center gap-1">
                                <Globe size={12} /> Fuente
                            </label>
                            <select
                                value={form.origen}
                                onChange={e => setForm(f => ({ ...f, origen: e.target.value as LeadOrigen }))}
                                className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none bg-white"
                            >
                                {ORIGENES.map(o => (
                                    <option key={o.value} value={o.value}>{o.emoji} {o.label}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1.5 flex items-center gap-1">
                                <Zap size={12} /> Prioridad
                            </label>
                            <select
                                value={form.prioridad}
                                onChange={e => setForm(f => ({ ...f, prioridad: e.target.value as LeadPrioridad }))}
                                className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none bg-white"
                            >
                                <option value="alta">🔴 Alta</option>
                                <option value="media">🟡 Media</option>
                                <option value="baja">🟢 Baja</option>
                            </select>
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-3 pt-2">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 px-4 py-2.5 border border-gray-200 text-gray-600 rounded-xl text-sm font-medium hover:bg-gray-50 transition"
                        >
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            disabled={saving}
                            className="flex-1 px-4 py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-semibold hover:bg-indigo-700 transition disabled:opacity-60"
                        >
                            {saving ? "Guardando..." : "Crear Lead"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
