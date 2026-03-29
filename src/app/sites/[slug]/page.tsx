"use client";

import { useEffect, useState } from "react";
import { useSite } from "./SiteProvider";
import { publicService, PublicProperty } from "@/infrastructure/services/publicService";
import ModernoTemplate from "./templates/ModernoTemplate";
import ClasicoTemplate from "./templates/ClasicoTemplate";
import MinimalistaTemplate from "./templates/MinimalistaTemplate";

export default function SitePage() {
    const { site } = useSite();
    const [properties, setProperties] = useState<PublicProperty[]>([]);
    const [search, setSearch] = useState("");

    useEffect(() => {
        if (!site) return;
        publicService.getPropertiesByAgencySlug(site.slug).then((result) => {
            if (result) setProperties(result.properties.filter((p) => p.status === "active").slice(0, 6));
        });
    }, [site]);

    if (!site) return null;

    const props = { site, properties, search, onSearchChange: setSearch };

    switch (site.template) {
        case "clasico":      return <ClasicoTemplate {...props} />;
        case "minimalista":  return <MinimalistaTemplate {...props} />;
        default:             return <ModernoTemplate {...props} />;
    }
}
