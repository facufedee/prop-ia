import { Metadata } from "next";
import PricingTable from "@/ui/components/pricing/PricingTable";
import { PRICING_FAQS } from "@/ui/components/pricing/pricingFaqs";

export const metadata: Metadata = {
    title: "Precios del software para inmobiliarias",
    description: "Precios de Zeta Prop, el software para inmobiliarias: compará los planes y elegí el que se adapta a tu equipo. Probalo gratis, sin tarjeta de crédito.",
    keywords: [
        "precios CRM inmobiliario",
        "planes software inmobiliario",
        "cuánto cuesta Zeta Prop",
        "prueba gratis CRM inmobiliario",
        "software inmobiliario precio argentina",
        "CRM inmobiliario mensual",
        "gestión de alquileres precio",
    ],
    alternates: {
        canonical: "https://zetaprop.com.ar/precios",
    },
    openGraph: {
        type: "website",
        locale: "es_AR",
        url: "https://zetaprop.com.ar/precios",
        title: "Precios del software para inmobiliarias | Zeta Prop",
        description: "Precios de Zeta Prop, el software para inmobiliarias: compará los planes y elegí el que se adapta a tu equipo. Probalo gratis, sin tarjeta de crédito.",
        siteName: "Zeta Prop",
        images: [
            {
                url: "/assets/img/Logo%20ZetaProp%20Fondo%20Blanco%202.png",
                width: 1200,
                height: 630,
                alt: "Planes y Precios — Zeta Prop CRM Inmobiliario",
            },
        ],
    },
    twitter: {
        card: "summary_large_image",
        title: "Precios del software para inmobiliarias | Zeta Prop",
        description: "Precios de Zeta Prop, el software para inmobiliarias: compará los planes y elegí el que se adapta a tu equipo. Probalo gratis, sin tarjeta de crédito.",
        images: ["/assets/img/Logo%20ZetaProp%20Fondo%20Blanco%202.png"],
    },
    robots: { index: true, follow: true },
};

export default function PreciosPage() {
    return (
        <>
            {/* JSON-LD — FAQPage (mirrors FAQ accordion) */}
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{
                    __html: JSON.stringify({
                        "@context": "https://schema.org",
                        "@type": "FAQPage",
                        mainEntity: PRICING_FAQS.map(({ q, a }) => ({
                            "@type": "Question",
                            name: q,
                            acceptedAnswer: { "@type": "Answer", text: a },
                        })),
                    }),
                }}
            />

            {/* JSON-LD — SoftwareApplication with offers */}
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{
                    __html: JSON.stringify({
                        "@context": "https://schema.org",
                        "@type": "SoftwareApplication",
                        name: "Zeta Prop",
                        url: "https://zetaprop.com.ar",
                        applicationCategory: "BusinessApplication",
                        operatingSystem: "Web",
                        offers: {
                            "@type": "Offer",
                            price: "0",
                            priceCurrency: "ARS",
                            description: "14 días de prueba gratis, sin tarjeta de crédito.",
                            availability: "https://schema.org/InStock",
                        },
                    }),
                }}
            />

            <PricingTable />
        </>
    );
}
