"use client";

import { Info, User, Mail, Lock, Bell, Loader2 } from "lucide-react";
import { useState, useEffect } from "react";
import { app, auth, db } from "@/infrastructure/firebase/client";
import { onAuthStateChanged, updateProfile, sendPasswordResetEmail, User as FirebaseUser } from "firebase/auth";
import { doc, getDoc, setDoc, updateDoc } from "firebase/firestore";
import { roleService, Role } from "@/infrastructure/services/roleService";
import { subscriptionService } from "@/infrastructure/services/subscriptionService";
import { Subscription, Plan } from "@/domain/models/Subscription";

export default function CuentaPage() {
    const [user, setUser] = useState<FirebaseUser | null>(null);
    const [role, setRole] = useState<Role | null>(null);
    const [subscription, setSubscription] = useState<Subscription | null>(null);
    const [plan, setPlan] = useState<Plan | null>(null);

    // Form States
    const [displayName, setDisplayName] = useState("");
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState<{ text: string, type: 'success' | 'error' } | null>(null);

    // Preferences State
    const [preferences, setPreferences] = useState({
        emailNotifications: true,
        weeklyReport: true
    });

    useEffect(() => {
        if (!auth) return;
        const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
            if (currentUser) {
                setUser(currentUser);
                setDisplayName(currentUser.displayName || "");

                if (db) {
                    try {
                        // 1. Fetch Role
                        const userRole = await roleService.getUserRole(currentUser.uid);
                        setRole(userRole);

                        // 2. Fetch Subscription & Plan
                        const sub = await subscriptionService.getUserSubscription(currentUser.uid);
                        setSubscription(sub);
                        if (sub?.planId) {
                            const p = await subscriptionService.getPlanById(sub.planId);
                            setPlan(p);
                        }

                        // 3. Fetch Preferences (from user doc)
                        const userDocRef = doc(db, "users", currentUser.uid);
                        const userDocSnap = await getDoc(userDocRef);
                        if (userDocSnap.exists() && userDocSnap.data().preferences) {
                            setPreferences(userDocSnap.data().preferences);
                        }

                    } catch (error) {
                        console.error("Error fetching user data:", error);
                    }
                }
            }
            setLoading(false);
        });
        return () => unsubscribe();
    }, []);

    const handleSaveProfile = async () => {
        if (!user || !db) return;
        setSaving(true);
        setMessage(null);

        try {
            // Update Auth Profile
            await updateProfile(user, { displayName });

            // Update Firestore User Doc
            const userRef = doc(db, "users", user.uid);
            // Use setDoc with merge to ensure doc exists
            await setDoc(userRef, {
                displayName,
                updatedAt: new Date()
            }, { merge: true });

            setMessage({ text: "Perfil actualizado correctamente.", type: 'success' });
        } catch (error: any) {
            console.error("Error updating profile:", error);
            setMessage({ text: "Error al actualizar perfil: " + error.message, type: 'error' });
        } finally {
            setSaving(false);
        }
    };

    const handlePasswordReset = async () => {
        if (!user?.email) return;
        try {
            await sendPasswordResetEmail(auth!, user.email);
            setMessage({ text: `Se envió un email de restablecimiento a ${user.email}`, type: 'success' });
        } catch (error: any) {
            setMessage({ text: "Error al enviar email: " + error.message, type: 'error' });
        }
    };

    const handlePreferenceChange = async (key: keyof typeof preferences) => {
        if (!user || !db) return;

        const newPreferences = { ...preferences, [key]: !preferences[key] };
        setPreferences(newPreferences); // Optimistic update

        try {
            const userRef = doc(db, "users", user.uid);
            await setDoc(userRef, { preferences: newPreferences }, { merge: true });
        } catch (error) {
            console.error("Error saving preferences:", error);
            setPreferences(preferences); // Revert on error
            setMessage({ text: "Error al guardar preferencias", type: 'error' });
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
            </div>
        );
    }

    if (!user) {
        return <div className="p-8">No se encontró usuario activo.</div>;
    }

    return (
        <div className="space-y-6 max-w-4xl mx-auto p-4 md:p-8">
            <h1 className="text-2xl font-bold text-gray-900">Mi Cuenta</h1>

            {/* Status Message */}
            {message && (
                <div className={`p-4 rounded-xl flex items-center gap-3 ${message.type === 'success' ? 'bg-green-50 text-green-800 border border-green-200' : 'bg-red-50 text-red-800 border border-red-200'
                    }`}>
                    <Info className="w-5 h-5 flex-shrink-0" />
                    <p className="font-medium">{message.text}</p>
                </div>
            )}

            <div className="bg-white border rounded-2xl overflow-hidden shadow-sm">

                {/* Header Profile */}
                <div className="p-6 border-b bg-gray-50 flex flex-col md:flex-row items-center gap-6">
                    <div className="w-24 h-24 bg-indigo-600 text-white rounded-full flex items-center justify-center text-3xl font-bold border-4 border-white shadow-md">
                        {displayName ? displayName.charAt(0).toUpperCase() : user.email?.charAt(0).toUpperCase()}
                    </div>
                    <div className="text-center md:text-left space-y-1">
                        <h2 className="text-2xl font-bold text-gray-900">{displayName || user.email}</h2>
                        <div className="flex flex-wrap gap-2 justify-center md:justify-start">
                            <span className="px-3 py-1 rounded-full bg-blue-100 text-blue-700 text-sm font-medium">
                                {role?.name || "Usuario"}
                            </span>
                            {plan && (
                                <span className="px-3 py-1 rounded-full bg-indigo-100 text-indigo-700 text-sm font-medium">
                                    Plan {plan.name}
                                </span>
                            )}
                        </div>
                        <p className="text-gray-500 text-sm">{user.email}</p>
                    </div>
                </div>

                <div className="p-6 space-y-8">
                    {/* Personal Information */}
                    <section className="space-y-4">
                        <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                            <User className="w-5 h-5 text-gray-400" />
                            Información Personal
                        </h3>
                        <div className="grid md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-gray-700">Nombre Completo</label>
                                <div className="relative">
                                    <input
                                        type="text"
                                        value={displayName}
                                        onChange={(e) => setDisplayName(e.target.value)}
                                        className="w-full pl-4 p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
                                        placeholder="Tu nombre"
                                    />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-gray-700">Email</label>
                                <div className="relative">
                                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                    <input
                                        type="email"
                                        value={user.email || ""}
                                        disabled
                                        className="w-full pl-10 p-3 border border-gray-200 rounded-xl bg-gray-50 text-gray-500 cursor-not-allowed"
                                    />
                                </div>
                                <p className="text-xs text-gray-400">El email no se puede cambiar.</p>
                            </div>
                        </div>
                    </section>

                    <div className="border-t border-gray-100 my-6"></div>

                    {/* Security */}
                    <section className="space-y-4">
                        <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                            <Lock className="w-5 h-5 text-gray-400" />
                            Seguridad
                        </h3>
                        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 border border-gray-200 rounded-xl bg-gray-50">
                            <div>
                                <p className="font-medium text-gray-900">Contraseña</p>
                                <p className="text-sm text-gray-500">Te enviaremos un email para restablecerla.</p>
                            </div>
                            <button
                                onClick={handlePasswordReset}
                                className="mt-3 sm:mt-0 px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium text-sm transition-colors shadow-sm"
                            >
                                Cambiar Contraseña
                            </button>
                        </div>
                    </section>

                    <div className="border-t border-gray-100 my-6"></div>

                    {/* Notifications */}
                    <section className="space-y-4">
                        <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                            <Bell className="w-5 h-5 text-gray-400" />
                            Notificaciones
                        </h3>
                        <div className="space-y-3">
                            <label className="flex items-start gap-4 p-4 border border-gray-200 rounded-xl cursor-pointer hover:bg-gray-50 transition-colors group">
                                <div className="relative flex items-center">
                                    <input
                                        type="checkbox"
                                        checked={preferences.emailNotifications}
                                        onChange={() => handlePreferenceChange('emailNotifications')}
                                        className="w-5 h-5 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500 transition-all"
                                    />
                                </div>
                                <div className="flex-1">
                                    <p className="font-medium text-gray-900 group-hover:text-indigo-700 transition-colors">Nuevos Leads</p>
                                    <p className="text-sm text-gray-500">Recibir un email inmediatamente cuando ingresa una nueva consulta.</p>
                                </div>
                            </label>

                            <label className="flex items-start gap-4 p-4 border border-gray-200 rounded-xl cursor-pointer hover:bg-gray-50 transition-colors group">
                                <div className="relative flex items-center">
                                    <input
                                        type="checkbox"
                                        checked={preferences.weeklyReport}
                                        onChange={() => handlePreferenceChange('weeklyReport')}
                                        className="w-5 h-5 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500 transition-all"
                                    />
                                </div>
                                <div className="flex-1">
                                    <p className="font-medium text-gray-900 group-hover:text-indigo-700 transition-colors">Resumen Semanal</p>
                                    <p className="text-sm text-gray-500">Recibir estadísticas de rendimiento y métricas clave cada lunes.</p>
                                </div>
                            </label>
                        </div>
                    </section>
                </div>

                {/* Footer Actions */}
                <div className="p-6 bg-gray-50 border-t flex justify-end gap-3 sticky bottom-0">
                    <button
                        onClick={handleSaveProfile}
                        disabled={saving}
                        className="px-6 py-2.5 bg-indigo-600 text-white rounded-xl font-medium hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 shadow-sm shadow-indigo-200"
                    >
                        {saving && <Loader2 className="w-4 h-4 animate-spin" />}
                        {saving ? "Guardando..." : "Guardar Cambios"}
                    </button>
                </div>
            </div>
        </div>
    );
}
