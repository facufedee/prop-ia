import type { Metadata } from "next";

// Funnel/auth page: keep it out of search results.
export const metadata: Metadata = {
    title: "Darse de baja",
    robots: { index: false, follow: false },
};

export default function UnsubscribeLayout({ children }: { children: React.ReactNode }) {
    return <>{children}</>;
}
