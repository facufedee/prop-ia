
import { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Encontrá tu Hogar | Propiedades en Venta y Alquiler | Zeta Prop',
    description: 'Explorá miles de propiedades en venta y alquiler en Argentina. Casas, departamentos, PH, quintas y terrenos con las mejores inmobiliarias. Zeta Prop.',
};

export default function PropertiesLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return <>{children}</>;
}
