import type { Metadata } from "next";
import JsonLd, { breadcrumbList } from "@/ui/seo/JsonLd";
import { FAQ_CATEGORIES } from "./faqData";

// The FAQ page is a client component, so its metadata lives here.
export const metadata: Metadata = {
    title: "Preguntas frecuentes",
    description:
        "Preguntas frecuentes sobre Zeta Prop: período de prueba, carga de propiedades y contratos, ajustes de alquiler, recibos, portal del inquilino y agenda.",
    alternates: { canonical: "/faqs" },
};

// Built from the same data the accordion renders, so markup and visible content always match.
const faqJsonLd = {
    "@context": "https://schema.org",
    "@graph": [
        {
            "@type": "FAQPage",
            mainEntity: FAQ_CATEGORIES.flatMap((category) =>
                category.faqs.map(({ question, answer }) => ({
                    "@type": "Question",
                    name: question,
                    acceptedAnswer: { "@type": "Answer", text: answer },
                }))
            ),
        },
        breadcrumbList([{ name: "Preguntas frecuentes", path: "/faqs" }]),
    ],
};

export default function FaqsLayout({ children }: { children: React.ReactNode }) {
    return (
        <>
            <JsonLd data={faqJsonLd} />
            {children}
        </>
    );
}
