import { Metadata } from "next";
import LandingNav from "@/ui/components/landing/LandingNav";
import LandingFooter from "@/ui/components/landing/LandingFooter";
import { landingSans, landingSerif } from "@/ui/sections/landingFonts";
import {
    PROPERTIES_FAQ,
    PropertiesCta,
    PropertiesFaq,
    PropertiesFeatures,
    PropertiesHero,
    PropertiesIncluded,
    PropertiesSteps,
} from "@/ui/sections/properties/PropertiesLanding";
import "@/ui/sections/landing-theme.css";

const url = "https://zetaprop.com.ar/propiedades-gestion";
const description =
    "Software para administrar propiedades e interesados: carga en cinco pasos, fichas en PDF, tablero de consultas, agenda de visitas, tasación y seguimiento de ventas hasta la escritura.";

export const metadata: Metadata = {
    // The root layout template appends the brand suffix.
    title: "Administración de propiedades para inmobiliarias",
    description,
    keywords: [
        "administración de propiedades",
        "software inmobiliario",
        "gestión de cartera inmobiliaria",
        "seguimiento de interesados",
        "agenda de visitas inmobiliaria",
        "tasación de propiedades",
        "CRM inmobiliario",
    ],
    alternates: { canonical: url },
    openGraph: {
        type: "website",
        locale: "es_AR",
        url,
        siteName: "Zeta Prop",
        title: "Administración de propiedades para inmobiliarias | Zeta Prop",
        description,
        images: [{ url: "/assets/img/og-landing.png", width: 1200, height: 630, alt: "Zeta Prop · Administración de propiedades" }],
    },
    twitter: {
        card: "summary_large_image",
        title: "Administración de propiedades para inmobiliarias | Zeta Prop",
        description,
        images: ["/assets/img/og-landing.png"],
    },
};

const faqJsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: PROPERTIES_FAQ.map((item) => ({
        "@type": "Question",
        name: item.q,
        acceptedAnswer: { "@type": "Answer", text: item.a },
    })),
};

export default function PropertiesManagementPage() {
    return (
        <main className={`landing-page ${landingSans.variable} ${landingSerif.variable} min-h-screen flex flex-col gap-0`}>
            <LandingNav />
            <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }} />
            <PropertiesHero />
            <PropertiesSteps />
            <PropertiesFeatures />
            <PropertiesIncluded />
            <PropertiesFaq />
            <PropertiesCta />
            <LandingFooter />
        </main>
    );
}
