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
            case 'activo': return 'bg-green-100 text-green-800 border-green-200';
            case 'pendiente': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
            case 'finalizado': return 'bg-gray-100 text-gray-800 border-gray-200';
            default: return 'bg-gray-100 text-gray-800 border-gray-200';
        }
    };

    const getStatusLabel = (status: string) => {
        return status.charAt(0).toUpperCase() + status.slice(1);
    };

    return (
        <Link href={`/dashboard/alquileres/${contract.id}`} className="block">
            <div className="bg-white rounded-xl border border-gray-200 p-5 hover:shadow-md transition-shadow cursor-pointer h-full flex flex-col justify-between">
                <div>
                    <div className="flex justify-between items-start mb-3">
                        <div className="flex items-start gap-2">
                            <div className="p-2 bg-indigo-50 rounded-lg shrink-0">
                                <MapPin className="w-5 h-5 text-indigo-600" />
                            </div>
                            <div>
                                <h3 className="font-semibold text-gray-900 line-clamp-1">{contract.direccion}</h3>
                                <p className="text-sm text-gray-500">{contract.propiedadTipo}</p>
                            </div>
                        </div>
                        <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium border ${getStatusColor(contract.estado)}`}>
                            {getStatusLabel(contract.estado)}
                        </span>
                    </div>

                    <div className="space-y-2 mb-4">
                        <div className="flex items-center text-sm text-gray-600">
                            <User className="w-4 h-4 mr-2 text-gray-400" />
                            <span className="truncate">{contract.nombreInquilino}</span>
                        </div>
                        <div className="flex items-center text-sm text-gray-600">
                            <Calendar className="w-4 h-4 mr-2 text-gray-400" />
                            <span>Vence: {new Date(contract.fechaFin as any).toLocaleDateString()}</span>
                        </div>
                        <div className="flex items-center text-sm font-medium text-gray-900">
                            <DollarSign className="w-4 h-4 mr-2 text-gray-400" />
                            <span>{formatCurrency(contract.montoMensual)}</span>
                            {contract.ajusteTipo === 'ICL' && <span className="text-xs text-gray-500 ml-1">(ajustable ICL)</span>}
                        </div>
                    </div>
                </div>

                {/* Optional: Add footer actions if needed, for now just the card is clickable */}
                {/* <div className="pt-4 border-t border-gray-100 flex justify-end">
                    <button 
                        onClick={(e) => {
                            e.preventDefault(); // Prevent navigation
                            onDelete(contract.id);
                        }}
                        className="text-sm text-red-600 hover:text-red-700 font-medium"
                    >
                        Eliminar
                    </button>
                </div> */}
            </div>
        </Link>
    );
}
