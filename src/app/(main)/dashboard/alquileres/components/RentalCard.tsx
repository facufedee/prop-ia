import { Alquiler } from "@/domain/models/Alquiler";
import Link from "next/link";
import { formatCurrency } from "@/ui/utils/format";
import { Calendar, User, DollarSign, MapPin } from "lucide-react";

interface RentalCardProps {
    contract: Alquiler;
    onDelete: (id: string) => void;
}

export default function RentalCard({ contract, onDelete }: RentalCardProps) {
    const getStatusColor = (status: string) => {
        switch (status) {
            case 'activo': return 'bg-[var(--color-positive-soft)] text-[var(--color-positive)] border-[var(--color-positive)]/30';
            case 'pendiente': return 'bg-[var(--color-warning-soft)] text-[var(--color-warning)] border-[var(--color-warning)]/30';
            case 'finalizado': return 'bg-[var(--color-paper-3)] text-[var(--color-ink)] border-[var(--color-rule)]';
            default: return 'bg-[var(--color-paper-3)] text-[var(--color-ink)] border-[var(--color-rule)]';
        }
    };

    const getStatusLabel = (status: string) => {
        return status.charAt(0).toUpperCase() + status.slice(1);
    };

    return (
        <Link href={`/dashboard/alquileres/${contract.id}`} className="block">
            <div className="bg-[var(--color-paper-2)] rounded-xl border border-[var(--color-rule)] p-5 hover:shadow-md transition-shadow cursor-pointer h-full flex flex-col justify-between">
                <div>
                    <div className="flex justify-between items-start mb-3">
                        <div className="flex items-start gap-2">
                            <div className="p-2 bg-[var(--color-paper-3)] rounded-full shrink-0">
                                <MapPin strokeWidth={1.5} className="w-5 h-5 text-[var(--color-muted)]" />
                            </div>
                            <div>
                                <h3 className="font-semibold text-[var(--color-ink)] line-clamp-1">{contract.direccion}</h3>
                                <p className="text-sm text-[var(--color-muted)]">{contract.propiedadTipo}</p>
                            </div>
                        </div>
                        <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium border ${getStatusColor(contract.estado)}`}>
                            {getStatusLabel(contract.estado)}
                        </span>
                    </div>

                    <div className="space-y-2 mb-4">
                        <div className="flex items-center text-sm text-[var(--color-ink-2)]">
                            <User strokeWidth={1.5} className="w-4 h-4 mr-2 text-[var(--color-neutral)]" />
                            <span className="truncate">{contract.nombreInquilino}</span>
                        </div>
                        <div className="flex items-center text-sm text-[var(--color-ink-2)]">
                            <Calendar strokeWidth={1.5} className="w-4 h-4 mr-2 text-[var(--color-neutral)]" />
                            <span>Vence: {new Date(contract.fechaFin as any).toLocaleDateString()}</span>
                        </div>
                        <div className="flex items-center text-sm font-medium text-[var(--color-ink)]">
                            <DollarSign strokeWidth={1.5} className="w-4 h-4 mr-2 text-[var(--color-neutral)]" />
                            <span>{formatCurrency(contract.montoMensual)}</span>
                            {contract.ajusteTipo === 'ICL' && <span className="text-xs text-[var(--color-muted)] ml-1">(ajustable ICL)</span>}
                        </div>
                    </div>
                </div>

                {/* Optional: Add footer actions if needed, for now just the card is clickable */}
                {/* <div className="pt-4 border-t border-[var(--color-rule-2)] flex justify-end">
                    <button 
                        onClick={(e) => {
                            e.preventDefault(); // Prevent navigation
                            onDelete(contract.id);
                        }}
                        className="text-sm text-[var(--color-danger)] hover:text-[var(--color-danger)] font-medium"
                    >
                        Eliminar
                    </button>
                </div> */}
            </div>
        </Link>
    );
}
