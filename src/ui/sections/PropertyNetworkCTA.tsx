"use client";

import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { ArrowRight, Building2, MapPin, BedDouble, Bath } from "lucide-react";
import { publicService, PublicProperty } from "@/infrastructure/services/publicService";
import { formatPropertyPrice } from "@/ui/utils/propertyPrice";

export default function PropertyNetworkCTA() {
    const [properties, setProperties] = useState<PublicProperty[]>([]);
    const [paused, setPaused] = useState(false);

    useEffect(() => {
        publicService.getAllProperties().then((all) => {
            // Only those with at least one image, limit to 12
            const withImages = all.filter((p) => p.imageUrls?.length > 0 && p.status === "active").slice(0, 12);
            setProperties(withImages);
        });
    }, []);

    // Duplicate list for seamless infinite loop
    const track = [...properties, ...properties];

    return (
        <section className="py-12 sm:py-16 bg-indigo-50/30 border-y border-indigo-100 relative overflow-hidden">
            {/* Decorative blobs */}
            <div className="absolute top-0 right-0 -mt-20 -mr-20 w-80 h-80 bg-gradient-to-br from-indigo-100 to-purple-100 rounded-full blur-3xl opacity-60 pointer-events-none" />
            <div className="absolute bottom-0 left-0 -mb-20 -ml-20 w-80 h-80 bg-gradient-to-tr from-blue-100 to-indigo-100 rounded-full blur-3xl opacity-60 pointer-events-none" />

            <div className="max-w-7xl mx-auto px-5 sm:px-6 relative z-10">
                {/* Header */}
                <div className="max-w-3xl mx-auto text-center mb-10">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-100 border border-indigo-200 mb-6">
                        <Building2 className="w-4 h-4 text-indigo-700" />
                        <span className="text-xs font-semibold text-indigo-700 uppercase tracking-wide">
                            Red de Inmobiliarias Federal
                        </span>
                    </div>

                    <h2 className="text-3xl md:text-5xl font-bold text-gray-900 mb-4 tracking-tight leading-tight">
                        Encontrá tu próxima propiedad en nuestra{" "}
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600">
                            red de inmobiliarias de toda Argentina
                        </span>
                    </h2>

                    <p className="text-lg text-gray-600 mb-8 max-w-2xl mx-auto leading-relaxed">
                        Catálogo en constante crecimiento con propiedades gestionadas por inmobiliarias de todo el país.
                    </p>

                    <Link
                        href="/propiedades"
                        className="group inline-flex items-center justify-center px-8 py-3.5 text-base font-semibold text-white bg-indigo-600 rounded-xl hover:bg-indigo-700 shadow-lg hover:shadow-indigo-200 hover:-translate-y-0.5 transition-all duration-200"
                    >
                        Explorar Propiedades
                        <ArrowRight className="w-5 h-5 ml-2 transition-transform group-hover:translate-x-1" />
                    </Link>
                </div>
            </div>

            {/* Carousel — full-width, outside the centered container */}
            {properties.length > 0 && (
                <div
                    className="relative overflow-hidden mt-8"
                    onMouseEnter={() => setPaused(true)}
                    onMouseLeave={() => setPaused(false)}
                >
                    {/* Fade edges */}
                    <div className="absolute left-0 top-0 bottom-0 w-24 bg-gradient-to-r from-indigo-50/80 to-transparent z-10 pointer-events-none" />
                    <div className="absolute right-0 top-0 bottom-0 w-24 bg-gradient-to-l from-indigo-50/80 to-transparent z-10 pointer-events-none" />

                    <div
                        className="flex gap-4 w-max"
                        style={{
                            animation: `carousel-scroll ${properties.length * 5}s linear infinite`,
                            animationPlayState: paused ? "paused" : "running",
                        }}
                    >
                        {track.map((prop, i) => (
                            <Link
                                key={`${prop.id}-${i}`}
                                href={`/propiedades/p/${prop.id}`}
                                className="group flex-shrink-0 w-64 bg-white rounded-2xl border border-gray-100 overflow-hidden hover:shadow-xl hover:border-indigo-200 transition-all duration-300 hover:-translate-y-1"
                            >
                                {/* Image */}
                                <div className="relative h-40 bg-gray-100 overflow-hidden">
                                    <Image
                                        src={prop.imageUrls[0]}
                                        alt={prop.title}
                                        fill
                                        className="object-cover group-hover:scale-105 transition-transform duration-500"
                                        sizes="256px"
                                    />
                                    <div className="absolute top-2 left-2">
                                        <span className="px-2 py-0.5 text-xs font-bold text-white bg-indigo-600 rounded-full capitalize">
                                            {prop.operation_type}
                                        </span>
                                    </div>
                                </div>

                                {/* Info */}
                                <div className="p-4">
                                    <p className="text-base font-bold text-gray-900 mb-1">
                                        {formatPropertyPrice(prop.price, prop.currency, prop.hidePrice)}
                                    </p>
                                    <p className="text-sm text-gray-600 line-clamp-1 mb-2">{prop.title}</p>
                                    {prop.localidad && (
                                        <p className="flex items-center gap-1 text-xs text-gray-400 mb-3">
                                            <MapPin className="w-3 h-3 flex-shrink-0" />
                                            {prop.localidad}{prop.provincia ? `, ${prop.provincia}` : ""}
                                        </p>
                                    )}
                                    <div className="flex items-center gap-3 text-xs text-gray-400 border-t border-gray-50 pt-2">
                                        {prop.rooms > 0 && (
                                            <span className="flex items-center gap-1">
                                                <BedDouble className="w-3.5 h-3.5" /> {prop.rooms} amb.
                                            </span>
                                        )}
                                        {prop.bathrooms > 0 && (
                                            <span className="flex items-center gap-1">
                                                <Bath className="w-3.5 h-3.5" /> {prop.bathrooms}
                                            </span>
                                        )}
                                        {prop.area_covered > 0 && (
                                            <span>{prop.area_covered} m²</span>
                                        )}
                                    </div>
                                </div>
                            </Link>
                        ))}
                    </div>
                </div>
            )}

            <style>{`
                @keyframes carousel-scroll {
                    0%   { transform: translateX(0); }
                    100% { transform: translateX(-50%); }
                }
            `}</style>
        </section>
    );
}
