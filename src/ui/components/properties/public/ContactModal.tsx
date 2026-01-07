"use strict";
import { useState } from "react";
import { X, Send, Loader2 } from "lucide-react";
import { publicService } from "@/infrastructure/services/publicService"; // Assuming we might need this or just pass the submit function
import { leadsService } from "@/infrastructure/services/leadsService"; // We can't use this directly locally if it's client side without api? 
// Wait, leadsService uses firebase/firestore directly which is fine for client components if rules allow. 
// However, typically public users can't write to 'leads' collection unless rules allow it.
// For now, I will assume we can write or I should create an API route. 
// Given the current architecture seems to use direct firestore services in components (e.g. AgentesPage), I will try using a service.
// But wait, "leadsService" might require auth? 
// The user is anonymous on the public page.
// I should probably check if I need an API route `/api/leads` to handle this securely (server-side admin sdk or allow public write).
// For this iteration, I'll create a simple API route to handle public lead submission to avoid exposing direct DB write to public unauth users if possible, or just use the service if rules allow.
// Let's assume I should use an API route for public submissions.

// Actually, looking at `agentesService`, it uses `auth.currentUser`.
// `leadsService` uses `db`.
// If I use `leadsService` directly, I need to make sure Firestore rules allow 'create' for public or use an API.
// To be safe and robust, I will create an API route: `/api/public/leads`.

// But first, let's just make the UI component.

export interface ContactModalProps {
    isOpen: boolean;
    onClose: () => void;
    propertyId: string;
    propertyTitle: string;
    ownerId: string; // The agent/agency to receive the lead
    agencyId?: string; // organizationId
}

export default function ContactModal({ isOpen, onClose, propertyId, propertyTitle, ownerId, agencyId }: ContactModalProps) {
    const [formData, setFormData] = useState({
        nombre: "",
        email: "",
        telefono: "",
        mensaje: `Hola, estoy interesado en la propiedad "${propertyTitle}" que vi en PropIA.`
    });
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [error, setError] = useState("");

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError("");

        try {
            // POST to internal API
            const res = await fetch('/api/leads/public', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ...formData,
                    propertyId,
                    propertyTitle,
                    userId: ownerId, // The recipient
                    organizationId: agencyId,
                    origen: 'web',
                    tipo: 'consulta',
                    estado: 'nuevo'
                })
            });

            if (!res.ok) throw new Error("Error al enviar la consulta");

            setSuccess(true);
            setTimeout(() => {
                onClose();
                setSuccess(false);
                setFormData({ nombre: "", email: "", telefono: "", mensaje: "" });
            }, 3000);
        } catch (err) {
            console.error(err);
            setError("Hubo un error al enviar tu consulta. Por favor intenta nuevamente.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[70] bg-black/50 flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in">
            <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl relative overflow-hidden">
                {/* Header */}
                <div className="px-6 py-4 border-b flex justify-between items-center bg-gray-50">
                    <h3 className="font-bold text-lg text-gray-900">Consultar por esta propiedad</h3>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-900 transition">
                        <X size={20} />
                    </button>
                </div>

                {/* Body */}
                <div className="p-6">
                    {success ? (
                        <div className="text-center py-8">
                            <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
                                <Send size={32} />
                            </div>
                            <h4 className="text-xl font-bold text-gray-900 mb-2">¡Consulta enviada!</h4>
                            <p className="text-gray-600">El agente se pondrá en contacto contigo a la brevedad.</p>
                        </div>
                    ) : (
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Nombre</label>
                                <input
                                    type="text"
                                    required
                                    className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-black focus:border-transparent outline-none transition"
                                    placeholder="Tu nombre completo"
                                    value={formData.nombre}
                                    onChange={e => setFormData({ ...formData, nombre: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                                <input
                                    type="email"
                                    required
                                    className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-black focus:border-transparent outline-none transition"
                                    placeholder="tu@email.com"
                                    value={formData.email}
                                    onChange={e => setFormData({ ...formData, email: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Teléfono</label>
                                <input
                                    type="tel"
                                    required
                                    className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-black focus:border-transparent outline-none transition"
                                    placeholder="Cod. Área + Número"
                                    value={formData.telefono}
                                    onChange={e => setFormData({ ...formData, telefono: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Mensaje</label>
                                <textarea
                                    required
                                    rows={4}
                                    className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-black focus:border-transparent outline-none transition resize-none"
                                    value={formData.mensaje}
                                    onChange={e => setFormData({ ...formData, mensaje: e.target.value })}
                                />
                            </div>

                            {error && <p className="text-sm text-red-600 font-medium">{error}</p>}

                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full bg-black hover:bg-gray-800 text-white font-bold py-3 rounded-xl transition flex items-center justify-center gap-2"
                            >
                                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Enviar Consulta"}
                            </button>
                        </form>
                    )}
                </div>
            </div>
        </div>
    );
}
