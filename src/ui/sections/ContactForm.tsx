"use client";

import { useState } from "react";
import { Mail, Building, MessageSquare, Send, CheckCircle, AlertCircle } from "lucide-react";
import { contactService } from "@/infrastructure/services/contactService";
import { WhatsAppIcon } from "@/ui/icons/WhatsAppIcon";

export default function ContactForm() {
    const [formData, setFormData] = useState({
        name: "",
        email: "",
        phone: "",
        company: "",
        message: "",
    });
    const [errors, setErrors] = useState({
        name: "",
        email: "",
        phone: "",
        message: "",
    });
    const [submitted, setSubmitted] = useState(false);
    const [loading, setLoading] = useState(false);

    // Regex Patterns
    const patterns = {
        name: /^[a-zA-ZÀ-ÿ\s]{3,50}$/, // Letters, spaces, 3-50 chars
        email: /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,6}$/,
        phone: /^[+]?[\d\s-]{8,20}$/, // Numbers, spaces, hyphens, optional +, 8-20 chars
    };

    const validateField = (name: string, value: string) => {
        let error = "";
        switch (name) {
            case "name":
                if (!patterns.name.test(value)) error = "Nombre inválido (3-50 letras)";
                break;
            case "email":
                if (!patterns.email.test(value)) error = "Email inválido";
                break;
            case "phone":
                if (value && !patterns.phone.test(value)) error = "Teléfono inválido (mínimo 8 números)";
                break;
            case "message":
                if (value.length > 500) error = "Máximo 500 caracteres";
                break;
        }
        setErrors(prev => ({ ...prev, [name]: error }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        // Final Validation check before submit
        const nameValid = patterns.name.test(formData.name);
        const emailValid = patterns.email.test(formData.email);
        const phoneValid = !formData.phone || patterns.phone.test(formData.phone);
        const messageValid = formData.message.length > 0 && formData.message.length <= 500;

        if (!nameValid || !emailValid || !phoneValid || !messageValid) {
            // Trigger validations to show errors
            validateField("name", formData.name);
            validateField("email", formData.email);
            if (formData.phone) validateField("phone", formData.phone);
            validateField("message", formData.message);
            return;
        }

        setLoading(true);

        try {
            await contactService.createMessage(formData);
            setSubmitted(true);
            setFormData({ name: "", email: "", phone: "", company: "", message: "" });
            setErrors({ name: "", email: "", phone: "", message: "" });

            // Reset state after 5 seconds
            setTimeout(() => {
                setSubmitted(false);
            }, 5000);
        } catch (error) {
            console.error("Error sending message:", error);
            alert("Hubo un error al enviar el mensaje. Por favor intenta nuevamente.");
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));

        // Validate on change (optional: can be onBlur for less aggression)
        // For message length, useful to update immediately.
        if (name === "message" || errors[name as keyof typeof errors]) {
            validateField(name, value);
        }
    };

    if (submitted) {
        return (
            <section id="contacto" className="l-section l-section--tight">
                <div className="l-container l-contact__success">
                    <div className="l-contact__success-icon">
                        <CheckCircle size={36} />
                    </div>
                    <h2>¡Mensaje enviado!</h2>
                    <p>Gracias por contactarnos. Nuestro equipo te responderá en menos de 24 horas.</p>
                </div>
            </section>
        );
    }

    return (
        <section id="contacto" className="l-section l-section--tight">
            <div className="l-container l-contact__grid">
                {/* Left: Info */}
                <div>
                    <h2 className="l-contact__title">Información de contacto</h2>

                    <div className="l-contact__list">
                        <div className="l-contact__item">
                            <div className="l-contact__icon">
                                <Mail size={20} />
                            </div>
                            <div>
                                <h3>Email</h3>
                                <p>zetaprop.com.ar@gmail.com</p>
                                <p className="l-contact__hint">Respuesta rápida</p>
                            </div>
                        </div>

                        <div className="l-contact__item">
                            <div className="l-contact__icon l-contact__icon--positive">
                                <WhatsAppIcon className="w-5 h-5" />
                            </div>
                            <div>
                                <h3>WhatsApp</h3>
                                <a href="https://wa.me/5491123889745" target="_blank" rel="noopener noreferrer">
                                    +54 9 11 2388-9745
                                </a>
                                <p className="l-contact__hint">Facundo</p>
                            </div>
                        </div>

                        <div className="l-contact__item">
                            <div className="l-contact__icon">
                                <Building size={20} />
                            </div>
                            <div>
                                <h3>Oficina</h3>
                                <p>Oeste de Buenos Aires, Argentina</p>
                                <p className="l-contact__hint">Visitas con cita previa</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right: Form */}
                <div className="l-contact__panel">
                    <div className="l-contact__panel-head">
                        <div className="l-contact__icon">
                            <MessageSquare size={18} />
                        </div>
                        <h3>Envianos un mensaje</h3>
                    </div>

                    <form onSubmit={handleSubmit}>
                        <div className="l-field">
                            <label htmlFor="name">Nombre completo *</label>
                            <input
                                id="name"
                                type="text"
                                name="name"
                                required
                                maxLength={50}
                                value={formData.name}
                                onChange={handleChange}
                                className={`l-input ${errors.name ? 'l-input--error' : ''}`}
                                placeholder="Juan Pérez"
                            />
                            {errors.name && <p className="l-field__error"><AlertCircle size={12} /> {errors.name}</p>}
                        </div>

                        <div className="l-field">
                            <label htmlFor="email">Email *</label>
                            <input
                                id="email"
                                type="email"
                                name="email"
                                required
                                maxLength={100}
                                value={formData.email}
                                onChange={handleChange}
                                className={`l-input ${errors.email ? 'l-input--error' : ''}`}
                                placeholder="juan@inmobiliaria.com"
                            />
                            {errors.email && <p className="l-field__error"><AlertCircle size={12} /> {errors.email}</p>}
                        </div>

                        <div className="l-field">
                            <label htmlFor="phone">Teléfono</label>
                            <input
                                id="phone"
                                type="tel"
                                name="phone"
                                maxLength={20}
                                value={formData.phone}
                                onChange={handleChange}
                                className={`l-input ${errors.phone ? 'l-input--error' : ''}`}
                                placeholder="+54 9 11 1234-5678"
                            />
                            {errors.phone && <p className="l-field__error"><AlertCircle size={12} /> {errors.phone}</p>}
                        </div>

                        <div className="l-field">
                            <label htmlFor="company">Inmobiliaria</label>
                            <input
                                id="company"
                                type="text"
                                name="company"
                                maxLength={50}
                                value={formData.company}
                                onChange={handleChange}
                                className="l-input"
                                placeholder="Mi Inmobiliaria"
                            />
                        </div>

                        <div className="l-field">
                            <div className="l-field__row">
                                <label htmlFor="message" style={{ margin: 0 }}>Mensaje *</label>
                                <span className={`l-field__counter ${formData.message.length > 450 ? 'l-field__counter--warn' : ''}`}>
                                    {formData.message.length}/500
                                </span>
                            </div>
                            <textarea
                                id="message"
                                name="message"
                                required
                                maxLength={500}
                                value={formData.message}
                                onChange={handleChange}
                                rows={4}
                                className={`l-input l-input--textarea ${errors.message ? 'l-input--error' : ''}`}
                                placeholder="Cuéntanos cómo podemos ayudarte..."
                            />
                            {errors.message && <p className="l-field__error"><AlertCircle size={12} /> {errors.message}</p>}
                        </div>

                        <button
                            type="submit"
                            disabled={loading || !!errors.name || !!errors.email || !!errors.phone || !!errors.message}
                            className="l-btn l-btn--primary l-btn--block"
                        >
                            {loading ? (
                                <>Enviando...</>
                            ) : (
                                <>
                                    Enviar mensaje
                                    <Send size={18} />
                                </>
                            )}
                        </button>

                        <p className="l-contact__legal">
                            Al enviar este formulario, aceptás nuestra{" "}
                            <a href="/privacidad">Política de Privacidad</a>
                        </p>
                    </form>
                </div>
            </div>
        </section>
    );
}
