import { useState } from "react";
import Link from "next/link";
import { PublicProperty } from "@/infrastructure/services/publicService";
import { MapPin, Bath, Bed, Maximize, Home, ChevronLeft, ChevronRight } from "lucide-react";

interface PropertyPublicCardProps {
    property: PublicProperty;
}

export default function PropertyPublicCard({ property }: PropertyPublicCardProps) {
    const [currentImageIndex, setCurrentImageIndex] = useState(0);

    const formatPrice = (currency: string, price: number) => {
        return new Intl.NumberFormat('es-AR', { style: 'currency', currency: currency, maximumFractionDigits: 0 }).format(price);
    };

    const nextImage = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (property.imageUrls && property.imageUrls.length > 0) {
            setCurrentImageIndex((prev) => (prev + 1) % property.imageUrls.length);
        }
    };

    const prevImage = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (property.imageUrls && property.imageUrls.length > 0) {
            setCurrentImageIndex((prev) => (prev - 1 + property.imageUrls.length) % property.imageUrls.length);
        }
    };

    return (
        <Link href={`/propiedades/p/${property.id}`} className="group block bg-white rounded-2xl overflow-hidden border border-gray-100 hover:shadow-xl transition-all duration-300">
            {/* Image Container */}
            <div className="relative aspect-[4/3] bg-gray-200 overflow-hidden">
                {property.imageUrls && property.imageUrls.length > 0 ? (
                    <>
                        {/* Slider Track */}
                        <div
                            className="flex h-full transition-transform duration-300 ease-out"
                            style={{ transform: `translateX(-${currentImageIndex * 100}%)` }}
                        >
                            {property.imageUrls.map((url, idx) => (
                                <img
                                    key={idx}
                                    src={url}
                                    alt={`${property.title} ${property.operation_type} en ${property.localidad} - Foto ${idx + 1}`}
                                    className={`w-full h-full object-cover flex-shrink-0 ${property.status === 'sold' ? 'grayscale opacity-90' : ''}`}
                                />
                            ))}
                        </div>

                        {/* Carousel Controls (Visible on Hover) */}
                        {property.imageUrls.length > 1 && (
                            <>
                                <button
                                    onClick={prevImage}
                                    className="absolute left-2 top-1/2 -translate-y-1/2 p-1 bg-white/80 rounded-full shadow-sm opacity-0 group-hover:opacity-100 transition-opacity hover:bg-white text-gray-700 hover:text-indigo-600 z-10"
                                >
                                    <ChevronLeft className="w-5 h-5" />
                                </button>
                                <button
                                    onClick={nextImage}
                                    className="absolute right-2 top-1/2 -translate-y-1/2 p-1 bg-white/80 rounded-full shadow-sm opacity-0 group-hover:opacity-100 transition-opacity hover:bg-white text-gray-700 hover:text-indigo-600 z-10"
                                >
                                    <ChevronRight className="w-5 h-5" />
                                </button>

                                {/* Dots Indicator */}
                                <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1 z-10 opacity-0 group-hover:opacity-100 transition-opacity">
                                    {property.imageUrls.slice(0, 5).map((_, idx) => (
                                        <div
                                            key={idx}
                                            className={`w-1.5 h-1.5 rounded-full shadow-sm transition-colors ${idx === currentImageIndex ? 'bg-white' : 'bg-white/50'}`}
                                        />
                                    ))}
                                    {property.imageUrls.length > 5 && <div className="w-1.5 h-1.5 rounded-full bg-white/50" />}
                                </div>
                            </>
                        )}
                    </>
                ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-400">
                        <Home className="w-12 h-12 opacity-50" />
                    </div>
                )}

                {/* Operation Tag */}
                <span className={`absolute top-3 left-3 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider shadow-sm z-10 ${property.status === 'sold'
                    ? 'bg-red-100 text-red-600 border border-red-200'
                    : property.operation_type === 'Venta'
                        ? 'bg-green-500 text-white'
                        : property.operation_type === 'Alquiler'
                            ? 'bg-blue-600 text-white'
                            : 'bg-purple-600 text-white'
                    }`}>
                    {property.status === 'sold' ? 'VENDIDA' : property.operation_type}
                </span>

                {/* Price Tag */}
                <div className="absolute bottom-3 left-3 bg-white/95 backdrop-blur-sm px-3 py-1.5 rounded-lg shadow-sm z-10">
                    <p className="font-bold text-gray-900">
                        {property.currency} {Number(property.price)?.toLocaleString('es-AR')}
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
                        <span className="text-xs text-gray-500 font-medium truncate">
                            Publicado por {property.agency.displayName}
                        </span>
                    </div>
                )}

                <h3 className="font-semibold text-gray-900 mb-1 line-clamp-1 group-hover:text-indigo-600 transition-colors">
                    {property.calle ? `${property.calle} ${property.altura || ''}` : property.title}
                </h3>

                <div className="flex items-center gap-2 text-gray-500 text-sm mb-4">
                    <MapPin className="w-3.5 h-3.5" />
                    <span className="truncate">{property.localidad}, {property.provincia}</span>
                    {property.code && (
                        <span className="ml-auto text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded font-mono">
                            {property.code}
                        </span>
                    )}
                </div>

                {/* Specs Grid - Only show populated fields */}
                {(Boolean(property.area_covered) || Boolean(property.rooms) || Boolean(property.bathrooms)) && (
                    <div className="flex flex-wrap gap-4 py-3 border-t border-gray-100">
                        {Number(property.area_covered) > 0 && (
                            <div className="flex flex-col items-center justify-center text-center">
                                <div className="flex items-center gap-1 text-gray-400 mb-1">
                                    <Maximize className="w-3.5 h-3.5" />
                                </div>
                                <span className="text-xs font-semibold text-gray-700">{property.area_covered} m²</span>
                            </div>
                        )}

                        {Number(property.rooms) > 0 && (
                            <div className={`flex flex-col items-center justify-center text-center ${Number(property.area_covered) > 0 ? 'pl-4 border-l border-gray-100' : ''}`}>
                                <div className="flex items-center gap-1 text-gray-400 mb-1">
                                    <Bed className="w-3.5 h-3.5" />
                                </div>
                                <span className="text-xs font-semibold text-gray-700">{property.rooms} Amb.</span>
                            </div>
                        )}

                        {Number(property.bathrooms) > 0 && (
                            <div className={`flex flex-col items-center justify-center text-center ${Number(property.area_covered) > 0 || Number(property.rooms) > 0 ? 'pl-4 border-l border-gray-100' : ''}`}>
                                <div className="flex items-center gap-1 text-gray-400 mb-1">
                                    <Bath className="w-3.5 h-3.5" />
                                </div>
                                <span className="text-xs font-semibold text-gray-700">{property.bathrooms} Baños</span>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </Link>
    );
}
