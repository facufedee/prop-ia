import { X, Rocket, Crown } from "lucide-react";
import { useRouter } from "next/navigation";

interface LimitReachedModalProps {
    isOpen: boolean;
    onClose: () => void;
    resource: 'propiedades' | 'clientes';
    limit: number | string;
}

export default function LimitReachedModal({ isOpen, onClose, resource, limit }: LimitReachedModalProps) {
    const router = useRouter();

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
            <div className="bg-[var(--color-paper-2)] rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200 border border-[var(--color-rule)]">
                {/* Header with Icon */}
                <div className="p-6 flex flex-col items-center justify-center text-center border-b border-[var(--color-rule)]">
                    <div className="w-16 h-16 bg-[var(--color-paper-3)] rounded-full flex items-center justify-center mb-4">
                        <Rocket strokeWidth={1.5} className="w-8 h-8 text-[var(--color-muted)]" />
                    </div>
                    <h2 className="font-heading text-xl font-bold text-[var(--color-ink)]">¡Has alcanzado el límite!</h2>
                    <p className="text-[var(--color-ink-2)] mt-2">
                        Tu plan actual solo permite hasta <span className="font-bold text-[var(--color-accent)]">{limit} {resource}</span>.
                    </p>
                </div>

                {/* Content */}
                <div className="p-6 space-y-4">
                    <div className="bg-[var(--color-paper-3)] border border-[var(--color-rule)] rounded-xl p-4 text-[var(--color-ink)]">
                        <div className="flex items-start gap-3">
                            <Crown strokeWidth={1.5} className="w-5 h-5 mt-0.5 flex-shrink-0 text-[var(--color-accent)]" />
                            <div>
                                <h3 className="font-bold text-lg">Plan PRO</h3>
                                <p className="text-[var(--color-muted)] text-sm mt-1">
                                    Eliminá los límites, accedé a IA avanzada y obtené soporte prioritario.
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="flex flex-col gap-3 pt-2">
                        <button
                            onClick={() => {
                                onClose();
                                router.push('/precios');
                            }}
                            className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-[var(--color-ink)] text-[var(--color-paper)] rounded-full hover:bg-[var(--color-ink-2)] transition-colors font-medium group"
                        >
                            <Rocket strokeWidth={1.5} className="w-5 h-5" />
                            Ver Planes y Precios
                        </button>
                        <button
                            onClick={onClose}
                            className="text-[var(--color-muted)] text-sm hover:text-[var(--color-ink-2)] transition-colors text-center"
                        >
                            Cancelar
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
