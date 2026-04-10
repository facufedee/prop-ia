"use client";

import Link from "next/link";
import { Building2, ArrowRight } from "lucide-react";
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

export default function MinimalistaTemplate({ site, properties }: Omit<Props, "basePath">) {
    const { basePath } = useSite();
    return (
        <div className="min-h-screen bg-white transition-all font-sans" style={{ fontFamily: "'Outfit', sans-serif" }}>
            <SiteNavbar site={site} basePath={basePath} transparent />

            {/* ── Hero ── */}
            <PropertyHero
                title={site.nombre}
                subtitle={site.descripcion || "Diseño y exclusividad inmobiliaria"}
                coverUrl={site.coverUrl}
                basePath={basePath}
                isSite
            />

            {/* ── Properties ── */}
            <section className="py-20 sm:py-32 px-6">
                <div className="max-w-7xl mx-auto">
                    <div className="flex items-center justify-between mb-16">
                        <div>
                            <h2 className="text-2xl font-light text-gray-900 tracking-tight sm:text-3xl">Propiedades Destacadas</h2>
                            <p className="text-sm text-gray-400 mt-2">Una mirada exclusiva a nuestro portfolio</p>
                        </div>
                        <Link href={`${basePath}/propiedades`} className="group flex items-center gap-2 text-sm font-medium text-gray-900">
                            Ver todas <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                        </Link>
                    </div>

                    {properties.length === 0 ? (
                        <div className="text-center py-32 border border-gray-100 text-gray-300">
                            <Building2 className="w-12 h-12 mx-auto mb-4 opacity-10" />
                            <p className="text-sm font-light tracking-widest uppercase">No hay propiedades disponibles.</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-10">
                            {properties.map((prop) => (
                                <div key={prop.id} className="transition-all hover:-translate-y-1">
                                    <PropertyPublicCard property={prop} basePath={basePath} />
                                </div>
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
