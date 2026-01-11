"use client";

import { useEffect, useState, useRef } from "react";
import { createPortal } from "react-dom";
import { X, ArrowRight, ArrowUp } from "lucide-react";

interface OnboardingOverlayProps {
    targetId: string;
    show: boolean;
    onDismiss: () => void;
}

export default function OnboardingOverlay({ targetId, show, onDismiss }: OnboardingOverlayProps) {
    const [targetRect, setTargetRect] = useState<DOMRect | null>(null);
    const [windowSize, setWindowSize] = useState({ width: 0, height: 0 });

    useEffect(() => {
        if (!show) return;

        const handleResize = () => {
            setWindowSize({ width: window.innerWidth, height: window.innerHeight });
            const element = document.getElementById(targetId);
            if (element) {
                setTargetRect(element.getBoundingClientRect());
            }
        };

        // Initial calc
        handleResize();

        // Re-calc after a short delay to ensure rendering is complete
        setTimeout(handleResize, 500);

        window.addEventListener("resize", handleResize);
        return () => window.removeEventListener("resize", handleResize);
    }, [show, targetId]);

    if (!show || !targetRect) return null;

    // We use a portal to ensure it renders on top of everything
    if (typeof document === "undefined") return null;

    return createPortal(
        <div className="fixed inset-0 z-[100] isolate">
            {/* Backdrop with hole logic using clip-path or huge box-shadow */}
            {/* An easier "spotlight" approach is using a huge box-shadow on a div positioned over the target */}

            <div
                className="absolute transition-all duration-500 ease-out"
                style={{
                    top: targetRect.top,
                    left: targetRect.left,
                    width: targetRect.width,
                    height: targetRect.height,
                    borderRadius: '12px', // Match button radius roughly
                    boxShadow: '0 0 0 9999px rgba(0, 0, 0, 0.75), 0 0 30px 5px rgba(255, 255, 255, 0.3)'
                }}
            >
                {/* Pulsing Ring Effect */}
                <div className="absolute -inset-2 border-2 border-white rounded-xl animate-ping opacity-75"></div>
            </div>

            {/* Interaction Layer (transparent but blocks clicks elsewhere) */}
            <div
                className="absolute inset-0 z-[-1]"
                onClick={onDismiss}
                aria-hidden="true"
            />

            {/* Message Box */}
            <div
                className="absolute bg-white px-6 py-5 rounded-2xl shadow-2xl max-w-sm border-l-4 border-indigo-600 animate-in fade-in zoom-in slide-in-from-bottom-4 duration-500"
                style={{
                    top: targetRect.bottom + 20, // Position below the target
                    left: Math.max(20, targetRect.left - 100), // Adjust logic as needed
                }}
            >
                {/* Arrow pointing up */}
                <div className="absolute -top-3 left-[120px] w-6 h-6 bg-white transform rotate-45 border-t border-l border-gray-100"></div>

                <div className="relative">
                    <button
                        onClick={onDismiss}
                        className="absolute -top-2 -right-2 text-gray-400 hover:text-gray-600 p-1"
                    >
                        <X size={16} />
                    </button>

                    <h3 className="text-lg font-bold text-gray-900 mb-2 flex items-center gap-2">
                        <span className="bg-indigo-600 text-white text-xs px-2 py-0.5 rounded-full">PASO 1</span>
                        Ingresa tus propiedades
                    </h3>

                    <p className="text-gray-600 text-sm mb-4 leading-relaxed">
                        Comienza cargando tu inventario. Con el plan <strong>FREE</strong> puedes gestionar hasta <strong>10 propiedades</strong> con IA incluida.
                    </p>

                    <div className="flex justify-end">
                        <button
                            onClick={onDismiss}
                            className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors shadow-lg shadow-indigo-200 flex items-center gap-2"
                        >
                            ¡Entendido! <ArrowRight size={16} />
                        </button>
                    </div>
                </div>
            </div>
        </div>,
        document.body
    );
}
