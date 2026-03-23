"use client";

import { useEffect, useState, useMemo, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { PublicProperty, publicService } from "@/infrastructure/services/publicService";
import PropertiesGrid from "@/ui/components/properties/public/PropertiesGrid";
import { Loader2, Filter, ChevronDown, RotateCcw, Search, X, Home, ChevronRight, SlidersHorizontal } from "lucide-react";

const PROPERTY_TYPES = [
    "Casa", "Departamento", "PH", "Quinta Vacacional", "Lote/Terreno",
    "Local comercial", "Oficina comercial", "Cochera", "Edificio", "Bodega-Galpon", "Depósito", "Hotel",
];

const RELATED_ZONES = [
    "Ituzaingó", "Castelar", "Morón", "Ramos Mejía", "Haedo",
    "El Palomar", "Hurlingham", "Villa del Parque", "Palermo", "Belgrano",
];

function shuffleArray<T>(arr: T[]): T[] {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
}

const FilterSection = ({
    title, children, defaultOpen = true, onClear
}: { title: string; children: React.ReactNode; defaultOpen?: boolean; onClear?: () => void }) => {
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

function BusquedaContent() {
    const searchParams = useSearchParams();
    const router = useRouter();

    const [allProperties, setAllProperties] = useState<PublicProperty[]>([]);
    const [loading, setLoading] = useState(true);
    const [currentPage, setCurrentPage] = useState(1);
    const [showMobileFilter, setShowMobileFilter] = useState(false);
    const propertiesPerPage = 15;

    // Filters — initialized from URL params
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

    // Re-sync if URL params change (e.g. landing click)
    useEffect(() => {
        setOperationType(searchParams.get("operacion") || "Todos");
        setPropertyType(searchParams.get("tipo") || "Todos");
        setSearchQuery(searchParams.get("loc") || "");
        setCurrentPage(1);
    }, [searchParams]);

    const hasActiveFilters = operationType !== "Todos" || propertyType !== "Todos" || currency !== "Todos"
        || rooms !== "Todos" || priceMin || priceMax || areaMin || areaMax || searchQuery;

    const clearAllFilters = () => {
        setOperationType("Todos");
        setPropertyType("Todos");
        setCurrency("Todos");
        setRooms("Todos");
        setPriceMin("");
        setPriceMax("");
        setAreaMin("");
        setAreaMax("");
        setSearchQuery("");
        router.push("/busqueda");
    };

    const filteredProperties = useMemo(() => {
        let filtered = [...allProperties];

        if (operationType !== "Todos") filtered = filtered.filter(p => p.operation_type === operationType);
        if (propertyType !== "Todos") filtered = filtered.filter(p => p.type === propertyType || (p as any).property_type === propertyType);
        if (currency !== "Todos") filtered = filtered.filter(p => p.currency === currency);
        if (rooms !== "Todos") {
            if (rooms === "4+") filtered = filtered.filter(p => (p.rooms || 0) >= 4);
            else filtered = filtered.filter(p => (p.rooms || 0) === Number(rooms));
        }
        if (priceMin) filtered = filtered.filter(p => Number(p.price) >= Number(priceMin));
        if (priceMax) filtered = filtered.filter(p => Number(p.price) <= Number(priceMax));
        if (areaMin) filtered = filtered.filter(p => (p.area_covered || 0) >= Number(areaMin));
        if (areaMax) filtered = filtered.filter(p => (p.area_covered || 0) <= Number(areaMax));
        if (searchQuery) {
            const q = searchQuery.toLowerCase().trim();
            filtered = filtered.filter(p => {
                const fields = [
                    p.title,
                    p.localidad,
                    p.provincia,
                    p.address,
                    p.calle,
                    p.altura,
                    p.code,
                    p.type,
                    (p as any).barrio,
                    (p as any).ciudad,
                    (p as any).property_type,
                    (p as any).description,
                    (p as any).all_features,
                ];
                return fields.some(f => f && String(f).toLowerCase().includes(q));
            });
        }
        return filtered;
    }, [allProperties, operationType, propertyType, currency, rooms, priceMin, priceMax, areaMin, areaMax, searchQuery]);

    const paginatedProperties = filteredProperties.slice((currentPage - 1) * propertiesPerPage, currentPage * propertiesPerPage);
    const totalPages = Math.ceil(filteredProperties.length / propertiesPerPage);

    // Breadcrumbs
    const breadcrumbs = [
        { label: "Inicio", href: "/propiedades" },
        ...(operationType !== "Todos" ? [{ label: operationType, href: `/busqueda?operacion=${operationType}` }] : []),
        ...(propertyType !== "Todos" ? [{ label: propertyType, href: `/busqueda?tipo=${encodeURIComponent(propertyType)}` }] : []),
        ...(searchQuery ? [{ label: searchQuery, href: `/busqueda?loc=${encodeURIComponent(searchQuery)}` }] : []),
    ];

    const FilterPanel = () => (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="p-4 bg-gray-50 border-b border-gray-100 flex items-center justify-between">
                <span className="font-bold text-gray-900 flex items-center gap-2"><Filter size={16} /> Filtros</span>
                {hasActiveFilters && (
                    <button onClick={clearAllFilters} className="text-xs text-indigo-600 hover:text-indigo-800 font-medium hover:underline flex items-center gap-1">
                        <RotateCcw size={11} /> Limpiar
                    </button>
                )}
            </div>

            <div className="p-4 overflow-y-auto max-h-[calc(100vh-12rem)]">
                {/* Location Search */}
                <div className="mb-5">
                    <label className="text-xs font-bold text-gray-500 uppercase mb-2 block">Ubicación</label>
                    <div className="relative">
                        <input
                            type="text"
                            placeholder="Barrio, ciudad..."
                            value={searchQuery}
                            onChange={e => { setSearchQuery(e.target.value); setCurrentPage(1); }}
                            className="w-full pl-9 pr-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-indigo-500 transition"
                        />
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                    </div>
                </div>

                {/* Tipo de Propiedad */}
                <FilterSection
                    title="Tipo de Propiedad"
                    onClear={propertyType !== "Todos" ? () => setPropertyType("Todos") : undefined}
                >
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

                {/* Tipo de Operación */}
                <FilterSection
                    title="Tipo de Operación"
                    onClear={operationType !== "Todos" ? () => setOperationType("Todos") : undefined}
                >
                    <div className="space-y-1.5">
                        {["Todos", "Venta", "Alquiler", "Alquiler Temporal"].map(type => (
                            <label key={type} className="flex items-center gap-3 cursor-pointer group">
                                <div className={`w-4 h-4 rounded-full border flex items-center justify-center transition ${operationType === type ? "border-indigo-600 bg-indigo-50" : "border-gray-300 group-hover:border-indigo-300"}`}>
                                    {operationType === type && <div className="w-2 h-2 rounded-full bg-indigo-600" />}
                                </div>
                                <input type="radio" className="hidden" name="operation" checked={operationType === type} onChange={() => { setOperationType(type); setCurrentPage(1); }} />
                                <span className={`text-sm ${operationType === type ? "font-bold text-indigo-700" : "text-gray-600"}`}>{type}</span>
                            </label>
                        ))}
                    </div>
                </FilterSection>

                {/* Precio */}
                <FilterSection
                    title="Precio"
                    onClear={(priceMin || priceMax) ? () => { setPriceMin(""); setPriceMax(""); } : undefined}
                >
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

                {/* Ambientes */}
                <FilterSection
                    title="Ambientes"
                    onClear={rooms !== "Todos" ? () => setRooms("Todos") : undefined}
                >
                    <div className="flex flex-wrap gap-2">
                        {["Todos", "1", "2", "3", "4+"].map(r => (
                            <button key={r} onClick={() => { setRooms(r); setCurrentPage(1); }} className={`w-10 h-10 flex items-center justify-center text-sm rounded-lg border transition ${rooms === r ? "bg-indigo-600 text-white border-indigo-600" : "bg-white text-gray-600 border-gray-200 hover:border-gray-300"}`}>{r}</button>
                        ))}
                    </div>
                </FilterSection>

                {/* Superficie */}
                <FilterSection
                    title="Superficie (m²)"
                    onClear={(areaMin || areaMax) ? () => { setAreaMin(""); setAreaMax(""); } : undefined}
                >
                    <div className="flex gap-2">
                        <input type="number" placeholder="Min" value={areaMin} onChange={e => { setAreaMin(e.target.value); setCurrentPage(1); }} className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-indigo-500 transition" />
                        <input type="number" placeholder="Max" value={areaMax} onChange={e => { setAreaMax(e.target.value); setCurrentPage(1); }} className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-indigo-500 transition" />
                    </div>
                </FilterSection>
            </div>
        </div>
    );

    return (
        <div className="min-h-screen bg-gray-50 pb-20 pt-24">
            <div className="container mx-auto px-4 max-w-7xl">

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

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">

                    {/* Filter Panel — desktop only */}
                    <div className="hidden lg:block lg:col-span-3 sticky top-24">
                        <FilterPanel />
                    </div>

                    {/* Results */}
                    <div className="lg:col-span-9">
                        <div className="flex items-center justify-between mb-5">
                            <div>
                                <h1 className="text-xl font-bold text-gray-900">
                                    {loading ? "Cargando..." : `${filteredProperties.length} inmuebles encontrados`}
                                </h1>
                                {hasActiveFilters && (
                                    <p className="text-xs text-gray-400 mt-0.5">Con los filtros aplicados</p>
                                )}
                            </div>
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
                                <PropertiesGrid
                                    properties={paginatedProperties}
                                    loading={loading}
                                    className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5"
                                />

                                {/* Pagination */}
                                {totalPages > 1 && (
                                    <div className="flex items-center justify-center gap-3 mt-10">
                                        <button
                                            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                            disabled={currentPage === 1}
                                            className="px-5 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 hover:text-indigo-600 disabled:opacity-40 disabled:cursor-not-allowed transition"
                                        >
                                            Anterior
                                        </button>
                                        <span className="text-sm text-gray-500">
                                            Página <strong>{currentPage}</strong> de <strong>{totalPages}</strong>
                                        </span>
                                        <button
                                            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                                            disabled={currentPage === totalPages}
                                            className="px-5 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 hover:text-indigo-600 disabled:opacity-40 disabled:cursor-not-allowed transition"
                                        >
                                            Siguiente
                                        </button>
                                    </div>
                                )}

                                {/* Related searches */}
                                <div className="mt-14 p-6 bg-white rounded-2xl border border-gray-100">
                                    <p className="text-sm font-bold text-gray-700 mb-3">Búsquedas relacionadas</p>
                                    <div className="flex flex-wrap gap-2">
                                        {RELATED_ZONES.filter(z => z.toLowerCase() !== searchQuery.toLowerCase()).slice(0, 8).map(zona => (
                                            <Link
                                                key={zona}
                                                href={`/busqueda?loc=${encodeURIComponent(zona)}`}
                                                className="px-3 py-1.5 bg-gray-50 hover:bg-indigo-50 border border-gray-200 hover:border-indigo-300 text-xs font-medium text-gray-600 hover:text-indigo-700 rounded-full transition-all"
                                            >
                                                Propiedades en {zona}
                                            </Link>
                                        ))}
                                    </div>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            </div>

            {/* Mobile Filter Drawer */}
            {showMobileFilter && (
                <div className="fixed inset-0 z-50 flex lg:hidden">
                    <div className="absolute inset-0 bg-black/40" onClick={() => setShowMobileFilter(false)} />
                    <div className="relative ml-auto w-[320px] h-full bg-white shadow-2xl overflow-y-auto">
                        <div className="flex items-center justify-between p-4 border-b border-gray-100 sticky top-0 bg-white z-10">
                            <span className="font-bold text-gray-900 flex items-center gap-2"><Filter size={16} /> Filtros</span>
                            <button onClick={() => setShowMobileFilter(false)} className="p-2 rounded-lg hover:bg-gray-100 transition">
                                <X size={18} />
                            </button>
                        </div>
                        <div className="p-4">
                            <FilterPanel />
                        </div>
                        <div className="sticky bottom-0 bg-white p-4 border-t border-gray-100">
                            <button
                                onClick={() => setShowMobileFilter(false)}
                                className="w-full py-3 bg-indigo-600 text-white font-semibold rounded-xl hover:bg-indigo-700 transition-colors"
                            >
                                Ver {filteredProperties.length} resultados
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

// Wrap in Suspense for useSearchParams
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
