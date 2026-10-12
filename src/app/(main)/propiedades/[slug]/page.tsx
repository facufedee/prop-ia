"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { PublicProperty, PublicAgency, publicService } from "@/infrastructure/services/publicService";
import PropertiesGrid from "@/ui/components/properties/public/PropertiesGrid";
import { Mail, Loader2, Home, MapPin, Filter, Search, RotateCcw, ChevronDown } from "lucide-react";

// Filter Section Component (Enhanced)
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
        <div className="s-filter-sec">
            <div className="s-filter-sec__head">
                <button
                    type="button"
                    onClick={() => setIsOpen(!isOpen)}
                    aria-expanded={isOpen}
                    className="s-filter-sec__toggle"
                >
                    {title}
                    <ChevronDown size={16} aria-hidden="true" />
                </button>
                {onClear && (
                    <button
                        type="button"
                        onClick={onClear}
                        className="s-text-btn s-text-btn--quiet"
                        title="Limpiar esta sección"
                    >
                        Borrar
                    </button>
                )}
            </div>
            {isOpen && <div className="s-filter-sec__body animate-in slide-in-from-top-2 duration-200">{children}</div>}
        </div>
    );
};

export default function AgencyPropertiesPage() {
    const params = useParams();
    const slug = params.slug as string;

    const [allProperties, setAllProperties] = useState<PublicProperty[]>([]);
    const [filteredProperties, setFilteredProperties] = useState<PublicProperty[]>([]);
    const [agency, setAgency] = useState<PublicAgency | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);

    // Filters
    const [operationType, setOperationType] = useState<string>("Todos");
    const [currency, setCurrency] = useState<string>("Todos");
    const [rooms, setRooms] = useState<string>("Todos");
    const [bathrooms, setBathrooms] = useState<string>("Todos");
    const [priceMin, setPriceMin] = useState<string>("");
    const [priceMax, setPriceMax] = useState<string>("");
    const [areaMin, setAreaMin] = useState<string>("");
    const [areaMax, setAreaMax] = useState<string>("");

    useEffect(() => {
        const load = async () => {
            if (!slug) return;
            try {
                const result = await publicService.getPropertiesByAgencySlug(slug);
                if (result) {
                    setAgency(result.agency);
                    setAllProperties(result.properties);
                    setFilteredProperties(result.properties);
                } else {
                    const fallbackProp = await publicService.getPropertyById(slug);
                    if (fallbackProp) {
                        window.location.replace(`/propiedades/p/${slug}`);
                        return;
                    }
                    setError(true);
                }
            } catch (err) {
                console.error(err);
                setError(true);
            } finally {
                setLoading(false);
            }
        };
        load();
    }, [slug]);

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

        setFilteredProperties(filtered);
    }, [allProperties, operationType, currency, rooms, bathrooms, priceMin, priceMax, areaMin, areaMax]);

    const clearAllFilters = () => {
        setOperationType("Todos");
        setCurrency("Todos");
        setRooms("Todos");
        setBathrooms("Todos");
        setPriceMin("");
        setPriceMax("");
        setAreaMin("");
        setAreaMax("");
    };

    const hasActiveFilters = operationType !== "Todos" || currency !== "Todos" || rooms !== "Todos" || bathrooms !== "Todos" || priceMin || priceMax || areaMin || areaMax;

    if (loading) {
        return <main className="flex-1 s-loading min-h-screen"><Loader2 className="animate-spin w-8 h-8" aria-hidden="true" /></main>;
    }

    if (error || !agency) {
        return <main className="flex-1 s-status"><p className="s-page-lede">Inmobiliaria no encontrada</p></main>;
    }

    return (
        <main className="flex-1 s-portal">
            <div className="l-container">
                {/* Agency Banner / Header */}
                <div className="s-agency-head">
                    <div className="s-avatar s-avatar--square">
                        {agency.logoUrl ? (
                            <img src={agency.logoUrl} alt={agency.agencyName || agency.displayName} className="w-full h-full object-cover" />
                        ) : agency.photoURL ? (
                            <img src={agency.photoURL} alt={agency.displayName} className="w-full h-full object-cover" />
                        ) : (
                            (agency.agencyName || agency.displayName).substring(0, 2).toUpperCase()
                        )}
                    </div>
                    <div className="flex-1 min-w-0">
                        <h1 className="s-page-title">{agency.agencyName || agency.displayName}</h1>
                        <div className="s-agency-head__contact">
                            {agency.email && <span><Mail size={16} aria-hidden="true" />{agency.email}</span>}
                            {agency.phoneNumber && <span>{agency.phoneNumber}</span>}
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">

                    {/* LEFT COLUMN: FILTERS (3 cols) */}
                    <div className="lg:col-span-3 lg:sticky lg:top-24">
                        <div className="s-filter flex flex-col max-h-[calc(100vh-8rem)]">
                            {/* Header (Fixed) */}
                            <div className="s-filter__head shrink-0">
                                <span className="s-filter__title"><Filter size={18} aria-hidden="true" /> Filtros</span>
                                {hasActiveFilters && (
                                    <button type="button" onClick={clearAllFilters} className="s-text-btn">
                                        <RotateCcw size={12} aria-hidden="true" /> Limpiar Todo
                                    </button>
                                )}
                            </div>

                            {/* Scrollable Content */}
                            <div className="s-filter__body overflow-y-auto custom-scrollbar">
                                <FilterSection
                                    title="Operación"
                                    onClear={operationType !== "Todos" ? () => setOperationType("Todos") : undefined}
                                >
                                    <div className="s-radio-list">
                                        {['Todos', 'Venta', 'Alquiler', 'Alquiler Temporal'].map(type => (
                                            <label key={type} className="s-radio">
                                                <input type="radio" name="operation" checked={operationType === type} onChange={() => setOperationType(type)} />
                                                <span className="s-radio__dot" aria-hidden="true" />
                                                <span className="s-radio__text">{type}</span>
                                            </label>
                                        ))}
                                    </div>
                                </FilterSection>

                                <FilterSection
                                    title="Moneda"
                                    onClear={currency !== "Todos" ? () => setCurrency("Todos") : undefined}
                                >
                                    <div className="s-seg">
                                        {['Todos', 'USD', 'ARS'].map(c => (
                                            <button
                                                key={c}
                                                type="button"
                                                onClick={() => setCurrency(c)}
                                                aria-pressed={currency === c}
                                                className="s-seg__opt"
                                            >
                                                {c}
                                            </button>
                                        ))}
                                    </div>
                                </FilterSection>

                                <FilterSection
                                    title="Precio"
                                    onClear={(priceMin || priceMax) ? () => { setPriceMin(""); setPriceMax(""); } : undefined}
                                >
                                    <div className="s-input-pair">
                                        <div className="s-field-wrap w-full">
                                            <span className="s-field-wrap__prefix" aria-hidden="true">$</span>
                                            <input type="number" placeholder="Min" aria-label="Precio mínimo" value={priceMin} onChange={(e) => setPriceMin(e.target.value)} className="s-input s-input--sm s-input--prefix" />
                                        </div>
                                        <div className="s-field-wrap w-full">
                                            <span className="s-field-wrap__prefix" aria-hidden="true">$</span>
                                            <input type="number" placeholder="Max" aria-label="Precio máximo" value={priceMax} onChange={(e) => setPriceMax(e.target.value)} className="s-input s-input--sm s-input--prefix" />
                                        </div>
                                    </div>
                                </FilterSection>

                                <FilterSection
                                    title="Ambientes"
                                    onClear={rooms !== "Todos" ? () => setRooms("Todos") : undefined}
                                >
                                    <div className="s-chip-row">
                                        {['Todos', '1', '2', '3', '4+'].map(r => (
                                            <button key={r} type="button" onClick={() => setRooms(r)} aria-pressed={rooms === r} className="s-chip s-chip--square">{r}</button>
                                        ))}
                                    </div>
                                </FilterSection>

                                <FilterSection
                                    title="Baños"
                                    onClear={bathrooms !== "Todos" ? () => setBathrooms("Todos") : undefined}
                                >
                                    <div className="s-chip-row">
                                        {['Todos', '1', '2', '3+'].map(b => (
                                            <button key={b} type="button" onClick={() => setBathrooms(b)} aria-pressed={bathrooms === b} className="s-chip s-chip--square">{b}</button>
                                        ))}
                                    </div>
                                </FilterSection>

                                <FilterSection
                                    title="Superficie (m²)"
                                    onClear={(areaMin || areaMax) ? () => { setAreaMin(""); setAreaMax(""); } : undefined}
                                >
                                    <div className="s-input-pair">
                                        <input type="number" placeholder="Min" aria-label="Superficie mínima" value={areaMin} onChange={(e) => setAreaMin(e.target.value)} className="s-input s-input--sm" />
                                        <input type="number" placeholder="Max" aria-label="Superficie máxima" value={areaMax} onChange={(e) => setAreaMax(e.target.value)} className="s-input s-input--sm" />
                                    </div>
                                </FilterSection>
                            </div>
                        </div>
                    </div>

                    {/* RIGHT COLUMN: LISTING (9 cols) */}
                    <div className="lg:col-span-9 min-w-0">
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="s-results-title">{filteredProperties.length} Propiedades Encontradas</h2>
                            {/* Sorting could go here */}
                        </div>

                        <PropertiesGrid
                            properties={filteredProperties}
                            loading={loading}
                            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6"
                        />
                    </div>
                </div>
            </div>
        </main>
    );
}
