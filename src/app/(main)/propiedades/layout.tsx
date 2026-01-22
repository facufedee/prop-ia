
import { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Propiedades | CRM Inmobiliario | Gestión de Propiedades | Alquileres | Zeta Prop',
    description: 'Explora las mejores propiedades en venta y alquiler de las inmobiliarias más confiables de Argentina. Gestionado por Zeta Prop.',
};

export default function PropertiesLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return <>{children}</>;
}
