import type { Metadata } from "next";

export const metadata: Metadata = {
    title: "Recuperar contraseña",
    description: "Recibí un enlace por email para crear una contraseña nueva en Zeta Prop.",
    robots: { index: false, follow: false },
};

export default function ForgotPasswordLayout({ children }: { children: React.ReactNode }) {
    return <>{children}</>;
}
