"use client";

import { useEffect, useState, createContext, useContext } from "react";
import { Site } from "@/domain/models/Site";
import { SitePayload, payloadToSite } from "./siteTypes";

// ── Context ───────────────────────────────────────────────────────────────────

interface SiteContextValue {
    site: Site | null;
    loading: boolean;
    basePath: string;
}

const SiteContext = createContext<SiteContextValue>({ site: null, loading: false, basePath: "" });

export function useSite() {
    return useContext(SiteContext);
}

// ── Provider ──────────────────────────────────────────────────────────────────
// Receives pre-fetched site data from the server layout.
// No client-side Firebase fetch — eliminates the loading waterfall.

interface Props {
    children: React.ReactNode;
    initialSite: SitePayload | null;
}

export default function SiteProvider({ children, initialSite }: Props) {
    const site = initialSite ? payloadToSite(initialSite) : null;

    // basePath: "" on custom domains, "/sites/slug" when accessed via platform path
    const [basePath, setBasePath] = useState("");

    useEffect(() => {
        const onSitePath = window.location.pathname.startsWith("/sites/");
        setBasePath(onSitePath ? `/sites/${initialSite?.slug ?? ""}` : "");
    }, [initialSite?.slug]);

    // Inject CSS custom properties for site theme
    useEffect(() => {
        if (!site) return;
        document.documentElement.style.setProperty("--site-primary",   site.colorPrimario);
        document.documentElement.style.setProperty("--site-secondary", site.colorSecundario);
    }, [site?.colorPrimario, site?.colorSecundario]);

    if (!site) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="text-center max-w-sm px-6">
                    <div className="text-5xl mb-4">🏠</div>
                    <h1 className="text-2xl font-bold text-gray-900 mb-2">Sitio no encontrado</h1>
                    <p className="text-gray-500">
                        No existe ningún sitio con este identificador. Verificá el URL o subdominio.
                    </p>
                </div>
            </div>
        );
    }

    if (!site.published) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="text-center max-w-sm px-6">
                    <div className="text-5xl mb-4">🔒</div>
                    <h1 className="text-2xl font-bold text-gray-900 mb-2">Sitio no publicado</h1>
                    <p className="text-gray-500">
                        Este sitio está configurado pero todavía no fue publicado. Entrá a tu panel y hacé clic en <strong>Publicar</strong>.
                    </p>
                </div>
            </div>
        );
    }

    return (
        <SiteContext.Provider value={{ site, loading: false, basePath }}>
            {children}
        </SiteContext.Provider>
    );
}
