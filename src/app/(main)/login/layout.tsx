import type { Metadata } from "next";

export const metadata: Metadata = {
    title: "Iniciar Sesión | Zeta Prop",
    description: "Accedé a tu cuenta de Zeta Prop para gestionar tasaciones, clientes y propiedades.",
};

export default function LoginLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return <>{children}</>;
}
