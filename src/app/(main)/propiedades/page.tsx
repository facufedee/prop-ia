import Link from "next/link";
import Image from "next/image";
import { ChevronRight, Calendar, BookOpen, MapPin, ArrowRight, Home, Building2, TreePine, Warehouse } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { publicServerService } from "@/infrastructure/services/publicServerService";
import PropertyHero from "@/ui/components/properties/public/PropertyHero";
import PropertyPublicCard from "@/ui/components/properties/public/PropertyPublicCard";
import { PrimaryCta } from "@/ui/sections/PhotoHero";
import type { Metadata } from "next";
import JsonLd, { breadcrumbList, SITE_ORIGIN, WEBSITE_ID } from "@/ui/seo/JsonLd";

const pageTitle = "Propiedades en venta y alquiler en Argentina";
const pageDescription =
    "Propiedades en venta y alquiler publicadas por inmobiliarias en Zeta Prop: casas, departamentos, PH, terrenos y locales en Argentina.";

export const metadata: Metadata = {
    title: pageTitle,
    description: pageDescription,
    alternates: { canonical: "/propiedades" },
    openGraph: {
        type: "website",
        locale: "es_AR",
        url: "/propiedades",
        siteName: "Zeta Prop",
        title: `${pageTitle} | Zeta Prop`,
        description: pageDescription,
        images: [{ url: "/hero-propiedades.png", width: 1200, height: 630, alt: pageTitle }],
    },
    twitter: {
        card: "summary_large_image",
        title: `${pageTitle} | Zeta Prop`,
        description: pageDescription,
        images: ["/hero-propiedades.png"],
    },
};

const listingJsonLd = {
    "@context": "https://schema.org",
    "@graph": [
        {
            "@type": "CollectionPage",
            name: pageTitle,
            description: pageDescription,
            url: `${SITE_ORIGIN}/propiedades`,
            inLanguage: "es-AR",
            isPartOf: { "@id": WEBSITE_ID },
        },
        breadcrumbList([{ name: "Propiedades", path: "/propiedades" }]),
    ],
};

const QUICK_CATEGORIES = [
    { label: "Casas", tipo: "Casa", icon: Home },
    { label: "Departamentos", tipo: "Departamento", icon: Building2 },
    { label: "PH", tipo: "PH", icon: Home },
    { label: "Quintas", tipo: "Quinta Vacacional", icon: TreePine },
    { label: "Terrenos", tipo: "Lote/Terreno", icon: MapPin },
    { label: "Locales", tipo: "Local comercial", icon: Warehouse },
];

const POPULAR_ZONES = [
    "Ituzaingó", "Castelar", "Morón", "Ramos Mejía", "Haedo",
    "El Palomar", "Hurlingham", "Villa del Parque", "Palermo", "Belgrano",
];

export default async function PropiedadesLandingPage() {
    // Fetch data on the server
    const featured = await publicServerService.getFeaturedProperties(8);
    const posts = await publicServerService.getPublishedBlogPosts(4);

    const formatPostDate = (date: any) => {
        if (!date) return "";
        const d = new Date(date);
        return format(d, "dd MMM yyyy", { locale: es });
    };

    return (
        <main className="flex-1">
            <JsonLd data={listingJsonLd} />

            {/* ═══ HERO ═══════════════════════════════════════════════════ */}
            <PropertyHero tone="dark" />

            {/* ═══ CATEGORÍAS RÁPIDAS ════════════════════════════════════ */}
            <section aria-label="Categorías de propiedades" className="l-section l-section--tight s-flush-top">
                <div className="l-container s-pill-row">
                    {QUICK_CATEGORIES.map(cat => {
                        const Icon = cat.icon;
                        return (
                            <Link
                                key={cat.label}
                                href={`/busqueda?tipo=${encodeURIComponent(cat.tipo)}`}
                                className="s-pill-link"
                            >
                                <Icon size={16} aria-hidden="true" />
                                {cat.label}
                            </Link>
                        );
                    })}
                </div>
            </section>

            {/* ═══ PROPIEDADES DESTACADAS ════════════════════════════════ */}
            <section aria-label="Propiedades destacadas" className="l-section l-section--tight s-flush-top">
                <div className="l-container">
                    <div className="s-row-head">
                        <div>
                            <h2 className="l-section__title">Propiedades Destacadas</h2>
                            <p className="s-row-head__lede">Una selección de las mejores propiedades disponibles en Argentina</p>
                        </div>
                        <Link href="/busqueda" className="l-link-arrow">
                            Ver todas <ChevronRight size={16} aria-hidden="true" />
                        </Link>
                    </div>

                    {featured.length > 0 ? (
                        <div className="s-prop-grid">
                            {featured.map(property => (
                                <PropertyPublicCard key={property.id} property={property} tone="dark" />
                            ))}
                        </div>
                    ) : (
                        <div className="s-empty">
                            <p className="s-empty__text">No hay propiedades disponibles aún.</p>
                        </div>
                    )}
                </div>
            </section>

            {/* ═══ ZONAS POPULARES ═══════════════════════════════════════ */}
            <section aria-label="Zonas populares" className="l-section l-section--tight">
                <div className="l-container">
                    <div className="s-row-head">
                        <div>
                            <h2 className="l-section__title">Zonas Populares</h2>
                            <p className="s-row-head__lede">Explorá propiedades en las ubicaciones más buscadas de Buenos Aires y GBA</p>
                        </div>
                    </div>
                    <nav aria-label="Búsquedas por zona">
                        <div className="s-zone-grid">
                            {POPULAR_ZONES.map(zona => (
                                <Link
                                    key={zona}
                                    href={`/busqueda?loc=${encodeURIComponent(zona)}`}
                                    title={`Propiedades en ${zona}`}
                                    className="s-zone"
                                >
                                    <span className="s-zone__name">
                                        <MapPin size={12} aria-hidden="true" />
                                        {zona}
                                    </span>
                                    <ArrowRight size={13} aria-hidden="true" />
                                </Link>
                            ))}
                        </div>
                    </nav>
                </div>
            </section>

            {/* ═══ TEXTO SEO ESTÁTICO ════════════════════════════════════ */}
            <section aria-label="Información sobre el portal" className="l-section l-section--tight">
                <div className="l-container">
                    <h2 className="s-h2">Encontrá propiedades en venta y alquiler en Argentina</h2>
                    <div className="s-seo-cols">
                        <div>
                            <h3>Casas y departamentos</h3>
                            <p>Explorá una amplia selección de <strong>casas en venta</strong>, <strong>departamentos en alquiler</strong> y PH en Buenos Aires, GBA y todo el interior del país.</p>
                        </div>
                        <div>
                            <h3>Inmuebles comerciales</h3>
                            <p>Encontrá <strong>locales comerciales</strong>, oficinas, galpones y depósitos para alquilar o comprar. La mejor oferta de inmuebles comerciales en Argentina.</p>
                        </div>
                        <div>
                            <h3>Terrenos e inversiones</h3>
                            <p>Descubrí <strong>terrenos y lotes</strong> en las mejores ubicaciones para construir o invertir. Quintas vacacionales y propiedades rurales en todo el país.</p>
                        </div>
                    </div>
                </div>
            </section>

            {/* ═══ BLOG / RECURSOS ════════════════════════════════════════ */}
            {posts.length > 0 && (
                <section aria-label="Guías y recursos inmobiliarios" className="l-section l-section--tight">
                    <div className="l-container">
                        <div className="s-row-head">
                            <div>
                                <h2 className="l-section__title">Guías y Recursos</h2>
                                <p className="s-row-head__lede">Todo lo que necesitás saber sobre el mercado inmobiliario</p>
                            </div>
                            <Link href="/blog" className="l-link-arrow">
                                Ver blog <ChevronRight size={16} aria-hidden="true" />
                            </Link>
                        </div>
                        <div className="s-prop-grid">
                            {posts.map(post => (
                                <Link
                                    key={post.id}
                                    href={`/blog/${post.slug}`}
                                    className="s-media-card"
                                >
                                    <div className="s-media-card__media">
                                        {post.imageUrl ? (
                                            <Image
                                                src={post.imageUrl}
                                                alt={post.title}
                                                fill
                                                className="object-cover"
                                                sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                                            />
                                        ) : (
                                            <div className="s-blog-cover-empty">
                                                <BookOpen className="w-10 h-10" aria-hidden="true" />
                                            </div>
                                        )}
                                    </div>
                                    <div className="s-media-card__body">
                                        {post.category && (
                                            <span className="s-media-card__kicker">{post.category}</span>
                                        )}
                                        <h3 className="s-media-card__title line-clamp-2">
                                            {post.title}
                                        </h3>
                                        {post.excerpt && (
                                            <p className="s-media-card__excerpt line-clamp-2">{post.excerpt}</p>
                                        )}
                                        {post.publishedAt && (
                                            <div className="s-media-card__meta">
                                                <Calendar size={11} aria-hidden="true" />
                                                {formatPostDate(post.publishedAt)}
                                            </div>
                                        )}
                                    </div>
                                </Link>
                            ))}
                        </div>
                    </div>
                </section>
            )}

            {/* ═══ CTA INMOBILIARIAS ══════════════════════════════════════ */}
            <section aria-label="Publicá tu inmobiliaria" className="l-section l-section--tight">
                <div className="l-container">
                    <div className="s-cta-band">
                        <p className="l-eyebrow">Para Inmobiliarias</p>
                        <h2 className="l-section__title">
                            ¿Tenés una inmobiliaria?
                        </h2>
                        <p className="s-cta-band__text">
                            Publicá tus propiedades gratis por 14 días en Zeta Prop y llegá a miles de compradores e inquilinos en toda Argentina.
                        </p>
                        <div className="s-cta-band__actions">
                            <PrimaryCta href="/login">Publicá gratis</PrimaryCta>
                            <Link
                                href="/contacto"
                                target="_blank" rel="noopener noreferrer"
                                className="l-btn l-btn--secondary"
                            >
                                Contactarnos
                            </Link>
                        </div>
                    </div>
                </div>
            </section>
        </main>
    );
}
