import { Metadata } from "next";
import PricingTable from "@/ui/components/pricing/PricingTable";

export const metadata: Metadata = {
    title: "Planes y Precios | PROP-IA",
    description: "Conocé nuestros planes para inmobiliarias. Desde opciones gratuitas hasta soluciones empresariales con IA y publicaciones ilimitadas.",
    alternates: {
        canonical: "https://prop-ia.com/catalogo",
    },
};

export default function CatalogoPage() {
    return <PricingTable />;
}
