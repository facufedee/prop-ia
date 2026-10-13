import type { Metadata } from "next";
import { Toaster } from "sonner";

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
            {children}
            <Toaster position="top-right" theme="dark" richColors />
        </>
    );
}
