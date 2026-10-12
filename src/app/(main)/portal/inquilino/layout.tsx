import type { Metadata } from "next";

// Tenant portal screens are private; the parent portal layout is a client
// component and can't export metadata, so this server layout does it.
export const metadata: Metadata = {
    title: "Portal de inquilinos",
    robots: { index: false, follow: false },
};

export default function TenantPortalLayout({ children }: { children: React.ReactNode }) {
    return <>{children}</>;
}
