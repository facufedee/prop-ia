"use client";

import { useState } from "react";
import Link from "next/link";
import { sendPasswordResetEmail } from "firebase/auth";
import { FirebaseError } from "firebase/app";
import { Loader2, Mail } from "lucide-react";
import { auth } from "@/infrastructure/firebase/client";
import AuthShell from "@/ui/components/auth/AuthShell";

export default function ForgotPasswordPage() {
    const [email, setEmail] = useState("");
    const [loading, setLoading] = useState(false);
    const [sent, setSent] = useState(false);
    const [error, setError] = useState("");

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!auth) return;
        setLoading(true);
        setError("");
        try {
            await sendPasswordResetEmail(auth, email.trim());
            setSent(true);
        } catch (err) {
            const code = err instanceof FirebaseError ? err.code : "";
            if (code === "auth/invalid-email") {
                setError("El email no es válido.");
            } else if (code === "auth/user-not-found") {
                // Same answer as success so the form can't be used to check which emails have accounts.
                setSent(true);
            } else if (code === "auth/too-many-requests") {
                setError("Demasiados intentos. Probá de nuevo en unos minutos.");
            } else {
                setError("No pudimos enviar el email. Probá de nuevo.");
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <AuthShell
            title="Recuperar contraseña"
            panelLine="Tu inmobiliaria, en orden."
            intro={
                <p className="s-auth__sub">
                    Ingresá el email de tu cuenta y te enviamos un enlace para crear una contraseña nueva.
                </p>
            }
        >
            {sent ? (
                <div className="s-auth-notice" role="status">
                    <p>
                        Si existe una cuenta con <strong>{email.trim()}</strong>, vas a recibir un email con el enlace.
                        Revisá también la carpeta de spam.
                    </p>
                </div>
            ) : (
                <form className="s-auth-form" onSubmit={handleSubmit}>
                    <div>
                        <label htmlFor="email" className="s-auth-label">
                            Email
                        </label>
                        <div className="s-auth-field">
                            <Mail className="s-auth-field__icon" aria-hidden />
                            <input
                                id="email"
                                name="email"
                                type="email"
                                autoComplete="email"
                                required
                                className="s-auth-input"
                                placeholder="tucorreo@ejemplo.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                            />
                        </div>
                    </div>

                    {error && (
                        <p className="s-auth-alert" role="alert">
                            {error}
                        </p>
                    )}

                    <button type="submit" disabled={loading} className="s-auth-submit">
                        {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : "Enviar enlace"}
                    </button>
                </form>
            )}

            <p className="s-auth__sub">
                <Link href="/login" className="s-auth__link s-auth-small-link">
                    Volver a iniciar sesión
                </Link>
            </p>
        </AuthShell>
    );
}
