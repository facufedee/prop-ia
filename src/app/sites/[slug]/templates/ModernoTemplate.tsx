"use client";

import Link from "next/link";
import Image from "next/image";
import { Search, MapPin, BedDouble, Bath, ChevronRight, Phone, Mail, MessageCircle, Instagram, Facebook, Building2 } from "lucide-react";
import { Site } from "@/domain/models/Site";
import { PublicProperty } from "@/infrastructure/services/publicService";

function formatPrice(price: number, currency: string) {
    return `${currency} ${price.toLocaleString("es-AR")}`;
}

interface Props {
    site: Site;
    properties: PublicProperty[];
    search: string;
    onSearchChange: (v: string) => void;
}

export default function ModernoTemplate({ site, properties, search, onSearchChange }: Props) {
    const primary = site.colorPrimario;

    const filtered = properties.filter((p) =>
        search === "" ||
        p.title.toLowerCase().includes(search.toLowerCase()) ||
        p.localidad?.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <div className="min-h-screen bg-white font-sans">

            {/* ── Header ── */}
            <header className="sticky top-0 z-50 bg-white/95 backdrop-blur border-b border-gray-100 shadow-sm">
                <div className="max-w-6xl mx-auto px-5 sm:px-6 h-16 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        {site.logoUrl ? (
                            <Image src={site.logoUrl} alt={site.nombre} width={120} height={40} className="h-9 w-auto object-contain" />
                        ) : (
                            <div className="flex items-center gap-2">
                                <Building2 className="w-7 h-7" style={{ color: primary }} />
                                <span className="font-bold text-gray-900 text-lg">{site.nombre}</span>
                            </div>
                        )}
                    </div>
                    <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-gray-600">
                        <Link href="/" className="hover:text-gray-900 transition-colors">Inicio</Link>
                        <Link href="/propiedades" className="hover:text-gray-900 transition-colors">Propiedades</Link>
                        <Link href="/contacto" className="hover:text-gray-900 transition-colors">Contacto</Link>
                    </nav>
                    {site.whatsapp && (
                        <a
                            href={`https://wa.me/${site.whatsapp.replace(/\D/g, "")}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-2 px-4 py-2 rounded-xl text-white text-sm font-semibold transition-all hover:opacity-90"
                            style={{ backgroundColor: primary }}
                        >
                            <MessageCircle className="w-4 h-4" />
                            <span className="hidden sm:inline">WhatsApp</span>
                        </a>
                    )}
                </div>
            </header>

            {/* ── Hero ── */}
            <section
                className="relative py-20 sm:py-28 px-5 sm:px-6 text-white"
                style={{
                    background: site.coverUrl
                        ? `linear-gradient(rgba(0,0,0,0.55),rgba(0,0,0,0.55)) center/cover, url(${site.coverUrl})`
                        : `linear-gradient(135deg, ${site.colorPrimario}, ${site.colorSecundario})`,
                }}
            >
                <div className="max-w-3xl mx-auto text-center">
                    <h1 className="text-4xl sm:text-5xl font-extrabold mb-4 leading-tight drop-shadow">
                        {site.nombre}
                    </h1>
                    {site.descripcion && (
                        <p className="text-lg sm:text-xl text-white/85 mb-10 leading-relaxed">
                            {site.descripcion}
                        </p>
                    )}
                    <div className="flex items-center bg-white rounded-2xl shadow-2xl overflow-hidden max-w-xl mx-auto">
                        <Search className="w-5 h-5 text-gray-400 ml-4 flex-shrink-0" />
                        <input
                            type="text"
                            placeholder="Buscar por zona o propiedad..."
                            value={search}
                            onChange={(e) => onSearchChange(e.target.value)}
                            className="flex-1 px-4 py-4 text-gray-900 placeholder-gray-400 outline-none text-sm"
                        />
                        <Link
                            href={`/propiedades${search ? `?q=${encodeURIComponent(search)}` : ""}`}
                            className="m-2 px-5 py-2.5 rounded-xl text-white text-sm font-semibold transition-all hover:opacity-90"
                            style={{ backgroundColor: primary }}
                        >
                            Buscar
                        </Link>
                    </div>
                </div>
            </section>

            {/* ── Featured Properties ── */}
            <section className="py-16 sm:py-20 px-5 sm:px-6">
                <div className="max-w-6xl mx-auto">
                    <div className="flex items-center justify-between mb-10">
                        <div>
                            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900">Propiedades disponibles</h2>
                            <p className="text-gray-500 mt-1">{properties.length} propiedad{properties.length !== 1 ? "es" : ""} activa{properties.length !== 1 ? "s" : ""}</p>
                        </div>
                        <Link href="/propiedades" className="flex items-center gap-1.5 text-sm font-semibold transition-colors hover:opacity-80" style={{ color: primary }}>
                            Ver todas <ChevronRight className="w-4 h-4" />
                        </Link>
                    </div>

                    {filtered.length === 0 ? (
                        <div className="text-center py-16 text-gray-400">
                            <Building2 className="w-12 h-12 mx-auto mb-3 opacity-40" />
                            <p>No hay propiedades disponibles en este momento.</p>
                        </div>
                    ) : (
                        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                            {filtered.map((prop) => (
                                <Link key={prop.id} href={`/propiedades/${prop.id}`}
                                    className="group bg-white rounded-2xl border border-gray-100 overflow-hidden hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
                                >
                                    <div className="relative aspect-[4/3] bg-gray-100 overflow-hidden">
                                        {prop.imageUrls?.[0] ? (
                                            <Image src={prop.imageUrls[0]} alt={prop.title} fill
                                                className="object-cover group-hover:scale-105 transition-transform duration-500"
                                                sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                                            />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center">
                                                <Building2 className="w-10 h-10 text-gray-300" />
                                            </div>
                                        )}
                                        <div className="absolute top-3 left-3">
                                            <span className="px-2.5 py-1 text-xs font-bold text-white rounded-full capitalize" style={{ backgroundColor: primary }}>
                                                {prop.operation_type}
                                            </span>
                                        </div>
                                    </div>
                                    <div className="p-5">
                                        {!prop.hidePrice && (
                                            <p className="text-xl font-bold text-gray-900 mb-1">{formatPrice(prop.price, prop.currency)}</p>
                                        )}
                                        <h3 className="text-sm font-semibold text-gray-700 mb-2 line-clamp-2 group-hover:text-indigo-600 transition-colors">{prop.title}</h3>
                                        {prop.localidad && (
                                            <p className="flex items-center gap-1.5 text-xs text-gray-500 mb-3">
                                                <MapPin className="w-3.5 h-3.5 flex-shrink-0" /> {prop.localidad}, {prop.provincia}
                                            </p>
                                        )}
                                        <div className="flex items-center gap-4 text-xs text-gray-500 border-t border-gray-50 pt-3">
                                            {prop.rooms > 0 && <span className="flex items-center gap-1"><BedDouble className="w-3.5 h-3.5" /> {prop.rooms} amb.</span>}
                                            {prop.bathrooms > 0 && <span className="flex items-center gap-1"><Bath className="w-3.5 h-3.5" /> {prop.bathrooms} baños</span>}
                                            {prop.area_covered > 0 && <span>{prop.area_covered} m²</span>}
                                        </div>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    )}
                </div>
            </section>

            {/* ── Contact ── */}
            <section className="py-16 sm:py-20 px-5 sm:px-6 bg-gray-50">
                <div className="max-w-2xl mx-auto text-center">
                    <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-3">¿Necesitás ayuda?</h2>
                    <p className="text-gray-500 mb-8">Contactanos y te respondemos a la brevedad.</p>
                    <div className="flex flex-wrap justify-center gap-4">
                        {site.whatsapp && (
                            <a href={`https://wa.me/${site.whatsapp.replace(/\D/g, "")}`} target="_blank" rel="noopener noreferrer"
                                className="flex items-center gap-2 px-6 py-3 bg-green-500 hover:bg-green-600 text-white rounded-xl font-semibold transition-colors">
                                <MessageCircle className="w-5 h-5" /> WhatsApp
                            </a>
                        )}
                        {site.email && (
                            <a href={`mailto:${site.email}`}
                                className="flex items-center gap-2 px-6 py-3 border-2 rounded-xl font-semibold transition-colors hover:bg-gray-100"
                                style={{ borderColor: primary, color: primary }}>
                                <Mail className="w-5 h-5" /> Email
                            </a>
                        )}
                    </div>
                </div>
            </section>

            {/* ── Footer ── */}
            <footer className="bg-gray-900 text-gray-400 py-10 px-5 sm:px-6">
                <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
                    <div>
                        <p className="text-white font-semibold">{site.nombre}</p>
                        {site.direccion && <p className="text-sm mt-0.5">{site.direccion}</p>}
                    </div>
                    <div className="flex items-center gap-4">
                        {site.instagram && (
                            <a href={`https://instagram.com/${site.instagram.replace("@", "")}`} target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">
                                <Instagram className="w-5 h-5" />
                            </a>
                        )}
                        {site.facebook && (
                            <a href={site.facebook} target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">
                                <Facebook className="w-5 h-5" />
                            </a>
                        )}
                    </div>
                    <p className="text-xs text-gray-600">
                        Sitio creado con{" "}
                        <a href="https://zetaprop.com.ar" target="_blank" rel="noopener noreferrer" className="hover:text-gray-400 transition-colors">Zeta Prop</a>
                    </p>
                </div>
            </footer>
        </div>
    );
}
