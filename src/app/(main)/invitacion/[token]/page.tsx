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
            <div className="s-util-loading">
                <Loader2 className="w-8 h-8 animate-spin" aria-label="Cargando" />
            </div>
        );
    }

    if (error) {
        return (
            <main className="s-util s-util--center">
                <section className="s-util-card" aria-labelledby="invitation-title">
                    <div className="s-util-mark s-util-mark--danger">
                        <AlertCircle aria-hidden="true" />
                    </div>
                    <h1 id="invitation-title" className="s-util-title">Invitación Inválida</h1>
                    <p className="s-util-text">{error}</p>
                </section>
            </main>
        );
    }

    if (activeUser) {
        return (
            <main className="s-util s-util--center">
                <section className="s-util-card" aria-labelledby="invitation-title">
                    <div className="s-util-mark">
                        <UserIcon aria-hidden="true" />
                    </div>
                    <h1 id="invitation-title" className="s-util-title">Sesión Activa detectada</h1>
                    <p className="s-util-text">
                        Estás conectado como <br /><strong>{activeUser.email}</strong>
                    </p>
                    <div className="s-util-note">
                        Esta invitación es para: <br />
                        <strong>{invitation?.email}</strong>
                    </div>
                    <p className="s-util-fine">
                        Para continuar con el registro, necesitas cerrar tu sesión actual.
                    </p>
                    <div className="s-util-actions">
                        <button
                            type="button"
                            onClick={() => auth && signOut(auth)}
                            className="s-util-ghost"
                        >
                            <LogOut size={18} aria-hidden="true" />
                            Cerrar Sesión
                        </button>
                    </div>
                </section>
            </main>
        );
    }

    return (
        <main className="s-util s-util--center">
            <section className="s-util-card s-util-card--form" aria-labelledby="invitation-title">
                <div className="s-util-head">
                    <h1 id="invitation-title" className="s-util-title">Bienvenido a Zeta Prop</h1>
                    <p className="s-util-text">
                        Has sido invitado para unirte al equipo. <br />
                        Configura tu contraseña para continuar.
                    </p>
                </div>

                <form onSubmit={handleRegister} className="s-auth-form">
                    <div>
                        <label htmlFor="invitation-email" className="s-auth-label">
                            Email
                        </label>
                        <input
                            id="invitation-email"
                            type="email"
                            value={invitation?.email}
                            disabled
                            className="s-auth-input s-auth-input--plain"
                        />
                    </div>

                    {/* Phone Input Addition */}
                    <div>
                        <label htmlFor="invitation-phone" className="s-auth-label">
                            Teléfono
                        </label>
                        <input
                            id="invitation-phone"
                            type="tel"
                            required
                            className="s-auth-input s-auth-input--plain"
                            placeholder="+54 9 11 1234 5678"
                            name="phone"
                            value={phone}
                            onChange={(e) => setPhone(e.target.value)}
                        />
                    </div>

                    <div>
                        <label htmlFor="invitation-password" className="s-auth-label">
                            Contraseña
                        </label>
                        <input
                            id="invitation-password"
                            type="password"
                            required
                            minLength={6}
                            className="s-auth-input s-auth-input--plain"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="Mínimo 6 caracteres"
                        />
                    </div>

                    <div>
                        <label htmlFor="invitation-confirm" className="s-auth-label">
                            Confirmar Contraseña
                        </label>
                        <input
                            id="invitation-confirm"
                            type="password"
                            required
                            minLength={6}
                            className="s-auth-input s-auth-input--plain"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            placeholder="Repite tu contraseña"
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={submitting}
                        className="s-auth-submit"
                    >
                        {submitting ? "Registrando..." : "Completar Registro"}
                    </button>
                </form>
            </section>
        </main>
    );
}
