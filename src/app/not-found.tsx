import type { Metadata } from "next";
import ClientLayout from "@/ui/components/layout/ClientLayout";
import NotFound from "./(main)/not-found";

export const metadata: Metadata = {
    title: "Página no encontrada",
    robots: { index: false },
};

// Unmatched URLs render this root not-found, which sits outside the (main) layout,
// so it wraps the site chrome itself to keep the 404 on the public theme.
export default function RootNotFound() {
    return (
        <ClientLayout>
            <NotFound />
        </ClientLayout>
    );
}
