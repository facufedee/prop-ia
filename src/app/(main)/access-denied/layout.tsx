import type { Metadata } from "next";

// Funnel/auth page: keep it out of search results.
export const metadata: Metadata = {
    title: "Acceso denegado",
    robots: { index: false, follow: false },
};

export default function AccessDeniedLayout({ children }: { children: React.ReactNode }) {
    return <>{children}</>;
}
