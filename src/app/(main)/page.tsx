import { Metadata } from "next";
import dynamic from "next/dynamic";
import Hero from "@/ui/sections/Hero";

export const metadata: Metadata = {
    title: "Zeta Prop | Tu CRM Inmobiliario Integral",
    description: "Control total de tu inmobiliaria: Administración de propiedades, clientes, alquileres y emprendimientos. El sistema más completo de Argentina.",
    keywords: "CRM inmobiliario, gestión de propiedades, alquileres, administración, agenda, clientes",
    openGraph: {
        title: "Zeta Prop | Tu CRM Inmobiliario Integral",
        description: "La plataforma definitiva para gestionar propiedades, alquileres, clientes y emprendimientos.",
        images: ["/assets/img/Logo%20ZetaProp%20Fondo%20Blanco%202.png"],
    },
};

import Features from "@/ui/sections/Features";
import Testimonials from "@/ui/sections/Testimonials";
import HumanPromise from "@/ui/sections/HumanPromise";
import PropertyNetworkCTA from "@/ui/sections/PropertyNetworkCTA";
import ContactForm from "@/ui/sections/ContactForm";

import GoogleAuthPrompt from "@/ui/components/auth/GoogleAuthPrompt";

import LatestBlogPosts from "@/ui/sections/LatestBlogPosts";
import FAQ from "@/ui/sections/FAQ";

export default function LandingPage() {
    return (
        <main className="bg-white min-h-screen flex flex-col gap-0">
            <GoogleAuthPrompt />

            {/* Structured Data for Software Application */}
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{
                    __html: JSON.stringify({
                        "@context": "https://schema.org",
                        "@type": "SoftwareApplication",
                        "name": "Zeta Prop",
                        "applicationCategory": "BusinessApplication",
                        "operatingSystem": "Web",
                        "offers": {
                            "@type": "Offer",
                            "price": "0",
                            "priceCurrency": "ARS",
                            "priceValidUntil": "2026-12-31",
                            "availability": "https://schema.org/InStock"
                        },
                        "description": "CRM Inmobiliario integral para gestión de propiedades y alquileres en Argentina.",
                        "aggregateRating": {
                            "@type": "AggregateRating",
                            "ratingValue": "4.9",
                            "ratingCount": "150"
                        }
                    })
                }}
            />

            <Hero />
            <Features />
            <HumanPromise />
            <PropertyNetworkCTA />
            <LatestBlogPosts />
            <FAQ />
            <ContactForm />

        </main>
    );
}