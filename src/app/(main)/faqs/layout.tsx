import type { Metadata } from "next";

// The FAQ page is a client component, so its metadata lives here.
export const metadata: Metadata = {
    title: "Preguntas frecuentes",
    description:
        "Preguntas frecuentes sobre Zeta Prop: período de prueba, carga de propiedades y contratos, ajustes de alquiler, recibos, portal del inquilino y agenda.",
    alternates: { canonical: "/faqs" },
};

export default function FaqsLayout({ children }: { children: React.ReactNode }) {
    return <>{children}</>;
}
