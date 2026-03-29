"use client";

import Link from "next/link";
import Image from "next/image";
import { MapPin, BedDouble, Bath, Mail, MessageCircle, Instagram, Facebook, Building2, ArrowRight, Search } from "lucide-react";
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

export default function MinimalistaTemplate({ site, properties, search, onSearchChange }: Props) {
    const filtered = properties.filter((p) =>
        search === "" ||
        p.title.toLowerCase().includes(search.toLowerCase()) ||
        p.localidad?.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <div className="min-h-screen bg-white" style={{ fontFamily: "'Inter', 'Helvetica Neue', sans-serif" }}>

            {/* ── Header ── */}
            <header className="border-b border-gray-100">
                <div className="max-w-5xl mx-auto px-6 h-16 flex items-center justify-between">
                    <div>
                        {site.logoUrl ? (
                            <Image src={site.logoUrl} alt={site.nombre} width={120} height={36} className="h-8 w-auto object-contain" />
                        ) : (
                            <span className="font-semibold text-gray-900 tracking-tight">{site.nombre}</span>
                        )}
                    </div>
                    <nav className="hidden md:flex items-center gap-8 text-sm text-gray-500">
                        <Link href="/" className="hover:text-gray-900 transition-colors">Inicio</Link>
                        <Link href="/propiedades" className="hover:text-gray-900 transition-colors">Propiedades</Link>
                        <Link href="/contacto" className="hover:text-gray-900 transition-colors">Contacto</Link>
                    </nav>
                    {site.whatsapp && (
                        <a
                            href={`https://wa.me/${site.whatsapp.replace(/\D/g, "")}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-2 px-4 py-2 bg-gray-900 text-white text-sm font-medium transition-colors hover:bg-gray-700"
                        >
                            <MessageCircle className="w-4 h-4" />
                            <span className="hidden sm:inline">WhatsApp</span>
                        </a>
                    )}
                </div>
            </header>

            {/* ── Hero ── */}
            {site.coverUrl ? (
                <section className="relative h-[480px] sm:h-[560px]">
                    <Image src={site.coverUrl} alt={site.nombre} fill className="object-cover" priority />
                    <div className="absolute inset-0 bg-black/50 flex flex-col items-center justify-center px-6 text-center">
                        <h1 className="text-4xl sm:text-6xl font-light text-white mb-4 tracking-tight">{site.nombre}</h1>
                        {site.descripcion && <p className="text-white/70 text-base max-w-xl">{site.descripcion}</p>}
                    </div>
                </section>
            ) : (
                <section className="py-20 sm:py-32 px-6 text-center border-b border-gray-100">
                    <p className="text-xs tracking-widest text-gray-400 uppercase mb-4">{site.nombre}</p>
                    <h1 className="text-4xl sm:text-6xl font-light text-gray-900 mb-6 tracking-tight leading-tight">
                        {site.descripcion || "Tu nueva propiedad,\nen el lugar indicado."}
                    </h1>
                    <div className="w-12 h-px bg-gray-900 mx-auto" />
                </section>
            )}

            {/* ── Search ── */}
            <section className="py-10 px-6 border-b border-gray-100">
                <div className="max-w-2xl mx-auto flex items-center gap-0 border border-gray-200">
                    <Search className="w-4 h-4 text-gray-400 ml-4 flex-shrink-0" />
                    <input
                        type="text"
                        placeholder="Buscar por zona o propiedad..."
                        value={search}
                        onChange={(e) => onSearchChange(e.target.value)}
                        className="flex-1 px-4 py-3.5 text-sm text-gray-900 placeholder-gray-400 outline-none"
                    />
                    <Link
                        href={`/propiedades${search ? `?q=${encodeURIComponent(search)}` : ""}`}
                        className="px-6 py-3.5 bg-gray-900 text-white text-sm font-medium hover:bg-gray-700 transition-colors whitespace-nowrap"
                    >
                        Buscar
                    </Link>
                </div>
            </section>

            {/* ── Properties ── */}
            <section className="py-16 sm:py-20 px-6">
                <div className="max-w-5xl mx-auto">
                    <div className="flex items-center justify-between mb-12">
                        <div>
                            <h2 className="text-xl font-medium text-gray-900">Propiedades</h2>
                            <p className="text-sm text-gray-400 mt-0.5">{properties.length} disponibles</p>
                        </div>
                        <Link href="/propiedades" className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-900 transition-colors">
                            Ver todas <ArrowRight className="w-4 h-4" />
                        </Link>
                    </div>

                    {filtered.length === 0 ? (
                        <div className="text-center py-20 text-gray-300">
                            <Building2 className="w-10 h-10 mx-auto mb-3" />
                            <p className="text-sm">No hay propiedades disponibles.</p>
                        </div>
                    ) : (
                        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-px bg-gray-100">
                            {filtered.map((prop) => (
                                <Link key={prop.id} href={`/propiedades/${prop.id}`}
                                    className="group bg-white p-0 overflow-hidden hover:bg-gray-50 transition-colors"
                                >
                                    <div className="relative aspect-[4/3] bg-gray-100 overflow-hidden">
                                        {prop.imageUrls?.[0] ? (
                                            <Image src={prop.imageUrls[0]} alt={prop.title} fill
                                                className="object-cover group-hover:scale-102 transition-transform duration-700"
                                                sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                                            />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center">
                                                <Building2 className="w-8 h-8 text-gray-200" />
                                            </div>
                                        )}
                                    </div>
                                    <div className="p-5">
                                        <div className="flex items-start justify-between gap-2 mb-3">
                                            <div>
                                                {!prop.hidePrice && (
                                                    <p className="text-base font-semibold text-gray-900">{formatPrice(prop.price, prop.currency)}</p>
                                                )}
                                                <p className="text-xs text-gray-400 uppercase tracking-wider mt-0.5">{prop.operation_type}</p>
                                            </div>
                                            <ArrowRight className="w-4 h-4 text-gray-300 group-hover:text-gray-900 group-hover:translate-x-0.5 transition-all flex-shrink-0 mt-1" />
                                        </div>
                                        <h3 className="text-sm text-gray-600 mb-3 line-clamp-2">{prop.title}</h3>
                                        {prop.localidad && (
                                            <p className="flex items-center gap-1.5 text-xs text-gray-400 mb-3">
                                                <MapPin className="w-3 h-3 flex-shrink-0" /> {prop.localidad}
                                            </p>
                                        )}
                                        <div className="flex items-center gap-4 text-xs text-gray-400 pt-3 border-t border-gray-50">
                                            {prop.rooms > 0 && <span className="flex items-center gap-1"><BedDouble className="w-3.5 h-3.5" /> {prop.rooms}</span>}
                                            {prop.bathrooms > 0 && <span className="flex items-center gap-1"><Bath className="w-3.5 h-3.5" /> {prop.bathrooms}</span>}
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
            <section className="py-20 px-6 border-t border-gray-100">
                <div className="max-w-xl mx-auto text-center">
                    <h2 className="text-2xl font-light text-gray-900 mb-2">{site.nombre}</h2>
                    <p className="text-sm text-gray-400 mb-10">{site.descripcion || "Contactanos para más información."}</p>
                    <div className="flex flex-wrap justify-center gap-3">
                        {site.whatsapp && (
                            <a href={`https://wa.me/${site.whatsapp.replace(/\D/g, "")}`} target="_blank" rel="noopener noreferrer"
                                className="flex items-center gap-2 px-5 py-2.5 bg-gray-900 text-white text-sm hover:bg-gray-700 transition-colors">
                                <MessageCircle className="w-4 h-4" /> WhatsApp
                            </a>
                        )}
                        {site.email && (
                            <a href={`mailto:${site.email}`}
                                className="flex items-center gap-2 px-5 py-2.5 border border-gray-200 text-gray-700 text-sm hover:border-gray-900 transition-colors">
                                <Mail className="w-4 h-4" /> Email
                            </a>
                        )}
                    </div>
                </div>
            </section>

            {/* ── Footer ── */}
            <footer className="border-t border-gray-100 py-8 px-6">
                <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
                    <p className="text-sm text-gray-400">{site.nombre}{site.direccion ? ` — ${site.direccion}` : ""}</p>
                    <div className="flex items-center gap-5">
                        {site.instagram && (
                            <a href={`https://instagram.com/${site.instagram.replace("@", "")}`} target="_blank" rel="noopener noreferrer" className="text-gray-300 hover:text-gray-900 transition-colors">
                                <Instagram className="w-4 h-4" />
                            </a>
                        )}
                        {site.facebook && (
                            <a href={site.facebook} target="_blank" rel="noopener noreferrer" className="text-gray-300 hover:text-gray-900 transition-colors">
                                <Facebook className="w-4 h-4" />
                            </a>
                        )}
                        <span className="text-xs text-gray-300">
                            <a href="https://zetaprop.com.ar" target="_blank" rel="noopener noreferrer" className="hover:text-gray-500 transition-colors">Zeta Prop</a>
                        </span>
                    </div>
                </div>
            </footer>
        </div>
    );
}
