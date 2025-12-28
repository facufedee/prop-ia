"use client";

import { useState } from "react";
import { Mail, Building, MessageSquare, Send, CheckCircle, AlertCircle } from "lucide-react";
import { contactService } from "@/infrastructure/services/contactService";

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
            <section id="contacto" className="py-24 bg-gradient-to-br from-green-50 to-emerald-50">
                <div className="max-w-7xl mx-auto px-6">
                    <div className="max-w-2xl mx-auto text-center">
                        <div className="w-20 h-20 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-6 animate-bounce">
                            <CheckCircle className="w-10 h-10 text-white" />
                        </div>
                        <h2 className="text-3xl font-bold text-gray-900 mb-4">
                            ¡Mensaje Enviado!
                        </h2>
                        <p className="text-lg text-gray-600">
                            Gracias por contactarnos. Nuestro equipo te responderá en menos de 24 horas.
                        </p>
                    </div>
                </div>
            </section>
        );
    }

    return (
        <section id="contacto" className="py-24 bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50">
            <div className="max-w-7xl mx-auto px-6">
                <div className="grid lg:grid-cols-2 gap-12 items-center">
                    {/* Left: Info */}
                    <div>
                        <span className="inline-block px-4 py-2 bg-indigo-100 text-indigo-700 rounded-full text-sm font-semibold mb-4">
                            CONTACTO
                        </span>
                        <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
                            ¿Listo para transformar
                            <span className="block bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                                tu inmobiliaria?
                            </span>
                        </h2>
                        <p className="text-xl text-gray-600 mb-8">
                            Hablemos sobre cómo PROP-IA puede ayudarte a automatizar procesos,
                            ahorrar tiempo y aumentar tus ventas.
                        </p>

                        {/* Contact Info */}
                        <div className="space-y-6">
                            <div className="flex items-start gap-4">
                                <div className="w-12 h-12 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-xl flex items-center justify-center flex-shrink-0">
                                    <Mail className="w-6 h-6 text-white" />
                                </div>
                                <div>
                                    <h4 className="font-semibold text-gray-900 mb-1">Email</h4>
                                    <p className="text-gray-600">contacto@prop-ia.com.ar</p>
                                    <p className="text-sm text-gray-500">Respuesta en menos de 24hs</p>
                                </div>
                            </div>

                            <div className="flex items-start gap-4">
                                <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-xl flex items-center justify-center flex-shrink-0">
                                    <Building className="w-6 h-6 text-white" />
                                </div>
                                <div>
                                    <h4 className="font-semibold text-gray-900 mb-1">Oficina</h4>
                                    <p className="text-gray-600">Oeste de Buenos Aires, Argentina</p>
                                    <p className="text-sm text-gray-500">Visitas con cita previa</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Right: Form */}
                    <div className="bg-white rounded-3xl shadow-2xl p-8 md:p-10">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="w-10 h-10 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-lg flex items-center justify-center">
                                <MessageSquare className="w-5 h-5 text-white" />
                            </div>
                            <h3 className="text-2xl font-bold text-gray-900">Envíanos un mensaje</h3>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div>
                                <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                                    Nombre completo *
                                </label>
                                <input
                                    id="name"
                                    type="text"
                                    name="name"
                                    required
                                    maxLength={50}
                                    value={formData.name}
                                    onChange={handleChange}
                                    className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all ${errors.name ? 'border-red-500 bg-red-50' : 'border-gray-300'}`}
                                    placeholder="Juan Pérez"
                                />
                                {errors.name && <p className="mt-1 text-xs text-red-500 flex items-center gap-1"><AlertCircle size={12} /> {errors.name}</p>}
                            </div>

                            <div>
                                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                                    Email *
                                </label>
                                <input
                                    id="email"
                                    type="email"
                                    name="email"
                                    required
                                    maxLength={100}
                                    value={formData.email}
                                    onChange={handleChange}
                                    className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all ${errors.email ? 'border-red-500 bg-red-50' : 'border-gray-300'}`}
                                    placeholder="juan@inmobiliaria.com"
                                />
                                {errors.email && <p className="mt-1 text-xs text-red-500 flex items-center gap-1"><AlertCircle size={12} /> {errors.email}</p>}
                            </div>

                            <div>
                                <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-2">
                                    Teléfono
                                </label>
                                <input
                                    id="phone"
                                    type="tel"
                                    name="phone"
                                    maxLength={20}
                                    value={formData.phone}
                                    onChange={handleChange}
                                    className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all ${errors.phone ? 'border-red-500 bg-red-50' : 'border-gray-300'}`}
                                    placeholder="+54 9 11 1234-5678"
                                />
                                {errors.phone && <p className="mt-1 text-xs text-red-500 flex items-center gap-1"><AlertCircle size={12} /> {errors.phone}</p>}
                            </div>

                            <div>
                                <label htmlFor="company" className="block text-sm font-medium text-gray-700 mb-2">
                                    Inmobiliaria
                                </label>
                                <input
                                    id="company"
                                    type="text"
                                    name="company"
                                    maxLength={50}
                                    value={formData.company}
                                    onChange={handleChange}
                                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
                                    placeholder="Mi Inmobiliaria"
                                />
                            </div>

                            <div>
                                <div className="flex justify-between mb-2">
                                    <label htmlFor="message" className="block text-sm font-medium text-gray-700">
                                        Mensaje *
                                    </label>
                                    <span className={`text-xs ${formData.message.length > 450 ? 'text-red-500' : 'text-gray-400'}`}>
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
                                    className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all resize-none ${errors.message ? 'border-red-500 bg-red-50' : 'border-gray-300'}`}
                                    placeholder="Cuéntanos cómo podemos ayudarte..."
                                />
                                {errors.message && <p className="mt-1 text-xs text-red-500 flex items-center gap-1"><AlertCircle size={12} /> {errors.message}</p>}
                            </div>

                            <button
                                type="submit"
                                disabled={loading || !!errors.name || !!errors.email || !!errors.phone || !!errors.message}
                                className="w-full px-6 py-4 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl font-semibold hover:shadow-lg transform hover:scale-105 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                            >
                                {loading ? (
                                    <>
                                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                        Enviando...
                                    </>
                                ) : (
                                    <>
                                        Enviar Mensaje
                                        <Send className="w-5 h-5" />
                                    </>
                                )}
                            </button>

                            <p className="text-xs text-gray-500 text-center">
                                Al enviar este formulario, aceptas nuestra{" "}
                                <a href="/privacidad" className="text-indigo-600 hover:underline">
                                    Política de Privacidad
                                </a>
                            </p>
                        </form>
                    </div>
                </div>
            </div>
        </section>
    );
}
