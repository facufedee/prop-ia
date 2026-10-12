import { Metadata } from "next";
import PricingTable from "@/ui/components/pricing/PricingTable";
import { PRICING_FAQS } from "@/ui/components/pricing/pricingFaqs";
import { adminDb } from "@/infrastructure/firebase/admin";
import JsonLd, { breadcrumbList, SITE_ORIGIN, SOFTWARE_ID } from "@/ui/seo/JsonLd";
import { DEFAULT_OG_IMAGE } from "@/lib/seo/ogImage";

export const metadata: Metadata = {
    title: "Precios del software para inmobiliarias",
    description: "Precios de Zeta Prop, el software para inmobiliarias: compará los planes y elegí el que se adapta a tu equipo. Probalo gratis, sin tarjeta de crédito.",
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
        images: [DEFAULT_OG_IMAGE],
        type: "website",
        locale: "es_AR",
        url: "https://zetaprop.com.ar/precios",
        title: "Precios del software para inmobiliarias | Zeta Prop",
        description: "Precios de Zeta Prop, el software para inmobiliarias: compará los planes y elegí el que se adapta a tu equipo. Probalo gratis, sin tarjeta de crédito.",
        siteName: "Zeta Prop",
    },
    twitter: {
        images: [DEFAULT_OG_IMAGE.url],
        card: "summary_large_image",
        title: "Precios del software para inmobiliarias | Zeta Prop",
        description: "Precios de Zeta Prop, el software para inmobiliarias: compará los planes y elegí el que se adapta a tu equipo. Probalo gratis, sin tarjeta de crédito.",
    },
    robots: { index: true, follow: true },
};

// Plan prices change in Firestore without a deploy; refresh the offers hourly.
export const revalidate = 3600;

interface PlanOffer {
    name: string;
    monthly: number;
}

/**
 * Reads the same Firestore "plans" collection the pricing table renders (read-only: unlike
 * subscriptionService.getAllPlans it never seeds). Returns [] on any failure so the page
 * simply omits offers instead of publishing prices that may not match the table.
 */
async function loadPlanOffers(): Promise<PlanOffer[]> {
    try {
        const snapshot = await adminDb.collection("plans").get();
        return snapshot.docs
            .map((doc) => {
                const data = doc.data();
                return { name: data.name, monthly: data.price?.monthly };
            })
            .filter((plan): plan is PlanOffer => typeof plan.name === "string" && typeof plan.monthly === "number")
            .sort((a, b) => a.monthly - b.monthly);
    } catch (error) {
        console.error("Failed to load plans for pricing JSON-LD", error);
        return [];
    }
}

export default async function PreciosPage() {
    const plans = await loadPlanOffers();
    const pageUrl = `${SITE_ORIGIN}/precios`;

    // Offers live only here: this node extends the home SoftwareApplication via its @id.
    const jsonLd = {
        "@context": "https://schema.org",
        "@graph": [
            {
                "@type": "FAQPage",
                mainEntity: PRICING_FAQS.map(({ q, a }) => ({
                    "@type": "Question",
                    name: q,
                    acceptedAnswer: { "@type": "Answer", text: a },
                })),
            },
            ...(plans.length > 0
                ? [
                      {
                          "@type": "SoftwareApplication",
                          "@id": SOFTWARE_ID,
                          name: "Zeta Prop",
                          applicationCategory: "BusinessApplication",
                          operatingSystem: "Web",
                          offers: plans.map((plan) => ({
                              "@type": "Offer",
                              name: plan.name,
                              price: plan.monthly,
                              priceCurrency: "ARS",
                              url: pageUrl,
                          })),
                      },
                  ]
                : []),
            breadcrumbList([{ name: "Precios", path: "/precios" }]),
        ],
    };

    return (
        <>
            <JsonLd data={jsonLd} />
            <PricingTable />
        </>
    );
}
