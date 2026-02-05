"use client";

import { useState } from "react";
import Link from "next/link";
import { PublicProperty } from "@/infrastructure/services/publicService";
import { MapPin, Bath, Bed, Maximize, Heart, Share2, ChevronLeft, ChevronRight, MessageCircle } from "lucide-react";

interface PropertyHorizontalCardProps {
    property: PublicProperty;
}

export default function PropertyHorizontalCard({ property }: PropertyHorizontalCardProps) {
    const [currentImageIndex, setCurrentImageIndex] = useState(0);

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
        <Link href={`/propiedades/p/${property.id}`} className="group flex flex-col sm:flex-row bg-white rounded-2xl overflow-hidden border border-gray-200 hover:shadow-xl hover:border-indigo-200 transition-all duration-300 h-auto sm:h-[280px]">
            {/* Image Slider (Left Side) */}
            <div className="relative w-full sm:w-[320px] lg:w-[360px] h-[240px] sm:h-full bg-gray-200 shrink-0">
                {property.imageUrls && property.imageUrls.length > 0 ? (
                    <>
                        <div className="absolute inset-0">
                            <img
                                src={property.imageUrls[currentImageIndex]}
                                alt={property.title}
                                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                            />
                        </div>

                        {/* Overlay Gradient */}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent opacity-60"></div>

                        {/* Controls */}
                        {property.imageUrls.length > 1 && (
                            <>
                                <button onClick={prevImage} className="absolute left-2 top-1/2 -translate-y-1/2 p-1.5 bg-black/30 hover:bg-black/50 text-white rounded-full backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity z-10">
                                    <ChevronLeft size={16} />
                                </button>
                                <button onClick={nextImage} className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 bg-black/30 hover:bg-black/50 text-white rounded-full backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity z-10">
                                    <ChevronRight size={16} />
                                </button>
                            </>
                        )}

                        <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-1.5">
                            {property.imageUrls.slice(0, 5).map((_, i) => (
                                <div key={i} className={`w-1.5 h-1.5 rounded-full shadow-sm ${i === currentImageIndex ? 'bg-white' : 'bg-white/40'}`} />
                            ))}
                        </div>
                    </>
                ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gray-100">
                        <Building2 className="w-12 h-12 text-gray-300" />
                    </div>
                )}

                {/* Tags */}
                <div className="absolute top-3 left-3 flex gap-2">
                    <span className={`px-2.5 py-1 rounded-md text-xs font-bold uppercase tracking-wide backdrop-blur-md ${property.operation_type === 'Venta' ? 'bg-green-500/90 text-white' :
                        property.operation_type === 'Alquiler' ? 'bg-blue-600/90 text-white' : 'bg-purple-600/90 text-white'
                        }`}>
                        {property.operation_type}
                    </span>
                    {property.status === 'reserved' && (
                        <span className="px-2.5 py-1 rounded-md text-xs font-bold uppercase tracking-wide bg-yellow-500/90 text-white backdrop-blur-md">
                            Reservado
                        </span>
                    )}
                </div>
            </div>

            {/* Content (Right Side) */}
            <div className="flex-1 p-5 lg:p-6 flex flex-col justify-between relative">

                {/* Header */}
                <div className="pr-8">
                    <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">
                        {property.type || "Propiedad"} en {property.localidad}
                    </p>
                    <h3 className="text-lg lg:text-xl font-bold text-gray-900 group-hover:text-indigo-600 transition-colors line-clamp-1 mb-2">
                        {property.calle ? `${property.calle} ${property.altura || ''}` : property.title}
                    </h3>
                    <div className="flex items-center gap-1 text-gray-500 text-sm mb-4">
                        <MapPin className="w-4 h-4 text-indigo-500" />
                        <span className="truncate max-w-[200px] lg:max-w-none">{property.address || property.localidad}, {property.provincia}</span>
                    </div>
                </div>

                {/* Features */}
                <div className="flex flex-wrap gap-4 text-sm text-gray-600 border-b border-gray-100 pb-4 mb-4">
                    {Number(property.area_covered) > 0 && (
                        <div className="flex items-center gap-1.5">
                            <Maximize className="w-4 h-4 text-gray-400" />
                            <span className="font-semibold text-gray-900">{property.area_covered}</span> m²
                        </div>
                    )}
                    {Number(property.rooms) > 0 && (
                        <div className="flex items-center gap-1.5 pl-4 border-l border-gray-200">
                            <Bed className="w-4 h-4 text-gray-400" />
                            <span className="font-semibold text-gray-900">{property.rooms}</span> Amb.
                        </div>
                    )}
                    {Number(property.bathrooms) > 0 && (
                        <div className="flex items-center gap-1.5 pl-4 border-l border-gray-200">
                            <Bath className="w-4 h-4 text-gray-400" />
                            <span className="font-semibold text-gray-900">{property.bathrooms}</span> Baños
                        </div>
                    )}
                </div>

                {/* Price and Actions */}
                <div className="flex items-end justify-between mt-auto">
                    <div>
                        <p className="text-xs text-gray-500 font-medium mb-0.5">Precio</p>
                        <p className="text-2xl font-bold text-gray-900">
                            {property.currency} {Number(property.price).toLocaleString('es-AR')}
                        </p>
                    </div>

                    <div className="flex gap-2">
                        <button onClick={(e) => { e.preventDefault(); /* Like logic */ }} className="p-2 rounded-full border border-gray-200 text-gray-400 hover:text-red-500 hover:border-red-200 hover:bg-red-50 transition-colors">
                            <Heart className="w-5 h-5" />
                        </button>
                        <button className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-bold shadow-sm shadow-indigo-200 transition-colors">
                            <MessageCircle className="w-4 h-4" />
                            Contactar
                        </button>
                    </div>
                </div>
            </div>
        </Link>
    );
}

import { Building2 } from "lucide-react";
