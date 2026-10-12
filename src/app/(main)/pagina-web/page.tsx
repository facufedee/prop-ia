import { Metadata } from "next";
import JsonLd, { breadcrumbList } from "@/ui/seo/JsonLd";
import { DEFAULT_OG_IMAGE } from "@/lib/seo/ogImage";
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
        images: [DEFAULT_OG_IMAGE],
        type: "website",
        locale: "es_AR",
        url,
        siteName: "Zeta Prop",
        title: "Página web para inmobiliarias | Zeta Prop",
        description,
    },
    twitter: {
        images: [DEFAULT_OG_IMAGE.url],
        card: "summary_large_image",
        title: "Página web para inmobiliarias | Zeta Prop",
        description,
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
            <JsonLd data={{ "@context": "https://schema.org", ...breadcrumbList([{ name: "Página web", path: "/pagina-web" }]) }} />
            <JsonLd data={faqJsonLd} />
            <WebsiteHero />
            <WebsiteSteps />
            <WebsiteFeatures />
            <WebsiteIncluded />
            <WebsiteFaq />
            <WebsiteCta />
        </main>
    );
}
