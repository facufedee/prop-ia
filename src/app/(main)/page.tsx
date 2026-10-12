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
        images: [
            {
                url: "/assets/img/og-landing.png",
                width: 1200,
                height: 630,
                alt: "Zeta Prop - CRM Inmobiliario Integral para Argentina",
            },
        ],
    },
    twitter: {
        card: "summary_large_image",
        title: "Software para inmobiliarias: alquileres, propiedades y web",
        description: "Software para inmobiliarias: cobrá alquileres, ordená tus propiedades y recibí consultas desde tu propia página web, todo en un solo lugar. Probalo gratis.",
        images: ["/assets/img/og-landing.png"],
    },
};

import Intro from "@/ui/sections/Intro";
import Modules from "@/ui/sections/Modules";
import { Pricing } from "@/ui/sections/Pricing";
import HumanPromise from "@/ui/sections/HumanPromise";
import PropertyNetworkCTA from "@/ui/sections/PropertyNetworkCTA";
import ContactForm from "@/ui/sections/ContactForm";

import LatestBlogPosts from "@/ui/sections/LatestBlogPosts";
import GoogleAuthPromptLazy from "@/ui/components/auth/GoogleAuthPromptLazy";

export default function LandingPage() {
    return (
        <main className="flex flex-col gap-0">
            <GoogleAuthPromptLazy />

            {/* Structured Data — SoftwareApplication */}
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{
                    __html: JSON.stringify({
                        "@context": "https://schema.org",
                        "@type": "SoftwareApplication",
                        "name": "Zeta Prop",
                        "url": "https://zetaprop.com.ar",
                        "applicationCategory": "BusinessApplication",
                        "operatingSystem": "Web",
                        "inLanguage": "es-AR",
                        "offers": {
                            "@type": "Offer",
                            "price": "0",
                            "priceCurrency": "ARS",
                            "description": "14 días de prueba gratis, sin tarjeta de crédito",
                            "availability": "https://schema.org/InStock"
                        },
                        "description": "CRM Inmobiliario integral para gestión de propiedades, alquileres, clientes y emprendimientos en Argentina.",
                        "screenshot": "https://zetaprop.com.ar/assets/img/og-landing.png",
                        "featureList": [
                            "Gestión de propiedades",
                            "Administración de alquileres",
                            "CRM de clientes",
                            "Emprendimientos inmobiliarios",
                            "Cobranzas y liquidaciones",
                            "Agenda de cobros",
                            "Portal del inquilino",
                            "Sitio web propio",
                            "Multisucursal"
                        ]
                    })
                }}
            />

            {/* Structured Data — FAQPage */}
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{
                    __html: JSON.stringify({
                        "@context": "https://schema.org",
                        "@type": "FAQPage",
                        "mainEntity": [
                            {
                                "@type": "Question",
                                "name": "¿Qué es Zeta Prop?",
                                "acceptedAnswer": {
                                    "@type": "Answer",
                                    "text": "Zeta Prop es un CRM inmobiliario integral diseñado para inmobiliarias argentinas. Permite gestionar propiedades, alquileres, clientes, cobranzas, emprendimientos y mucho más desde un solo sistema."
                                }
                            },
                            {
                                "@type": "Question",
                                "name": "¿Cuánto cuesta Zeta Prop?",
                                "acceptedAnswer": {
                                    "@type": "Answer",
                                    "text": "Zeta Prop ofrece 14 días de prueba gratis sin necesidad de tarjeta de crédito. Luego podés elegir el plan que mejor se adapte a tu inmobiliaria. Consultá nuestros planes en zetaprop.com.ar/precios."
                                }
                            },
                            {
                                "@type": "Question",
                                "name": "¿Puedo gestionar alquileres con Zeta Prop?",
                                "acceptedAnswer": {
                                    "@type": "Answer",
                                    "text": "Sí. Zeta Prop incluye un módulo completo de gestión de alquileres: contratos, pagos, ajustes por inflación, liquidaciones para propietarios y portal del inquilino."
                                }
                            },
                            {
                                "@type": "Question",
                                "name": "¿Zeta Prop tiene sitio web para mi inmobiliaria?",
                                "acceptedAnswer": {
                                    "@type": "Answer",
                                    "text": "Sí. Cada inmobiliaria obtiene su propio sitio web, en un subdominio gratuito, donde se publican automáticamente todas las propiedades activas."
                                }
                            },
                            {
                                "@type": "Question",
                                "name": "¿Funciona para inmobiliarias con varias sucursales?",
                                "acceptedAnswer": {
                                    "@type": "Answer",
                                    "text": "Sí. Zeta Prop soporta gestión multisucursal, permitiendo administrar propiedades, agentes y reportes por sucursal desde una sola cuenta."
                                }
                            }
                        ]
                    })
                }}
            />

            <Hero />
            <Modules />
            <Intro />
            <Pricing />
            <HumanPromise />
            <PropertyNetworkCTA />
            <LatestBlogPosts />
            <ContactForm />

        </main>
    );
}