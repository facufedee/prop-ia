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
        <div className="s-map-loading">
            <Map className="w-10 h-10 animate-pulse" aria-hidden="true" />
            <p>Cargando mapa...</p>
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
        <div className="s-filter-sec">
            <div className="s-filter-sec__head">
                <button type="button" onClick={() => setIsOpen(!isOpen)} aria-expanded={isOpen} className="s-filter-sec__toggle">
                    {title}
                    <ChevronDown size={15} aria-hidden="true" />
                </button>
                {onClear && (
                    <button type="button" onClick={onClear} className="s-text-btn s-text-btn--quiet">
                        Borrar
                    </button>
                )}
            </div>
            {isOpen && <div className="s-filter-sec__body">{children}</div>}
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
        <div className="s-filter">
            <div className="s-filter__head">
                <span className="s-filter__title"><Filter size={16} aria-hidden="true" /> Filtros</span>
                {hasActiveFilters && (
                    <button type="button" onClick={clearAllFilters} className="s-text-btn">
                        <RotateCcw size={11} aria-hidden="true" /> Limpiar
                    </button>
                )}
            </div>
            <div className="s-filter__body overflow-y-auto max-h-[calc(100vh-12rem)]">
                <div className="mb-2">
                    <label htmlFor="busqueda-ubicacion" className="s-filter__label">Ubicación</label>
                    <div className="s-field-wrap">
                        <input
                            id="busqueda-ubicacion"
                            type="text" placeholder="Barrio, ciudad..."
                            value={searchQuery}
                            onChange={e => { setSearchQuery(e.target.value); setCurrentPage(1); }}
                            className="s-input s-input--sm s-input--icon"
                        />
                        <Search className="s-field-wrap__icon w-4 h-4" aria-hidden="true" />
                    </div>
                </div>

                <FilterSection title="Tipo de Propiedad" onClear={propertyType !== "Todos" ? () => setPropertyType("Todos") : undefined}>
                    <div className="s-radio-list">
                        {["Todos", ...PROPERTY_TYPES].map(t => (
                            <label key={t} className="s-radio">
                                <input type="radio" checked={propertyType === t} onChange={() => { setPropertyType(t); setCurrentPage(1); }} />
                                <span className="s-radio__dot" aria-hidden="true" />
                                <span className="s-radio__text">{t}</span>
                            </label>
                        ))}
                    </div>
                </FilterSection>

                <FilterSection title="Operación" onClear={operationType !== "Todos" ? () => setOperationType("Todos") : undefined}>
                    <div className="s-radio-list">
                        {["Todos", "Venta", "Alquiler", "Alquiler Temporal"].map(type => (
                            <label key={type} className="s-radio">
                                <input type="radio" checked={operationType === type} onChange={() => { setOperationType(type); setCurrentPage(1); }} />
                                <span className="s-radio__dot" aria-hidden="true" />
                                <span className="s-radio__text">{type}</span>
                            </label>
                        ))}
                    </div>
                </FilterSection>

                <FilterSection title="Precio" onClear={(priceMin || priceMax) ? () => { setPriceMin(""); setPriceMax(""); } : undefined}>
                    <div className="s-input-pair">
                        <div className="s-field-wrap w-full">
                            <span className="s-field-wrap__prefix" aria-hidden="true">$</span>
                            <input type="number" placeholder="Min" aria-label="Precio mínimo" value={priceMin} onChange={e => { setPriceMin(e.target.value); setCurrentPage(1); }} className="s-input s-input--sm s-input--prefix" />
                        </div>
                        <div className="s-field-wrap w-full">
                            <span className="s-field-wrap__prefix" aria-hidden="true">$</span>
                            <input type="number" placeholder="Max" aria-label="Precio máximo" value={priceMax} onChange={e => { setPriceMax(e.target.value); setCurrentPage(1); }} className="s-input s-input--sm s-input--prefix" />
                        </div>
                    </div>
                    <div className="s-seg">
                        {["Todos", "USD", "ARS"].map(c => (
                            <button key={c} type="button" onClick={() => setCurrency(c)} aria-pressed={currency === c} className="s-seg__opt">{c}</button>
                        ))}
                    </div>
                </FilterSection>

                <FilterSection title="Ambientes" onClear={rooms !== "Todos" ? () => setRooms("Todos") : undefined}>
                    <div className="s-chip-row">
                        {["Todos", "1", "2", "3", "4+"].map(r => (
                            <button key={r} type="button" onClick={() => { setRooms(r); setCurrentPage(1); }} aria-pressed={rooms === r} className="s-chip s-chip--square">{r}</button>
                        ))}
                    </div>
                </FilterSection>

                <FilterSection title="Superficie (m²)" onClear={(areaMin || areaMax) ? () => { setAreaMin(""); setAreaMax(""); } : undefined}>
                    <div className="s-input-pair">
                        <input type="number" placeholder="Min" aria-label="Superficie mínima" value={areaMin} onChange={e => { setAreaMin(e.target.value); setCurrentPage(1); }} className="s-input s-input--sm" />
                        <input type="number" placeholder="Max" aria-label="Superficie máxima" value={areaMax} onChange={e => { setAreaMax(e.target.value); setCurrentPage(1); }} className="s-input s-input--sm" />
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
        <main className="flex-1">
            {/* ── Mobile full-screen map ──────────────────────────────────────────────── */}
            {showMap && (
                <div className="s-overlay fixed inset-0 z-[250] lg:hidden flex flex-col">
                    {/* Mobile map header */}
                    <div className="s-overlay__head flex-shrink-0">
                        <button
                            type="button"
                            onClick={() => setShowMap(false)}
                            className="s-ghost-btn"
                        >
                            <List className="w-4 h-4" aria-hidden="true" /> Ver lista
                        </button>
                        <span className="s-overlay__title">
                            {withCoords.length} en el mapa
                        </span>
                        <button
                            type="button"
                            onClick={() => setShowMobileFilter(true)}
                            aria-label="Filtros"
                            className="s-icon-btn"
                        >
                            <SlidersHorizontal className="w-4 h-4" aria-hidden="true" />
                            {hasActiveFilters && <span className="s-dot ml-1" />}
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
                        <div className="fixed inset-0 z-[1100] flex">
                            <div className="s-backdrop" onClick={() => setShowMobileFilter(false)} />
                            <div className="s-drawer">
                                <div className="s-drawer__head">
                                    <span className="s-filter__title"><Filter size={16} aria-hidden="true" /> Filtros</span>
                                    <button type="button" onClick={() => setShowMobileFilter(false)} aria-label="Cerrar filtros" className="s-icon-btn"><X size={18} /></button>
                                </div>
                                <div className="s-drawer__body"><FilterPanel {...filterPanelProps} /></div>
                                <div className="s-drawer__foot">
                                    <button type="button" onClick={() => setShowMobileFilter(false)} className="l-btn l-btn--primary l-btn--block s-btn-reset s-btn-plain">
                                        Ver {filteredProperties.length} resultados
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            )}

            <div className="s-portal">
            <div className={showMap ? "s-portal__wide" : "l-container"}>

                {/* Breadcrumbs */}
                <nav aria-label="Migas de pan" className="s-crumbs">
                    <Link href="/"><Home size={12} aria-hidden="true" /> Inicio</Link>
                    {breadcrumbs.slice(1).map((crumb, i) => (
                        <span key={i} className="s-crumbs__sep">
                            <ChevronRight size={12} aria-hidden="true" />
                            <Link href={crumb.href}>{crumb.label}</Link>
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
                    <div className={`min-w-0 ${showMap ? "lg:overflow-y-auto lg:max-h-[calc(100vh-96px)]" : "lg:col-span-9"}`}>

                        {/* Results header */}
                        <div className="flex items-center justify-between mb-6 gap-3 flex-wrap">
                            <div>
                                <h1 className="s-results-title">
                                    {loading ? "Cargando..." : `${filteredProperties.length} inmuebles encontrados`}
                                </h1>
                                {hasActiveFilters && <p className="s-results-sub">Con los filtros aplicados</p>}
                            </div>
                            <div className="flex items-center gap-2">
                                {/* Map/List toggle — desktop */}
                                <span className="hidden lg:inline-flex">
                                <button
                                    type="button"
                                    onClick={() => setShowMap(v => !v)}
                                    className="s-ghost-btn"
                                >
                                    {showMap ? <List className="w-4 h-4" aria-hidden="true" /> : <Map className="w-4 h-4" aria-hidden="true" />}
                                    {showMap ? "Ocultar mapa" : "Ver mapa"}
                                    {withCoords.length > 0 && !showMap && (
                                        <span className="s-ghost-btn__count">({withCoords.length})</span>
                                    )}
                                </button>
                                </span>
                                {/* Mobile filter button */}
                                <span className="lg:hidden">
                                <button
                                    type="button"
                                    onClick={() => setShowMobileFilter(true)}
                                    className="s-ghost-btn"
                                >
                                    <SlidersHorizontal size={16} aria-hidden="true" />
                                    Filtrar
                                    {hasActiveFilters && <span className="s-dot" />}
                                </button>
                                </span>
                            </div>
                        </div>

                        {loading ? (
                            <div className="s-loading">
                                <Loader2 className="w-10 h-10 animate-spin" aria-hidden="true" />
                                <p>Buscando las mejores propiedades...</p>
                            </div>
                        ) : filteredProperties.length === 0 ? (
                            <div className="s-empty">
                                <Search className="w-12 h-12" aria-hidden="true" />
                                <p className="s-empty__title">No encontramos resultados</p>
                                <p className="s-empty__text">Probá con otros filtros o una búsqueda más amplia</p>
                                <button type="button" onClick={clearAllFilters} className="l-btn l-btn--primary s-btn-reset s-btn-plain">
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
                                            data-active={hoveredId === p.id}
                                            className="s-hover-wrap"
                                        >
                                            <PropertyPublicCard property={p} tone="dark" />
                                        </div>
                                    ))}
                                </div>

                                {/* Pagination */}
                                {totalPages > 1 && (
                                    <div className="s-pager">
                                        <button type="button" onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1}
                                            className="s-ghost-btn">
                                            Anterior
                                        </button>
                                        <span>
                                            Página <strong>{currentPage}</strong> de <strong>{totalPages}</strong>
                                        </span>
                                        <button type="button" onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages}
                                            className="s-ghost-btn">
                                            Siguiente
                                        </button>
                                    </div>
                                )}

                                {/* Related searches — only when map is hidden */}
                                {!showMap && (
                                    <div className="s-related">
                                        <p className="s-label">Búsquedas relacionadas</p>
                                        <div className="s-chip-row">
                                            {RELATED_ZONES.filter(z => z.toLowerCase() !== searchQuery.toLowerCase()).slice(0, 8).map(zona => (
                                                <Link key={zona} href={`/busqueda?loc=${encodeURIComponent(zona)}`}
                                                    className="s-chip s-chip--link">
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
                        <div className="s-map-frame hidden lg:block sticky top-24 h-[calc(100vh-96px)]">
                            <PropertyMapInner
                                properties={filteredProperties}
                                hoveredId={hoveredId}
                                onHover={setHoveredId}
                            />
                            {withCoords.length < filteredProperties.length && (
                                <div className="s-map-note absolute bottom-3 left-1/2 -translate-x-1/2 z-[1000] pointer-events-none">
                                    <MapPin className="w-3 h-3" aria-hidden="true" />
                                    {withCoords.length} de {filteredProperties.length} tienen coordenadas
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
            </div>

            {/* ── Mobile: floating "Ver mapa" button ───────────────────────── */}
            {!loading && filteredProperties.length > 0 && withCoords.length > 0 && (
                <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 lg:hidden">
                    <button
                        type="button"
                        onClick={() => setShowMap(true)}
                        className="l-btn l-btn--primary s-btn-reset s-btn-plain shadow-xl"
                    >
                        <Map className="w-4 h-4" aria-hidden="true" />
                        Ver mapa · {withCoords.length} propiedades
                    </button>
                </div>
            )}

            {/* Mobile Filter Drawer */}
            {showMobileFilter && (
                <div className="fixed inset-0 z-[250] flex lg:hidden">
                    <div className="s-backdrop" onClick={() => setShowMobileFilter(false)} />
                    <div className="s-drawer">
                        <div className="s-drawer__head">
                            <span className="s-filter__title"><Filter size={16} aria-hidden="true" /> Filtros</span>
                            <button type="button" onClick={() => setShowMobileFilter(false)} aria-label="Cerrar filtros" className="s-icon-btn"><X size={18} /></button>
                        </div>
                        <div className="s-drawer__body"><FilterPanel {...filterPanelProps} /></div>
                        <div className="s-drawer__foot">
                            <button type="button" onClick={() => setShowMobileFilter(false)} className="l-btn l-btn--primary l-btn--block s-btn-reset s-btn-plain">
                                Ver {filteredProperties.length} resultados
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </main>
    );
}

export default function BusquedaPage() {
    return (
        <Suspense fallback={
            <main className="flex-1 s-loading min-h-screen">
                <Loader2 className="w-10 h-10 animate-spin" aria-hidden="true" />
            </main>
        }>
            <BusquedaContent />
        </Suspense>
    );
}
