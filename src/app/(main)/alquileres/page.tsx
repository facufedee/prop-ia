import { Metadata } from "next";
import {
    RENTALS_FAQ,
    RentalsCta,
    RentalsFaq,
    RentalsFeatures,
    RentalsHero,
    RentalsIncluded,
    RentalsSteps,
} from "@/ui/sections/rentals/RentalsLanding";

const url = "https://zetaprop.com.ar/alquileres";
const description =
    "Software de gestión de alquileres para inmobiliarias: plan de pagos, ajustes por ICL e IPC, recibos en PDF y liquidaciones a propietarios. Probalo gratis.";

export const metadata: Metadata = {
    // The root layout template appends the brand suffix.
    title: "Software de alquileres para inmobiliarias",
    description,
    keywords: [
        "gestión de alquileres",
        "administración de alquileres",
        "software de alquileres",
        "ajuste ICL",
        "ajuste IPC alquiler",
        "liquidación a propietarios",
        "recibos de alquiler",
        "CRM inmobiliario",
    ],
    alternates: { canonical: url },
    openGraph: {
        type: "website",
        locale: "es_AR",
        url,
        siteName: "Zeta Prop",
        title: "Software de alquileres para inmobiliarias | Zeta Prop",
        description,
        images: [{ url: "/assets/img/og-landing.png", width: 1200, height: 630, alt: "Zeta Prop · Gestión de alquileres" }],
    },
    twitter: {
        card: "summary_large_image",
        title: "Software de alquileres para inmobiliarias | Zeta Prop",
        description,
        images: ["/assets/img/og-landing.png"],
    },
};

const faqJsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: RENTALS_FAQ.map((item) => ({
        "@type": "Question",
        name: item.q,
        acceptedAnswer: { "@type": "Answer", text: item.a },
    })),
};

export default function RentalsPage() {
    return (
        <main className="flex flex-col gap-0">
            <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }} />
            <RentalsHero />
            <RentalsSteps />
            <RentalsFeatures />
            <RentalsIncluded />
            <RentalsFaq />
            <RentalsCta />
        </main>
    );
}
