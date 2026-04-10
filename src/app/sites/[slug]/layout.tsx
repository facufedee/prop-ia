import { Metadata } from "next";
import SiteProvider from "./SiteProvider";
import { getSitePayload } from "./siteData";
import { headers } from "next/headers";

// ISR: revalidate every 60 s — site config rarely changes
export const revalidate = 60;

// ── SSR Metadata ──────────────────────────────────────────────────────────────

export async function generateMetadata(
    { params }: { params: Promise<{ slug: string }> }
): Promise<Metadata> {
    const { slug } = await params;
    const site = await getSitePayload(slug); // cached — shared with layout render

    if (!site) {
        return { title: "Sitio no encontrado", robots: { index: false, follow: false } };
    }

    const nombre      = site.nombre      || slug;
    const descripcion = site.descripcion || `Portal inmobiliario de ${nombre}`;

    return {
        icons: site.faviconUrl
            ? { icon: site.faviconUrl, apple: site.faviconUrl }
            : { icon: [], apple: [] }, // suppress Next.js default icon.png request on custom domains
        title:       `${nombre} | Portal Inmobiliario`,
        description: descripcion,
        openGraph: {
            title:       nombre,
            description: descripcion,
            images:      site.coverUrl ? [site.coverUrl] : site.logoUrl ? [site.logoUrl] : [],
            siteName:    nombre,
            type:        "website",
        },
        twitter: {
            card:        "summary_large_image",
            title:       nombre,
            description: descripcion,
            images:      site.coverUrl ? [site.coverUrl] : [],
        },
    };
}

// ── Layout ────────────────────────────────────────────────────────────────────

export default async function SiteLayout({
    children,
    params,
}: {
    children: React.ReactNode;
    params: Promise<{ slug: string }>;
}) {
    const { slug } = await params;
    const headerList = await headers();
    const host = headerList.get("host") || "";
    // Detect if we are on the main platform or a custom domain
    const isPlatformHost = host.includes("zetaprop.com.ar") || host.includes("localhost") || host.includes(".vercel.app");
    const basePath = isPlatformHost ? `/sites/${slug}` : "";

    let site = null;
    try {
        site = await getSitePayload(slug);
    } catch (err) {
        console.error("[SiteLayout] getSitePayload failed:", err);
    }

    return <SiteProvider initialSite={site} initialBasePath={basePath}>{children}</SiteProvider>;
}
