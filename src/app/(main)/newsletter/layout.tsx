import type { Metadata } from "next";

// Funnel/auth page: keep it out of search results.
export const metadata: Metadata = {
    title: "Newsletter",
    robots: { index: false, follow: false },
};

export default function NewsletterLayout({ children }: { children: React.ReactNode }) {
    return <>{children}</>;
}
