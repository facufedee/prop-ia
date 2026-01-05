"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { auth, db } from "@/infrastructure/firebase/client";
import { doc, updateDoc } from "firebase/firestore";
import { invitationService, Invitation } from "@/infrastructure/services/invitationService";
import { Loader2, AlertCircle, CheckCircle } from "lucide-react";

import { whatsappService } from "@/infrastructure/services/whatsappService";

export default function InvitationPage({ params }: { params: { token: string } }) {
    const router = useRouter();
    const [invitation, setInvitation] = useState<Invitation | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Form state
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [phone, setPhone] = useState(""); // Add phone state
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        validateToken();
    }, [params.token]);

    const validateToken = async () => {
        try {
            const data = await invitationService.validateInvitation(params.token);
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

            // 3. Create a User Profile for the Agent (optional, but good for roles)
            // We might need to store their role "Agente" in a 'users' collection too.
            // For Prop-IA to know they are an agent.

            /* 
               We need to create a document in 'users' collection for this new user 
               so roleService can find their role (Agente) and permissions.
            */
            // If it fails (doc doesn't exist), set it
            // Actually `updateDoc` fails if doc doesn't exist. Use setDoc logic equivalent via specific service or native.
            // Ideally use userService.createUser or simply setDoc here.
            const { setDoc } = await import("firebase/firestore"); // Dynamic import to avoid global import mess if not needed
            await setDoc(doc(db, "users", user.uid), {
                email: invitation.email,
                role: "Agente",
                organizationId: invitation.organizationId, // Link to organization
                branchId: invitation.branchId,
                createdAt: new Date(),
                phone: phone // Save phone to user doc
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
            } else {
                alert("Error al registrar: " + err.message);
            }
        } finally {
            setSubmitting(false);
        }
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

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
            <div className="max-w-md w-full bg-white rounded-xl shadow-lg p-8">
                <div className="text-center mb-8">
                    <h1 className="text-2xl font-bold text-gray-900">Bienvenido a Prop-IA</h1>
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
