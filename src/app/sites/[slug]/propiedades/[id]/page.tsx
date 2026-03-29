"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { ChevronLeft, MapPin, BedDouble, Bath, Maximize2, MessageCircle, Phone, Mail, Building2, ChevronRight } from "lucide-react";
import { useSite } from "../../SiteProvider";
import { publicService, PublicProperty } from "@/infrastructure/services/publicService";

export default function PropiedadDetailPage() {
    const { site } = useSite();
    const params = useParams<{ id: string }>();
    const [property, setProperty] = useState<PublicProperty | null>(null);
    const [loading, setLoading] = useState(true);
    const [activeImg, setActiveImg] = useState(0);

    useEffect(() => {
        if (!params?.id) return;
        publicService.getPropertyById(params.id).then((p) => {
            setProperty(p);
            setLoading(false);
        });
    }, [params?.id]);

    if (!site) return null;

    const primary = site.colorPrimario;

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="w-8 h-8 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" />
            </div>
        );
    }

    if (!property) {
        return (
            <div className="min-h-screen flex items-center justify-center text-center px-6">
                <div>
                    <Building2 className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                    <h1 className="text-xl font-bold text-gray-900 mb-2">Propiedad no encontrada</h1>
                    <Link href="/propiedades" className="text-sm font-medium" style={{ color: primary }}>
                        ← Volver al listado
                    </Link>
                </div>
            </div>
        );
    }

    const images = property.imageUrls ?? [];
    const waMessage = encodeURIComponent(`Hola! Me interesa la propiedad: ${property.title}`);
    const waUrl = site.whatsapp
        ? `https://wa.me/${site.whatsapp.replace(/\D/g, "")}?text=${waMessage}`
        : null;

    return (
        <div className="min-h-screen bg-white">
            {/* Header */}
            <header className="sticky top-0 z-50 bg-white/95 backdrop-blur border-b border-gray-100 shadow-sm">
                <div className="max-w-5xl mx-auto px-5 sm:px-6 h-16 flex items-center gap-4">
                    <Link href="/propiedades" className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-900 transition-colors">
                        <ChevronLeft className="w-4 h-4" /> Propiedades
                    </Link>
                    <span className="text-gray-300">·</span>
                    <span className="text-sm text-gray-700 line-clamp-1 flex-1">{property.title}</span>
                </div>
            </header>

            <div className="max-w-5xl mx-auto px-5 sm:px-6 py-8">
                {/* Image gallery */}
                {images.length > 0 ? (
                    <div className="mb-8">
                        <div className="relative aspect-[16/9] rounded-2xl overflow-hidden bg-gray-100 mb-3">
                            <Image
                                src={images[activeImg]}
                                alt={property.title}
                                fill
                                className="object-cover"
                                sizes="(max-width: 1024px) 100vw, 900px"
                                priority
                            />
                            {images.length > 1 && (
                                <>
                                    <button
                                        onClick={() => setActiveImg((i) => Math.max(0, i - 1))}
                                        className="absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 bg-black/40 hover:bg-black/60 text-white rounded-full flex items-center justify-center transition-colors"
                                    >
                                        <ChevronLeft className="w-5 h-5" />
                                    </button>
                                    <button
                                        onClick={() => setActiveImg((i) => Math.min(images.length - 1, i + 1))}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 bg-black/40 hover:bg-black/60 text-white rounded-full flex items-center justify-center transition-colors"
                                    >
                                        <ChevronRight className="w-5 h-5" />
                                    </button>
                                </>
                            )}
                            <div className="absolute bottom-3 right-3 bg-black/50 text-white text-xs px-2.5 py-1 rounded-full">
                                {activeImg + 1} / {images.length}
                            </div>
                        </div>
                        {images.length > 1 && (
                            <div className="flex gap-2 overflow-x-auto pb-1">
                                {images.map((img, i) => (
                                    <button
                                        key={i}
                                        onClick={() => setActiveImg(i)}
                                        className={`relative w-16 h-16 flex-shrink-0 rounded-xl overflow-hidden border-2 transition-all ${i === activeImg ? "opacity-100" : "border-transparent opacity-60 hover:opacity-80"}`}
                                        style={i === activeImg ? { borderColor: primary } : {}}
                                    >
                                        <Image src={img} alt="" fill className="object-cover" sizes="64px" />
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                ) : (
                    <div className="aspect-[16/9] rounded-2xl bg-gray-100 flex items-center justify-center mb-8">
                        <Building2 className="w-16 h-16 text-gray-300" />
                    </div>
                )}

                <div className="grid lg:grid-cols-3 gap-8">
                    {/* Left: details */}
                    <div className="lg:col-span-2">
                        <div className="flex items-start justify-between gap-4 mb-4">
                            <div>
                                <span
                                    className="inline-block px-2.5 py-1 text-xs font-bold text-white rounded-full capitalize mb-3"
                                    style={{ backgroundColor: primary }}
                                >
                                    {property.operation_type}
                                </span>
                                <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">{property.title}</h1>
                            </div>
                            {!property.hidePrice && (
                                <div className="text-right">
                                    <p className="text-2xl font-bold text-gray-900">
                                        {property.currency} {property.price.toLocaleString("es-AR")}
                                    </p>
                                    {property.expenses && (
                                        <p className="text-sm text-gray-500">+ ${property.expenses.toLocaleString("es-AR")} expensas</p>
                                    )}
                                </div>
                            )}
                        </div>

                        {property.localidad && (
                            <p className="flex items-center gap-2 text-gray-500 mb-6">
                                <MapPin className="w-4 h-4 flex-shrink-0" />
                                {[property.address || property.calle, property.localidad, property.provincia].filter(Boolean).join(", ")}
                            </p>
                        )}

                        {/* Stats */}
                        <div className="grid grid-cols-3 gap-4 mb-8">
                            {property.rooms > 0 && (
                                <div className="text-center p-4 bg-gray-50 rounded-xl">
                                    <BedDouble className="w-5 h-5 mx-auto mb-1 text-gray-400" />
                                    <p className="font-bold text-gray-900">{property.rooms}</p>
                                    <p className="text-xs text-gray-500">Ambientes</p>
                                </div>
                            )}
                            {property.bathrooms > 0 && (
                                <div className="text-center p-4 bg-gray-50 rounded-xl">
                                    <Bath className="w-5 h-5 mx-auto mb-1 text-gray-400" />
                                    <p className="font-bold text-gray-900">{property.bathrooms}</p>
                                    <p className="text-xs text-gray-500">Baños</p>
                                </div>
                            )}
                            {property.area_covered > 0 && (
                                <div className="text-center p-4 bg-gray-50 rounded-xl">
                                    <Maximize2 className="w-5 h-5 mx-auto mb-1 text-gray-400" />
                                    <p className="font-bold text-gray-900">{property.area_covered}</p>
                                    <p className="text-xs text-gray-500">m² cubiertos</p>
                                </div>
                            )}
                        </div>

                        {/* Description */}
                        {property.description && (
                            <div>
                                <h2 className="text-lg font-bold text-gray-900 mb-3">Descripción</h2>
                                <p className="text-gray-600 leading-relaxed whitespace-pre-line">{property.description}</p>
                            </div>
                        )}
                    </div>

                    {/* Right: contact card */}
                    <div>
                        <div className="sticky top-24 bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
                            <div className="flex items-center gap-3 mb-6">
                                {site.logoUrl ? (
                                    <Image src={site.logoUrl} alt={site.nombre} width={48} height={48} className="w-12 h-12 object-contain rounded-lg" />
                                ) : (
                                    <div className="w-12 h-12 rounded-lg flex items-center justify-center" style={{ backgroundColor: primary + "20" }}>
                                        <Building2 className="w-6 h-6" style={{ color: primary }} />
                                    </div>
                                )}
                                <div>
                                    <p className="font-bold text-gray-900 text-sm">{site.nombre}</p>
                                    {site.direccion && <p className="text-xs text-gray-500">{site.direccion}</p>}
                                </div>
                            </div>

                            <div className="space-y-3">
                                {waUrl && (
                                    <a
                                        href={waUrl}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="flex items-center justify-center gap-2 w-full py-3 bg-green-500 hover:bg-green-600 text-white rounded-xl font-semibold transition-colors"
                                    >
                                        <MessageCircle className="w-5 h-5" /> Consultar por WhatsApp
                                    </a>
                                )}
                                {site.email && (
                                    <a
                                        href={`mailto:${site.email}?subject=Consulta: ${property.title}`}
                                        className="flex items-center justify-center gap-2 w-full py-3 rounded-xl font-semibold border-2 transition-colors hover:bg-gray-50"
                                        style={{ borderColor: primary, color: primary }}
                                    >
                                        <Mail className="w-5 h-5" /> Enviar email
                                    </a>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
