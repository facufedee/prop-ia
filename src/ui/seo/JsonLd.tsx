export const SITE_ORIGIN = "https://zetaprop.com.ar";

/** Stable node ids so pages can reference the site-wide entities instead of redefining them. */
export const ORGANIZATION_ID = `${SITE_ORIGIN}/#organization`;
export const WEBSITE_ID = `${SITE_ORIGIN}/#website`;
export const SOFTWARE_ID = `${SITE_ORIGIN}/#software`;

export interface BreadcrumbItem {
    name: string;
    /** Absolute URL or site path ("/precios"). */
    path: string;
}

/** BreadcrumbList node; "Inicio" is always the first item. */
export function breadcrumbList(items: BreadcrumbItem[]) {
    const all: BreadcrumbItem[] = [{ name: "Inicio", path: "/" }, ...items];
    return {
        "@type": "BreadcrumbList",
        itemListElement: all.map((item, index) => ({
            "@type": "ListItem",
            position: index + 1,
            name: item.name,
            item: item.path.startsWith("http") ? item.path : `${SITE_ORIGIN}${item.path === "/" ? "" : item.path}`,
        })),
    };
}

/**
 * Renders schema.org data as a JSON-LD script. `<` is escaped so string values
 * (titles, descriptions from the CMS) can never close the script tag.
 */
export default function JsonLd({ data }: { data: Record<string, unknown> | Record<string, unknown>[] }) {
    return (
        <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{ __html: JSON.stringify(data).replace(/</g, "\\u003c") }}
        />
    );
}
