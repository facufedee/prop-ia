
import { Property } from "@/ui/components/tables/PropertiesTable";
import Link from "next/link";
import { MapPin, Ruler, BedDouble, Bath, Car, Trash2, Edit, Printer, Share2 } from "lucide-react";

interface PropertyCardProps {
    property: Property;
    onDelete: (id: string) => void;
}

export default function PropertyCard({ property, onDelete }: PropertyCardProps) {
    const formatPrice = (currency: string, price: number) => {
        return new Intl.NumberFormat('es-AR', {
            style: 'currency',
            currency: currency,
            maximumFractionDigits: 0
        }).format(price);
    };

    const getOperationColor = (type: string) => {
        switch (type) {
            case 'Venta': return 'bg-green-100 text-green-700 border-green-200';
            case 'Alquiler': return 'bg-blue-100 text-blue-700 border-blue-200';
            case 'Alquiler Temporal': return 'bg-purple-100 text-purple-700 border-purple-200';
            default: return 'bg-gray-100 text-gray-700 border-gray-200';
        }
    };

    return (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden hover:shadow-lg transition-all duration-200 group flex flex-col h-full">
            {/* Image Header */}
            <div className="relative h-48 bg-gray-100">
                {property.imageUrls && property.imageUrls.length > 0 ? (
                    <img
                        src={property.imageUrls[0]}
                        alt={property.title}
                        className="w-full h-full object-cover"
                        loading="lazy"
                    />
                ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-400">
                        <span className="text-sm">Sin imagen</span>
                    </div>
                )}

                <div className="absolute top-3 right-3 flex gap-2">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-semibold border shadow-sm ${getOperationColor(property.operation_type)}`}>
                        {property.operation_type}
                    </span>
                </div>
            </div>

            {/* Content */}
            <div className="p-4 flex-1 flex flex-col">
                <div className="flex-1">
                    <div className="flex items-start justify-between mb-2">
                        <h3 className="font-bold text-gray-900 line-clamp-1 text-lg mb-1" title={property.title}>
                            {property.title || "Sin título"}
                        </h3>
                    </div>

                    <div className="flex items-center text-gray-500 text-sm mb-4">
                        <MapPin className="w-4 h-4 mr-1 flex-shrink-0" />
                        <span className="truncate">{property.localidad}, {property.provincia}</span>
                    </div>

                    <div className="text-xl font-bold text-indigo-600 mb-4">
                        {property.currency} {property.price?.toLocaleString('es-AR')}
                    </div>

                    <div className="grid grid-cols-3 gap-2 py-3 border-t border-gray-100 text-xs text-gray-500">
                        <div className="flex items-center gap-1" title="Superficie Cubierta">
                            <Ruler className="w-4 h-4" />
                            <span>{property.area_covered}m²</span>
                        </div>
                        {/* We could add bedrooms/bathrooms here if available in the Property interface later */}
                    </div>
                </div>

                <div className="pt-4 mt-auto border-t border-gray-100 flex items-center justify-between gap-1">
                    <div className="flex gap-1">
                        <Link
                            href={`/print/propiedades/${property.id}?mode=horizontal`}
                            target="_blank"
                            className="p-2 rounded-lg text-gray-600 hover:bg-gray-100 hover:text-indigo-600 transition-colors"
                            title="Imprimir Ficha (Cartelera)"
                        >
                            <Printer className="w-5 h-5" />
                        </Link>
                        <Link
                            href={`/print/propiedades/${property.id}?mode=vertical`}
                            target="_blank"
                            className="p-2 rounded-lg text-gray-600 hover:bg-gray-100 hover:text-green-600 transition-colors"
                            title="Enviar Ficha (WhatsApp)"
                        >
                            <Share2 className="w-5 h-5" />
                        </Link>
                    </div>
                    <Link
                        href={`/dashboard/propiedades/editar/${property.id}`}
                        className="flex-1 text-center px-4 py-2 rounded-lg bg-gray-50 text-gray-700 font-medium hover:bg-gray-100 transition-colors text-sm"
                    >
                        Editar
                    </Link>
                    <button
                        onClick={() => onDelete(property.id)}
                        className="p-2 rounded-lg text-red-600 hover:bg-red-50 transition-colors"
                        title="Eliminar propiedad"
                    >
                        <Trash2 className="w-5 h-5" />
                    </button>
                </div>
            </div>
        </div>
    );
}
