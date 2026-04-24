"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import NextImage from "next/image";
import { PublicProperty } from "@/infrastructure/services/publicService";
import { MapPin, Bath, Bed, Maximize, Home, ChevronLeft, ChevronRight, Heart, PlayCircle } from "lucide-react";
import { useSite } from "@/app/sites/[slug]/SiteProvider";

interface PropertyPublicCardProps {
    property: PublicProperty;
    basePath?: string;
}

function getYouTubeId(url: string) {
    const m = url.match(/(?:youtu\.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([\w-]{11})/);
    return m ? m[1] : null;
}

export default function PropertyPublicCard({ property, basePath: propBasePath }: PropertyPublicCardProps) {
    const { basePath: contextBasePath } = useSite();
    const basePath = propBasePath || contextBasePath || "";
    const [currentImageIndex, setCurrentImageIndex] = useState(0);
    const [isFav, setIsFav] = useState(false);
    const touchStartX = useRef<number | null>(null);

    // Build media list: images + YouTube thumbnail at end
    const ytId = property.video_url ? getYouTubeId(property.video_url) : null;
    const mediaItems = [
        ...(property.imageUrls?.map(url => ({ type: "image" as const, url })) || []),
        ...(ytId ? [{ type: "video" as const, url: `https://img.youtube.com/vi/${ytId}/hqdefault.jpg`, ytId }] : []),
    ];
    const total = mediaItems.length;

    useEffect(() => {
        setIsFav(!!localStorage.getItem(`fav_${property.id}`));
    }, [property.id]);

    const toggleFav = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (isFav) {
            localStorage.removeItem(`fav_${property.id}`);
            // Remove full saved entry too
            localStorage.removeItem(`fav_data_${property.id}`);
        } else {
            localStorage.setItem(`fav_${property.id}`, "1");
            // Persist minimal data for the favorites page
            localStorage.setItem(`fav_data_${property.id}`, JSON.stringify({
                id: property.id,
                title: property.title,
                price: property.price,
                currency: property.currency,
                operation_type: property.operation_type,
                localidad: property.localidad,
                provincia: property.provincia,
                imageUrl: property.imageUrls?.[0] || "",
                basePath,
            }));
        }
        setIsFav(!isFav);
    };

    const nextImage = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (total > 1) setCurrentImageIndex((p) => (p + 1) % total);
    };

    const prevImage = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (total > 1) setCurrentImageIndex((p) => (p - 1 + total) % total);
    };

    // Touch swipe
    const onTouchStart = (e: React.TouchEvent) => {
        touchStartX.current = e.touches[0].clientX;
    };
    const onTouchEnd = (e: React.TouchEvent) => {
        if (touchStartX.current === null) return;
        const diff = touchStartX.current - e.changedTouches[0].clientX;
        if (Math.abs(diff) > 40) {
            if (diff > 0) setCurrentImageIndex((p) => (p + 1) % total);
            else setCurrentImageIndex((p) => (p - 1 + total) % total);
        }
        touchStartX.current = null;
    };

    const formatPrice = (currency: string, price: number) =>
        new Intl.NumberFormat("es-AR", { style: "currency", currency, maximumFractionDigits: 0 }).format(price);

    const currentMedia = mediaItems[currentImageIndex];

    return (
        <Link href={basePath ? `${basePath}/propiedades/${property.id}` : `/propiedades/p/${property.id}`}
            className="group block bg-white rounded-2xl overflow-hidden border border-gray-100 hover:shadow-xl transition-all duration-300">

            {/* Image Container */}
            <div className="relative aspect-[4/3] bg-gray-200 overflow-hidden"
                onTouchStart={onTouchStart}
                onTouchEnd={onTouchEnd}
            >
                {total > 0 ? (
                    <>
                        {/* Slider Track */}
                        <div
                            className="flex h-full transition-transform duration-300 ease-out"
                            style={{ transform: `translateX(-${currentImageIndex * 100}%)` }}
                        >
                            {mediaItems.map((item, idx) => (
                                <div key={idx} className="relative w-full h-full flex-shrink-0">
                                    <NextImage
                                        src={item.url}
                                        alt={`${property.title} - Foto ${idx + 1}`}
                                        fill
                                        className={`object-cover ${property.status === "sold" ? "grayscale opacity-90" : ""}`}
                                        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                                        priority={idx === 0}
                                    />
                                    {item.type === "video" && (
                                        <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                                            <PlayCircle className="w-12 h-12 text-white drop-shadow-lg" />
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>

                        {/* Carousel Controls */}
                        {total > 1 && (
                            <>
                                <button
                                    onClick={prevImage}
                                    aria-label="Imagen anterior"
                                    className="absolute left-2 top-1/2 -translate-y-1/2 p-1.5 bg-white/85 rounded-full shadow-sm
                                        opacity-0 group-hover:opacity-100 sm:opacity-0 sm:group-hover:opacity-100
                                        transition-opacity hover:bg-white text-gray-700 z-10"
                                >
                                    <ChevronLeft className="w-5 h-5" />
                                </button>
                                <button
                                    onClick={nextImage}
                                    aria-label="Siguiente imagen"
                                    className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 bg-white/85 rounded-full shadow-sm
                                        opacity-0 group-hover:opacity-100 sm:opacity-0 sm:group-hover:opacity-100
                                        transition-opacity hover:bg-white text-gray-700 z-10"
                                >
                                    <ChevronRight className="w-5 h-5" />
                                </button>

                                {/* Dots — always visible on mobile */}
                                <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1 z-10
                                    opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity" aria-hidden="true">
                                    {mediaItems.slice(0, 6).map((_, idx) => (
                                        <div
                                            key={idx}
                                            className={`w-1.5 h-1.5 rounded-full shadow-sm transition-colors ${idx === currentImageIndex ? "bg-white" : "bg-white/50"}`}
                                        />
                                    ))}
                                    {total > 6 && <div className="w-1.5 h-1.5 rounded-full bg-white/50" />}
                                </div>
                            </>
                        )}
                    </>
                ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-400">
                        <Home className="w-12 h-12 opacity-50" />
                    </div>
                )}

                {/* Favorites button */}
                <button
                    onClick={toggleFav}
                    aria-label={isFav ? "Quitar de favoritos" : "Guardar en favoritos"}
                    className={`absolute top-3 right-3 z-10 p-2 rounded-full shadow-md transition-all active:scale-90
                        ${isFav ? "bg-red-500 text-white" : "bg-white/90 text-gray-500 hover:text-red-500"}`}
                >
                    <Heart className={`w-4 h-4 ${isFav ? "fill-current" : ""}`} />
                </button>

                {/* Operation Tag */}
                <span className={`absolute top-3 left-3 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider shadow-sm z-10 ${property.status === "sold"
                    ? "bg-red-100 text-red-600 border border-red-200"
                    : property.operation_type === "Venta"
                        ? "bg-green-500 text-white"
                        : property.operation_type === "Alquiler"
                            ? "bg-blue-600 text-white"
                            : "bg-purple-600 text-white"
                    }`}>
                    {property.status === "sold" ? "VENDIDA" : property.operation_type}
                </span>

                {/* Price Tag */}
                <div className="absolute bottom-3 left-3 bg-white/95 backdrop-blur-sm px-3 py-1.5 rounded-lg shadow-sm z-10">
                    <p className="font-bold text-gray-900">
                        {property.hidePrice || Number(property.price) === 0 ? "Consultar Precio" : `${property.currency} ${Number(property.price)?.toLocaleString("es-AR")}`}
                    </p>
                </div>
            </div>

            {/* Content */}
            <div className="p-5">
                {property.agency && (
                    <div className="flex items-center gap-2 mb-3">
                        <div className="relative w-6 h-6 rounded-full bg-gray-100 overflow-hidden shrink-0">
                            {property.agency.photoURL ? (
                                <NextImage src={property.agency.photoURL} alt={property.agency.displayName} fill className="object-cover" sizes="24px" />
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
                    {property.calle ? `${property.calle} ${property.altura || ""}` : property.title}
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

                {(Boolean(property.area_covered) || Boolean(property.rooms) || Boolean(property.bathrooms)) && (
                    <div className="flex flex-wrap gap-4 py-3 border-t border-gray-100">
                        {Number(property.area_covered) > 0 && (
                            <div className="flex flex-col items-center justify-center text-center">
                                <div className="flex items-center gap-1 text-gray-400 mb-1"><Maximize className="w-3.5 h-3.5" /></div>
                                <span className="text-xs font-semibold text-gray-700">{property.area_covered} m²</span>
                            </div>
                        )}
                        {Number(property.rooms) > 0 && (
                            <div className={`flex flex-col items-center justify-center text-center ${Number(property.area_covered) > 0 ? "pl-4 border-l border-gray-100" : ""}`}>
                                <div className="flex items-center gap-1 text-gray-400 mb-1"><Bed className="w-3.5 h-3.5" /></div>
                                <span className="text-xs font-semibold text-gray-700">{property.rooms} Amb.</span>
                            </div>
                        )}
                        {Number(property.bathrooms) > 0 && (
                            <div className={`flex flex-col items-center justify-center text-center ${Number(property.area_covered) > 0 || Number(property.rooms) > 0 ? "pl-4 border-l border-gray-100" : ""}`}>
                                <div className="flex items-center gap-1 text-gray-400 mb-1"><Bath className="w-3.5 h-3.5" /></div>
                                <span className="text-xs font-semibold text-gray-700">{property.bathrooms} Baños</span>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </Link>
    );
}
