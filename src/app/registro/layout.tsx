import type { Metadata } from "next";

export const metadata: Metadata = {
    title: "Crear Cuenta | PROP-IA",
    description: "Registrate en PROP-IA y comenzá a tasar propiedades con Inteligencia Artificial hoy mismo.",
};

export default function RegisterLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return <>{children}</>;
}
