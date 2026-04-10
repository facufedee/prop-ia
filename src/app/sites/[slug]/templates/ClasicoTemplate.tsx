"use client";

import Link from "next/link";
import { ChevronRight, Building2 } from "lucide-react";
import { Site } from "@/domain/models/Site";
import { PublicProperty } from "@/infrastructure/services/publicService";
import PropertyHero from "@/ui/components/properties/public/PropertyHero";
import PropertyPublicCard from "@/ui/components/properties/public/PropertyPublicCard";
import SiteNavbar from "../../components/SiteNavbar";
import SiteFooter from "../../components/SiteFooter";
import SiteContactForm from "../../components/SiteContactForm";
import SiteSafetySection from "../../components/SiteSafetySection";
import SiteWhatsAppFloat from "../../components/SiteWhatsAppFloat";
import { useSite } from "../SiteProvider";

interface Props {
    site: Site;
    properties: PublicProperty[];
    basePath: string;
}

export default function ClasicoTemplate({ site, properties }: Omit<Props, "basePath">) {
    const { basePath } = useSite();
    const primary = site.colorPrimario;

    return (
        <div className="min-h-screen bg-stone-50 transition-all font-sans" style={{ fontFamily: "'Outfit', sans-serif" }}>
            <SiteNavbar site={site} basePath={basePath} transparent />

            {/* ── Hero ── */}
            <PropertyHero
                title={site.nombre}
                subtitle={site.descripcion || "Excelencia en gestión inmobiliaria"}
                coverUrl={site.coverUrl}
                basePath={basePath}
                isSite
            />

            {/* ── Properties ── */}
            <section className="py-16 sm:py-24 px-5 sm:px-6">
                <div className="max-w-7xl mx-auto">
                    <div className="flex items-end justify-between mb-12 border-b-2 border-stone-200 pb-6">
                        <div>
                            <p className="text-xs tracking-widest uppercase text-stone-500 mb-2 font-sans">Nuestro portfolio</p>
                            <h2 className="text-3xl sm:text-4xl font-bold text-stone-900">Propiedades Destacadas</h2>
                        </div>
                        <Link href={`${basePath}/propiedades`} className="flex items-center gap-1 text-sm font-bold transition-all hover:translate-x-1 font-sans" style={{ color: primary }}>
                            Ver catálogo completo <ChevronRight className="w-4 h-4" />
                        </Link>
                    </div>

                    {properties.length === 0 ? (
                        <div className="text-center py-24 bg-white border-2 border-stone-100 rounded-lg text-stone-400 font-sans">
                            <Building2 className="w-16 h-16 mx-auto mb-4 opacity-20" />
                            <p className="text-stone-500 font-medium italic">No hay propiedades disponibles en este momento.</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
                            {properties.map((prop) => (
                                <PropertyPublicCard key={prop.id} property={prop} basePath={basePath} />
                            ))}
                        </div>
                    )}
                </div>
            </section>

            <SiteContactForm site={site} />
            <SiteSafetySection site={site} />
            <SiteFooter site={site} basePath={basePath} />
            <SiteWhatsAppFloat site={site} />
        </div>
    );
}
