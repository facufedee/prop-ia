import type { Metadata } from "next";

// Funnel/auth page: keep it out of search results.
export const metadata: Metadata = {
    title: "Pago",
    robots: { index: false, follow: false },
};

export default function CheckoutLayout({ children }: { children: React.ReactNode }) {
    return <>{children}</>;
}
