import { Metadata } from "next";

interface SEOProps {
    title: string;
    description: string;
    keywords?: string;
    ogImage?: string;
    canonical?: string;
    noindex?: boolean;
}

/**
 * Generate optimized metadata for SEO
 * Usage: export const metadata = generateMetadata({ title: "...", description: "..." });
 */
export function generateMetadata({
    title,
    description,
    keywords,
    ogImage = "/assets/img/og-default.jpg",
    canonical,
    noindex = false,
}: SEOProps): Metadata {
    const siteName = "Zeta Prop";
    const fullTitle = title.includes(siteName) ? title : `${title} | ${siteName}`;

    return {
        title: fullTitle,
        description,
        keywords,
        openGraph: {
            title: fullTitle,
            description,
            images: [ogImage],
            siteName,
            type: "website",
        },
        twitter: {
            card: "summary_large_image",
            title: fullTitle,
            description,
            images: [ogImage],
        },
        ...(canonical && { alternates: { canonical } }),
        ...(noindex && { robots: { index: false, follow: false } }),
    };
}
