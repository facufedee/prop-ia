import { Metadata } from "next";

export const metadata: Metadata = {
    title: "Buscar propiedades en venta y alquiler",
    description: "Encontrá la propiedad ideal. Casas, departamentos, PH, quintas y terrenos en venta y alquiler en Argentina. Filtrá por ubicación, precio y características.",
    // Client-rendered results page driven by query params: /propiedades is the indexable listing.
    robots: { index: false, follow: true },
};

export default function BusquedaLayout({ children }: { children: React.ReactNode }) {
    return <>{children}</>;
}
