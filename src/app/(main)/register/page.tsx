"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Eye, EyeOff, Loader2, Mail, Lock, Building2, User, Globe } from "lucide-react";
import { loginWithGoogle, registerEmail } from "@/infrastructure/auth/firebaseAuthService";
import { auth } from "@/infrastructure/firebase/client";
import { onAuthStateChanged, sendEmailVerification } from "firebase/auth";
import AuthShell, { GoogleLogo } from "@/ui/components/auth/AuthShell";

export default function RegisterPage() {
    const router = useRouter();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [name, setName] = useState("");
    const [agency, setAgency] = useState("");
    const [socialLink, setSocialLink] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [showPassword, setShowPassword] = useState(false);

    // Password strength logic
    const calculateStrength = (pass: string) => {
        let score = 0;
        if (!pass) return score;
        if (pass.length > 5) score += 1;
        if (pass.length > 8) score += 1;
        if (/[A-Z]/.test(pass)) score += 1;
        if (/[0-9]/.test(pass)) score += 1;
        if (/[^A-Za-z0-9]/.test(pass)) score += 1;
        return Math.min(score, 4);
    };
    const passwordStrength = calculateStrength(password);
    const strengthLabels = ["Débil", "Regular", "Buena", "Fuerte", "Excelente"];
    const strengthColors = ["bg-[var(--color-danger)]", "bg-[var(--color-danger)]", "bg-[var(--color-warning)]", "bg-[var(--color-positive)]", "bg-[var(--color-positive)]"];

    const isSubmitting = useRef(false);

    // Redirect if already logged in
    useEffect(() => {
        if (!auth) return;

        const unsubscribe = onAuthStateChanged(auth, (user) => {
            if (user && !isSubmitting.current) {
                router.push("/dashboard");
            }
        });

        return () => unsubscribe();
    }, [router]);

    const handleRegister = async (e: React.FormEvent) => {
        e.preventDefault();
        isSubmitting.current = true;
        setLoading(true);
        setError(null);

        if (!name.trim() || !agency.trim()) {
            setError("Por favor completa todos los campos.");
            setLoading(false);
            return;
        }

        try {
            const result = await registerEmail(email, password, name, agency, socialLink);
            await sendEmailVerification(result.user);

            // Fire-and-forget welcome email via Resend
            fetch('/api/marketing/send', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    type: 'welcome',
                    to: email,
                    data: { userName: name, email },
                }),
            }).catch(err => console.error('[Register] Welcome email error:', err));

            router.push("/verify-email");
        } catch (err: any) {
            console.error(err);
            if (err.code === "auth/email-already-in-use") {
                setError("Este correo electrónico ya está registrado.");
            } else if (err.code === "auth/weak-password") {
                setError("La contraseña debe tener al menos 6 caracteres.");
            } else {
                setError("Ocurrió un error al registrarse. Inténtalo de nuevo.");
            }
        } finally {
            setLoading(false);
            isSubmitting.current = false;
        }
    };

    const handleGoogleLogin = async () => {
        isSubmitting.current = true;
        setLoading(true);
        setError(null);
        try {
            await loginWithGoogle();
            router.push("/dashboard");
        } catch (err: any) {
            if (err.code === 'auth/cancelled-popup-request') {
                return;
            }
            console.error("Google login error:", err);
            setError("Error al iniciar sesión con Google.");
        } finally {
            setLoading(false);
            isSubmitting.current = false;
        }
    };

    return (
        <AuthShell
            title="Únete a Zeta Prop"
            panelLine="Gestiona tu cartera de propiedades, clientes y equipos en un solo lugar."
            intro={
                <>
                    <p className="s-auth__badge">14 días de uso gratis</p>
                    <p className="s-auth__sub">
                        ¿Ya tienes una cuenta?{" "}
                        <Link href="/login" className="s-auth__link">
                            Inicia sesión
                        </Link>
                    </p>
                </>
            }
        >
            <button
                type="button"
                onClick={handleGoogleLogin}
                disabled={loading}
                className="s-auth-google"
            >
                {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : <GoogleLogo />}
                <span>Continuar con Google</span>
            </button>

            <div className="s-auth-divider">O regístrate con email</div>

            <form className="s-auth-form" onSubmit={handleRegister}>
                <div>
                    <label htmlFor="name" className="s-auth-label">
                        Nombre completo
                    </label>
                    <div className="s-auth-field">
                        <User className="s-auth-field__icon" aria-hidden />
                        <input
                            id="name"
                            name="name"
                            type="text"
                            required
                            className="s-auth-input"
                            placeholder="Juan Pérez"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                        />
                    </div>
                </div>

                <div>
                    <label htmlFor="agency" className="s-auth-label">
                        Nombre de la inmobiliaria
                    </label>
                    <div className="s-auth-field">
                        <Building2 className="s-auth-field__icon" aria-hidden />
                        <input
                            id="agency"
                            name="agency"
                            type="text"
                            required
                            className="s-auth-input"
                            placeholder="Pérez Inmobiliaria"
                            value={agency}
                            onChange={(e) => setAgency(e.target.value)}
                        />
                    </div>
                </div>

                <div>
                    <label htmlFor="socialLink" className="s-auth-label">
                        Sitio Web o Instagram <span className="s-auth-label__opt">(Opcional)</span>
                    </label>
                    <div className="s-auth-field">
                        <Globe className="s-auth-field__icon" aria-hidden />
                        <input
                            id="socialLink"
                            name="socialLink"
                            type="text"
                            className="s-auth-input"
                            placeholder="ej. @mi_inmobiliaria o www.web.com"
                            value={socialLink}
                            onChange={(e) => setSocialLink(e.target.value)}
                        />
                    </div>
                </div>

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

                <div>
                    <label htmlFor="password" className="s-auth-label">
                        Contraseña
                    </label>
                    <div className="s-auth-field">
                        <Lock className="s-auth-field__icon" aria-hidden />
                        <input
                            id="password"
                            name="password"
                            type={showPassword ? "text" : "password"}
                            autoComplete="new-password"
                            required
                            className="s-auth-input s-auth-input--toggle"
                            placeholder="••••••••"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                        />
                        <button
                            type="button"
                            className="s-auth-reveal"
                            aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
                            onClick={() => setShowPassword(!showPassword)}
                        >
                            {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                        </button>
                    </div>
                    {/* Password Strength Meter */}
                    {password.length > 0 && (
                        <div className="s-auth-strength">
                            <div className="s-auth-strength__bar">
                                {[...Array(5)].map((_, i) => (
                                    <div
                                        key={i}
                                        className={`s-auth-strength__seg ${i <= passwordStrength ? strengthColors[passwordStrength] : 'bg-transparent'}`}
                                    />
                                ))}
                            </div>
                            <p className="s-auth-strength__label">
                                Seguridad: <span>{strengthLabels[passwordStrength]}</span>
                            </p>
                        </div>
                    )}
                </div>

                <div className="s-auth-check">
                    <input
                        id="terms"
                        name="terms"
                        type="checkbox"
                        required
                    />
                    <label htmlFor="terms">
                        Acepto los <a href="#">Términos y Condiciones</a> y la <a href="#">Política de Privacidad</a>
                    </label>
                </div>

                {error && (
                    <p className="s-auth-alert" role="alert">
                        {error}
                    </p>
                )}

                <button type="submit" disabled={loading} className="s-auth-submit">
                    {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : "Crear mi cuenta"}
                </button>
            </form>
        </AuthShell>
    );
}
