import { Metadata } from "next";
import dynamic from "next/dynamic";
import Hero from "@/ui/sections/Hero";

export const metadata: Metadata = {
    title: "Zeta Prop | El CRM Inmobiliario que se Adapta a tu Inmobiliaria",
    description: "Zeta Prop es el CRM inmobiliario integral de Argentina: gestioná propiedades, alquileres, clientes, emprendimientos y cobranzas desde un solo lugar. Probalo gratis 14 días.",
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
        canonical: "https://zetaprop.com.ar",
    },
    openGraph: {
        type: "website",
        locale: "es_AR",
        url: "https://zetaprop.com.ar",
        title: "Zeta Prop | El CRM Inmobiliario que se Adapta a tu Inmobiliaria",
        description: "Gestioná propiedades, alquileres, clientes y emprendimientos desde un solo sistema. Diseñado para inmobiliarias argentinas. Probalo gratis.",
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
        title: "Zeta Prop | CRM Inmobiliario para Argentina",
        description: "Gestioná propiedades, alquileres y clientes desde un solo sistema. Probalo gratis 14 días.",
        images: ["/assets/img/og-landing.png"],
    },
};

import Features from "@/ui/sections/Features";
import Testimonials from "@/ui/sections/Testimonials";
import HumanPromise from "@/ui/sections/HumanPromise";
import PropertyNetworkCTA from "@/ui/sections/PropertyNetworkCTA";
import ContactForm from "@/ui/sections/ContactForm";

import GoogleAuthPrompt from "@/ui/components/auth/GoogleAuthPrompt";

import LatestBlogPosts from "@/ui/sections/LatestBlogPosts";

export default function LandingPage() {
    return (
        <main className="bg-white min-h-screen flex flex-col gap-0">
            <GoogleAuthPrompt />

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
                                    "text": "Sí. Cada inmobiliaria obtiene su propio sitio web profesional con dominio personalizado donde se publican automáticamente todas las propiedades activas."
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
            <Features />
            <HumanPromise />
            <PropertyNetworkCTA />
            <LatestBlogPosts />
            <ContactForm />

        </main>
    );
}