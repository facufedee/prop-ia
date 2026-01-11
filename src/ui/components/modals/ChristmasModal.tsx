"use client";

import { useEffect, useState } from "react";
import { X, Gift, Sparkles } from "lucide-react";

export default function ChristmasModal() {
    const [isOpen, setIsOpen] = useState(false);

    useEffect(() => {
        // Check if user has already seen the modal
        const hasSeenChristmasModal = localStorage.getItem("christmasModal2024");

        if (!hasSeenChristmasModal) {
            // Show modal after a short delay for better UX
            setTimeout(() => {
                setIsOpen(true);
            }, 1000);
        }
    }, []);

    const handleClose = () => {
        setIsOpen(false);
        // Mark as seen in localStorage
        localStorage.setItem("christmasModal2024", "true");
    };

    if (!isOpen) return null;

    return (
        <>
            {/* Backdrop */}
            <div
                className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 animate-in fade-in duration-300"
                onClick={handleClose}
            />

            {/* Modal */}
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
                <div
                    className="relative bg-white rounded-3xl shadow-2xl max-w-md w-full p-8 pointer-events-auto animate-in zoom-in-95 fade-in duration-300"
                    onClick={(e) => e.stopPropagation()}
                >
                    {/* Close Button */}
                    <button
                        onClick={handleClose}
                        className="absolute top-4 right-4 p-2 hover:bg-gray-100 rounded-full transition-colors"
                        aria-label="Cerrar"
                    >
                        <X className="w-5 h-5 text-gray-500" />
                    </button>

                    {/* Content */}
                    <div className="text-center">
                        {/* Icon */}
                        <div className="mb-6 flex justify-center">
                            <div className="relative">
                                <div className="absolute inset-0 bg-gradient-to-r from-indigo-600 via-purple-600 to-cyan-500 rounded-full blur-xl opacity-30 animate-pulse" />
                                <div className="relative w-20 h-20 bg-gradient-to-r from-indigo-600 via-purple-600 to-cyan-500 rounded-full flex items-center justify-center">
                                    <Gift className="w-10 h-10 text-white" />
                                </div>
                            </div>
                        </div>

                        {/* Title */}
                        <h2 className="text-3xl font-bold text-gray-900 mb-3 flex items-center justify-center gap-2">
                            <Sparkles className="w-6 h-6 text-indigo-500" />
                            ¡Feliz Navidad!
                            <Sparkles className="w-6 h-6 text-cyan-500" />
                        </h2>

                        {/* Message */}
                        <p className="text-gray-600 mb-6 leading-relaxed">
                            El equipo de <span className="font-semibold bg-gradient-to-r from-indigo-600 to-cyan-500 bg-clip-text text-transparent">Zeta Prop</span> te desea una
                            <span className="font-semibold"> Feliz Navidad</span> y un
                            <span className="font-semibold"> Próspero Año Nuevo</span>.
                            <br />
                            <br />
                            Que estas fiestas estén llenas de éxito y nuevas oportunidades. 🎄✨
                        </p>

                        {/* CTA Button */}
                        <button
                            onClick={handleClose}
                            className="w-full bg-gradient-to-r from-indigo-600 via-purple-600 to-cyan-500 text-white px-6 py-3 rounded-xl font-semibold hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200"
                        >
                            ¡Gracias! 🎁
                        </button>
                    </div>

                    {/* Decorative Elements */}
                    <div className="absolute top-0 left-0 w-full h-full pointer-events-none overflow-hidden rounded-3xl">
                        <div className="absolute -top-10 -left-10 w-20 h-20 bg-indigo-200 rounded-full blur-2xl opacity-30" />
                        <div className="absolute -bottom-10 -right-10 w-20 h-20 bg-cyan-200 rounded-full blur-2xl opacity-30" />
                    </div>
                </div>
            </div>
        </>
    );
}
