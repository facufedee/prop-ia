"use client";

import { useState, useRef, useEffect } from 'react';
import { MessageCircle, X, Send, User, Phone, MessageSquare } from 'lucide-react';
import { useAuth } from '@/ui/context/AuthContext';
import { leadsService } from '@/infrastructure/services/leadsService';
import { Timestamp } from 'firebase/firestore';

export default function FloatingChatWidget() {
    const { user } = useAuth();
    const [isOpen, setIsOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);

    // Form State
    const [formData, setFormData] = useState({
        nombre: '',
        telefono: '',
        mensaje: ''
    });

    // Load user data if logged in
    useEffect(() => {
        if (user) {
            setFormData(prev => ({
                ...prev,
                nombre: user.displayName || user.email?.split('@')[0] || '',
                // Phone is not standard in user auth usually, so we leave it empty or checking if we have it in user metadata (not implemented here)
            }));
        }
    }, [user]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);

        try {
            // We are saving this as a 'Lead' for Zeta Prop system.
            // Using a system ID or the user's ID if logged in to track origin.
            // If logged in, userId is the user's ID. If not, maybe a generic 'visitor' ID or we create a separate collection?
            // The user asked to save it in "leads de consultas".
            // createLead expects a valid Lead object structure.

            await leadsService.createLead({
                nombre: formData.nombre,
                telefono: formData.telefono,
                mensaje: formData.mensaje,
                email: user?.email || 'anonimo@web.com', // Fallback email
                tipo: 'consulta',
                estado: 'nuevo',
                origen: 'web',
                userId: 'SYSTEM_ZETA_PROP', // Always assign to System/SuperAdmin
                notas: user ? ['Usuario Logueado', `ID: ${user.uid}`] : ['Visitante Web'],
                createdAt: new Date(),
                updatedAt: new Date()
            } as any); // Type casting comfortably as createLead handles the Omit

            setIsSuccess(true);
            setFormData({ nombre: '', telefono: '', mensaje: '' });

            // Auto close after success message
            setTimeout(() => {
                setIsOpen(false);
                setTimeout(() => setIsSuccess(false), 500); // Reset success state after closing
            }, 5000);

        } catch (error) {
            console.error("Error submitting lead:", error);
            alert("Hubo un error al enviar el mensaje. Por favor intenta nuevamente.");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <>
            {/* Toggle Button */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className={`fixed bottom-6 right-6 z-50 p-4 rounded-full shadow-2xl transition-all duration-300 hover:scale-110 flex items-center justify-center ${isOpen ? 'bg-red-500 rotate-90' : 'bg-gradient-to-r from-indigo-600 to-violet-600 animate-bounce-slow'
                    }`}
                aria-label="Chat de consultas"
            >
                {isOpen ? (
                    <X className="w-7 h-7 text-white" />
                ) : (
                    <MessageCircle className="w-7 h-7 text-white" />
                )}
            </button>

            {/* Chat Box */}
            <div
                className={`fixed bottom-24 right-6 z-50 w-[350px] max-w-[calc(100vw-3rem)] bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden transition-all duration-300 origin-bottom-right ${isOpen ? 'scale-100 opacity-100' : 'scale-90 opacity-0 pointer-events-none'
                    }`}
            >
                {/* Header */}
                <div className="bg-gradient-to-r from-indigo-600 to-violet-600 p-4 text-white">
                    <h3 className="font-bold text-lg flex items-center gap-2">
                        <MessageSquare className="w-5 h-5" />
                        Consultas Zeta Prop
                    </h3>
                    <p className="text-indigo-100 text-xs mt-1">
                        Escribinos y te responderemos en menos de 24hs.
                    </p>
                </div>

                {/* Body */}
                <div className="p-5">
                    {isSuccess ? (
                        <div className="text-center py-8 animate-in fade-in zoom-in duration-300">
                            <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
                                <Send className="w-8 h-8" />
                            </div>
                            <h4 className="font-bold text-gray-900 text-lg mb-2">¡Mensaje Recibido!</h4>
                            <p className="text-gray-600 text-sm">
                                Gracias por contactarnos. Te responderemos personalmente en menos de 24hs.
                            </p>
                        </div>
                    ) : (
                        <form onSubmit={handleSubmit} className="space-y-4">

                            {user && (
                                <div className="bg-indigo-50 p-3 rounded-xl flex items-center gap-3 border border-indigo-100 mb-2">
                                    <div className="w-8 h-8 rounded-full bg-indigo-200 flex items-center justify-center text-indigo-700 font-bold">
                                        {user.displayName?.[0] || user.email?.[0] || 'U'}
                                    </div>
                                    <div className="text-sm">
                                        <p className="font-medium text-gray-900">Hola, {user.displayName?.split(' ')[0] || 'Usuario'}</p>
                                        <p className="text-xs text-gray-500">¿En qué podemos ayudarte hoy?</p>
                                    </div>
                                </div>
                            )}

                            {!user && (
                                <div>
                                    <label className="block text-xs font-medium text-gray-500 mb-1 ml-1">Nombre</label>
                                    <div className="relative">
                                        <User className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
                                        <input
                                            type="text"
                                            required
                                            placeholder="Tu nombre completo"
                                            value={formData.nombre}
                                            onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                                            className="w-full pl-9 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all text-sm text-gray-900 placeholder:text-gray-500"
                                        />
                                    </div>
                                </div>
                            )}

                            <div>
                                <label className="block text-xs font-medium text-gray-500 mb-1 ml-1">WhatsApp (Solo números)</label>
                                <div className="relative">
                                    <Phone className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
                                    <input
                                        type="tel"
                                        required
                                        maxLength={15}
                                        placeholder="Ej: 112345678"
                                        value={formData.telefono}
                                        onChange={(e) => {
                                            const val = e.target.value.replace(/\D/g, '').slice(0, 15);
                                            setFormData({ ...formData, telefono: val });
                                        }}
                                        className="w-full pl-9 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all text-sm text-gray-900 placeholder:text-gray-500"
                                    />
                                </div>
                            </div>

                            <div>
                                <div className="flex justify-between items-center mb-1 ml-1">
                                    <label className="block text-xs font-medium text-gray-500">Mensaje</label>
                                    <span className="text-[10px] text-gray-400">
                                        {formData.mensaje.length}/100
                                    </span>
                                </div>
                                <textarea
                                    required
                                    maxLength={100}
                                    placeholder="¿Cómo podemos ayudarte? (Máx 100 caracteres)"
                                    rows={3}
                                    value={formData.mensaje}
                                    onChange={(e) => setFormData({ ...formData, mensaje: e.target.value })}
                                    className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all text-sm resize-none text-gray-900 placeholder:text-gray-500"
                                />
                            </div>

                            <button
                                type="submit"
                                disabled={isSubmitting}
                                className="w-full py-3 bg-gray-900 text-white rounded-xl font-medium hover:bg-black transition-colors flex items-center justify-center gap-2 shadow-lg shadow-gray-200"
                            >
                                {isSubmitting ? (
                                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                ) : (
                                    <>
                                        Enviar Consulta
                                        <Send className="w-4 h-4" />
                                    </>
                                )}
                            </button>
                        </form>
                    )}
                </div>

                {/* Footer */}
                <div className="bg-gray-50 py-2 text-center border-t border-gray-100">
                    <p className="text-[10px] text-gray-400">Powered by Zeta Prop AI</p>
                </div>
            </div>
        </>
    );
}
