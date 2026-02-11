"use client";

import { useState, useEffect } from "react";
import { Save, Plus, Trash2, Bell, Check, AlertCircle } from "lucide-react";
import { db } from "@/infrastructure/firebase/client";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { toast } from "sonner";

interface NotificationSettings {
    enabled: boolean;
    recipients: string[];
    events: {
        newUser: boolean;
        newPayment: boolean;
        newLead: boolean;
        subscriptionCancelled: boolean;
        newTicket: boolean;
    };
}

const DEFAULT_SETTINGS: NotificationSettings = {
    enabled: false,
    recipients: [],
    events: {
        newUser: false,
        newPayment: false,
        newLead: false,
        subscriptionCancelled: false,
        newTicket: false
    }
};

const SETTINGS_DOC_REF = "email_notifications"; // ID in 'settings' collection

export default function NotificationsTab() {
    const [settings, setSettings] = useState<NotificationSettings>(DEFAULT_SETTINGS);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [newEmail, setNewEmail] = useState("");

    useEffect(() => {
        loadSettings();
    }, []);

    const loadSettings = async () => {
        if (!db) return;
        try {
            const ref = doc(db, "settings", SETTINGS_DOC_REF);
            const snap = await getDoc(ref);
            if (snap.exists()) {
                setSettings({ ...DEFAULT_SETTINGS, ...snap.data() } as NotificationSettings);
            }
        } catch (error) {
            console.error("Error loading settings:", error);
            toast.error("Error al cargar configuración");
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        if (!db) return;
        setSaving(true);
        try {
            const ref = doc(db, "settings", SETTINGS_DOC_REF);
            await setDoc(ref, settings, { merge: true });
            toast.success("Configuración guardada");
        } catch (error) {
            console.error("Error saving settings:", error);
            toast.error("Error al guardar configuración");
        } finally {
            setSaving(false);
        }
    };

    const addEmail = () => {
        if (!newEmail || !newEmail.includes('@')) return;
        if (settings.recipients.includes(newEmail)) {
            toast.error("El email ya está en la lista");
            return;
        }
        setSettings(prev => ({
            ...prev,
            recipients: [...prev.recipients, newEmail]
        }));
        setNewEmail("");
    };

    const removeEmail = (email: string) => {
        setSettings(prev => ({
            ...prev,
            recipients: prev.recipients.filter(e => e !== email)
        }));
    };

    const toggleEvent = (event: keyof NotificationSettings['events']) => {
        setSettings(prev => ({
            ...prev,
            events: {
                ...prev.events,
                [event]: !prev.events[event]
            }
        }));
    };

    if (loading) return <div className="p-8 text-center text-gray-500">Cargando configuración...</div>;

    return (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                <div>
                    <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                        <Bell className="w-5 h-5 text-indigo-600" />
                        Notificaciones por Email
                    </h2>
                    <p className="text-sm text-gray-500">Configura las alertas que deseas recibir de la plataforma.</p>
                </div>
                <button
                    onClick={handleSave}
                    disabled={saving}
                    className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition-colors font-medium shadow-sm"
                >
                    {saving ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Save className="w-4 h-4" />}
                    {saving ? "Guardando..." : "Guardar Cambios"}
                </button>
            </div>

            <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* General Toggle & Events */}
                <div className="space-y-6">
                    <div className="bg-indigo-50 rounded-xl p-4 border border-indigo-100">
                        <label className="flex items-center justify-between cursor-pointer">
                            <span className="font-medium text-indigo-900">Activar Notificaciones</span>
                            <div className="relative inline-flex items-center cursor-pointer">
                                <input
                                    type="checkbox"
                                    className="sr-only peer"
                                    checked={settings.enabled}
                                    onChange={(e) => setSettings(prev => ({ ...prev, enabled: e.target.checked }))}
                                />
                                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                            </div>
                        </label>
                        <p className="text-xs text-indigo-600 mt-2">
                            Si desactivas esta opción, no se enviarán correos aunque los eventos estén habilitados.
                        </p>
                    </div>

                    <div>
                        <h3 className="text-sm font-semibold text-gray-900 mb-4 uppercase tracking-wider">Eventos a Notificar</h3>
                        <div className="space-y-3">
                            <label className={`flex items-center p-3 border rounded-lg cursor-pointer hover:bg-gray-50 transition-colors ${settings.events.newUser ? 'border-indigo-200 bg-indigo-50/50' : 'border-gray-200'}`}>
                                <input
                                    type="checkbox"
                                    className="w-4 h-4 text-indigo-600 rounded border-gray-300 focus:ring-indigo-500"
                                    checked={settings.events.newUser}
                                    onChange={() => toggleEvent('newUser')}
                                />
                                <span className="ml-3 text-sm font-medium text-gray-700">Nuevo Usuario Registrado</span>
                            </label>

                            <label className={`flex items-center p-3 border rounded-lg cursor-pointer hover:bg-gray-50 transition-colors ${settings.events.newPayment ? 'border-indigo-200 bg-indigo-50/50' : 'border-gray-200'}`}>
                                <input
                                    type="checkbox"
                                    className="w-4 h-4 text-indigo-600 rounded border-gray-300 focus:ring-indigo-500"
                                    checked={settings.events.newPayment}
                                    onChange={() => toggleEvent('newPayment')}
                                />
                                <span className="ml-3 text-sm font-medium text-gray-700">Nuevo Pago Recibido</span>
                            </label>

                            <label className={`flex items-center p-3 border rounded-lg cursor-pointer hover:bg-gray-50 transition-colors ${settings.events.newLead ? 'border-indigo-200 bg-indigo-50/50' : 'border-gray-200'}`}>
                                <input
                                    type="checkbox"
                                    className="w-4 h-4 text-indigo-600 rounded border-gray-300 focus:ring-indigo-500"
                                    checked={settings.events.newLead}
                                    onChange={() => toggleEvent('newLead')}
                                />
                                <span className="ml-3 text-sm font-medium text-gray-700">Nueva Consulta (Lead)</span>
                            </label>

                            <label className={`flex items-center p-3 border rounded-lg cursor-pointer hover:bg-gray-50 transition-colors ${settings.events.newTicket ? 'border-indigo-200 bg-indigo-50/50' : 'border-gray-200'}`}>
                                <input
                                    type="checkbox"
                                    className="w-4 h-4 text-indigo-600 rounded border-gray-300 focus:ring-indigo-500"
                                    checked={settings.events.newTicket || false}
                                    onChange={() => toggleEvent('newTicket')}
                                />
                                <span className="ml-3 text-sm font-medium text-gray-700">Nuevo Ticket de Soporte</span>
                            </label>

                            <label className={`flex items-center p-3 border rounded-lg cursor-pointer hover:bg-gray-50 transition-colors ${settings.events.subscriptionCancelled ? 'border-red-200 bg-red-50/50' : 'border-gray-200'}`}>
                                <input
                                    type="checkbox"
                                    className="w-4 h-4 text-red-600 rounded border-gray-300 focus:ring-red-500"
                                    checked={settings.events.subscriptionCancelled || false}
                                    onChange={() => toggleEvent('subscriptionCancelled')}
                                />
                                <span className="ml-3 text-sm font-medium text-gray-700">Suscripción Cancelada</span>
                            </label>
                        </div>
                    </div>
                </div>

                {/* Recipients */}
                <div>
                    <h3 className="text-sm font-semibold text-gray-900 mb-4 uppercase tracking-wider">Destinatarios</h3>
                    <div className="bg-gray-50 rounded-xl p-4 border border-gray-200 mb-4">
                        <div className="flex gap-2">
                            <input
                                type="email"
                                placeholder="ejemplo@empresa.com"
                                className="flex-1 rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2 border"
                                value={newEmail}
                                onChange={(e) => setNewEmail(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && addEmail()}
                            />
                            <button
                                type="button"
                                onClick={addEmail}
                                disabled={!newEmail}
                                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors"
                            >
                                <Plus className="w-4 h-4" />
                            </button>
                        </div>
                        {settings.recipients.length > 0 && (
                            <div className="mt-2">
                                <button
                                    type="button"
                                    onClick={async () => {
                                        const baseUrl = process.env.NEXT_PUBLIC_APP_URL || '';
                                        const loadingToast = toast.loading("Enviando correo de prueba...");
                                        try {
                                            const res = await fetch(`${baseUrl}/api/notifications/trigger`, {
                                                method: 'POST',
                                                headers: { 'Content-Type': 'application/json' },
                                                body: JSON.stringify({
                                                    event: 'test',
                                                    data: { recipients: settings.recipients }
                                                })
                                            });
                                            if (res.ok) {
                                                toast.success("Correo de prueba enviado", { id: loadingToast });
                                            } else {
                                                toast.error("Error al enviar prueba", { id: loadingToast });
                                            }
                                        } catch (e) {
                                            toast.error("Error de conexión", { id: loadingToast });
                                        }
                                    }}
                                    className="text-xs text-indigo-600 hover:text-indigo-800 underline mt-1"
                                >
                                    Enviar correo de prueba a estos destinatarios
                                </button>
                            </div>
                        )}
                        <p className="mt-1 text-xs text-gray-500">
                            Ingresa los emails que recibirán las alertas.
                        </p>
                    </div>

                    <div className="space-y-2 max-h-[300px] overflow-y-auto">
                        {settings.recipients.length === 0 ? (
                            <div className="text-center py-8 text-gray-500 text-sm border-2 border-dashed border-gray-200 rounded-xl">
                                No hay destinatarios configurados.
                            </div>
                        ) : (
                            settings.recipients.map((email) => (
                                <div key={email} className="flex justify-between items-center p-3 bg-white border border-gray-200 rounded-lg shadow-sm group">
                                    <span className="text-sm text-gray-700 font-medium">{email}</span>
                                    <button
                                        onClick={() => removeEmail(email)}
                                        className="text-gray-400 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"
                                        title="Eliminar"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                            ))
                        )}
                    </div>

                    {/* Sender Warning */}
                    <div className="mt-6 flex items-start gap-3 p-4 bg-amber-50 rounded-xl border border-amber-100 text-amber-800 text-xs">
                        <AlertCircle className="w-5 h-5 shrink-0" />
                        <p>
                            Asegúrate de que la dirección de envío configurada en el sistema (Postmark) esté verificada. De lo contrario, los correos podrían rebotar.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
