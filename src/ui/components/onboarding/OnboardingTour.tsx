"use client";

import { useEffect, useState, useCallback } from "react";
import { createPortal } from "react-dom";
import { X, ArrowRight, ArrowLeft } from "lucide-react";

const TOUR_STORAGE_KEY = "zeta_prop_onboarding_views";
const MAX_VIEWS = 3;

interface TourStep {
    targetId?: string;
    title: string;
    description: string;
    position?: "top" | "bottom" | "left" | "right";
    align?: "start" | "center" | "end";
}

const STEPS: TourStep[] = [
    {
        title: "¡Bienvenido a Zeta Prop! 🚀",
        description: "Te guiaremos rápidamente por los módulos principales para que saques el máximo provecho a la plataforma.",
        // No targetId -> Centered Modal
    },
    {
        targetId: "nav-item-propiedades",
        title: "Propiedades",
        description: "Aquí es donde cargas y gestionas todo tu inventario. Podrás agregar nuevas propiedades, editarlas y compartirlas.",
        position: "right"
    },
    {
        targetId: "nav-item-alquileres",
        title: "Alquileres",
        description: "Administra contratos, vencimientos y actualizaciones de tus alquileres activos.",
        position: "right"
    },
    {
        targetId: "nav-item-finanzas",
        title: "Finanzas",
        description: "Lleva el control de ingresos, egresos y comisiones de tu inmobiliaria.",
        position: "right"
    },
    {
        targetId: "nav-item-soporte",
        title: "Soporte",
        description: "¿Necesitás ayuda? Acá podrás crear tickets de soporte y ver el estado de tus consultas.",
        position: "right"
    },
    {
        targetId: "nav-item-novedades-zeta",
        title: "Novedades",
        description: "Enterate de las últimas actualizaciones y mejoras que agregamos a Zeta Prop.",
        position: "right"
    }
];

export default function OnboardingTour() {
    const [currentStepIndex, setCurrentStepIndex] = useState(-1);
    const [active, setActive] = useState(false);
    const [targetRect, setTargetRect] = useState<DOMRect | null>(null);
    const [windowSize, setWindowSize] = useState({ width: 0, height: 0 });

    useEffect(() => {
        // Init check
        const views = parseInt(localStorage.getItem(TOUR_STORAGE_KEY) || "0", 10);
        if (views < MAX_VIEWS) {
            // Delay start
            const timer = setTimeout(() => {
                setActive(true);
                setCurrentStepIndex(0);
                // Increment view count immediately
                localStorage.setItem(TOUR_STORAGE_KEY, (views + 1).toString());
            }, 1000);
            return () => clearTimeout(timer);
        }
    }, []);

    const updateTargetRect = useCallback(() => {
        setWindowSize({ width: window.innerWidth, height: window.innerHeight });

        if (currentStepIndex >= 0 && currentStepIndex < STEPS.length) {
            const step = STEPS[currentStepIndex];
            if (step.targetId) {
                // If it has a target, measure it
                const el = document.getElementById(step.targetId);
                if (el) {
                    setTargetRect(el.getBoundingClientRect());
                } else {
                    // Fallback if element not found: show centered or skip?
                    // For safety, let's just null rect which we can interpret as center or just header
                    setTargetRect(null);
                }
            } else {
                // Centered modal
                setTargetRect(null);
            }
        }
    }, [currentStepIndex]);

    useEffect(() => {
        updateTargetRect();
        const handleResize = () => updateTargetRect();
        window.addEventListener("resize", handleResize);
        window.addEventListener("scroll", handleResize, true); // Capture scroll too

        // Polling for dynamic elements
        const interval = setInterval(updateTargetRect, 500);

        return () => {
            window.removeEventListener("resize", handleResize);
            window.removeEventListener("scroll", handleResize, true);
            clearInterval(interval);
        };
    }, [currentStepIndex, updateTargetRect]);

    const handleNext = () => {
        if (currentStepIndex < STEPS.length - 1) {
            setCurrentStepIndex(prev => prev + 1);
        } else {
            handleDismiss();
        }
    };

    const handlePrev = () => {
        if (currentStepIndex > 0) {
            setCurrentStepIndex(prev => prev - 1);
        }
    };

    const handleDismiss = () => {
        setActive(false);
        setCurrentStepIndex(-1);
    };

    if (!active || currentStepIndex === -1) return null;
    if (typeof document === "undefined") return null;

    const currentStep = STEPS[currentStepIndex];
    const isCentered = !currentStep.targetId || !targetRect;

    return createPortal(
        <div className="fixed inset-0 z-[100] isolate font-sans">
            {/* Backdrop / Spotlight */}
            {isCentered ? (
                // Full backdrop for centered modal
                <div className="absolute inset-0 bg-black/70 backdrop-blur-sm transition-opacity duration-300" />
            ) : (
                // Spotlight effect for targeted steps
                <div
                    className="absolute transition-all duration-500 ease-in-out"
                    style={{
                        top: targetRect!.top,
                        left: targetRect!.left,
                        width: targetRect!.width,
                        height: targetRect!.height,
                        borderRadius: '12px',
                        boxShadow: '0 0 0 9999px rgba(0, 0, 0, 0.75), 0 0 30px 5px rgba(255, 255, 255, 0.3)'
                    }}
                >
                    <div className="absolute -inset-2 border-2 border-white rounded-xl animate-pulse opacity-50"></div>
                </div>
            )}

            {/* Interaction Blocker */}
            <div className="absolute inset-0 z-[-1]" onClick={handleDismiss} />

            {/* Content Card */}
            <div
                className={`absolute bg-white p-6 rounded-2xl shadow-2xl max-w-sm border-l-4 border-indigo-600 animate-in fade-in zoom-in slide-in-from-bottom-4 duration-300
                    ${isCentered
                        ? "top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"
                        : "transition-all duration-500 ease-in-out"
                    }
                `}
                style={!isCentered && targetRect ? {
                    // Simple positioning logic: defaulted to right or auto
                    // For sidebar items (left), we want the card on the RIGHT
                    top: targetRect.top,
                    left: targetRect.right + 20,
                } : {}}
            >
                {/* Close Button */}
                <button
                    onClick={handleDismiss}
                    className="absolute -top-3 -right-3 bg-white text-gray-400 hover:text-red-500 p-1.5 rounded-full shadow-md border border-gray-100 transition-colors"
                >
                    <X size={16} />
                </button>

                {/* Step Badge */}
                <div className="flex items-center gap-2 mb-3">
                    <span className="bg-indigo-600 text-white text-xs font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
                        Paso {currentStepIndex + 1}/{STEPS.length}
                    </span>
                </div>

                {/* Content */}
                <h3 className="text-xl font-bold text-gray-900 mb-2">
                    {currentStep.title}
                </h3>
                <p className="text-gray-600 text-sm mb-6 leading-relaxed">
                    {currentStep.description}
                </p>

                {/* Controls */}
                <div className="flex items-center justify-between pt-2 border-t border-gray-50">
                    <button
                        onClick={handlePrev}
                        disabled={currentStepIndex === 0}
                        className={`text-sm font-medium flex items-center gap-1 transition-colors
                            ${currentStepIndex === 0 ? "text-gray-300 cursor-not-allowed" : "text-gray-500 hover:text-gray-800"}
                        `}
                    >
                        <ArrowLeft size={14} /> Atrás
                    </button>

                    <button
                        onClick={handleNext}
                        className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2 rounded-lg text-sm font-bold transition-all shadow-lg shadow-indigo-200 flex items-center gap-2 hover:translate-x-1"
                    >
                        {currentStepIndex === STEPS.length - 1 ? "Finalizar" : "Siguiente"}
                        {currentStepIndex !== STEPS.length - 1 && <ArrowRight size={16} />}
                    </button>
                </div>
            </div>
        </div>,
        document.body
    );
}
