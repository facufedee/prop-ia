"use client";

import Link from "next/link";
import Image from "next/image";
import { MapPin, BedDouble, Bath, Phone, Mail, MessageCircle, Instagram, Facebook, Building2, ChevronRight, Search } from "lucide-react";
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

export default function ClasicoTemplate({ site, properties, search, onSearchChange }: Props) {
    const primary = site.colorPrimario;

    const filtered = properties.filter((p) =>
        search === "" ||
        p.title.toLowerCase().includes(search.toLowerCase()) ||
        p.localidad?.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <div className="min-h-screen bg-stone-50" style={{ fontFamily: "'Georgia', serif" }}>

            {/* ── Top bar ── */}
            <div className="bg-stone-800 text-stone-300 text-xs py-2 px-5 sm:px-6">
                <div className="max-w-6xl mx-auto flex items-center justify-between gap-4">
                    <span>{site.direccion || site.nombre}</span>
                    <div className="flex items-center gap-4">
                        {site.email && <span className="flex items-center gap-1"><Mail className="w-3 h-3" /> {site.email}</span>}
                        {site.whatsapp && <span className="flex items-center gap-1"><Phone className="w-3 h-3" /> {site.whatsapp}</span>}
                    </div>
                </div>
            </div>

            {/* ── Header ── */}
            <header className="bg-white border-b-2 border-stone-200">
                <div className="max-w-6xl mx-auto px-5 sm:px-6 py-5 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        {site.logoUrl ? (
                            <Image src={site.logoUrl} alt={site.nombre} width={180} height={56} className="h-14 w-auto object-contain" />
                        ) : (
                            <div>
                                <p className="text-2xl font-bold text-stone-900 tracking-wide">{site.nombre}</p>
                                <p className="text-xs text-stone-500 tracking-widest uppercase">Inmobiliaria</p>
                            </div>
                        )}
                    </div>
                    <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-stone-600">
                        <Link href="/" className="hover:text-stone-900 transition-colors border-b-2 border-transparent hover:border-stone-800 pb-0.5">Inicio</Link>
                        <Link href="/propiedades" className="hover:text-stone-900 transition-colors border-b-2 border-transparent hover:border-stone-800 pb-0.5">Propiedades</Link>
                        <Link href="/contacto" className="hover:text-stone-900 transition-colors border-b-2 border-transparent hover:border-stone-800 pb-0.5">Contacto</Link>
                    </nav>
                    {site.whatsapp && (
                        <a
                            href={`https://wa.me/${site.whatsapp.replace(/\D/g, "")}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-2 px-5 py-2.5 text-white text-sm font-semibold transition-all hover:opacity-90"
                            style={{ backgroundColor: primary }}
                        >
                            <MessageCircle className="w-4 h-4" />
                            <span className="hidden sm:inline">Consultar</span>
                        </a>
                    )}
                </div>
            </header>

            {/* ── Hero ── */}
            <section
                className="relative py-24 sm:py-36 px-5 sm:px-6"
                style={{
                    background: site.coverUrl
                        ? `linear-gradient(rgba(0,0,0,0.6),rgba(0,0,0,0.6)) center/cover, url(${site.coverUrl})`
                        : `linear-gradient(160deg, #1c1917 0%, #292524 60%, ${primary}33 100%)`,
                }}
            >
                <div className="max-w-4xl mx-auto text-center">
                    <p className="text-xs tracking-widest uppercase text-stone-400 mb-4">Bienvenido a</p>
                    <h1 className="text-4xl sm:text-6xl font-bold text-white mb-5 leading-tight">
                        {site.nombre}
                    </h1>
                    {site.descripcion && (
                        <p className="text-base sm:text-lg text-stone-300 mb-12 max-w-2xl mx-auto leading-relaxed">
                            {site.descripcion}
                        </p>
                    )}

                    {/* Search */}
                    <div className="flex items-center bg-white max-w-2xl mx-auto overflow-hidden shadow-2xl">
                        <Search className="w-5 h-5 text-stone-400 ml-4 flex-shrink-0" />
                        <input
                            type="text"
                            placeholder="Zona, barrio, tipo de propiedad..."
                            value={search}
                            onChange={(e) => onSearchChange(e.target.value)}
                            className="flex-1 px-4 py-4 text-stone-900 placeholder-stone-400 outline-none text-sm"
                            style={{ fontFamily: "sans-serif" }}
                        />
                        <Link
                            href={`/propiedades${search ? `?q=${encodeURIComponent(search)}` : ""}`}
                            className="px-6 py-4 text-white text-sm font-semibold uppercase tracking-wider transition-all hover:opacity-90"
                            style={{ backgroundColor: primary, fontFamily: "sans-serif" }}
                        >
                            Buscar
                        </Link>
                    </div>
                </div>
            </section>

            {/* ── Properties ── */}
            <section className="py-16 sm:py-20 px-5 sm:px-6">
                <div className="max-w-6xl mx-auto">
                    <div className="flex items-end justify-between mb-10 border-b-2 border-stone-200 pb-4">
                        <div>
                            <p className="text-xs tracking-widest uppercase text-stone-500 mb-1">Nuestro portfolio</p>
                            <h2 className="text-2xl sm:text-3xl font-bold text-stone-900">Propiedades Disponibles</h2>
                        </div>
                        <Link href="/propiedades" className="flex items-center gap-1 text-sm font-medium transition-colors hover:opacity-70" style={{ color: primary, fontFamily: "sans-serif" }}>
                            Ver todas <ChevronRight className="w-4 h-4" />
                        </Link>
                    </div>

                    {filtered.length === 0 ? (
                        <div className="text-center py-20 text-stone-400">
                            <Building2 className="w-12 h-12 mx-auto mb-3 opacity-40" />
                            <p style={{ fontFamily: "sans-serif" }}>No hay propiedades disponibles.</p>
                        </div>
                    ) : (
                        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                            {filtered.map((prop) => (
                                <Link key={prop.id} href={`/propiedades/${prop.id}`}
                                    className="group bg-white border border-stone-200 overflow-hidden hover:shadow-lg transition-all duration-300"
                                >
                                    <div className="relative aspect-[4/3] bg-stone-100 overflow-hidden">
                                        {prop.imageUrls?.[0] ? (
                                            <Image src={prop.imageUrls[0]} alt={prop.title} fill
                                                className="object-cover group-hover:scale-105 transition-transform duration-700"
                                                sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                                            />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center">
                                                <Building2 className="w-10 h-10 text-stone-300" />
                                            </div>
                                        )}
                                        <div className="absolute top-0 left-0 right-0 bottom-0 bg-gradient-to-t from-black/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                                        <div className="absolute top-3 left-3">
                                            <span className="px-3 py-1 text-xs font-semibold text-white uppercase tracking-wider" style={{ backgroundColor: primary, fontFamily: "sans-serif" }}>
                                                {prop.operation_type}
                                            </span>
                                        </div>
                                    </div>
                                    <div className="p-5 border-t border-stone-100">
                                        {!prop.hidePrice && (
                                            <p className="text-xl font-bold text-stone-900 mb-1" style={{ fontFamily: "sans-serif" }}>{formatPrice(prop.price, prop.currency)}</p>
                                        )}
                                        <h3 className="text-sm font-semibold text-stone-700 mb-2 line-clamp-2">{prop.title}</h3>
                                        {prop.localidad && (
                                            <p className="flex items-center gap-1.5 text-xs text-stone-500 mb-3" style={{ fontFamily: "sans-serif" }}>
                                                <MapPin className="w-3.5 h-3.5 flex-shrink-0" /> {prop.localidad}, {prop.provincia}
                                            </p>
                                        )}
                                        <div className="flex items-center gap-4 text-xs text-stone-500 pt-3 border-t border-stone-100" style={{ fontFamily: "sans-serif" }}>
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

            {/* ── Contact band ── */}
            <section className="py-16 px-5 sm:px-6" style={{ backgroundColor: primary }}>
                <div className="max-w-4xl mx-auto text-center text-white">
                    <h2 className="text-2xl sm:text-3xl font-bold mb-3">¿Buscás tu próxima propiedad?</h2>
                    <p className="text-white/80 mb-8 text-sm" style={{ fontFamily: "sans-serif" }}>
                        Contamos con un equipo de profesionales listos para asesorarte.
                    </p>
                    <div className="flex flex-wrap justify-center gap-4">
                        {site.whatsapp && (
                            <a href={`https://wa.me/${site.whatsapp.replace(/\D/g, "")}`} target="_blank" rel="noopener noreferrer"
                                className="flex items-center gap-2 px-6 py-3 bg-white font-semibold transition-colors hover:bg-white/90"
                                style={{ color: primary, fontFamily: "sans-serif" }}>
                                <MessageCircle className="w-5 h-5" /> WhatsApp
                            </a>
                        )}
                        {site.email && (
                            <a href={`mailto:${site.email}`}
                                className="flex items-center gap-2 px-6 py-3 border-2 border-white text-white font-semibold hover:bg-white/10 transition-colors"
                                style={{ fontFamily: "sans-serif" }}>
                                <Mail className="w-5 h-5" /> Enviar email
                            </a>
                        )}
                    </div>
                </div>
            </section>

            {/* ── Footer ── */}
            <footer className="bg-stone-900 text-stone-400 py-12 px-5 sm:px-6">
                <div className="max-w-6xl mx-auto grid sm:grid-cols-3 gap-8">
                    <div>
                        <p className="text-white font-bold text-lg mb-2">{site.nombre}</p>
                        {site.descripcion && <p className="text-sm leading-relaxed">{site.descripcion}</p>}
                    </div>
                    <div style={{ fontFamily: "sans-serif" }}>
                        <p className="text-white text-xs font-semibold uppercase tracking-widest mb-3">Contacto</p>
                        <div className="space-y-1.5 text-sm">
                            {site.direccion && <p className="flex items-center gap-2"><MapPin className="w-3.5 h-3.5 flex-shrink-0" /> {site.direccion}</p>}
                            {site.whatsapp && <p className="flex items-center gap-2"><Phone className="w-3.5 h-3.5 flex-shrink-0" /> {site.whatsapp}</p>}
                            {site.email && <p className="flex items-center gap-2"><Mail className="w-3.5 h-3.5 flex-shrink-0" /> {site.email}</p>}
                        </div>
                    </div>
                    <div style={{ fontFamily: "sans-serif" }}>
                        <p className="text-white text-xs font-semibold uppercase tracking-widest mb-3">Redes</p>
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
                        <p className="text-xs text-stone-600 mt-6">
                            Sitio creado con{" "}
                            <a href="https://zetaprop.com.ar" target="_blank" rel="noopener noreferrer" className="hover:text-stone-400 transition-colors">Zeta Prop</a>
                        </p>
                    </div>
                </div>
            </footer>
        </div>
    );
}
