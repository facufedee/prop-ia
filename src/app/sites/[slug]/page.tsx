import { getSitePayload, getActiveProperties, payloadToSite } from "./siteData";
import { PublicProperty } from "@/infrastructure/services/publicService";
import ModernoTemplate     from "./templates/ModernoTemplate";
import ClasicoTemplate     from "./templates/ClasicoTemplate";
import MinimalistaTemplate from "./templates/MinimalistaTemplate";

// ISR: same revalidation window as layout
export const revalidate = 60;

export default async function SitePage({
    params,
}: {
    params: Promise<{ slug: string }>;
}) {
    const { slug } = await params;
    const payload = await getSitePayload(slug); // cached — no extra Firestore call

    if (!payload || !payload.published) return null; // SiteProvider already renders the error UI

    const site = payloadToSite(payload);

    // Fetch properties server-side — no client waterfall
    let rawProps: Awaited<ReturnType<typeof getActiveProperties>> = [];
    try {
        rawProps = await getActiveProperties(site.userId);
    } catch (err) {
        console.error("[SitePage] getActiveProperties failed:", err);
    }
    const properties = rawProps.slice(0, 6) as unknown as PublicProperty[];

    const templateProps = { site, properties, basePath: "" };

    switch (site.template) {
        case "clasico":      return <ClasicoTemplate     {...templateProps} />;
        case "minimalista":  return <MinimalistaTemplate {...templateProps} />;
        default:             return <ModernoTemplate     {...templateProps} />;
    }
}
