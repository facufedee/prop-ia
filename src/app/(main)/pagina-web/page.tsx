import { Metadata } from "next";
import {
    WEBSITE_FAQ,
    WebsiteCta,
    WebsiteFaq,
    WebsiteFeatures,
    WebsiteHero,
    WebsiteIncluded,
    WebsiteSteps,
} from "@/ui/sections/website/WebsiteLanding";

const url = "https://zetaprop.com.ar/pagina-web";
const description =
    "Página web para inmobiliarias con tu logo y tus colores: tus propiedades se publican solas y las consultas llegan directo a tu panel de Zeta Prop.";

export const metadata: Metadata = {
    // The root layout template appends the brand suffix.
    title: "Página web para inmobiliarias",
    description,
    keywords: [
        "página web para inmobiliarias",
        "sitio web inmobiliaria",
        "web inmobiliaria con propiedades",
        "plantilla web inmobiliaria",
        "publicar propiedades en mi web",
        "CRM inmobiliario",
    ],
    alternates: { canonical: url },
    openGraph: {
        type: "website",
        locale: "es_AR",
        url,
        siteName: "Zeta Prop",
        title: "Página web para inmobiliarias | Zeta Prop",
        description,
        images: [{ url: "/assets/img/og-landing.png", width: 1200, height: 630, alt: "Zeta Prop · Página web para inmobiliarias" }],
    },
    twitter: {
        card: "summary_large_image",
        title: "Página web para inmobiliarias | Zeta Prop",
        description,
        images: ["/assets/img/og-landing.png"],
    },
};

const faqJsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: WEBSITE_FAQ.map((item) => ({
        "@type": "Question",
        name: item.q,
        acceptedAnswer: { "@type": "Answer", text: item.a },
    })),
};

export default function WebsitePage() {
    return (
        <main className="flex flex-col gap-0">
            <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }} />
            <WebsiteHero />
            <WebsiteSteps />
            <WebsiteFeatures />
            <WebsiteIncluded />
            <WebsiteFaq />
            <WebsiteCta />
        </main>
    );
}
