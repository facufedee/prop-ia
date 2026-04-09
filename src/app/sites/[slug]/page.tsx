"use client";

import { useEffect, useState } from "react";
import { useSite } from "./SiteProvider";
import { publicService, PublicProperty } from "@/infrastructure/services/publicService";
import ModernoTemplate from "./templates/ModernoTemplate";
import ClasicoTemplate from "./templates/ClasicoTemplate";
import MinimalistaTemplate from "./templates/MinimalistaTemplate";

export default function SitePage() {
    const { site, basePath } = useSite();
    const [properties, setProperties] = useState<PublicProperty[]>([]);
    const [search, setSearch] = useState("");

    useEffect(() => {
        if (!site?.userId) return;
        publicService.getPropertiesByUserId(site.userId).then((result) => {
            setProperties(result.filter((p) => p.status === "active").slice(0, 6));
        });
    }, [site?.userId]);

    if (!site) return null;

    const props = { site, properties, search, onSearchChange: setSearch, basePath };

    switch (site.template) {
        case "clasico":      return <ClasicoTemplate {...props} />;
        case "minimalista":  return <MinimalistaTemplate {...props} />;
        default:             return <ModernoTemplate {...props} />;
    }
}
