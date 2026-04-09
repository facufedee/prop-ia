"use client";

import Link from "next/link";
import { ChevronRight, Building2, Home, MapPin, Warehouse } from "lucide-react";
import { Site } from "@/domain/models/Site";
import { PublicProperty } from "@/infrastructure/services/publicService";
import PropertyHero from "@/ui/components/properties/public/PropertyHero";
import PropertyPublicCard from "@/ui/components/properties/public/PropertyPublicCard";
import SiteNavbar from "../../components/SiteNavbar";
import SiteFooter from "../../components/SiteFooter";
import SiteContactForm from "../../components/SiteContactForm";

const QUICK_CATS = [
    { label: "Casas",         tipo: "Casa",            Icon: Home, color: "bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100" },
    { label: "Departamentos", tipo: "Departamento",    Icon: Building2, color: "bg-indigo-50 text-indigo-700 border-indigo-200 hover:bg-indigo-100" },
    { label: "PH",            tipo: "PH",              Icon: Home, color: "bg-violet-50 text-violet-700 border-violet-200 hover:bg-violet-100" },
    { label: "Quintas",       tipo: "Quinta Vacacional", Icon: Home, color: "bg-green-50 text-green-700 border-green-200 hover:bg-green-100" },
    { label: "Terrenos",      tipo: "Lote/Terreno",    Icon: MapPin, color: "bg-orange-50 text-orange-700 border-orange-200 hover:bg-orange-100" },
    { label: "Locales",       tipo: "Local comercial", Icon: Warehouse, color: "bg-sky-50 text-sky-700 border-sky-200 hover:bg-sky-100" },
];

interface Props {
    site: Site;
    properties: PublicProperty[];
    basePath: string;
}

export default function ModernoTemplate({ site, properties, basePath }: Props) {
    const primary = site.colorPrimario || "#4f46e5";

    return (
        <div className="min-h-screen bg-white font-sans" style={{ fontFamily: "'Outfit', sans-serif" }}>
            <SiteNavbar site={site} basePath={basePath} transparent />

            <main>
                {/* ── Hero ── */}
                <PropertyHero 
                    title={site.nombre}
                    subtitle={site.descripcion || "Encontrá tu lugar en el mundo"}
                    coverUrl={site.coverUrl}
                    basePath={basePath}
                />

                {/* ── Categories ── */}
                <section className="py-12 bg-white">
                    <div className="max-w-7xl mx-auto px-6">
                        <div className="flex flex-wrap items-center justify-center gap-4">
                            {QUICK_CATS.map(({ label, tipo, Icon, color }) => (
                                <Link 
                                    key={label}
                                    href={`${basePath}/propiedades?tipo=${encodeURIComponent(tipo)}`}
                                    className={`flex items-center gap-2 px-6 py-3 rounded-full border text-xs font-bold uppercase tracking-widest transition-all shadow-sm bg-white hover:shadow-md ${color}`}
                                >
                                    <Icon size={14} /> {label}
                                </Link>
                            ))}
                        </div>
                    </div>
                </section>

                {/* ── Properties ── */}
                <section className="py-20 px-6">
                    <div className="max-w-7xl mx-auto">
                        <div className="flex flex-col md:flex-row md:items-end justify-between mb-16 gap-4">
                            <div>
                                <h2 className="text-3xl md:text-5xl font-bold text-gray-900 tracking-tight leading-tight">
                                    Propiedades <span style={{ color: primary }}>Destacadas</span>
                                </h2>
                                <p className="text-gray-500 mt-4 text-lg">Explorá nuestras mejores oportunidades inmobiliarias.</p>
                            </div>
                            <Link href={`${basePath}/propiedades`} className="group flex items-center gap-2 text-sm font-bold uppercase tracking-widest text-gray-400 hover:text-gray-900 transition-colors">
                                Ver todas <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                            </Link>
                        </div>

                        {properties.length === 0 ? (
                            <div className="text-center py-32 border-2 border-dashed border-gray-100 rounded-3xl text-gray-300">
                                <Building2 size={48} className="mx-auto mb-4 opacity-20" />
                                <p className="font-medium italic">No hay propiedades disponibles en este momento.</p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-10">
                                {properties.map((prop) => (
                                    <PropertyPublicCard key={prop.id} property={prop} basePath={basePath} />
                                ))}
                            </div>
                        )}
                    </div>
                </section>

                {/* ── Contact Form ── */}
                <SiteContactForm site={site} />
            </main>

            <SiteFooter site={site} basePath={basePath} />
        </div>
    );
}
