"use client";

import { useState, useEffect } from "react";
import { X } from "lucide-react";
import { loginWithGoogle } from "@/infrastructure/auth/firebaseAuthService";
import { useRouter } from "next/navigation";
import { app } from "@/infrastructure/firebase/client";
import { onAuthStateChanged, getAuth } from "firebase/auth";

const auth = getAuth(app);

export default function GoogleAuthPrompt() {
    const [isVisible, setIsVisible] = useState(false);
    const [isClosing, setIsClosing] = useState(false);
    const router = useRouter();

    useEffect(() => {
        // Check if user is already logged in
        const unsubscribe = onAuthStateChanged(auth, (user) => {
            if (!user) {
                // Show prompt after a short delay if not logged in
                const timer = setTimeout(() => {
                    setIsVisible(true);
                }, 1500);
                return () => clearTimeout(timer);
            } else {
                setIsVisible(false);
            }
        });

        return () => unsubscribe();
    }, []);

    const handleLogin = async () => {
        try {
            await loginWithGoogle();
            router.push("/dashboard");
        } catch (error) {
            console.error("Login failed", error);
        }
    };

    const handleClose = () => {
        setIsClosing(true);
        setTimeout(() => {
            setIsVisible(false);
            setIsClosing(false);
        }, 300); // Match animation duration
    };

    if (!isVisible) return null;

    return (
        <div
            className={`fixed top-4 right-4 z-[60] flex flex-col items-end transition-all duration-500 ease-in-out ${isClosing ? "opacity-0 translate-x-10" : "opacity-100 translate-x-0"
                }`}
        >
            <div className="bg-[#202124] text-white rounded-lg shadow-2xl w-[350px] overflow-hidden border border-gray-700 font-sans">
                {/* Header */}
                <div className="flex items-center justify-between px-4 py-3 border-b border-gray-700/50">
                    <div className="flex items-center gap-2">
                        <div className="bg-white p-1 rounded-full">
                            <svg className="w-4 h-4" viewBox="0 0 24 24">
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
                        </div>
                        <span className="text-sm font-medium text-gray-200">Acceder a Prop-IA con Google</span>
                    </div>
                    <button
                        onClick={handleClose}
                        className="text-gray-400 hover:text-white transition-colors"
                    >
                        <X size={18} />
                    </button>
                </div>

                {/* Content */}
                <div className="p-4 bg-[#202124]">
                    <div className="flex items-center gap-4 mb-4">
                        <div className="w-10 h-10 rounded-full bg-indigo-600 flex items-center justify-center text-white font-bold text-lg">
                            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                            </svg>
                        </div>
                        <div>
                            <p className="text-sm font-medium text-white">Inicia sesión en Prop-IA</p>
                            <p className="text-xs text-gray-400">Guarda tus búsquedas y favoritos</p>
                        </div>
                    </div>

                    <button
                        onClick={handleLogin}
                        className="w-full bg-[#8ab4f8] hover:bg-[#aecbfa] text-[#202124] font-medium py-2 px-4 rounded-full text-sm transition-colors duration-200"
                    >
                        Continuar con Google
                    </button>
                </div>
            </div>
        </div>
    );
}
