import { Metadata } from "next";
import { adminDb } from "@/infrastructure/firebase/admin";
import SiteProvider from "./SiteProvider";

// ── SEO: server-side metadata per site ───────────────────────────────────────

export async function generateMetadata(
    { params }: { params: Promise<{ slug: string }> }
): Promise<Metadata> {
    const { slug } = await params;

    try {
        const snap = await adminDb
            .collection("sites")
            .where("slug", "==", slug)
            .where("published", "==", true)
            .limit(1)
            .get();

        if (snap.empty) {
            return { title: "Sitio no encontrado", robots: { index: false, follow: false } };
        }

        const data = snap.docs[0].data();
        const nombre: string = data.nombre ?? slug;
        const descripcion: string = data.descripcion ?? `Portal inmobiliario de ${nombre}`;
        const coverUrl: string | undefined = data.coverUrl;
        const logoUrl: string | undefined = data.logoUrl;

        return {
            title: `${nombre} | Portal Inmobiliario`,
            description: descripcion,
            openGraph: {
                title: nombre,
                description: descripcion,
                images: coverUrl ? [coverUrl] : logoUrl ? [logoUrl] : [],
                siteName: nombre,
                type: "website",
            },
            twitter: {
                card: "summary_large_image",
                title: nombre,
                description: descripcion,
                images: coverUrl ? [coverUrl] : [],
            },
        };
    } catch {
        return { title: slug };
    }
}

// ── Layout ────────────────────────────────────────────────────────────────────

export default function SiteLayout({ children }: { children: React.ReactNode }) {
    return <SiteProvider>{children}</SiteProvider>;
}
