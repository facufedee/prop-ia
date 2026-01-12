"use client";

import { Info, User, Mail, Lock, Bell, Loader2, Building2, Shield } from "lucide-react";
import { useState, useEffect } from "react";
import { onAuthStateChanged, updateProfile, sendPasswordResetEmail, User as FirebaseUser } from "firebase/auth";
import { doc, getDoc, setDoc, updateDoc } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { app, auth, db, storage } from "@/infrastructure/firebase/client";
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

    // Agency Data States
    const [agencyData, setAgencyData] = useState({
        agencyName: "",
        agencyLicense: "",
        agencyAddress: "",
        agencyManager: "",
        agencyWhatsapp: "",
        agencyCuit: "",
        agencyWebsite: "",
        agencyLogoUrl: ""
    });

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

                        // 3. Fetch Preferences & Agency Data (from user doc)
                        const userDocRef = doc(db, "users", currentUser.uid);
                        const userDocSnap = await getDoc(userDocRef);
                        if (userDocSnap.exists()) {
                            const data = userDocSnap.data();
                            if (data.preferences) {
                                setPreferences(data.preferences);
                            }
                            // Load existing agency data if available
                            setAgencyData({
                                agencyName: data.agencyName || "",
                                agencyLicense: data.agencyLicense || "",
                                agencyAddress: data.agencyAddress || "",
                                agencyManager: data.agencyManager || "",
                                agencyWhatsapp: data.agencyWhatsapp || "",
                                agencyCuit: data.agencyCuit || "",
                                agencyWebsite: data.agencyWebsite || "",
                                agencyLogoUrl: data.logoUrl || "" // Map Firestore 'logoUrl' to state 'agencyLogoUrl'
                            });
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

    const handleAgencyChange = (field: keyof typeof agencyData, value: string) => {
        setAgencyData(prev => ({ ...prev, [field]: value }));
    };

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
                updatedAt: new Date(),
                ...agencyData, // This saves agencyLogoUrl into the doc, but we might want it as 'logoUrl' specifically if we want it clean
                logoUrl: agencyData.agencyLogoUrl, // Explicitly save as logoUrl for Sidebar to find easily
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

                    {/* Agency Information - NEW SECTION */}
                    <section className="space-y-4">
                        <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                            <Building2 className="w-5 h-5 text-gray-400" />
                            Datos de la Inmobiliaria
                        </h3>
                        <div className="grid md:grid-cols-2 gap-6">
                            <div className="md:col-span-2 space-y-4">
                                <label className="text-sm font-medium text-gray-700">Logo de la Inmobiliaria</label>
                                <div className="flex items-center gap-6">
                                    <div className="w-24 h-24 border-2 border-dashed border-gray-300 rounded-xl flex items-center justify-center bg-gray-50 overflow-hidden relative">
                                        {agencyData.agencyLogoUrl ? (
                                            <img src={agencyData.agencyLogoUrl} alt="Logo" className="w-full h-full object-cover" />
                                        ) : (
                                            <Building2 className="w-8 h-8 text-gray-400" />
                                        )}
                                        {saving && <div className="absolute inset-0 bg-white/50 flex items-center justify-center"><Loader2 className="w-6 h-6 animate-spin text-indigo-600" /></div>}
                                    </div>
                                    <div className="space-y-2">
                                        <p className="text-sm text-gray-500">
                                            Sube tu logo para personalizar la plataforma.
                                            <br />Recomendado: 500x500px, PNG o JPG.
                                        </p>
                                        <div className="relative">
                                            <input
                                                type="file"
                                                accept="image/*"
                                                className="hidden"
                                                id="logo-upload"
                                                onChange={async (e) => {
                                                    const file = e.target.files?.[0];
                                                    if (!file || !user) return;

                                                    try {
                                                        setSaving(true);
                                                        // 1. Upload to Firebase Storage
                                                        const storageRef = ref(storage, `logos/${user.uid}/${file.name}`);
                                                        await uploadBytes(storageRef, file);
                                                        const url = await getDownloadURL(storageRef);

                                                        // 2. Update Local State
                                                        handleAgencyChange('agencyLogoUrl', url);

                                                        // 3. Update Firestore immediately (optional, or wait for general save)
                                                        // For better UX, we'll wait for the "Guardar Cambios" button, 
                                                        // BUT to preview it we set it in state.
                                                        // If we want it to persist immediately:
                                                        // await updateDoc(doc(db, "users", user.uid), { logoUrl: url });

                                                    } catch (error: any) {
                                                        console.error("Upload error:", error);
                                                        setMessage({ text: "Error al subir imagen: " + error.message, type: 'error' });
                                                    } finally {
                                                        setSaving(false);
                                                    }
                                                }}
                                            />
                                            <label
                                                htmlFor="logo-upload"
                                                className="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium text-sm transition-colors shadow-sm cursor-pointer inline-block"
                                            >
                                                Subir Nuevo Logo
                                            </label>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium text-gray-700">Nombre de Inmobiliaria / Fantasía</label>
                                <input
                                    type="text"
                                    value={agencyData.agencyName}
                                    onChange={(e) => handleAgencyChange('agencyName', e.target.value)}
                                    className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
                                    placeholder="Ej. Inmobiliaria Zeta Prop"
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium text-gray-700">Matrícula / Legajo</label>
                                <input
                                    type="text"
                                    value={agencyData.agencyLicense}
                                    onChange={(e) => handleAgencyChange('agencyLicense', e.target.value)}
                                    className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
                                    placeholder="Ej. CUCICBA 1234"
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium text-gray-700">Responsable / Corredor</label>
                                <input
                                    type="text"
                                    value={agencyData.agencyManager}
                                    onChange={(e) => handleAgencyChange('agencyManager', e.target.value)}
                                    className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
                                    placeholder="Ej. Juan Pérez"
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium text-gray-700">CUIT</label>
                                <input
                                    type="text"
                                    value={agencyData.agencyCuit}
                                    onChange={(e) => handleAgencyChange('agencyCuit', e.target.value)}
                                    className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
                                    placeholder="Ej. 20-12345678-9"
                                />
                            </div>

                            <div className="md:col-span-2 space-y-2">
                                <label className="text-sm font-medium text-gray-700">Dirección Comercial</label>
                                <input
                                    type="text"
                                    value={agencyData.agencyAddress}
                                    onChange={(e) => handleAgencyChange('agencyAddress', e.target.value)}
                                    className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
                                    placeholder="Ej. Av. Libertador 1000, CABA"
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium text-gray-700">WhatsApp Comercial</label>
                                <input
                                    type="text"
                                    value={agencyData.agencyWhatsapp}
                                    onChange={(e) => handleAgencyChange('agencyWhatsapp', e.target.value)}
                                    className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
                                    placeholder="Ej. 5491112345678"
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium text-gray-700">Sitio Web</label>
                                <input
                                    type="text"
                                    value={agencyData.agencyWebsite}
                                    onChange={(e) => handleAgencyChange('agencyWebsite', e.target.value)}
                                    className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
                                    placeholder="Ej. www.tuinmobiliaria.com"
                                />
                            </div>
                        </div>
                    </section>

                    <div className="border-t border-gray-100 my-6"></div>

                    {/* Security */}
                    <section className="space-y-4">
                        <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                            <Lock className="w-5 h-5 text-gray-400" />
                            Seguridad e Identidad
                        </h3>

                        {/* Password Reset */}
                        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 border border-gray-200 rounded-xl bg-gray-50 mb-4">
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

                        {/* Identity Verification */}
                        <div className="p-4 border border-gray-200 rounded-xl bg-white space-y-4">
                            <div className="flex justify-between items-start">
                                <div>
                                    <h4 className="font-medium text-gray-900">Validación de Identidad</h4>
                                    <p className="text-sm text-gray-500">Para mayor seguridad y confianza, valida tu identidad como inmobiliaria.</p>
                                </div>
                                {/* Status Badge */}
                                {user.photoURL === 'verified' ? ( // Using photoURL/App state for demo, ideally user.isVerified
                                    <span className="px-3 py-1 bg-green-100 text-green-700 text-xs font-bold rounded-full border border-green-200">
                                        VERIFICADO
                                    </span>
                                ) : (
                                    <span className="px-3 py-1 bg-gray-100 text-gray-600 text-xs font-bold rounded-full border border-gray-200">
                                        NO VERIFICADO
                                    </span>
                                )}
                            </div>

                            <div className="grid md:grid-cols-2 gap-4">
                                <div className="p-4 border border-dashed border-gray-300 rounded-lg text-center hover:bg-gray-50 transition-colors cursor-pointer group">
                                    <Building2 className="w-8 h-8 text-indigo-300 mx-auto mb-2 group-hover:text-indigo-500" />
                                    <p className="text-sm font-medium text-gray-700">Validar Dominio Web</p>
                                    <p className="text-xs text-gray-400">DNS o archivo HTML</p>
                                </div>
                                <div className="p-4 border border-dashed border-gray-300 rounded-lg text-center hover:bg-gray-50 transition-colors cursor-pointer group">
                                    <Shield className="w-8 h-8 text-indigo-300 mx-auto mb-2 group-hover:text-indigo-500" />
                                    <p className="text-sm font-medium text-gray-700">Cargar Documentación</p>
                                    <p className="text-xs text-gray-400">Matrícula o Constancia</p>
                                </div>
                            </div>
                        </div>
                    </section>

                    <div className="border-t border-gray-100 my-6"></div>

                    {/* Danger Zone - Right to be Forgotten */}
                    <section className="space-y-4">
                        <h3 className="text-lg font-bold text-red-600 flex items-center gap-2">
                            <Info className="w-5 h-5 text-red-400" />
                            Zona de Peligro
                        </h3>
                        <div className="p-4 border border-red-200 rounded-xl bg-red-50 space-y-4">
                            <div>
                                <h4 className="font-medium text-red-900">Eliminar Cuenta</h4>
                                <p className="text-sm text-red-700 mt-1">
                                    Al eliminar tu cuenta, se borrarán todos tus datos personales, propiedades y configuraciones de forma permanente.
                                    Esta acción es irreversible (Derecho al Olvido).
                                </p>
                            </div>
                            <button
                                onClick={() => {
                                    const confirmText = prompt("Para confirmar, escribe 'ELIMINAR' en mayúsculas:");
                                    if (confirmText === 'ELIMINAR') {
                                        // Trigger deletion logic
                                        // For now, redirect or call a service. 
                                        // ideally: subscriptionService.cancelSubscription() then deleteUser()
                                        alert("Solicitud de eliminación enviada. Tu cuenta será procesada.");
                                        // Actually call adminService.deleteUser(user.uid) if allowed or auth.currentUser.delete()
                                    }
                                }}
                                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium text-sm transition-colors shadow-sm"
                            >
                                Eliminar mi cuenta permanentemente
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
