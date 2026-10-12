import type { Metadata } from "next";

export const metadata: Metadata = {
    title: "Recuperar contraseña | Zeta Prop",
    description: "Recibí un enlace por email para crear una contraseña nueva en Zeta Prop.",
    robots: { index: false },
};

export default function ForgotPasswordLayout({ children }: { children: React.ReactNode }) {
    return <>{children}</>;
}
