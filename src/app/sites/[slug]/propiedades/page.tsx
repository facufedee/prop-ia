"use client";

import { useEffect, useState, Suspense, useMemo } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Search, ChevronLeft, SlidersHorizontal, X, Building2, SortAsc, SortDesc } from "lucide-react";
import { useSite } from "../SiteProvider";
import { publicService, PublicProperty } from "@/infrastructure/services/publicService";
import PropertyPublicCard from "@/ui/components/properties/public/PropertyPublicCard";
import SiteFilterSidebar, { SiteFilters } from "../../components/SiteFilterSidebar";
import SiteFooter from "../../components/SiteFooter";
import SiteNavbar from "../../components/SiteNavbar";

function normalizeStr(str: string): string {
    return str.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
}

function PropiedadesContent() {
    const { site, basePath } = useSite();
    const searchParams = useSearchParams();
    const router = useRouter();

    const [allProperties, setAllProperties] = useState<PublicProperty[]>([]);
    const [loading, setLoading] = useState(true);
    const [showMobileFilter, setShowMobileFilter] = useState(false);

    // Filters — initialize from URL params
    const [filters, setFiltersState] = useState<SiteFilters>({
        search: searchParams.get("q") ?? searchParams.get("loc") ?? "",
        operationType: searchParams.get("operacion") ?? "Todos",
        propertyType: searchParams.get("tipo") ?? "Todos",
        rooms: "Todos",
        priceMin: "",
        priceMax: "",
        currency: "Todos"
    });

    const setFilters = (newFilters: Partial<SiteFilters>) => {
        setFiltersState((prev) => ({ ...prev, ...newFilters }));
    };

    useEffect(() => {
        if (!site?.userId) return;
        publicService.getPropertiesByUserId(site.userId).then((result) => {
            setAllProperties(result.filter((p) => p.status === "active"));
            setLoading(false);
        }).catch(() => setLoading(false));
    }, [site?.userId]);

    // Re-sync if URL params change (optional but good for consistency)
    useEffect(() => {
        if (searchParams.get("operacion")) setFilters({ operationType: searchParams.get("operacion")! });
        if (searchParams.get("tipo")) setFilters({ propertyType: searchParams.get("tipo")! });
        if (searchParams.get("q") || searchParams.get("loc")) setFilters({ search: searchParams.get("q") || searchParams.get("loc")! });
    }, [searchParams]);

    const filtered = useMemo(() => {
        let result = [...allProperties];

        // Search match
        if (filters.search) {
            const query = normalizeStr(filters.search);
            result = result.filter(p => 
                normalizeStr(p.title || "").includes(query) ||
                normalizeStr(p.localidad || "").includes(query) ||
                normalizeStr(p.calle || "").includes(query) ||
                normalizeStr((p as any).barrio || "").includes(query)
            );
        }

        // Operation match
        if (filters.operationType !== "Todos") {
            result = result.filter(p => p.operation_type?.toLowerCase() === filters.operationType.toLowerCase());
        }

        // Property type match
        if (filters.propertyType !== "Todos") {
            const pt = filters.propertyType.toLowerCase();
            result = result.filter(p => 
                p.type?.toLowerCase().includes(pt) || 
                (p as any).property_type?.toLowerCase().includes(pt)
            );
        }

        // Currency match
        if (filters.currency !== "Todos") {
            result = result.filter(p => p.currency === filters.currency || (filters.currency === "ARS" && p.currency === "Pesos") || (filters.currency === "USD" && p.currency === "Dólares"));
        }

        // Rooms match
        if (filters.rooms !== "Todos") {
            if (filters.rooms === "4+") result = result.filter(p => (p.rooms || 0) >= 4);
            else result = result.filter(p => (p.rooms || 0) === Number(filters.rooms));
        }

        // Price match
        if (filters.priceMin) result = result.filter(p => Number(p.price) >= Number(filters.priceMin));
        if (filters.priceMax) result = result.filter(p => Number(p.price) <= Number(filters.priceMax));

        return result;
    }, [allProperties, filters]);

    const hasActiveFilters = !!(filters.operationType !== "Todos" || filters.propertyType !== "Todos" || filters.currency !== "Todos"
        || filters.rooms !== "Todos" || filters.priceMin || filters.priceMax || filters.search);

    const clearAllFilters = () => {
        setFiltersState({
            search: "",
            operationType: "Todos",
            propertyType: "Todos",
            rooms: "Todos",
            priceMin: "",
            priceMax: "",
            currency: "Todos"
        });
        if (basePath) router.push(`${basePath}/propiedades`);
    };

    if (!site) return null;
    const primary = site.colorPrimario || "#4f46e5";

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col font-sans" style={{ fontFamily: "'Outfit', sans-serif" }}>
            {/* ── Navbar ── */}
            <header className="sticky top-0 z-50 bg-white border-b border-gray-100 shadow-sm">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                        <Link href={basePath || "/"} className="flex items-center gap-2 text-sm text-gray-400 hover:text-gray-900 transition-colors shrink-0">
                            <ChevronLeft className="w-4 h-4" /> Volver
                        </Link>
                        <div className="h-4 w-[1px] bg-gray-200 hidden sm:block" />
                        <span className="font-bold text-gray-900 text-sm hidden sm:block">Propiedades de {site.nombre}</span>
                    </div>

                    <div className="flex items-center gap-3">
                        {site.whatsapp && (
                            <a
                                href={`https://wa.me/${site.whatsapp.replace(/\D/g, "")}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="px-4 py-2 rounded-xl text-white text-xs font-bold shrink-0 transition-opacity hover:opacity-90 shadow-sm shadow-green-200"
                                style={{ backgroundColor: "#25D366" }}
                            >
                                Contactar WhatsApp
                            </a>
                        )}
                    </div>
                </div>
            </header>

            <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                    
                    {/* ── Left Sidebar (Filters) ── */}
                    <aside className="hidden lg:block lg:col-span-3">
                        <SiteFilterSidebar 
                            filters={filters} 
                            setFilters={setFilters} 
                            primaryColor={primary} 
                            onClearAll={clearAllFilters}
                            hasActiveFilters={hasActiveFilters}
                        />
                    </aside>

                    {/* ── Main Content (Results) ── */}
                    <section className="lg:col-span-9">
                        
                        {/* ── Top Bar ── */}
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-8 gap-4">
                            <div>
                                <h1 className="text-2xl font-black text-gray-900 tracking-tight">
                                    {loading ? "Cargando propiedades..." : `${filtered.length} inmuebles encontrados`}
                                </h1>
                                {hasActiveFilters && (
                                    <p className="text-xs text-gray-400 mt-1 font-medium">Búsqueda personalizada activa</p>
                                )}
                            </div>

                            <div className="flex items-center gap-2 self-end">
                                {/* Mobile Filter Toggle */}
                                <button
                                    onClick={() => setShowMobileFilter(true)}
                                    className="lg:hidden flex items-center gap-2 px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm font-bold text-gray-700 shadow-sm hover:bg-gray-50 transition-all active:scale-95"
                                >
                                    <SlidersHorizontal size={16} />
                                    Filtros
                                    {hasActiveFilters && <span className="w-2 h-2 rounded-full inline-block" style={{ backgroundColor: primary }} />}
                                </button>
                            </div>
                        </div>

                        {/* ── Search Input (Alternative or Desktop helper) ── */}
                        {!loading && (
                            <div className="relative mb-8 lg:hidden">
                                <input
                                    type="text"
                                    placeholder="Buscar por zona, calle o título..."
                                    value={filters.search}
                                    onChange={e => setFilters({ search: e.target.value })}
                                    className="w-full pl-10 pr-4 py-3 bg-white border border-gray-200 rounded-2xl text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-opacity-20 transition-all font-medium"
                                    style={{ '--tw-ring-color': primary } as any}
                                />
                                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                            </div>
                        )}

                        {/* ── Results Grid ── */}
                        {loading ? (
                            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                                {[1, 2, 3, 4, 5, 6].map(i => (
                                    <div key={i} className="bg-white rounded-3xl border border-gray-100 overflow-hidden animate-pulse">
                                        <div className="aspect-[4/3] bg-gray-100" />
                                        <div className="p-5 space-y-3">
                                            <div className="h-4 bg-gray-100 rounded w-3/4" />
                                            <div className="h-3 bg-gray-100 rounded w-1/2" />
                                            <div className="flex gap-2 pt-2">
                                                <div className="h-6 bg-gray-50 rounded w-16" />
                                                <div className="h-6 bg-gray-50 rounded w-16" />
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : filtered.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-20 bg-white rounded-3xl border border-dashed border-gray-200">
                                <Search className="w-16 h-16 text-gray-100 mb-6" />
                                <h3 className="text-xl font-bold text-gray-900">No encontramos resultados</h3>
                                <p className="text-gray-400 text-sm mt-2 max-w-xs text-center">Intentá ajustando tus filtros para encontrar lo que buscás.</p>
                                <button
                                    onClick={clearAllFilters}
                                    className="mt-8 px-8 py-3 rounded-2xl text-white font-bold text-sm shadow-lg transition-all active:scale-95"
                                    style={{ backgroundColor: primary }}
                                >
                                    Limpiar todos los filtros
                                </button>
                            </div>
                        ) : (
                            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                                {filtered.map((prop) => (
                                    <PropertyPublicCard key={prop.id} property={prop} basePath={basePath} />
                                ))}
                            </div>
                        )}
                    </section>
                </div>
            </main>

            {/* ── Mobile Filter Drawer ── */}
            {showMobileFilter && (
                <div className="fixed inset-0 z-[60] flex lg:hidden">
                    <div className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm" onClick={() => setShowMobileFilter(false)} />
                    <div className="relative ml-auto w-[320px] sm:w-[380px] h-full bg-white shadow-2xl flex flex-col">
                        <div className="flex items-center justify-between p-6 border-b border-gray-100">
                            <h2 className="font-black text-gray-900 text-lg uppercase tracking-tight flex items-center gap-2">
                                <SlidersHorizontal size={20} /> Filtros
                            </h2>
                            <button onClick={() => setShowMobileFilter(false)} className="p-2 transition-colors hover:bg-gray-100 rounded-xl">
                                <X size={20} className="text-gray-400" />
                            </button>
                        </div>
                        <div className="flex-1 overflow-y-auto px-6">
                            <SiteFilterSidebar 
                                filters={filters} 
                                setFilters={setFilters} 
                                primaryColor={primary} 
                                onClearAll={clearAllFilters}
                                hasActiveFilters={hasActiveFilters}
                            />
                        </div>
                        <div className="p-6 border-t border-gray-100 bg-gray-50">
                            <button
                                onClick={() => setShowMobileFilter(false)}
                                className="w-full py-4 text-white font-black rounded-2xl shadow-xl transition-all active:scale-95 text-sm uppercase tracking-widest"
                                style={{ backgroundColor: primary }}
                            >
                                Ver {filtered.length} resultados
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <SiteFooter site={site} basePath={basePath} />
        </div>
    );
}

export default function PropiedadesPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="flex flex-col items-center">
                    <div className="w-12 h-12 border-4 border-indigo-100 border-t-indigo-600 rounded-full animate-spin mb-4" />
                    <p className="text-gray-400 font-medium text-sm">Preparando catálogo...</p>
                </div>
            </div>
        }>
            <PropiedadesContent />
        </Suspense>
    );
}
