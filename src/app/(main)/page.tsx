import { Metadata } from "next";
import Hero from "@/ui/sections/Hero";

export const metadata: Metadata = {
    // Absolute: the keyword-led home title would exceed 60 chars with the template suffix.
    title: { absolute: "Software para inmobiliarias: alquileres, propiedades y web" },
    description: "Software para inmobiliarias: cobrá alquileres, ordená tus propiedades y recibí consultas desde tu propia página web, todo en un solo lugar. Probalo gratis.",
    keywords: [
        "CRM inmobiliario argentina",
        "software inmobiliario",
        "gestión de propiedades",
        "administración de alquileres",
        "sistema inmobiliario",
        "portal inmobiliario",
        "gestión de clientes inmobiliaria",
        "emprendimientos inmobiliarios",
        "cobranzas alquileres",
        "agenda inmobiliaria",
    ],
    alternates: {
        canonical: "/",
    },
    openGraph: {
        type: "website",
        locale: "es_AR",
        url: "https://zetaprop.com.ar",
        title: "Software para inmobiliarias: alquileres, propiedades y web",
        description: "Software para inmobiliarias: cobrá alquileres, ordená tus propiedades y recibí consultas desde tu propia página web, todo en un solo lugar. Probalo gratis.",
        siteName: "Zeta Prop",
    },
    twitter: {
        card: "summary_large_image",
        title: "Software para inmobiliarias: alquileres, propiedades y web",
        description: "Software para inmobiliarias: cobrá alquileres, ordená tus propiedades y recibí consultas desde tu propia página web, todo en un solo lugar. Probalo gratis.",
    },
};

import Intro from "@/ui/sections/Intro";
import Modules from "@/ui/sections/Modules";
import { Pricing } from "@/ui/sections/Pricing";
import HumanPromise from "@/ui/sections/HumanPromise";
import PropertyNetworkCTA, { type NetworkProperty } from "@/ui/sections/PropertyNetworkCTA";
import { publicService } from "@/infrastructure/services/publicService";
import { propertyPath } from "@/lib/seo/propertyUrl";
import ContactForm from "@/ui/sections/ContactForm";

import LatestBlogPosts from "@/ui/sections/LatestBlogPosts";
import GoogleAuthPromptLazy from "@/ui/components/auth/GoogleAuthPromptLazy";
import JsonLd, { ORGANIZATION_ID, SITE_ORIGIN, SOFTWARE_ID } from "@/ui/seo/JsonLd";

// The single SoftwareApplication node of the site. Offers live on /precios, which references
// this node by @id and reads plan prices from the same source as the pricing table.
const softwareJsonLd = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    "@id": SOFTWARE_ID,
    name: "Zeta Prop",
    url: SITE_ORIGIN,
    applicationCategory: "BusinessApplication",
    operatingSystem: "Web",
    inLanguage: "es-AR",
    description: "Software para inmobiliarias: gestión de alquileres, administración de propiedades, consultas y página web propia en un solo lugar.",
    publisher: { "@id": ORGANIZATION_ID },
    featureList: [
        "Gestión de propiedades",
        "Administración de alquileres",
        "CRM de consultas",
        "Emprendimientos inmobiliarios",
        "Cobranzas y liquidaciones",
        "Agenda",
        "Portal del inquilino",
        "Sitio web propio",
        "Multisucursal",
    ],
};

// ISR: the featured listings and latest posts refresh hourly instead of on every visit.
export const revalidate = 3600;

const FEATURED_COUNT = 8;

// Server-side so the home ships a few cards instead of the whole catalog to every visitor.
async function getFeaturedProperties(): Promise<NetworkProperty[]> {
    const properties = await publicService.getFeaturedProperties(FEATURED_COUNT).catch(() => []);
    return properties.map((p) => ({
        id: p.id,
        href: propertyPath(p),
        title: p.title,
        image: p.imageUrls[0],
        operation_type: p.operation_type,
        price: p.price,
        currency: p.currency,
        hidePrice: p.hidePrice ?? false,
        localidad: p.localidad ?? "",
        provincia: p.provincia ?? "",
        rooms: p.rooms ?? 0,
        bathrooms: p.bathrooms ?? 0,
        area_covered: p.area_covered ?? 0,
    }));
}

export default async function LandingPage() {
    const featuredProperties = await getFeaturedProperties();

    return (
        <main className="flex flex-col gap-0">
            <GoogleAuthPromptLazy />

            <JsonLd data={softwareJsonLd} />

            <Hero />
            <Modules />
            <Intro />
            <Pricing />
            <HumanPromise />
            <PropertyNetworkCTA properties={featuredProperties} />
            <LatestBlogPosts />
            <ContactForm />

        </main>
    );
}