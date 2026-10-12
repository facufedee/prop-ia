import type { Metadata } from "next";

// Funnel/auth page: keep it out of search results.
export const metadata: Metadata = {
    title: "Verificación",
    robots: { index: false, follow: false },
};

export default function VerifyLayout({ children }: { children: React.ReactNode }) {
    return <>{children}</>;
}
