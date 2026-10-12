"use client";

import { useState, useEffect, Suspense, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Eye, EyeOff, Loader2, Mail, Lock } from "lucide-react";
import { loginWithGoogle, loginEmail } from "@/infrastructure/auth/firebaseAuthService";
import { auth } from "@/infrastructure/firebase/client";
import { onAuthStateChanged } from "firebase/auth";
import AuthShell, { AuthLoading, GoogleLogo } from "@/ui/components/auth/AuthShell";

function LoginContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const redirectTo = searchParams.get("redirect") || "/dashboard";
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [showPassword, setShowPassword] = useState(false);

    const isSubmitting = useRef(false);
    const [authChecking, setAuthChecking] = useState(true);

    // Redirect if already logged in
    useEffect(() => {
        if (!auth) {
            setAuthChecking(false);
            return;
        }

        const unsubscribe = onAuthStateChanged(auth, (user) => {
            setAuthChecking(false);
            if (user && !isSubmitting.current) {
                router.push(redirectTo);
            }
        });

        return () => unsubscribe();
    }, [router, redirectTo]);

    if (authChecking) {
        return <AuthLoading />;
    }

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        isSubmitting.current = true;
        setLoading(true);
        setError(null);

        try {
            await loginEmail(email, password);
            router.push(redirectTo);
        } catch (err: any) {
            console.error(err);
            if (err.code === "auth/invalid-credential" || err.code === "auth/user-not-found" || err.code === "auth/wrong-password") {
                setError("Email o contraseña incorrectos.");
            } else if (err.code === "auth/too-many-requests") {
                setError("Demasiados intentos fallidos. Intenta más tarde.");
            } else {
                setError("Ocurrió un error al iniciar sesión.");
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
            router.push(redirectTo);
        } catch (err: any) {
            if (err.code === 'auth/cancelled-popup-request') {
                return;
            }
            console.error("Google login error:", err);
            // Show specific error for debugging
            setError(`Error: ${err.code} - ${err.message}`);
        } finally {
            setLoading(false);
            isSubmitting.current = false;
        }
    };

    return (
        <AuthShell
            title="Bienvenido de nuevo"
            panelLine="Administra propiedades, clientes y alquileres desde un solo lugar."
            intro={
                <p className="s-auth__sub">
                    ¿No tienes una cuenta?{" "}
                    <Link href="/register" className="s-auth__link">
                        Regístrate aquí
                    </Link>
                </p>
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

            <div className="s-auth-divider">O con email</div>

            <form className="s-auth-form" onSubmit={handleLogin}>
                <div>
                    <label htmlFor="email" className="s-auth-label">
                        Email o Usuario
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
                    <div className="s-auth-row">
                        <label htmlFor="password" className="s-auth-label">
                            Contraseña
                        </label>
                        <Link href="/forgot-password" className="s-auth-small-link">
                            ¿Olvidaste tu contraseña?
                        </Link>
                    </div>
                    <div className="s-auth-field">
                        <Lock className="s-auth-field__icon" aria-hidden />
                        <input
                            id="password"
                            name="password"
                            type={showPassword ? "text" : "password"}
                            autoComplete="current-password"
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
                </div>

                {error && (
                    <p className="s-auth-alert" role="alert">
                        {error}
                    </p>
                )}

                <button type="submit" disabled={loading} className="s-auth-submit">
                    {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : "Iniciar sesión"}
                </button>
            </form>
        </AuthShell>
    );
}

export default function LoginPage() {
    return (
        <Suspense fallback={<AuthLoading />}>
            <LoginContent />
        </Suspense>
    );
}
