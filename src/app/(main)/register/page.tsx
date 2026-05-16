"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { Eye, EyeOff, Loader2, Mail, Lock, Building2, User, Globe } from "lucide-react";
import { loginWithGoogle, registerEmail } from "@/infrastructure/auth/firebaseAuthService";
import { auth } from "@/infrastructure/firebase/client";
import { onAuthStateChanged, sendEmailVerification } from "firebase/auth";

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
    const strengthColors = ["bg-red-500", "bg-orange-500", "bg-yellow-500", "bg-green-400", "bg-green-600"];

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
                        Lleva tu inmobiliaria al siguiente nivel.
                    </h1>
                    <p className="text-lg text-gray-200 drop-shadow">
                        Únete a Zeta Prop y gestiona tu cartera de propiedades, clientes y equipos con la mejor tecnología.
                    </p>
                </div>
            </div>

            {/* Right Column - Form */}
            <div className="w-full lg:w-1/2 flex items-center justify-center bg-gray-50 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
                {/* Optional subtle background element */}
                <div className="absolute top-0 right-0 -mr-20 -mt-20 w-72 h-72 rounded-full bg-indigo-100 opacity-50 blur-3xl" />
                
                <div className="max-w-md w-full relative z-10 py-8">
                    <div className="text-center bg-white/70 backdrop-blur-xl p-8 sm:p-10 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-white/50">
                        <div className="flex justify-center mb-6">
                            <Image
                                src="/assets/img/logo_web_ZetaProp.png"
                                alt="Zeta Prop Logo"
                                width={180}
                                height={60}
                                className="h-14 w-auto object-contain"
                            />
                        </div>
                        <h2 className="text-2xl font-bold text-gray-900 tracking-tight">
                            Únete a Zeta Prop
                        </h2>
                        <div className="mt-2 inline-block px-3 py-1 bg-indigo-100 text-indigo-700 font-bold rounded-full text-xs uppercase tracking-wide">
                            🎁 14 días de uso gratis
                        </div>
                        <p className="mt-3 text-sm text-gray-600 mb-8">
                            ¿Ya tienes una cuenta?{" "}
                            <Link
                                href="/login"
                                className="font-semibold text-indigo-600 hover:text-indigo-500 transition-colors"
                            >
                                Inicia sesión
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
                                        O regístrate con email
                                    </span>
                                </div>
                            </div>

                            <form className="space-y-4 text-left" onSubmit={handleRegister}>
                                <div>
                                    <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                                        Nombre completo
                                    </label>
                                    <div className="relative group">
                                        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                                            <User className="h-5 w-5 text-gray-400 group-focus-within:text-indigo-500 transition-colors" />
                                        </div>
                                        <input
                                            id="name"
                                            name="name"
                                            type="text"
                                            required
                                            className="block w-full pl-11 pr-3 py-3 bg-white/60 border border-gray-200 rounded-2xl placeholder-gray-400 text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 sm:text-sm transition-all shadow-sm"
                                            placeholder="Juan Pérez"
                                            value={name}
                                            onChange={(e) => setName(e.target.value)}
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label htmlFor="agency" className="block text-sm font-medium text-gray-700 mb-1">
                                        Nombre de la inmobiliaria
                                    </label>
                                    <div className="relative group">
                                        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                                            <Building2 className="h-5 w-5 text-gray-400 group-focus-within:text-indigo-500 transition-colors" />
                                        </div>
                                        <input
                                            id="agency"
                                            name="agency"
                                            type="text"
                                            required
                                            className="block w-full pl-11 pr-3 py-3 bg-white/60 border border-gray-200 rounded-2xl placeholder-gray-400 text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 sm:text-sm transition-all shadow-sm"
                                            placeholder="Pérez Inmobiliaria"
                                            value={agency}
                                            onChange={(e) => setAgency(e.target.value)}
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label htmlFor="socialLink" className="block text-sm font-medium text-gray-700 mb-1">
                                        Sitio Web o Instagram <span className="text-gray-400 font-normal">(Opcional)</span>
                                    </label>
                                    <div className="relative group">
                                        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                                            <Globe className="h-5 w-5 text-gray-400 group-focus-within:text-indigo-500 transition-colors" />
                                        </div>
                                        <input
                                            id="socialLink"
                                            name="socialLink"
                                            type="text"
                                            className="block w-full pl-11 pr-3 py-3 bg-white/60 border border-gray-200 rounded-2xl placeholder-gray-400 text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 sm:text-sm transition-all shadow-sm"
                                            placeholder="ej. @mi_inmobiliaria o www.web.com"
                                            value={socialLink}
                                            onChange={(e) => setSocialLink(e.target.value)}
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                                        Email
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
                                    <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                                        Contraseña
                                    </label>
                                    <div className="relative group">
                                        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                                            <Lock className="h-5 w-5 text-gray-400 group-focus-within:text-indigo-500 transition-colors" />
                                        </div>
                                        <input
                                            id="password"
                                            name="password"
                                            type={showPassword ? "text" : "password"}
                                            autoComplete="new-password"
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
                                    {/* Password Strength Meter */}
                                    {password.length > 0 && (
                                        <div className="mt-2 space-y-1">
                                            <div className="flex gap-1 h-1.5 w-full bg-gray-200 rounded-full overflow-hidden">
                                                {[...Array(5)].map((_, i) => (
                                                    <div 
                                                        key={i} 
                                                        className={`flex-1 ${i <= passwordStrength ? strengthColors[passwordStrength] : 'bg-transparent'}`}
                                                    />
                                                ))}
                                            </div>
                                            <p className="text-xs text-right text-gray-500">
                                                Seguridad: <span className="font-semibold">{strengthLabels[passwordStrength]}</span>
                                            </p>
                                        </div>
                                    )}
                                </div>
                                
                                <div className="flex items-center mt-4">
                                    <input
                                        id="terms"
                                        name="terms"
                                        type="checkbox"
                                        required
                                        className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded cursor-pointer"
                                    />
                                    <label htmlFor="terms" className="ml-2 block text-xs text-gray-600">
                                        Acepto los <a href="#" className="text-indigo-600 hover:underline">Términos y Condiciones</a> y la <a href="#" className="text-indigo-600 hover:underline">Política de Privacidad</a>
                                    </label>
                                </div>

                                {error && (
                                    <div className="rounded-xl bg-red-50/80 p-3 border border-red-100 mt-4">
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
                                            "Crear mi cuenta"
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
