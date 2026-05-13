"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { ChevronLeft, ChevronDown, MessageCircle, Mail, Phone, Building2 } from "lucide-react";
import { useSite } from "../../SiteProvider";
import { SitePage } from "@/domain/models/Site";
import { publicService, PublicProperty } from "@/infrastructure/services/publicService";
import SiteNavbar from "../../../components/SiteNavbar";
import SiteFooter from "../../../components/SiteFooter";
import PropertyPublicCard from "@/ui/components/properties/public/PropertyPublicCard";

// ── Content Page ─────────────────────────────────────────────────────────────

function ContentPage({ page, primary, basePath }: { page: SitePage; primary: string; basePath: string }) {
    const [openFaq, setOpenFaq] = useState<number | null>(null);

    return (
        <main className="max-w-4xl mx-auto px-4 sm:px-6 py-12 pt-28 space-y-16">
            {/* Hero */}
            {(page.heroTitle || page.heroSubtitle) && (
                <div className="text-center space-y-3">
                    {page.heroTitle && (
                        <h1 className="text-4xl sm:text-5xl font-black text-gray-900 tracking-tight leading-tight">
                            {page.heroTitle}
                        </h1>
                    )}
                    {page.heroSubtitle && (
                        <p className="text-lg text-gray-500 max-w-2xl mx-auto">{page.heroSubtitle}</p>
                    )}
                    <div className="w-16 h-1 rounded-full mx-auto mt-4" style={{ backgroundColor: primary }} />
                </div>
            )}

            {/* Body text */}
            {page.body && (
                <div className="bg-white rounded-[32px] p-8 sm:p-10 shadow-sm border border-gray-100">
                    <div className="prose prose-gray max-w-none text-gray-700 leading-relaxed whitespace-pre-line text-lg">
                        {page.body}
                    </div>
                </div>
            )}

            {/* Team */}
            {(page.teamMembers?.length ?? 0) > 0 && (
                <section>
                    <h2 className="text-2xl font-black text-gray-900 mb-8 tracking-tight">Nuestro Equipo</h2>
                    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                        {page.teamMembers!.map((member, i) => (
                            <div key={i} className="bg-white rounded-[24px] p-6 shadow-sm border border-gray-100 flex flex-col items-center text-center gap-3">
                                {member.photoUrl ? (
                                    <div className="relative w-20 h-20 rounded-full overflow-hidden border-2 border-gray-100">
                                        <Image src={member.photoUrl} alt={member.name} fill className="object-cover" />
                                    </div>
                                ) : (
                                    <div
                                        className="w-20 h-20 rounded-full flex items-center justify-center text-white text-2xl font-black"
                                        style={{ backgroundColor: primary }}
                                    >
                                        {member.name.substring(0, 2).toUpperCase()}
                                    </div>
                                )}
                                <div>
                                    <p className="font-black text-gray-900 text-lg leading-tight">{member.name}</p>
                                    <p className="text-sm text-gray-500 font-medium mt-0.5">{member.role}</p>
                                </div>
                                <div className="flex gap-2 mt-1">
                                    {member.whatsapp && (
                                        <a
                                            href={`https://wa.me/${member.whatsapp.replace(/\D/g, "")}`}
                                            target="_blank" rel="noopener noreferrer"
                                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-white text-xs font-bold"
                                            style={{ backgroundColor: "#25D366" }}
                                        >
                                            <MessageCircle className="w-3.5 h-3.5" /> WA
                                        </a>
                                    )}
                                    {member.email && (
                                        <a
                                            href={`mailto:${member.email}`}
                                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-bold text-gray-600"
                                        >
                                            <Mail className="w-3.5 h-3.5" /> Email
                                        </a>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </section>
            )}

            {/* FAQ */}
            {(page.faqItems?.length ?? 0) > 0 && (
                <section>
                    <h2 className="text-2xl font-black text-gray-900 mb-8 tracking-tight">Preguntas Frecuentes</h2>
                    <div className="space-y-3">
                        {page.faqItems!.map((faq, i) => (
                            <div key={i} className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm">
                                <button
                                    onClick={() => setOpenFaq(openFaq === i ? null : i)}
                                    className="w-full flex items-center justify-between px-6 py-5 text-left"
                                >
                                    <span className="font-bold text-gray-900 pr-4">{faq.question}</span>
                                    <ChevronDown
                                        className={`w-5 h-5 text-gray-400 flex-shrink-0 transition-transform duration-200 ${openFaq === i ? "rotate-180" : ""}`}
                                    />
                                </button>
                                {openFaq === i && (
                                    <div className="px-6 pb-5 text-gray-600 leading-relaxed border-t border-gray-50 pt-4">
                                        {faq.answer}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </section>
            )}
        </main>
    );
}

// ── Properties Page ──────────────────────────────────────────────────────────

function PropertiesPage({ page, primary, basePath, userId }: { page: SitePage; primary: string; basePath: string; userId: string }) {
    const [properties, setProperties] = useState<PublicProperty[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!userId || !page.filterTag) return;
        publicService.getPropertiesByUserId(userId).then(all => {
            const filtered = all.filter(
                p => p.status === "active" && (p as any).customTag === page.filterTag
            );
            setProperties(filtered);
            setLoading(false);
        }).catch(() => setLoading(false));
    }, [userId, page.filterTag]);

    return (
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 pt-28">
            {/* Header */}
            <div className="mb-10 text-center">
                {page.pageTitle && (
                    <h1 className="text-4xl sm:text-5xl font-black text-gray-900 tracking-tight mb-3">{page.pageTitle}</h1>
                )}
                {page.pageSubtitle && (
                    <p className="text-lg text-gray-500 max-w-2xl mx-auto">{page.pageSubtitle}</p>
                )}
                <div className="w-16 h-1 rounded-full mx-auto mt-4" style={{ backgroundColor: primary }} />
            </div>

            {loading ? (
                <div className="flex justify-center py-24">
                    <div className="w-10 h-10 border-4 border-gray-100 rounded-full animate-spin" style={{ borderTopColor: primary }} />
                </div>
            ) : properties.length === 0 ? (
                <div className="text-center py-20">
                    <Building2 className="w-16 h-16 text-gray-200 mx-auto mb-4" />
                    <p className="font-bold text-gray-400 text-lg">Sin propiedades disponibles</p>
                    <p className="text-sm text-gray-400 mt-1">Aún no hay propiedades con esta etiqueta.</p>
                    <Link
                        href={`${basePath}/propiedades`}
                        className="inline-block mt-6 px-6 py-3 rounded-2xl text-white font-bold text-sm"
                        style={{ backgroundColor: primary }}
                    >
                        Ver todas las propiedades
                    </Link>
                </div>
            ) : (
                <>
                    <p className="text-sm text-gray-500 mb-6 font-medium">{properties.length} {properties.length === 1 ? "propiedad" : "propiedades"}</p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                        {properties.map(p => (
                            <PropertyPublicCard key={p.id} property={p} basePath={basePath} />
                        ))}
                    </div>
                </>
            )}
        </main>
    );
}

// ── Main Page Component ───────────────────────────────────────────────────────

export default function SiteCustomPage() {
    const { site, basePath } = useSite();
    const params = useParams<{ pageId: string }>();

    if (!site) return null;

    const page = site.pages?.find(p => p.id === params.pageId);
    const primary = site.colorPrimario || "#4f46e5";

    if (!page || !page.enabled) {
        return (
            <div className="min-h-screen bg-gray-50">
                <SiteNavbar site={site} basePath={basePath} />
                <div className="flex flex-col items-center justify-center min-h-screen gap-4 text-center px-6">
                    <Building2 className="w-16 h-16 text-gray-200" />
                    <h1 className="text-2xl font-black text-gray-900">Página no encontrada</h1>
                    <p className="text-gray-400 max-w-xs">Esta página no existe o fue desactivada.</p>
                    <Link
                        href={basePath || "/"}
                        className="flex items-center gap-2 px-6 py-3 rounded-2xl text-white font-bold text-sm"
                        style={{ backgroundColor: primary }}
                    >
                        <ChevronLeft className="w-4 h-4" /> Volver al inicio
                    </Link>
                </div>
                <SiteFooter site={site} basePath={basePath} />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 font-sans" style={{ fontFamily: "'Outfit', sans-serif" }}>
            <SiteNavbar site={site} basePath={basePath} />

            {page.type === "content" ? (
                <ContentPage page={page} primary={primary} basePath={basePath} />
            ) : (
                <PropertiesPage page={page} primary={primary} basePath={basePath} userId={site.userId} />
            )}

            <SiteFooter site={site} basePath={basePath} />
        </div>
    );
}
