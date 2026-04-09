"use client";

import { useEffect, useState, createContext, useContext } from "react";
import { useParams } from "next/navigation";
import { siteService } from "@/infrastructure/services/siteService";
import { Site } from "@/domain/models/Site";

// ── Site Context ──────────────────────────────────────────────────────────────

interface SiteContextValue {
    site: Site | null;
    loading: boolean;
    /** Empty string when on subdomain (middleware handles routing),
     *  "/sites/[slug]" when accessed via platform path. */
    basePath: string;
}

const SiteContext = createContext<SiteContextValue>({ site: null, loading: true, basePath: "" });

export function useSite() {
    return useContext(SiteContext);
}

// ── Provider ──────────────────────────────────────────────────────────────────

export default function SiteProvider({ children }: { children: React.ReactNode }) {
    const params = useParams<{ slug: string }>();
    const slug = params?.slug ?? "";

    const [site, setSite] = useState<Site | null>(null);
    const [loading, setLoading] = useState(true);
    // Empty string when on subdomain (middleware rewrites /propiedades → /sites/slug/propiedades).
    // "/sites/slug" when accessed via platform path directly.
    const [basePath, setBasePath] = useState("");

    useEffect(() => {
        if (!slug) return;
        siteService.getSiteBySlug(slug).then((s) => {
            setSite(s);
            setLoading(false);
        });
    }, [slug]);

    useEffect(() => {
        if (!slug) return;
        const onSitePath = window.location.pathname.startsWith("/sites/");
        setBasePath(onSitePath ? `/sites/${slug}` : "");
    }, [slug]);

    // Inject CSS custom properties for the site theme
    useEffect(() => {
        if (!site) return;
        document.documentElement.style.setProperty("--site-primary", site.colorPrimario);
        document.documentElement.style.setProperty("--site-secondary", site.colorSecundario);
    }, [site]);

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-white">
                <div className="w-8 h-8 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" />
            </div>
        );
    }

    if (!site) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="text-center max-w-sm px-6">
                    <div className="text-5xl mb-4">🏠</div>
                    <h1 className="text-2xl font-bold text-gray-900 mb-2">Sitio no encontrado</h1>
                    <p className="text-gray-500">
                        No existe ningún sitio con el identificador <strong className="text-gray-700 font-mono">{slug}</strong>.
                        Verificá el URL o el subdominio configurado en tu panel.
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
        <SiteContext.Provider value={{ site, loading, basePath }}>
            {children}
        </SiteContext.Provider>
    );
}
