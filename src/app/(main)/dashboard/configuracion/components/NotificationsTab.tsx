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

    if (loading) return <div className="p-8 text-center text-[var(--color-muted)]">Cargando configuración...</div>;

    return (
        <div className="bg-[var(--color-paper-2)] rounded-xl shadow-sm border border-[var(--color-rule)] overflow-hidden">
            <div className="p-6 border-b border-[var(--color-rule-2)] flex justify-between items-center bg-[var(--color-paper)]">
                <div>
                    <h2 className="text-lg font-bold text-[var(--color-ink)] flex items-center gap-2">
                        <Bell strokeWidth={1.5} className="w-5 h-5 text-[var(--color-accent)]" />
                        Notificaciones por Email
                    </h2>
                    <p className="text-sm text-[var(--color-muted)]">Configura las alertas que deseas recibir de la plataforma.</p>
                </div>
                <button
                    onClick={handleSave}
                    disabled={saving}
                    className="flex items-center gap-2 px-4 py-2 bg-[var(--color-ink)] text-[var(--color-paper)] rounded-lg hover:bg-[var(--color-ink-2)] disabled:opacity-50 transition-colors font-medium shadow-sm"
                >
                    {saving ? <div className="w-4 h-4 border-2 border-[var(--color-paper-2)]/30 border-t-[var(--color-paper-2)] rounded-full animate-spin" /> : <Save strokeWidth={1.5} className="w-4 h-4" />}
                    {saving ? "Guardando..." : "Guardar Cambios"}
                </button>
            </div>

            <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* General Toggle & Events */}
                <div className="space-y-6">
                    <div className="bg-[var(--color-accent-soft)] rounded-xl p-4 border border-[var(--color-accent)]/30">
                        <label className="flex items-center justify-between cursor-pointer">
                            <span className="font-medium text-[var(--color-accent)]">Activar Notificaciones</span>
                            <div className="relative inline-flex items-center cursor-pointer">
                                <input
                                    type="checkbox"
                                    className="sr-only peer"
                                    checked={settings.enabled}
                                    onChange={(e) => setSettings(prev => ({ ...prev, enabled: e.target.checked }))}
                                />
                                <div className="w-11 h-6 bg-[var(--color-paper-4)] peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-[var(--color-accent)]/30 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-[var(--color-paper-2)] after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-[var(--color-paper-2)] after:border-[var(--color-rule)] after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[var(--color-accent)]"></div>
                            </div>
                        </label>
                        <p className="text-xs text-[var(--color-accent)] mt-2">
                            Si desactivas esta opción, no se enviarán correos aunque los eventos estén habilitados.
                        </p>
                    </div>

                    <div>
                        <h3 className="text-sm font-semibold text-[var(--color-ink)] mb-4 uppercase tracking-wider">Eventos a Notificar</h3>
                        <div className="space-y-3">
                            <label className={`flex items-center p-3 border rounded-lg cursor-pointer hover:bg-[var(--color-paper-3)] transition-colors ${settings.events.newUser ? 'border-[var(--color-accent)]/30 bg-[var(--color-accent-soft)]' : 'border-[var(--color-rule)]'}`}>
                                <input
                                    type="checkbox"
                                    className="w-4 h-4 text-[var(--color-accent)] rounded border-[var(--color-rule)] focus:ring-[var(--color-accent)]/40"
                                    checked={settings.events.newUser}
                                    onChange={() => toggleEvent('newUser')}
                                />
                                <span className="ml-3 text-sm font-medium text-[var(--color-ink-2)]">Nuevo Usuario Registrado</span>
                            </label>

                            <label className={`flex items-center p-3 border rounded-lg cursor-pointer hover:bg-[var(--color-paper-3)] transition-colors ${settings.events.newPayment ? 'border-[var(--color-accent)]/30 bg-[var(--color-accent-soft)]' : 'border-[var(--color-rule)]'}`}>
                                <input
                                    type="checkbox"
                                    className="w-4 h-4 text-[var(--color-accent)] rounded border-[var(--color-rule)] focus:ring-[var(--color-accent)]/40"
                                    checked={settings.events.newPayment}
                                    onChange={() => toggleEvent('newPayment')}
                                />
                                <span className="ml-3 text-sm font-medium text-[var(--color-ink-2)]">Nuevo Pago Recibido</span>
                            </label>

                            <label className={`flex items-center p-3 border rounded-lg cursor-pointer hover:bg-[var(--color-paper-3)] transition-colors ${settings.events.newLead ? 'border-[var(--color-accent)]/30 bg-[var(--color-accent-soft)]' : 'border-[var(--color-rule)]'}`}>
                                <input
                                    type="checkbox"
                                    className="w-4 h-4 text-[var(--color-accent)] rounded border-[var(--color-rule)] focus:ring-[var(--color-accent)]/40"
                                    checked={settings.events.newLead}
                                    onChange={() => toggleEvent('newLead')}
                                />
                                <span className="ml-3 text-sm font-medium text-[var(--color-ink-2)]">Nueva Consulta (Lead)</span>
                            </label>

                            <label className={`flex items-center p-3 border rounded-lg cursor-pointer hover:bg-[var(--color-paper-3)] transition-colors ${settings.events.newTicket ? 'border-[var(--color-accent)]/30 bg-[var(--color-accent-soft)]' : 'border-[var(--color-rule)]'}`}>
                                <input
                                    type="checkbox"
                                    className="w-4 h-4 text-[var(--color-accent)] rounded border-[var(--color-rule)] focus:ring-[var(--color-accent)]/40"
                                    checked={settings.events.newTicket || false}
                                    onChange={() => toggleEvent('newTicket')}
                                />
                                <span className="ml-3 text-sm font-medium text-[var(--color-ink-2)]">Nuevo Ticket de Soporte</span>
                            </label>

                            <label className={`flex items-center p-3 border rounded-lg cursor-pointer hover:bg-[var(--color-paper-3)] transition-colors ${settings.events.subscriptionCancelled ? 'border-[var(--color-danger)]/30 bg-[var(--color-danger-soft)]' : 'border-[var(--color-rule)]'}`}>
                                <input
                                    type="checkbox"
                                    className="w-4 h-4 text-[var(--color-danger)] rounded border-[var(--color-rule)] focus:ring-[var(--color-danger)]"
                                    checked={settings.events.subscriptionCancelled || false}
                                    onChange={() => toggleEvent('subscriptionCancelled')}
                                />
                                <span className="ml-3 text-sm font-medium text-[var(--color-ink-2)]">Suscripción Cancelada</span>
                            </label>
                        </div>
                    </div>
                </div>

                {/* Recipients */}
                <div>
                    <h3 className="text-sm font-semibold text-[var(--color-ink)] mb-4 uppercase tracking-wider">Destinatarios</h3>
                    <div className="bg-[var(--color-paper)] rounded-xl p-4 border border-[var(--color-rule)] mb-4">
                        <div className="flex gap-2">
                            <input
                                type="email"
                                placeholder="ejemplo@empresa.com"
                                className="flex-1 rounded-md border-[var(--color-rule)] shadow-sm focus:border-[var(--color-accent)] focus:ring-[var(--color-accent)]/40 sm:text-sm p-2 border"
                                value={newEmail}
                                onChange={(e) => setNewEmail(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && addEmail()}
                            />
                            <button
                                type="button"
                                onClick={addEmail}
                                disabled={!newEmail}
                                className="px-4 py-2 bg-[var(--color-paper-3)] text-[var(--color-ink-2)] rounded-md hover:bg-[var(--color-paper-4)] transition-colors"
                            >
                                <Plus strokeWidth={1.5} className="w-4 h-4" />
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
                                    className="text-xs text-[var(--color-accent)] hover:text-[var(--color-accent-2)] underline mt-1"
                                >
                                    Enviar correo de prueba a estos destinatarios
                                </button>
                            </div>
                        )}
                        <p className="mt-1 text-xs text-[var(--color-muted)]">
                            Ingresa los emails que recibirán las alertas.
                        </p>
                    </div>

                    <div className="space-y-2 max-h-[300px] overflow-y-auto">
                        {settings.recipients.length === 0 ? (
                            <div className="text-center py-8 text-[var(--color-muted)] text-sm border-2 border-dashed border-[var(--color-rule)] rounded-xl">
                                No hay destinatarios configurados.
                            </div>
                        ) : (
                            settings.recipients.map((email) => (
                                <div key={email} className="flex justify-between items-center p-3 bg-[var(--color-paper-2)] border border-[var(--color-rule)] rounded-lg shadow-sm group">
                                    <span className="text-sm text-[var(--color-ink-2)] font-medium">{email}</span>
                                    <button
                                        onClick={() => removeEmail(email)}
                                        className="text-[var(--color-neutral)] hover:text-[var(--color-danger)] transition-colors opacity-0 group-hover:opacity-100"
                                        title="Eliminar"
                                    >
                                        <Trash2 strokeWidth={1.5} className="w-4 h-4" />
                                    </button>
                                </div>
                            ))
                        )}
                    </div>

                    {/* Sender Warning */}
                    <div className="mt-6 flex items-start gap-3 p-4 bg-[var(--color-warning-soft)] rounded-xl border border-[var(--color-warning)]/30 text-[var(--color-warning)] text-xs">
                        <AlertCircle strokeWidth={1.5} className="w-5 h-5 shrink-0" />
                        <p>
                            Asegúrate de que la dirección de envío configurada en el sistema (Postmark) esté verificada. De lo contrario, los correos podrían rebotar.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
