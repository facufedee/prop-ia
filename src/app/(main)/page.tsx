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
        images: ["/assets/img/logo_web_ZetaProp_fondonegro.png"],
    },
};

const Features = dynamic(() => import("@/ui/sections/Features"));
const Testimonials = dynamic(() => import("@/ui/sections/Testimonials"));
const PropertyNetworkCTA = dynamic(() => import("@/ui/sections/PropertyNetworkCTA"));
const ContactForm = dynamic(() => import("@/ui/sections/ContactForm"));

const GoogleAuthPrompt = dynamic(() => import("@/ui/components/auth/GoogleAuthPrompt"));

const LatestBlogPosts = dynamic(() => import("@/ui/sections/LatestBlogPosts"));
const FAQ = dynamic(() => import("@/ui/sections/FAQ"));

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
            {/* Testimonials removed as per user request */}
            {/* <Testimonials /> */}
            <PropertyNetworkCTA />
            <LatestBlogPosts />
            <FAQ />
            <ContactForm />

        </main>
    );
}