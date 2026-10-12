import { Metadata } from "next";
import JsonLd, { breadcrumbList } from "@/ui/seo/JsonLd";
import { DEFAULT_OG_IMAGE } from "@/lib/seo/ogImage";
import {
    PROPERTIES_FAQ,
    PropertiesCta,
    PropertiesFaq,
    PropertiesFeatures,
    PropertiesHero,
    PropertiesIncluded,
    PropertiesSteps,
} from "@/ui/sections/properties/PropertiesLanding";

const url = "https://zetaprop.com.ar/propiedades-gestion";
const description =
    "CRM para inmobiliarias: cargá tus propiedades, seguí a cada interesado en un tablero, agendá visitas y llevá cada venta desde la oferta hasta la escritura.";

export const metadata: Metadata = {
    // The root layout template appends the brand suffix.
    title: "CRM y gestión de propiedades para inmobiliarias",
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
        images: [DEFAULT_OG_IMAGE],
        type: "website",
        locale: "es_AR",
        url,
        siteName: "Zeta Prop",
        title: "CRM y gestión de propiedades para inmobiliarias | Zeta Prop",
        description,
    },
    twitter: {
        images: [DEFAULT_OG_IMAGE.url],
        card: "summary_large_image",
        title: "CRM y gestión de propiedades para inmobiliarias | Zeta Prop",
        description,
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
        <main className="flex flex-col gap-0">
            <JsonLd data={{ "@context": "https://schema.org", ...breadcrumbList([{ name: "Gestión de propiedades", path: "/propiedades-gestion" }]) }} />
            <JsonLd data={faqJsonLd} />
            <PropertiesHero />
            <PropertiesSteps />
            <PropertiesFeatures />
            <PropertiesIncluded />
            <PropertiesFaq />
            <PropertiesCta />
        </main>
    );
}
