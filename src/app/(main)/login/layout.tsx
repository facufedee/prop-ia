import type { Metadata } from "next";

export const metadata: Metadata = {
    title: "Iniciar sesión",
    description: "Accedé a tu cuenta de Zeta Prop para gestionar tasaciones, clientes y propiedades.",
    // Auth page: keep it out of search results.
    robots: { index: false, follow: false },
};

export default function LoginLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return <>{children}</>;
}
