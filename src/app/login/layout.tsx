import type { Metadata } from "next";

export const metadata: Metadata = {
    title: "Iniciar Sesión | PROP-IA",
    description: "Accedé a tu cuenta de PROP-IA para gestionar tasaciones, clientes y propiedades.",
};

export default function LoginLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return <>{children}</>;
}
