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
        mensaje: `Hola, estoy interesado en la propiedad "${propertyTitle}" que vi en Zeta Prop.`
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
        <div className="fixed inset-0 z-[300] bg-black/60 flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in">
            <div className="s-modal" role="dialog" aria-modal="true" aria-labelledby="contact-modal-title">
                {/* Header */}
                <div className="s-modal__head">
                    <h3 id="contact-modal-title" className="s-modal__title">Consultar por esta propiedad</h3>
                    <button type="button" onClick={onClose} aria-label="Cerrar" className="s-icon-btn">
                        <X size={18} />
                    </button>
                </div>

                {/* Body */}
                <div className="s-modal__body">
                    {success ? (
                        <div className="s-success">
                            <div className="s-success__icon">
                                <Send size={28} />
                            </div>
                            <h4 className="s-success__title">¡Consulta enviada!</h4>
                            <p className="s-success__text">El agente se pondrá en contacto contigo a la brevedad.</p>
                        </div>
                    ) : (
                        <form onSubmit={handleSubmit}>
                            <div className="l-field">
                                <label htmlFor="contact-nombre">Nombre</label>
                                <input
                                    id="contact-nombre"
                                    type="text"
                                    required
                                    className="l-input"
                                    placeholder="Tu nombre completo"
                                    value={formData.nombre}
                                    onChange={e => setFormData({ ...formData, nombre: e.target.value })}
                                />
                            </div>
                            <div className="l-field">
                                <label htmlFor="contact-email">Email</label>
                                <input
                                    id="contact-email"
                                    type="email"
                                    required
                                    className="l-input"
                                    placeholder="tu@email.com"
                                    value={formData.email}
                                    onChange={e => setFormData({ ...formData, email: e.target.value })}
                                />
                            </div>
                            <div className="l-field">
                                <label htmlFor="contact-telefono">Teléfono</label>
                                <input
                                    id="contact-telefono"
                                    type="tel"
                                    required
                                    className="l-input"
                                    placeholder="Cod. Área + Número"
                                    value={formData.telefono}
                                    onChange={e => setFormData({ ...formData, telefono: e.target.value })}
                                />
                            </div>
                            <div className="l-field">
                                <label htmlFor="contact-mensaje">Mensaje</label>
                                <textarea
                                    id="contact-mensaje"
                                    required
                                    rows={4}
                                    className="l-input l-input--textarea"
                                    value={formData.mensaje}
                                    onChange={e => setFormData({ ...formData, mensaje: e.target.value })}
                                />
                            </div>

                            {error && <p className="s-form-error" role="alert">{error}</p>}

                            <button
                                type="submit"
                                disabled={loading}
                                className="l-btn l-btn--primary l-btn--block s-btn-reset s-btn-plain"
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
