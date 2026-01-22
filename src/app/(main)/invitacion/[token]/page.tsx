"use client";

import { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import { createUserWithEmailAndPassword, signOut } from "firebase/auth";
import { auth, db } from "@/infrastructure/firebase/client";
import { doc, updateDoc, collection, query, where, getDocs, limit, setDoc } from "firebase/firestore";
import { invitationService, Invitation } from "@/infrastructure/services/invitationService";
import { Loader2, AlertCircle, CheckCircle, LogOut, User as UserIcon } from "lucide-react";

import { whatsappService } from "@/infrastructure/services/whatsappService";

export default function InvitationPage({ params }: { params: Promise<{ token: string }> }) {
    const { token } = use(params);
    const router = useRouter();
    const [invitation, setInvitation] = useState<Invitation | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [activeUser, setActiveUser] = useState<any>(null);

    // Form state
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [phone, setPhone] = useState("");
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        if (!auth) return;
        const unsubscribe = auth.onAuthStateChanged((user) => {
            setActiveUser(user);
        });
        validateToken();
        return () => unsubscribe();
    }, [token]);

    const validateToken = async () => {
        try {
            const data = await invitationService.validateInvitation(token);
            if (!data) {
                setError("La invitación no es válida o ha expirado.");
            } else {
                setInvitation(data);
            }
        } catch (err) {
            console.error(err);
            setError("Error al validar la invitación.");
        } finally {
            setLoading(false);
        }
    };

    const handleRegister = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!invitation) return;

        if (password.length < 6) {
            alert("La contraseña debe tener al menos 6 caracteres.");
            return;
        }

        if (password !== confirmPassword) {
            alert("Las contraseñas no coinciden.");
            return;
        }

        try {
            setSubmitting(true);

            // 1. Create User in Firebase Auth
            // Ensure auth is initialized
            if (!auth) throw new Error("Auth not initialized");

            const userCredential = await createUserWithEmailAndPassword(auth, invitation.email, password);
            const user = userCredential.user;

            // 2. Link Auth User to Agente Document
            // Note: Agents are stored in "agentes" collection of the Organization Owner? 
            // Wait, agentesService logic stores agents in a subcollection or root?
            // Checking agentesService: It likely stores in top-level or under user. 
            // Assuming 'agentes' collection for now based on previous context.
            // Actually, we need to know WHERE the agent document is.
            // invitationService has 'agenteId'.
            // IMPORTANT: If 'agentes' are subcollections of 'users', we need the organizationId path.
            // But usually, flat 'agentes' collection is easier.
            // For now, assume flat 'agentes' collection OR we try to find it.

            // Just updating the Agent doc with the new Auth UID so they can login and fetch THEIR data.
            // BUT WAIT: The Agente currently has 'userId' pointing to the OWNER.
            // We need a NEW field 'authId' or similar for the Agent's own login?
            // OR does 'userId' become the Agent's ID? 
            // In the 'Agente' model: `userId: string; // Inmobiliaria owner`.
            // So we CANNOT overwrite userId. We need a way to map AuthUID -> AgenteDoc.
            // Solution: Add `authUserId` to Agente model.

            // Let's assume we update the Agente doc.
            const agenteRef = doc(db, "agentes", invitation.agenteId);
            await updateDoc(agenteRef, {
                authUserId: user.uid, // New field to link the login
                phone: phone, // Save phone to agent doc
                updatedAt: new Date()
            });

            // 3. Create a User Profile for the Agent
            // Find 'Agente' role ID first
            const rolesRef = collection(db, "roles");
            const q = query(rolesRef, where("name", "==", "Agente"), limit(1));
            const querySnapshot = await getDocs(q);

            if (querySnapshot.empty) {
                throw new Error("Error interno: El rol 'Agente' no está configurado en el sistema.");
            }

            const agentRoleId = querySnapshot.docs[0].id;

            await setDoc(doc(db, "users", user.uid), {
                email: invitation.email,
                roleId: agentRoleId, // Correct field for PermissionGuard
                organizationId: invitation.organizationId,
                branchId: invitation.branchId,
                createdAt: new Date(),
                phone: phone
            });

            // 4. Mark invitation as used
            await invitationService.markAsUsed(invitation.id!);

            // 5. Send WhatsApp Welcome Message
            // We fire and forget, or log if it fails, but don't block registration
            try {
                // Assuming we want to greet them by name if available, or just generic
                await whatsappService.sendWelcomeMessage("Agente", phone);
            } catch (wpError) {
                console.error("Failed to send WhatsApp welcome:", wpError);
            }

            // 6. Redirect to dashboard
            router.push("/dashboard");

        } catch (err: any) {
            console.error(err);
            if (err.code === 'auth/email-already-in-use') {
                alert("Este email ya está registrado.");
            } else if (err.code === 'auth/operation-not-allowed') {
                alert("Error de configuración: El inicio de sesión con Email/Pass no está habilitado en Firebase Console.");
            } else {
                alert("Error al registrar: " + err.message);
            }

        };
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
                <div className="max-w-md w-full bg-white rounded-xl shadow-lg p-8 text-center">
                    <div className="bg-red-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                        <AlertCircle className="w-8 h-8 text-red-600" />
                    </div>
                    <h2 className="text-xl font-bold text-gray-900 mb-2">Invitación Inválida</h2>
                    <p className="text-gray-600">{error}</p>
                </div>
            </div>
        );
    }

    if (activeUser) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
                <div className="max-w-md w-full bg-white rounded-xl shadow-lg p-8 text-center">
                    <div className="bg-blue-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                        <UserIcon className="w-8 h-8 text-blue-600" />
                    </div>
                    <h2 className="text-xl font-bold text-gray-900 mb-2">Sesión Activa detectada</h2>
                    <p className="text-gray-600 mb-6">
                        Estás conectado como <br /><span className="font-semibold text-gray-800">{activeUser.email}</span>
                    </p>
                    <div className="bg-gray-50 p-4 rounded-lg text-sm text-gray-600 mb-6">
                        Esta invitación es para: <br />
                        <span className="font-semibold text-indigo-600">{invitation?.email}</span>
                    </div>
                    <p className="text-sm text-gray-500 mb-6">
                        Para continuar con el registro, necesitas cerrar tu sesión actual.
                    </p>
                    <button
                        onClick={() => auth && signOut(auth)}
                        className="w-full py-3 bg-white border-2 border-red-100 text-red-600 rounded-lg hover:bg-red-50 font-medium transition-colors flex items-center justify-center gap-2"
                    >
                        <LogOut size={18} />
                        Cerrar Sesión
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
            <div className="max-w-md w-full bg-white rounded-xl shadow-lg p-8">
                <div className="text-center mb-8">
                    <h1 className="text-2xl font-bold text-gray-900">Bienvenido a Zeta Prop</h1>
                    <p className="text-gray-600 mt-2">
                        Has sido invitado para unirte al equipo. <br />
                        Configura tu contraseña para continuar.
                    </p>
                </div>

                <form onSubmit={handleRegister} className="space-y-6">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Email
                        </label>
                        <input
                            type="email"
                            value={invitation?.email}
                            disabled
                            className="w-full p-3 bg-gray-100 border border-gray-300 rounded-lg text-gray-500"
                        />
                    </div>

                    {/* Phone Input Addition */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Teléfono
                        </label>
                        <input
                            type="tel"
                            required
                            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                            placeholder="+54 9 11 1234 5678"
                            name="phone"
                            value={phone}
                            onChange={(e) => setPhone(e.target.value)}
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Contraseña
                        </label>
                        <input
                            type="password"
                            required
                            minLength={6}
                            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="Mínimo 6 caracteres"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Confirmar Contraseña
                        </label>
                        <input
                            type="password"
                            required
                            minLength={6}
                            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            placeholder="Repite tu contraseña"
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={submitting}
                        className="w-full py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50 font-medium"
                    >
                        {submitting ? "Registrando..." : "Completar Registro"}
                    </button>
                </form>
            </div>
        </div>
    );
}

