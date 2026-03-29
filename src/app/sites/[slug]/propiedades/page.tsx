"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Search, MapPin, BedDouble, Bath, SlidersHorizontal, Building2, ChevronLeft } from "lucide-react";
import { useSite } from "../SiteProvider";
import { publicService, PublicProperty } from "@/infrastructure/services/publicService";

const OPERATION_TYPES = ["Todos", "alquiler", "venta", "temporal"];

export default function PropiedadesPage() {
    const { site } = useSite();
    const [properties, setProperties] = useState<PublicProperty[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [operationType, setOperationType] = useState("Todos");

    useEffect(() => {
        if (!site) return;
        publicService.getPropertiesByAgencySlug(site.slug).then((result) => {
            if (result) setProperties(result.properties.filter((p) => p.status === "active"));
            setLoading(false);
        });
    }, [site]);

    if (!site) return null;

    const primary = site.colorPrimario;

    const filtered = properties.filter((p) => {
        const matchesSearch =
            search === "" ||
            p.title.toLowerCase().includes(search.toLowerCase()) ||
            p.localidad?.toLowerCase().includes(search.toLowerCase());
        const matchesType =
            operationType === "Todos" || p.operation_type === operationType;
        return matchesSearch && matchesType;
    });

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <header className="sticky top-0 z-50 bg-white/95 backdrop-blur border-b border-gray-100 shadow-sm">
                <div className="max-w-6xl mx-auto px-5 sm:px-6 h-16 flex items-center justify-between">
                    <Link href="/" className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-900 transition-colors">
                        <ChevronLeft className="w-4 h-4" />
                        {site.nombre}
                    </Link>
                    <span className="font-semibold text-gray-900">Propiedades</span>
                    {site.whatsapp && (
                        <a
                            href={`https://wa.me/${site.whatsapp.replace(/\D/g, "")}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-4 py-2 rounded-xl text-white text-sm font-semibold"
                            style={{ backgroundColor: primary }}
                        >
                            WhatsApp
                        </a>
                    )}
                </div>
            </header>

            <div className="max-w-6xl mx-auto px-5 sm:px-6 py-8">
                {/* Filters */}
                <div className="bg-white rounded-2xl border border-gray-200 p-4 mb-8 flex flex-col sm:flex-row gap-3">
                    <div className="flex items-center gap-2 flex-1 bg-gray-50 rounded-xl px-4 py-2.5">
                        <Search className="w-4 h-4 text-gray-400 flex-shrink-0" />
                        <input
                            type="text"
                            placeholder="Buscar zona, barrio, tipo..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="flex-1 bg-transparent text-sm text-gray-900 placeholder-gray-400 outline-none"
                        />
                    </div>
                    <div className="flex items-center gap-2 overflow-x-auto">
                        {OPERATION_TYPES.map((type) => (
                            <button
                                key={type}
                                onClick={() => setOperationType(type)}
                                className={`px-3 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-all ${
                                    operationType === type
                                        ? "text-white"
                                        : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                                }`}
                                style={operationType === type ? { backgroundColor: primary } : {}}
                            >
                                {type === "Todos" ? "Todos" : type.charAt(0).toUpperCase() + type.slice(1)}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Results count */}
                <p className="text-sm text-gray-500 mb-6">
                    {loading ? "Cargando..." : `${filtered.length} propiedad${filtered.length !== 1 ? "es" : ""} encontrada${filtered.length !== 1 ? "s" : ""}`}
                </p>

                {/* Grid */}
                {!loading && filtered.length === 0 ? (
                    <div className="text-center py-20 text-gray-400">
                        <Building2 className="w-12 h-12 mx-auto mb-3 opacity-40" />
                        <p>No hay propiedades con esos filtros.</p>
                    </div>
                ) : (
                    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                        {filtered.map((prop) => (
                            <Link
                                key={prop.id}
                                href={`/propiedades/${prop.id}`}
                                className="group bg-white rounded-2xl border border-gray-100 overflow-hidden hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
                            >
                                <div className="relative aspect-[4/3] bg-gray-100 overflow-hidden">
                                    {prop.imageUrls?.[0] ? (
                                        <Image
                                            src={prop.imageUrls[0]}
                                            alt={prop.title}
                                            fill
                                            className="object-cover group-hover:scale-105 transition-transform duration-500"
                                            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                                        />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center">
                                            <Building2 className="w-10 h-10 text-gray-300" />
                                        </div>
                                    )}
                                    <div className="absolute top-3 left-3">
                                        <span
                                            className="px-2.5 py-1 text-xs font-bold text-white rounded-full capitalize"
                                            style={{ backgroundColor: primary }}
                                        >
                                            {prop.operation_type}
                                        </span>
                                    </div>
                                </div>
                                <div className="p-5">
                                    {!prop.hidePrice && (
                                        <p className="text-xl font-bold text-gray-900 mb-1">
                                            {prop.currency} {prop.price.toLocaleString("es-AR")}
                                        </p>
                                    )}
                                    <h3 className="text-sm font-semibold text-gray-700 mb-2 line-clamp-2 group-hover:text-indigo-600 transition-colors">
                                        {prop.title}
                                    </h3>
                                    {prop.localidad && (
                                        <p className="flex items-center gap-1.5 text-xs text-gray-500 mb-3">
                                            <MapPin className="w-3.5 h-3.5 flex-shrink-0" />
                                            {prop.localidad}, {prop.provincia}
                                        </p>
                                    )}
                                    <div className="flex items-center gap-4 text-xs text-gray-500 border-t border-gray-50 pt-3">
                                        {prop.rooms > 0 && (
                                            <span className="flex items-center gap-1">
                                                <BedDouble className="w-3.5 h-3.5" /> {prop.rooms} amb.
                                            </span>
                                        )}
                                        {prop.bathrooms > 0 && (
                                            <span className="flex items-center gap-1">
                                                <Bath className="w-3.5 h-3.5" /> {prop.bathrooms} baños
                                            </span>
                                        )}
                                        {prop.area_covered > 0 && <span>{prop.area_covered} m²</span>}
                                    </div>
                                </div>
                            </Link>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
