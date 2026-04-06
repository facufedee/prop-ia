import { Metadata } from "next";
import PricingTable from "@/ui/components/pricing/PricingTable";

export const metadata: Metadata = {
    title: "Planes y Precios | CRM Inmobiliario sin costos ocultos",
    description: "Elegí el plan de Zeta Prop que se adapta a tu inmobiliaria. Desde la opción gratuita hasta soluciones Enterprise con IA, multi-sucursal y soporte prioritario. 14 días de prueba sin tarjeta.",
    keywords: [
        "precios CRM inmobiliario",
        "planes software inmobiliario",
        "cuánto cuesta Zeta Prop",
        "plan gratuito inmobiliaria",
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
                        mainEntity: [
                            {
                                "@type": "Question",
                                name: "¿Puedo cambiar de plan en cualquier momento?",
                                acceptedAnswer: {
                                    "@type": "Answer",
                                    text: "Sí. Podés hacer upgrade o downgrade de tu plan en cualquier momento desde el panel de configuración. Los cambios se aplican de forma inmediata y el cobro se prorratea según los días restantes del período.",
                                },
                            },
                            {
                                "@type": "Question",
                                name: "¿Qué pasa cuando termina la prueba gratuita de 14 días?",
                                acceptedAnswer: {
                                    "@type": "Answer",
                                    text: "Al finalizar la prueba, tu cuenta pasa a modo lectura: podés ver todo pero no agregar nuevos datos. No se te cobra nada automáticamente. Elegís el plan que mejor se adapte y continuás donde lo dejaste.",
                                },
                            },
                            {
                                "@type": "Question",
                                name: "¿Necesito tarjeta de crédito para registrarme?",
                                acceptedAnswer: {
                                    "@type": "Answer",
                                    text: "No. El registro y los 14 días de prueba son completamente gratis y no requieren ningún método de pago.",
                                },
                            },
                            {
                                "@type": "Question",
                                name: "¿Qué métodos de pago aceptan?",
                                acceptedAnswer: {
                                    "@type": "Answer",
                                    text: "Aceptamos todas las tarjetas de crédito y débito (Visa, Mastercard, American Express), transferencia bancaria y MercadoPago.",
                                },
                            },
                            {
                                "@type": "Question",
                                name: "¿Funciona para inmobiliarias con varias sucursales?",
                                acceptedAnswer: {
                                    "@type": "Answer",
                                    text: "Sí. Los planes Profesional y Enterprise incluyen gestión multisucursal.",
                                },
                            },
                        ],
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
