"use client";

import { useEffect, useState, useMemo, Suspense, useCallback } from "react";
import dynamic from "next/dynamic";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { PublicProperty, publicService } from "@/infrastructure/services/publicService";
import PropertyPublicCard from "@/ui/components/properties/public/PropertyPublicCard";
import {
    Loader2, Filter, ChevronDown, RotateCcw, Search, X, Home,
    ChevronRight, SlidersHorizontal, Map, List, MapPin,
} from "lucide-react";

// Leaflet must be loaded client-side only
const PropertyMapInner = dynamic(
    () => import("@/ui/components/properties/public/PropertyMapInner"),
    { ssr: false, loading: () => <MapPlaceholder /> }
);

function MapPlaceholder() {
    return (
        <div className="w-full h-full bg-gray-100 flex flex-col items-center justify-center gap-3 text-gray-400">
            <Map className="w-10 h-10 animate-pulse" />
            <p className="text-sm font-medium">Cargando mapa...</p>
        </div>
    );
}

const PROPERTY_TYPES = [
    "Casa", "Departamento", "PH", "Quinta Vacacional", "Lote/Terreno",
    "Local comercial", "Oficina comercial", "Cochera", "Edificio", "Bodega-Galpon", "Depósito", "Hotel",
];

const RELATED_ZONES = [
    "Ituzaingó", "Castelar", "Morón", "Ramos Mejía", "Haedo",
    "El Palomar", "Hurlingham", "Villa del Parque", "Palermo", "Belgrano",
];

function normalizeStr(s: string) {
    return s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
}

function fuzzyMatch(text: string, query: string): boolean {
    const t = normalizeStr(text), q = normalizeStr(query.trim());
    if (!q) return true;
    if (t.includes(q)) return true;
    const qw = q.split(/\s+/).filter(Boolean);
    if (qw.length > 1) {
        const tw = t.split(/[\s,.-]+/).filter(Boolean);
        return qw.every(w => tw.some(tw => tw.includes(w) || w.includes(tw)));
    }
    return false;
}

function shuffleArray<T>(arr: T[]): T[] {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
}

const FilterSection = ({ title, children, defaultOpen = true, onClear }: {
    title: string; children: React.ReactNode; defaultOpen?: boolean; onClear?: () => void;
}) => {
    const [isOpen, setIsOpen] = useState(defaultOpen);
    return (
        <div className="border-b border-gray-100 py-4 last:border-0">
            <div className="flex items-center justify-between mb-3">
                <button onClick={() => setIsOpen(!isOpen)} className="flex items-center gap-2 text-left group flex-1">
                    <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wide group-hover:text-indigo-600 transition">{title}</h3>
                    <ChevronDown size={15} className={`text-gray-400 transition-transform ${isOpen ? "rotate-180" : ""}`} />
                </button>
                {onClear && (
                    <button onClick={onClear} className="text-[10px] uppercase font-bold text-gray-400 hover:text-red-500 transition px-2 py-1 rounded bg-gray-50 hover:bg-red-50">
                        Borrar
                    </button>
                )}
            </div>
            {isOpen && <div className="mt-2">{children}</div>}
        </div>
    );
};

interface FilterPanelProps {
    searchQuery: string; setSearchQuery: (v: string) => void;
    propertyType: string; setPropertyType: (v: string) => void;
    operationType: string; setOperationType: (v: string) => void;
    currency: string; setCurrency: (v: string) => void;
    rooms: string; setRooms: (v: string) => void;
    priceMin: string; setPriceMin: (v: string) => void;
    priceMax: string; setPriceMax: (v: string) => void;
    areaMin: string; setAreaMin: (v: string) => void;
    areaMax: string; setAreaMax: (v: string) => void;
    setCurrentPage: (v: number) => void;
    hasActiveFilters: boolean; clearAllFilters: () => void;
}

function FilterPanel({
    searchQuery, setSearchQuery, propertyType, setPropertyType,
    operationType, setOperationType, currency, setCurrency,
    rooms, setRooms, priceMin, setPriceMin, priceMax, setPriceMax,
    areaMin, setAreaMin, areaMax, setAreaMax, setCurrentPage,
    hasActiveFilters, clearAllFilters,
}: FilterPanelProps) {
    return (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="p-4 bg-gray-50 border-b border-gray-100 flex items-center justify-between">
                <span className="font-bold text-gray-900 flex items-center gap-2"><Filter size={16} /> Filtros</span>
                {hasActiveFilters && (
                    <button onClick={clearAllFilters} className="text-xs text-indigo-600 hover:text-indigo-800 font-medium flex items-center gap-1">
                        <RotateCcw size={11} /> Limpiar
                    </button>
                )}
            </div>
            <div className="p-4 overflow-y-auto max-h-[calc(100vh-12rem)]">
                <div className="mb-5">
                    <label className="text-xs font-bold text-gray-500 uppercase mb-2 block">Ubicación</label>
                    <div className="relative">
                        <input
                            type="text" placeholder="Barrio, ciudad..."
                            value={searchQuery}
                            onChange={e => { setSearchQuery(e.target.value); setCurrentPage(1); }}
                            className="w-full pl-9 pr-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-indigo-500 transition"
                        />
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                    </div>
                </div>

                <FilterSection title="Tipo de Propiedad" onClear={propertyType !== "Todos" ? () => setPropertyType("Todos") : undefined}>
                    <div className="space-y-1.5">
                        {["Todos", ...PROPERTY_TYPES].map(t => (
                            <label key={t} className="flex items-center gap-3 cursor-pointer group">
                                <div className={`w-4 h-4 rounded-full border flex items-center justify-center transition ${propertyType === t ? "border-indigo-600 bg-indigo-50" : "border-gray-300 group-hover:border-indigo-300"}`}>
                                    {propertyType === t && <div className="w-2 h-2 rounded-full bg-indigo-600" />}
                                </div>
                                <input type="radio" className="hidden" checked={propertyType === t} onChange={() => { setPropertyType(t); setCurrentPage(1); }} />
                                <span className={`text-sm ${propertyType === t ? "font-bold text-indigo-700" : "text-gray-600"}`}>{t}</span>
                            </label>
                        ))}
                    </div>
                </FilterSection>

                <FilterSection title="Operación" onClear={operationType !== "Todos" ? () => setOperationType("Todos") : undefined}>
                    <div className="space-y-1.5">
                        {["Todos", "Venta", "Alquiler", "Alquiler Temporal"].map(type => (
                            <label key={type} className="flex items-center gap-3 cursor-pointer group">
                                <div className={`w-4 h-4 rounded-full border flex items-center justify-center transition ${operationType === type ? "border-indigo-600 bg-indigo-50" : "border-gray-300 group-hover:border-indigo-300"}`}>
                                    {operationType === type && <div className="w-2 h-2 rounded-full bg-indigo-600" />}
                                </div>
                                <input type="radio" className="hidden" checked={operationType === type} onChange={() => { setOperationType(type); setCurrentPage(1); }} />
                                <span className={`text-sm ${operationType === type ? "font-bold text-indigo-700" : "text-gray-600"}`}>{type}</span>
                            </label>
                        ))}
                    </div>
                </FilterSection>

                <FilterSection title="Precio" onClear={(priceMin || priceMax) ? () => { setPriceMin(""); setPriceMax(""); } : undefined}>
                    <div className="flex gap-2 mb-3">
                        <div className="relative w-full">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs font-bold">$</span>
                            <input type="number" placeholder="Min" value={priceMin} onChange={e => { setPriceMin(e.target.value); setCurrentPage(1); }} className="w-full pl-6 pr-3 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-indigo-500 transition" />
                        </div>
                        <div className="relative w-full">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs font-bold">$</span>
                            <input type="number" placeholder="Max" value={priceMax} onChange={e => { setPriceMax(e.target.value); setCurrentPage(1); }} className="w-full pl-6 pr-3 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-indigo-500 transition" />
                        </div>
                    </div>
                    <div className="flex bg-gray-100 p-1 rounded-lg">
                        {["Todos", "USD", "ARS"].map(c => (
                            <button key={c} onClick={() => setCurrency(c)} className={`flex-1 py-1 text-xs font-bold rounded-md transition ${currency === c ? "bg-white text-indigo-600 shadow-sm" : "text-gray-500"}`}>{c}</button>
                        ))}
                    </div>
                </FilterSection>

                <FilterSection title="Ambientes" onClear={rooms !== "Todos" ? () => setRooms("Todos") : undefined}>
                    <div className="flex flex-wrap gap-2">
                        {["Todos", "1", "2", "3", "4+"].map(r => (
                            <button key={r} onClick={() => { setRooms(r); setCurrentPage(1); }} className={`w-10 h-10 flex items-center justify-center text-sm rounded-lg border transition ${rooms === r ? "bg-indigo-600 text-white border-indigo-600" : "bg-white text-gray-600 border-gray-200 hover:border-gray-300"}`}>{r}</button>
                        ))}
                    </div>
                </FilterSection>

                <FilterSection title="Superficie (m²)" onClear={(areaMin || areaMax) ? () => { setAreaMin(""); setAreaMax(""); } : undefined}>
                    <div className="flex gap-2">
                        <input type="number" placeholder="Min" value={areaMin} onChange={e => { setAreaMin(e.target.value); setCurrentPage(1); }} className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-indigo-500 transition" />
                        <input type="number" placeholder="Max" value={areaMax} onChange={e => { setAreaMax(e.target.value); setCurrentPage(1); }} className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-indigo-500 transition" />
                    </div>
                </FilterSection>
            </div>
        </div>
    );
}

function BusquedaContent() {
    const searchParams = useSearchParams();
    const router = useRouter();

    const [allProperties, setAllProperties] = useState<PublicProperty[]>([]);
    const [loading, setLoading] = useState(true);
    const [currentPage, setCurrentPage] = useState(1);
    const [showMobileFilter, setShowMobileFilter] = useState(false);
    const [showMap, setShowMap] = useState(false);
    const [hoveredId, setHoveredId] = useState<string | null>(null);

    // On desktop with map, show more per page to fill the scrollable list
    const perPage = showMap ? 20 : 15;

    const [operationType, setOperationType] = useState(searchParams.get("operacion") || "Todos");
    const [propertyType, setPropertyType] = useState(searchParams.get("tipo") || "Todos");
    const [currency, setCurrency] = useState("Todos");
    const [rooms, setRooms] = useState("Todos");
    const [priceMin, setPriceMin] = useState("");
    const [priceMax, setPriceMax] = useState("");
    const [areaMin, setAreaMin] = useState("");
    const [areaMax, setAreaMax] = useState("");
    const [searchQuery, setSearchQuery] = useState(searchParams.get("loc") || "");

    useEffect(() => {
        publicService.getAllProperties().then(data => {
            setAllProperties(shuffleArray(data));
            setLoading(false);
        }).catch(() => setLoading(false));
    }, []);

    useEffect(() => {
        setOperationType(searchParams.get("operacion") || "Todos");
        setPropertyType(searchParams.get("tipo") || "Todos");
        setSearchQuery(searchParams.get("loc") || "");
        setCurrentPage(1);
    }, [searchParams]);

    const hasActiveFilters = !!(operationType !== "Todos" || propertyType !== "Todos" || currency !== "Todos"
        || rooms !== "Todos" || priceMin || priceMax || areaMin || areaMax || searchQuery);

    const clearAllFilters = () => {
        setOperationType("Todos"); setPropertyType("Todos");
        setCurrency("Todos"); setRooms("Todos");
        setPriceMin(""); setPriceMax("");
        setAreaMin(""); setAreaMax("");
        setSearchQuery(""); router.push("/busqueda");
    };

    const filteredProperties = useMemo(() => {
        let f = [...allProperties];
        if (operationType !== "Todos") f = f.filter(p => p.operation_type === operationType);
        if (propertyType !== "Todos") f = f.filter(p => p.type === propertyType || (p as any).property_type === propertyType);
        if (currency !== "Todos") f = f.filter(p => p.currency === currency);
        if (rooms !== "Todos") {
            if (rooms === "4+") f = f.filter(p => (p.rooms || 0) >= 4);
            else f = f.filter(p => (p.rooms || 0) === Number(rooms));
        }
        if (priceMin) f = f.filter(p => Number(p.price) >= Number(priceMin));
        if (priceMax) f = f.filter(p => Number(p.price) <= Number(priceMax));
        if (areaMin) f = f.filter(p => (p.area_covered || 0) >= Number(areaMin));
        if (areaMax) f = f.filter(p => (p.area_covered || 0) <= Number(areaMax));
        if (searchQuery) {
            f = f.filter(p => {
                const fields = [p.title, p.localidad, p.provincia, p.address, p.calle, p.altura, p.code, p.type, (p as any).barrio, (p as any).ciudad, (p as any).property_type, (p as any).description];
                return fields.some(v => v && fuzzyMatch(String(v), searchQuery));
            });
        }
        return f;
    }, [allProperties, operationType, propertyType, currency, rooms, priceMin, priceMax, areaMin, areaMax, searchQuery]);

    const withCoords = useMemo(() => filteredProperties.filter(p => {
        const lat = Number(p.lat);
        const lng = Number(p.lng);
        return !isNaN(lat) && !isNaN(lng) && lat !== 0 && lng !== 0;
    }), [filteredProperties]);
    const paginatedProperties = filteredProperties.slice((currentPage - 1) * perPage, currentPage * perPage);
    const totalPages = Math.ceil(filteredProperties.length / perPage);

    const filterPanelProps: FilterPanelProps = {
        searchQuery, setSearchQuery, propertyType, setPropertyType,
        operationType, setOperationType, currency, setCurrency,
        rooms, setRooms, priceMin, setPriceMin, priceMax, setPriceMax,
        areaMin, setAreaMin, areaMax, setAreaMax,
        setCurrentPage, hasActiveFilters, clearAllFilters,
    };

    const breadcrumbs = [
        { label: "Inicio", href: "/propiedades" },
        ...(operationType !== "Todos" ? [{ label: operationType, href: `/busqueda?operacion=${operationType}` }] : []),
        ...(propertyType !== "Todos" ? [{ label: propertyType, href: `/busqueda?tipo=${encodeURIComponent(propertyType)}` }] : []),
        ...(searchQuery ? [{ label: searchQuery, href: `/busqueda?loc=${encodeURIComponent(searchQuery)}` }] : []),
    ];



    // ── Main layout (list + optional desktop map) ─────────────────────────────
    return (
        <>
            {/* ── Mobile full-screen map ──────────────────────────────────────────────── */}
            {showMap && (
                <div className="fixed inset-0 z-40 bg-white lg:hidden flex flex-col">
                    {/* Mobile map header */}
                    <div className="flex items-center justify-between px-4 py-3 bg-white border-b border-gray-100 shadow-sm flex-shrink-0">
                        <button
                            onClick={() => setShowMap(false)}
                            className="flex items-center gap-2 text-sm font-semibold text-gray-700"
                        >
                            <List className="w-4 h-4" /> Ver lista
                        </button>
                        <span className="text-sm font-bold text-gray-900">
                            {withCoords.length} en el mapa
                        </span>
                        <button
                            onClick={() => setShowMobileFilter(true)}
                            className="flex items-center gap-1.5 text-sm font-semibold text-indigo-600"
                        >
                            <SlidersHorizontal className="w-4 h-4" />
                            {hasActiveFilters && <span className="w-2 h-2 rounded-full bg-indigo-600 inline-block" />}
                        </button>
                    </div>
                    <div className="flex-1 relative" style={{ minHeight: 0 }}>
                        <PropertyMapInner
                            properties={filteredProperties}
                            hoveredId={hoveredId}
                            onHover={setHoveredId}
                        />
                    </div>

                    {/* Mobile filter drawer */}
                    {showMobileFilter && (
                        <div className="fixed inset-0 z-50 flex">
                            <div className="absolute inset-0 bg-black/40" onClick={() => setShowMobileFilter(false)} />
                            <div className="relative ml-auto w-[320px] h-full bg-white shadow-2xl overflow-y-auto">
                                <div className="flex items-center justify-between p-4 border-b border-gray-100 sticky top-0 bg-white z-10">
                                    <span className="font-bold text-gray-900 flex items-center gap-2"><Filter size={16} /> Filtros</span>
                                    <button onClick={() => setShowMobileFilter(false)} className="p-2 rounded-lg hover:bg-gray-100 transition"><X size={18} /></button>
                                </div>
                                <div className="p-4"><FilterPanel {...filterPanelProps} /></div>
                                <div className="sticky bottom-0 bg-white p-4 border-t border-gray-100">
                                    <button onClick={() => setShowMobileFilter(false)} className="w-full py-3 bg-indigo-600 text-white font-semibold rounded-xl hover:bg-indigo-700 transition-colors">
                                        Ver {filteredProperties.length} resultados
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            )}

            <div className="min-h-screen bg-gray-50 pb-28 pt-24">
            <div className={`mx-auto px-4 ${showMap ? "max-w-[1600px]" : "container max-w-7xl"}`}>

                {/* Breadcrumbs */}
                <nav className="flex items-center gap-1.5 text-xs text-gray-400 mb-5">
                    <Link href="/" className="hover:text-indigo-600 transition flex items-center gap-1"><Home size={12} /> Inicio</Link>
                    {breadcrumbs.slice(1).map((crumb, i) => (
                        <span key={i} className="flex items-center gap-1.5">
                            <ChevronRight size={12} />
                            <Link href={crumb.href} className="hover:text-indigo-600 transition font-medium text-gray-600">{crumb.label}</Link>
                        </span>
                    ))}
                </nav>

                {/* Layout: filter | list | map */}
                <div className={`grid gap-6 items-start ${showMap ? "lg:grid-cols-[260px_1fr_460px]" : "grid-cols-1 lg:grid-cols-12"}`}>

                    {/* ── Filter panel — desktop ─────────────────────────── */}
                    <div className={`hidden lg:block sticky top-24 ${showMap ? "" : "lg:col-span-3"}`}>
                        <FilterPanel {...filterPanelProps} />
                    </div>

                    {/* ── Property list ─────────────────────────────────── */}
                    <div className={showMap ? "lg:overflow-y-auto lg:max-h-[calc(100vh-96px)]" : "lg:col-span-9"}>

                        {/* Results header */}
                        <div className="flex items-center justify-between mb-5 gap-3 flex-wrap">
                            <div>
                                <h1 className="text-xl font-bold text-gray-900">
                                    {loading ? "Cargando..." : `${filteredProperties.length} inmuebles encontrados`}
                                </h1>
                                {hasActiveFilters && <p className="text-xs text-gray-400 mt-0.5">Con los filtros aplicados</p>}
                            </div>
                            <div className="flex items-center gap-2">
                                {/* Map/List toggle — desktop */}
                                <button
                                    onClick={() => setShowMap(v => !v)}
                                    className="hidden lg:flex items-center gap-2 px-4 py-2 border border-gray-200 bg-white rounded-xl text-sm font-semibold text-gray-700 shadow-sm hover:bg-gray-50 transition"
                                >
                                    {showMap ? <List className="w-4 h-4" /> : <Map className="w-4 h-4" />}
                                    {showMap ? "Ocultar mapa" : "Ver mapa"}
                                    {withCoords.length > 0 && !showMap && (
                                        <span className="text-xs text-indigo-600 font-bold ml-0.5">({withCoords.length})</span>
                                    )}
                                </button>
                                {/* Mobile filter button */}
                                <button
                                    onClick={() => setShowMobileFilter(true)}
                                    className="lg:hidden flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-xl text-sm font-semibold text-gray-700 shadow-sm hover:bg-gray-50"
                                >
                                    <SlidersHorizontal size={16} />
                                    Filtrar
                                    {hasActiveFilters && <span className="ml-1 w-2 h-2 rounded-full bg-indigo-600 inline-block" />}
                                </button>
                            </div>
                        </div>

                        {loading ? (
                            <div className="flex flex-col items-center justify-center py-20">
                                <Loader2 className="w-10 h-10 text-indigo-600 animate-spin mb-3" />
                                <p className="text-gray-500 text-sm">Buscando las mejores propiedades...</p>
                            </div>
                        ) : filteredProperties.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-20 bg-white rounded-2xl border border-dashed border-gray-200">
                                <Search className="w-12 h-12 text-gray-200 mb-4" />
                                <p className="text-lg text-gray-800 font-semibold">No encontramos resultados</p>
                                <p className="text-gray-400 text-sm mt-1">Probá con otros filtros o una búsqueda más amplia</p>
                                <button onClick={clearAllFilters} className="mt-5 px-5 py-2 bg-indigo-600 text-white font-semibold rounded-xl hover:bg-indigo-700 transition-colors text-sm">
                                    Limpiar Filtros
                                </button>
                            </div>
                        ) : (
                            <>
                                {/* Cards */}
                                <div className={`grid gap-5 ${showMap ? "grid-cols-1 sm:grid-cols-2" : "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3"}`}>
                                    {paginatedProperties.map(p => (
                                        <div
                                            key={p.id}
                                            onMouseEnter={() => setHoveredId(p.id)}
                                            onMouseLeave={() => setHoveredId(null)}
                                            className={`rounded-2xl transition-shadow ${hoveredId === p.id ? "shadow-lg ring-2 ring-indigo-300" : ""}`}
                                        >
                                            <PropertyPublicCard property={p} />
                                        </div>
                                    ))}
                                </div>

                                {/* Pagination */}
                                {totalPages > 1 && (
                                    <div className="flex items-center justify-center gap-3 mt-10">
                                        <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1}
                                            className="px-5 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 hover:text-indigo-600 disabled:opacity-40 disabled:cursor-not-allowed transition">
                                            Anterior
                                        </button>
                                        <span className="text-sm text-gray-500">
                                            Página <strong>{currentPage}</strong> de <strong>{totalPages}</strong>
                                        </span>
                                        <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages}
                                            className="px-5 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 hover:text-indigo-600 disabled:opacity-40 disabled:cursor-not-allowed transition">
                                            Siguiente
                                        </button>
                                    </div>
                                )}

                                {/* Related searches — only when map is hidden */}
                                {!showMap && (
                                    <div className="mt-14 p-6 bg-white rounded-2xl border border-gray-100">
                                        <p className="text-sm font-bold text-gray-700 mb-3">Búsquedas relacionadas</p>
                                        <div className="flex flex-wrap gap-2">
                                            {RELATED_ZONES.filter(z => z.toLowerCase() !== searchQuery.toLowerCase()).slice(0, 8).map(zona => (
                                                <Link key={zona} href={`/busqueda?loc=${encodeURIComponent(zona)}`}
                                                    className="px-3 py-1.5 bg-gray-50 hover:bg-indigo-50 border border-gray-200 hover:border-indigo-300 text-xs font-medium text-gray-600 hover:text-indigo-700 rounded-full transition-all">
                                                    Propiedades en {zona}
                                                </Link>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </>
                        )}
                    </div>

                    {/* ── Desktop Map (sticky right panel) ───────────────── */}
                    {showMap && (
                        <div className="hidden lg:block sticky top-24 h-[calc(100vh-96px)] rounded-2xl overflow-hidden border border-gray-200 shadow-md">
                            <PropertyMapInner
                                properties={filteredProperties}
                                hoveredId={hoveredId}
                                onHover={setHoveredId}
                            />
                            {withCoords.length < filteredProperties.length && (
                                <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-[1000] bg-black/70 text-white text-xs px-3 py-1.5 rounded-full font-medium flex items-center gap-1.5 pointer-events-none">
                                    <MapPin className="w-3 h-3" />
                                    {withCoords.length} de {filteredProperties.length} tienen coordenadas
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>

            {/* ── Mobile: floating "Ver mapa" button ───────────────────────── */}
            {!loading && filteredProperties.length > 0 && withCoords.length > 0 && (
                <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 lg:hidden">
                    <button
                        onClick={() => setShowMap(true)}
                        className="flex items-center gap-2 px-6 py-3 bg-gray-900 text-white rounded-full shadow-xl text-sm font-bold hover:bg-black active:scale-95 transition-all"
                    >
                        <Map className="w-4 h-4" />
                        Ver mapa · {withCoords.length} propiedades
                    </button>
                </div>
            )}

            {/* Mobile Filter Drawer */}
            {showMobileFilter && (
                <div className="fixed inset-0 z-50 flex lg:hidden">
                    <div className="absolute inset-0 bg-black/40" onClick={() => setShowMobileFilter(false)} />
                    <div className="relative ml-auto w-[320px] h-full bg-white shadow-2xl overflow-y-auto">
                        <div className="flex items-center justify-between p-4 border-b border-gray-100 sticky top-0 bg-white z-10">
                            <span className="font-bold text-gray-900 flex items-center gap-2"><Filter size={16} /> Filtros</span>
                            <button onClick={() => setShowMobileFilter(false)} className="p-2 rounded-lg hover:bg-gray-100 transition"><X size={18} /></button>
                        </div>
                        <div className="p-4"><FilterPanel {...filterPanelProps} /></div>
                        <div className="sticky bottom-0 bg-white p-4 border-t border-gray-100">
                            <button onClick={() => setShowMobileFilter(false)} className="w-full py-3 bg-indigo-600 text-white font-semibold rounded-xl hover:bg-indigo-700 transition-colors">
                                Ver {filteredProperties.length} resultados
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
        </>
    );
}

export default function BusquedaPage() {
    return (
        <Suspense fallback={
            <div className="flex justify-center items-center min-h-screen">
                <Loader2 className="w-10 h-10 text-indigo-600 animate-spin" />
            </div>
        }>
            <BusquedaContent />
        </Suspense>
    );
}
