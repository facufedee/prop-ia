import { X, Rocket, Zap } from "lucide-react";

interface LimitReachedModalProps {
    isOpen: boolean;
    onClose: () => void;
    resource: 'propiedades' | 'clientes';
    limit: number | string;
}

export default function LimitReachedModal({ isOpen, onClose, resource, limit }: LimitReachedModalProps) {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200 border-2 border-indigo-100">
                {/* Header with Icon */}
                <div className="bg-indigo-50 p-6 flex flex-col items-center justify-center text-center border-b border-indigo-100">
                    <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-sm mb-4">
                        <Rocket className="w-8 h-8 text-indigo-600" />
                    </div>
                    <h2 className="text-xl font-bold text-gray-900">¡Has alcanzado el límite!</h2>
                    <p className="text-gray-600 mt-2">
                        Tu plan actual solo permite hasta <span className="font-bold text-indigo-700">{limit} {resource}</span>.
                    </p>
                </div>

                {/* Content */}
                <div className="p-6 space-y-4">
                    <div className="bg-gradient-to-r from-indigo-500 to-purple-600 rounded-xl p-4 text-white shadow-md">
                        <div className="flex items-start gap-3">
                            <Zap className="w-5 h-5 mt-0.5 flex-shrink-0 text-yellow-300" />
                            <div>
                                <h3 className="font-bold text-lg">Plan PRO</h3>
                                <p className="text-indigo-100 text-sm mt-1">
                                    Eliminá los límites, accedé a IA avanzada y obtené soporte prioritario.
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="flex flex-col gap-3 pt-2">
                        <button
                            onClick={() => {
                                onClose();
                                window.location.href = '/catalogo';
                            }}
                            className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-colors font-medium shadow-lg shadow-indigo-200 group"
                        >
                            <Rocket className="w-5 h-5 group-hover:animate-bounce" />
                            Ver Planes y Precios
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
