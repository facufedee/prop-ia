"use client";

import { useEffect, useState } from "react";
import { PublicProperty, publicService } from "@/infrastructure/services/publicService";
import { Loader2, Filter, ChevronDown, RotateCcw, Search, LayoutGrid, List } from "lucide-react";
import PortalHome from "@/ui/components/properties/public/PortalHome";
import PropertyHorizontalCard from "@/ui/components/properties/public/PropertyHorizontalCard";
import PropertiesGrid from "@/ui/components/properties/public/PropertiesGrid";

// Filter Section Component
const FilterSection = ({
    title,
    children,
    defaultOpen = true,
    onClear
}: {
    title: string,
    children: React.ReactNode,
    defaultOpen?: boolean,
    onClear?: () => void
}) => {
    const [isOpen, setIsOpen] = useState(defaultOpen);
    return (
        <div className="border-b border-gray-100 py-5 last:border-0">
            <div className="flex items-center justify-between mb-3">
                <button
                    onClick={() => setIsOpen(!isOpen)}
                    className="flex items-center gap-2 text-left group flex-1"
                >
                    <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wide group-hover:text-indigo-600 transition">{title}</h3>
                    <ChevronDown size={16} className={`text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
                </button>
                {onClear && (
                    <button
                        onClick={onClear}
                        className="text-[10px] uppercase font-bold text-gray-400 hover:text-red-500 transition px-2 py-1 rounded bg-gray-50 hover:bg-red-50"
                        title="Limpiar esta sección"
                    >
                        Borrar
                    </button>
                )}
            </div>
            {isOpen && <div className="mt-2 animate-in slide-in-from-top-2 duration-200">{children}</div>}
        </div>
    );
};

export default function PublicPropertiesPage() {
    const [allProperties, setAllProperties] = useState<PublicProperty[]>([]);
    const [filteredProperties, setFilteredProperties] = useState<PublicProperty[]>([]);
    const [loading, setLoading] = useState(true);

    // Initial Mode
    const [isHomeMode, setIsHomeMode] = useState(true);

    // Filters
    const [operationType, setOperationType] = useState<string>("Todos");
    const [currency, setCurrency] = useState<string>("Todos");
    const [rooms, setRooms] = useState<string>("Todos");
    const [bathrooms, setBathrooms] = useState<string>("Todos");
    const [priceMin, setPriceMin] = useState<string>("");
    const [priceMax, setPriceMax] = useState<string>("");
    const [areaMin, setAreaMin] = useState<string>("");
    const [areaMax, setAreaMax] = useState<string>("");
    const [searchQuery, setSearchQuery] = useState("");

    useEffect(() => {
        const load = async () => {
            try {
                const data = await publicService.getAllProperties();
                setAllProperties(data);
                setFilteredProperties(data);
            } catch (error) {
                console.error(error);
            } finally {
                setLoading(false);
            }
        };
        load();
    }, []);

    // Effect to handle filtering
    useEffect(() => {
        if (!allProperties.length) return;

        let filtered = [...allProperties];

        // Filter by Operation
        if (operationType !== "Todos") {
            filtered = filtered.filter(p => p.operation_type === operationType);
        }

        // Filter by Currency
        if (currency !== "Todos") {
            filtered = filtered.filter(p => p.currency === currency);
        }

        // Filter by Rooms
        if (rooms !== "Todos") {
            if (rooms === "4+") {
                filtered = filtered.filter(p => (p.rooms || 0) >= 4);
            } else {
                filtered = filtered.filter(p => (p.rooms || 0) === Number(rooms));
            }
        }

        // Filter by Bathrooms
        if (bathrooms !== "Todos") {
            if (bathrooms === "3+") {
                filtered = filtered.filter(p => (p.bathrooms || 0) >= 3);
            } else {
                filtered = filtered.filter(p => (p.bathrooms || 0) === Number(bathrooms));
            }
        }

        // Filter by Price
        if (priceMin) {
            filtered = filtered.filter(p => Number(p.price) >= Number(priceMin));
        }
        if (priceMax) {
            filtered = filtered.filter(p => Number(p.price) <= Number(priceMax));
        }

        // Filter by Area
        if (areaMin) {
            filtered = filtered.filter(p => (p.area_covered || 0) >= Number(areaMin));
        }
        if (areaMax) {
            filtered = filtered.filter(p => (p.area_covered || 0) <= Number(areaMax));
        }

        // Filter by Search Query (Title or Code or Location)
        if (searchQuery) {
            const query = searchQuery.toLowerCase();
            filtered = filtered.filter(p =>
                p.title.toLowerCase().includes(query) ||
                (p.code && p.code.toLowerCase().includes(query)) ||
                (p.localidad && p.localidad.toLowerCase().includes(query))
            );
        }

        setFilteredProperties(filtered);
    }, [allProperties, operationType, currency, rooms, bathrooms, priceMin, priceMax, areaMin, areaMax, searchQuery]);

    const handleHomeSearch = (filters: any) => {
        setOperationType(filters.operationType);
        setSearchQuery(filters.searchQuery);
        setIsHomeMode(false);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const clearAllFilters = () => {
        setOperationType("Todos");
        setCurrency("Todos");
        setRooms("Todos");
        setBathrooms("Todos");
        setPriceMin("");
        setPriceMax("");
        setAreaMin("");
        setAreaMax("");
        setSearchQuery("");
        // Optional: Go back to home if clearing all? Maybe not.
        setIsHomeMode(true);
    };

    const hasActiveFilters = operationType !== "Todos" || currency !== "Todos" || rooms !== "Todos" || bathrooms !== "Todos" || priceMin || priceMax || areaMin || areaMax || searchQuery;

    // View Mode Toggle (Grid/List)
    const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');

    if (isHomeMode) {
        return (
            <PortalHome
                onSearch={handleHomeSearch}
                featuredProperties={allProperties} // Pass all, component slices 4
                loading={loading}
            />
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 pb-20 pt-28">
            <h1 className="sr-only">Propiedades en Venta y Alquiler - Zeta Prop</h1>
            <div className="container mx-auto px-4 max-w-7xl">

                {/* Mobile Breadcrumb / Back to Home */}
                <button onClick={() => setIsHomeMode(true)} className="mb-4 text-sm text-gray-500 hover:text-indigo-600 flex items-center gap-1">
                    ← Volver al Inicio
                </button>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">

                    {/* LEFT COLUMN: FILTERS (3 cols) */}
                    <div className="lg:col-span-3">
                        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden sticky top-24 max-h-[calc(100vh-8rem)] flex flex-col">
                            {/* Header (Fixed) */}
                            <div className="p-4 bg-gray-50 border-b border-gray-100 flex items-center justify-between shrink-0">
                                <span className="font-bold text-gray-900 flex items-center gap-2"><Filter size={18} /> Filtros</span>
                                {hasActiveFilters && (
                                    <button onClick={clearAllFilters} className="text-xs text-indigo-600 hover:text-indigo-800 font-medium hover:underline flex items-center gap-1">
                                        <RotateCcw size={12} /> Limpiar
                                    </button>
                                )}
                            </div>

                            {/* Scrollable Content */}
                            <div className="p-4 overflow-y-auto custom-scrollbar">
                                {/* Search Input */}
                                <div className="mb-6">
                                    <label className="text-xs font-bold text-gray-500 uppercase mb-2 block">Ubicación</label>
                                    <div className="relative">
                                        <input
                                            type="text"
                                            placeholder="Barrio, Ciudad..."
                                            value={searchQuery}
                                            onChange={(e) => setSearchQuery(e.target.value)}
                                            className="w-full pl-9 pr-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-indigo-500 transition"
                                        />
                                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                                    </div>
                                </div>

                                <FilterSection
                                    title="Tipo de Operación"
                                    onClear={operationType !== "Todos" ? () => setOperationType("Todos") : undefined}
                                >
                                    <div className="space-y-2">
                                        {['Todos', 'Venta', 'Alquiler', 'Alquiler Temporal'].map(type => (
                                            <label key={type} className="flex items-center gap-3 cursor-pointer group">
                                                <div className={`w-4 h-4 rounded-full border flex items-center justify-center transition ${operationType === type ? 'border-indigo-600 bg-indigo-50' : 'border-gray-300 bg-white group-hover:border-indigo-300'}`}>
                                                    {operationType === type && <div className="w-2 h-2 rounded-full bg-indigo-600" />}
                                                </div>
                                                <input type="radio" className="hidden" name="operation" checked={operationType === type} onChange={() => setOperationType(type)} />
                                                <span className={`text-sm ${operationType === type ? 'font-bold text-indigo-700' : 'text-gray-600 group-hover:text-gray-900'}`}>{type}</span>
                                            </label>
                                        ))}
                                    </div>
                                </FilterSection>

                                <FilterSection
                                    title="Precio"
                                    onClear={(priceMin || priceMax) ? () => { setPriceMin(""); setPriceMax(""); } : undefined}
                                >
                                    <div className="flex gap-2">
                                        <div className="relative w-full">
                                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs font-bold">$</span>
                                            <input type="number" placeholder="Min" value={priceMin} onChange={(e) => setPriceMin(e.target.value)} className="w-full pl-6 pr-3 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-indigo-500 transition" />
                                        </div>
                                        <div className="relative w-full">
                                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs font-bold">$</span>
                                            <input type="number" placeholder="Max" value={priceMax} onChange={(e) => setPriceMax(e.target.value)} className="w-full pl-6 pr-3 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-indigo-500 transition" />
                                        </div>
                                    </div>
                                    <div className="flex mt-2 bg-gray-100 p-1 rounded-lg">
                                        {['Todos', 'USD', 'ARS'].map(c => (
                                            <button
                                                key={c}
                                                onClick={() => setCurrency(c)}
                                                className={`flex-1 py-1 text-xs font-bold rounded-md transition ${currency === c ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                                            >
                                                {c}
                                            </button>
                                        ))}
                                    </div>
                                </FilterSection>

                                <FilterSection
                                    title="Ambientes"
                                    onClear={rooms !== "Todos" ? () => setRooms("Todos") : undefined}
                                >
                                    <div className="flex flex-wrap gap-2">
                                        {['Todos', '1', '2', '3', '4+'].map(r => (
                                            <button key={r} onClick={() => setRooms(r)} className={`w-8 h-8 flex items-center justify-center text-sm rounded-lg border transition ${rooms === r ? 'bg-indigo-600 text-white border-indigo-600 shadow-md shadow-indigo-200' : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300 hover:bg-gray-50'}`}>{r}</button>
                                        ))}
                                    </div>
                                </FilterSection>

                                <FilterSection title="Características" onClear={undefined}>
                                    {/* Placeholder for Amenities like 'Cochera', 'Piscina' */}
                                    <div className="space-y-2">
                                        <label className="flex items-center gap-2 text-sm text-gray-600"><input type="checkbox" className="rounded text-indigo-600 focus:ring-indigo-500" /> Cochera</label>
                                        <label className="flex items-center gap-2 text-sm text-gray-600"><input type="checkbox" className="rounded text-indigo-600 focus:ring-indigo-500" /> Piscina</label>
                                        <label className="flex items-center gap-2 text-sm text-gray-600"><input type="checkbox" className="rounded text-indigo-600 focus:ring-indigo-500" /> Seguridad</label>
                                    </div>
                                </FilterSection>

                            </div>
                        </div>
                    </div>

                    {/* RIGHT COLUMN: LISTING (9 cols) */}
                    <div className="lg:col-span-9">
                        <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm mb-6 flex items-center justify-between">
                            <div>
                                <h2 className="text-xl font-bold text-gray-900">{filteredProperties.length} Inmuebles encontrados</h2>
                                <p className="text-sm text-gray-500">Ordenado por más relevantes</p>
                            </div>

                            <div className="flex items-center gap-2 bg-gray-100 p-1 rounded-lg">
                                <button onClick={() => setViewMode('list')} className={`p-2 rounded-md transition ${viewMode === 'list' ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-500 hover:text-gray-900'}`}>
                                    <List size={20} />
                                </button>
                                <button onClick={() => setViewMode('grid')} className={`p-2 rounded-md transition ${viewMode === 'grid' ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-500 hover:text-gray-900'}`}>
                                    <LayoutGrid size={20} />
                                </button>
                            </div>
                        </div>

                        {loading ? (
                            <div className="flex flex-col items-center justify-center py-20">
                                <Loader2 className="w-10 h-10 text-indigo-600 animate-spin mb-4" />
                                <p className="text-gray-500">Buscando las mejores propiedades...</p>
                            </div>
                        ) : filteredProperties.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-20 bg-white rounded-2xl border border-dashed border-gray-200">
                                <Search className="w-12 h-12 text-gray-300 mb-4" />
                                <p className="text-lg text-gray-900 font-medium">No encontramos resultados</p>
                                <p className="text-gray-500">Probá con otros filtros o una búsqueda más amplia</p>
                                <button onClick={clearAllFilters} className="mt-4 text-indigo-600 font-bold hover:underline">Limpiar Filtros</button>
                            </div>
                        ) : (
                            <div className={`grid gap-6 ${viewMode === 'list' ? 'grid-cols-1' : 'grid-cols-1 md:grid-cols-2 xl:grid-cols-3'}`}>
                                {filteredProperties.map(property => (
                                    viewMode === 'list' ? (
                                        <PropertyHorizontalCard key={property.id} property={property} />
                                    ) : (
                                        <div key={property.id} className="h-full">
                                            <PropertiesGrid properties={[property]} className="!grid-cols-1 !gap-0 h-full" />
                                        </div>
                                    )
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
