import { Metadata } from "next";

export const metadata: Metadata = {
    title: "Buscar Propiedades en Venta y Alquiler | Zeta Prop",
    description: "Encontrá la propiedad ideal. Casas, departamentos, PH, quintas y terrenos en venta y alquiler en Argentina. Filtrá por ubicación, precio y características.",
};

export default function BusquedaLayout({ children }: { children: React.ReactNode }) {
    return <>{children}</>;
}
