import type { Metadata } from "next";

// Funnel/auth page: keep it out of search results.
export const metadata: Metadata = {
    title: "Invitación",
    robots: { index: false, follow: false },
};

export default function InvitacionLayout({ children }: { children: React.ReactNode }) {
    return <>{children}</>;
}
