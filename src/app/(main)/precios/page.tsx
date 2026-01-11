import { Metadata } from "next";
import PricingTable from "@/ui/components/pricing/PricingTable";

export const metadata: Metadata = {
    title: "Planes y Precios | Zeta Prop",
    description: "Conocé nuestros planes para inmobiliarias. Desde opciones gratuitas hasta soluciones empresariales con IA y publicaciones ilimitadas.",
    alternates: {
        canonical: "https://zetaprop.com.ar/precios",
    },
};

export default function CatalogoPage() {
    return <PricingTable />;
}
