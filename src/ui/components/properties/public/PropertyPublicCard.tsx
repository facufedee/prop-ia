import Link from "next/link";
import { PublicProperty } from "@/infrastructure/services/publicService";
import { MapPin, Bath, Bed, Maximize, Home } from "lucide-react";

interface PropertyPublicCardProps {
    property: PublicProperty;
}

export default function PropertyPublicCard({ property }: PropertyPublicCardProps) {
    const formatPrice = (currency: string, price: number) => {
        return new Intl.NumberFormat('es-AR', { style: 'currency', currency: currency, maximumFractionDigits: 0 }).format(price);
    };

    return (
        <Link href={`/propiedades/p/${property.id}`} className="group block bg-white rounded-2xl overflow-hidden border border-gray-100 hover:shadow-xl transition-all duration-300">
            {/* Image Container */}
            <div className="relative aspect-[4/3] bg-gray-200 overflow-hidden">
                {property.imageUrls && property.imageUrls.length > 0 ? (
                    <img
                        src={property.imageUrls[0]}
                        alt={property.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-400">
                        <Home className="w-12 h-12 opacity-50" />
                    </div>
                )}

                {/* Operation Tag */}
                <span className={`absolute top-3 left-3 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${property.operation_type === 'Venta' ? 'bg-green-500 text-white' :
                        property.operation_type === 'Alquiler' ? 'bg-blue-600 text-white' : 'bg-purple-600 text-white'
                    }`}>
                    {property.operation_type}
                </span>

                {/* Price Tag */}
                <div className="absolute bottom-3 left-3 bg-white/95 backdrop-blur-sm px-3 py-1.5 rounded-lg shadow-sm">
                    <p className="font-bold text-gray-900">
                        {property.currency} {property.price?.toLocaleString('es-AR')}
                    </p>
                </div>
            </div>

            {/* Content */}
            <div className="p-5">
                {/* Agency Info (Small) */}
                {property.agency && (
                    <div className="flex items-center gap-2 mb-3">
                        <div className="w-6 h-6 rounded-full bg-gray-100 overflow-hidden shrink-0">
                            {property.agency.photoURL ? (
                                <img src={property.agency.photoURL} alt={property.agency.displayName} className="w-full h-full object-cover" />
                            ) : (
                                <div className="w-full h-full bg-indigo-100 flex items-center justify-center text-[10px] font-bold text-indigo-600">
                                    {property.agency.displayName.substring(0, 2).toUpperCase()}
                                </div>
                            )}
                        </div>
                        <span className="text-xs text-gray-500 font-medium truncate">{property.agency.displayName}</span>
                    </div>
                )}

                <h3 className="font-semibold text-gray-900 mb-1 line-clamp-1 group-hover:text-indigo-600 transition-colors">
                    {property.title}
                </h3>

                <div className="flex items-center gap-1 text-gray-500 text-sm mb-4">
                    <MapPin className="w-3.5 h-3.5" />
                    <span className="truncate">{property.localidad}, {property.provincia}</span>
                </div>

                {/* Specs Grid */}
                <div className="grid grid-cols-3 gap-2 py-3 border-t border-gray-100">
                    <div className="flex flex-col items-center justify-center text-center">
                        <div className="flex items-center gap-1 text-gray-400 mb-1">
                            <Maximize className="w-3.5 h-3.5" />
                        </div>
                        <span className="text-xs font-semibold text-gray-700">{property.area_covered} m²</span>
                    </div>
                    <div className="flex flex-col items-center justify-center text-center border-l border-gray-100">
                        <div className="flex items-center gap-1 text-gray-400 mb-1">
                            <Bed className="w-3.5 h-3.5" />
                        </div>
                        <span className="text-xs font-semibold text-gray-700">{property.rooms || '-'} Amb.</span>
                    </div>
                    <div className="flex flex-col items-center justify-center text-center border-l border-gray-100">
                        <div className="flex items-center gap-1 text-gray-400 mb-1">
                            <Bath className="w-3.5 h-3.5" />
                        </div>
                        <span className="text-xs font-semibold text-gray-700">{property.bathrooms || '-'} Baños</span>
                    </div>
                </div>
            </div>
        </Link>
    );
}
