"use client";

import { useState, useEffect, Suspense, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { Eye, EyeOff, Loader2, Mail, Lock } from "lucide-react";
import { loginWithGoogle, loginEmail } from "@/infrastructure/auth/firebaseAuthService";
import { auth } from "@/infrastructure/firebase/client";
import { onAuthStateChanged } from "firebase/auth";

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
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="w-8 h-8 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
            </div>
        );
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
        <div className="min-h-screen flex w-full">
            {/* Left Column - Image */}
            <div className="hidden lg:flex lg:w-1/2 relative bg-gray-900">
                <Image
                    src="/assets/img/zeta_prop_agent.png"
                    alt="Zeta Prop Agente Inmobiliario"
                    fill
                    priority
                    className="object-cover opacity-90"
                />
                {/* Overlay for depth */}
                <div className="absolute inset-0 bg-gradient-to-r from-gray-900/60 to-transparent" />
                
                <div className="absolute bottom-12 left-12 max-w-lg text-white">
                    <h1 className="text-4xl font-bold mb-4 drop-shadow-md">
                        Tu ecosistema inmobiliario.
                    </h1>
                    <p className="text-lg text-gray-200 drop-shadow">
                        Administra propiedades, clientes y alquileres desde un solo lugar, con tecnología de primer nivel y soporte humano.
                    </p>
                </div>
            </div>

            {/* Right Column - Form */}
            <div className="w-full lg:w-1/2 flex items-center justify-center bg-gray-50 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
                {/* Optional subtle background element */}
                <div className="absolute top-0 right-0 -mr-20 -mt-20 w-72 h-72 rounded-full bg-indigo-100 opacity-50 blur-3xl" />
                
                <div className="max-w-md w-full relative z-10">
                    <div className="text-center bg-white/70 backdrop-blur-xl p-8 sm:p-10 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-white/50">
                        <Link href="/" className="flex justify-center mb-6 transition-opacity hover:opacity-80">
                            <Image
                                src="/assets/img/logo_web_ZetaProp.png"
                                alt="Zeta Prop Logo"
                                width={180}
                                height={60}
                                className="h-14 w-auto object-contain"
                            />
                        </Link>
                        <h2 className="text-2xl font-bold text-gray-900 tracking-tight">
                            Bienvenido de nuevo
                        </h2>
                        <p className="mt-2 text-sm text-gray-600 mb-8">
                            ¿No tienes una cuenta?{" "}
                            <Link
                                href="/register"
                                className="font-semibold text-indigo-600 hover:text-indigo-500 transition-colors"
                            >
                                Regístrate aquí
                            </Link>
                        </p>

                        <div className="space-y-6">
                            <button
                                onClick={handleGoogleLogin}
                                disabled={loading}
                                className="w-full flex items-center justify-center gap-3 px-4 py-3 border border-gray-200 rounded-2xl shadow-sm bg-white/80 hover:bg-white text-sm font-semibold text-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-all duration-200"
                            >
                                {loading ? (
                                    <Loader2 className="h-5 w-5 animate-spin text-gray-400" />
                                ) : (
                                    <svg className="h-5 w-5" viewBox="0 0 24 24">
                                        <path
                                            d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                                            fill="#4285F4"
                                        />
                                        <path
                                            d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                                            fill="#34A853"
                                        />
                                        <path
                                            d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                                            fill="#FBBC05"
                                        />
                                        <path
                                            d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                                            fill="#EA4335"
                                        />
                                    </svg>
                                )}
                                <span>Continuar con Google</span>
                            </button>

                            <div className="relative">
                                <div className="absolute inset-0 flex items-center">
                                    <div className="w-full border-t border-gray-200" />
                                </div>
                                <div className="relative flex justify-center text-sm">
                                    <span className="px-3 bg-white/80 text-gray-500 rounded-full text-xs font-medium uppercase tracking-wider">
                                        O con email
                                    </span>
                                </div>
                            </div>

                            <form className="space-y-5 text-left" onSubmit={handleLogin}>
                                <div>
                                    <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                                        Email o Usuario
                                    </label>
                                    <div className="relative group">
                                        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                                            <Mail className="h-5 w-5 text-gray-400 group-focus-within:text-indigo-500 transition-colors" />
                                        </div>
                                        <input
                                            id="email"
                                            name="email"
                                            type="email"
                                            autoComplete="email"
                                            required
                                            className="block w-full pl-11 pr-3 py-3 bg-white/60 border border-gray-200 rounded-2xl placeholder-gray-400 text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 sm:text-sm transition-all shadow-sm"
                                            placeholder="tucorreo@ejemplo.com"
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                        />
                                    </div>
                                </div>

                                <div>
                                    <div className="flex items-center justify-between mb-1">
                                        <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                                            Contraseña
                                        </label>
                                        <Link href="/forgot-password" className="text-xs font-medium text-indigo-600 hover:text-indigo-500">
                                            ¿Olvidaste tu contraseña?
                                        </Link>
                                    </div>
                                    <div className="relative group">
                                        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                                            <Lock className="h-5 w-5 text-gray-400 group-focus-within:text-indigo-500 transition-colors" />
                                        </div>
                                        <input
                                            id="password"
                                            name="password"
                                            type={showPassword ? "text" : "password"}
                                            autoComplete="current-password"
                                            required
                                            className="block w-full pl-11 pr-11 py-3 bg-white/60 border border-gray-200 rounded-2xl placeholder-gray-400 text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 sm:text-sm transition-all shadow-sm"
                                            placeholder="••••••••"
                                            value={password}
                                            onChange={(e) => setPassword(e.target.value)}
                                        />
                                        <button
                                            type="button"
                                            className="absolute inset-y-0 right-0 pr-3.5 flex items-center"
                                            onClick={() => setShowPassword(!showPassword)}
                                        >
                                            {showPassword ? (
                                                <EyeOff className="h-5 w-5 text-gray-400 hover:text-gray-600 transition-colors" />
                                            ) : (
                                                <Eye className="h-5 w-5 text-gray-400 hover:text-gray-600 transition-colors" />
                                            )}
                                        </button>
                                    </div>
                                </div>

                                {error && (
                                    <div className="rounded-xl bg-red-50/80 p-3 border border-red-100">
                                        <div className="flex">
                                            <div className="ml-2">
                                                <h3 className="text-sm font-medium text-red-800">{error}</h3>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                <div className="pt-2">
                                    <button
                                        type="submit"
                                        disabled={loading}
                                        className="group relative w-full flex justify-center py-3.5 px-4 border border-transparent text-sm font-bold rounded-2xl text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-all duration-300 shadow-lg hover:shadow-indigo-500/25 disabled:opacity-70 disabled:cursor-not-allowed"
                                    >
                                        {loading ? (
                                            <Loader2 className="h-5 w-5 animate-spin" />
                                        ) : (
                                            "Iniciar sesión"
                                        )}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default function LoginPage() {
    return (
        <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><div className="w-8 h-8 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" /></div>}>
            <LoginContent />
        </Suspense>
    );
}