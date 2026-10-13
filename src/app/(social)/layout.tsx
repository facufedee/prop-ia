import type { Metadata } from "next";
import { Toaster } from "sonner";
import { AuthProvider } from "@/ui/context/AuthContext";

// Internal social-media tooling: never index it.
export const metadata: Metadata = {
    title: "Generador RRSS | ZetaProp",
    robots: { index: false, follow: false },
};

export default function SocialLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return (
        <>
            {/* Auth is optional here: it only unlocks the admin-only "send to social" action. */}
            <AuthProvider>{children}</AuthProvider>
            <Toaster position="top-right" theme="dark" richColors />
        </>
    );
}
