import { Metadata } from "next";
import PricingTable from "@/ui/components/pricing/PricingTable";
import { PRICING_FAQS } from "@/ui/components/pricing/pricingFaqs";

export const metadata: Metadata = {
    title: "Planes y Precios | CRM Inmobiliario sin costos ocultos",
    description: "Elegí el plan de Zeta Prop que se adapta a tu inmobiliaria: Básico, Profesional o Enterprise. 14 días de prueba gratis, sin tarjeta.",
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
        title: "Planes y Precios | Zeta Prop",
        description: "Sin costos ocultos ni contratos a largo plazo. Probá Zeta Prop gratis 14 días y elegí el plan que acompaña el crecimiento de tu inmobiliaria.",
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
        title: "Planes y Precios | Zeta Prop",
        description: "Probá Zeta Prop gratis 14 días. Sin tarjeta de crédito, sin contratos.",
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
