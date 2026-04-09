"use client";

import { useState } from "react";
import { Search, ChevronDown, RotateCcw, Filter } from "lucide-react";

const PROPERTY_TYPES = [
    "Casa", "Departamento", "PH", "Quinta Vacacional", "Lote/Terreno",
    "Local comercial", "Oficina comercial", "Cochera", "Edificio", "Bodega-Galpon", "Depósito", "Hotel",
];

interface SectionProps {
    title: string;
    children: React.ReactNode;
    defaultOpen?: boolean;
    onClear?: () => void;
}

const FilterSection = ({ title, children, defaultOpen = true, onClear }: SectionProps) => {
    const [isOpen, setIsOpen] = useState(defaultOpen);
    return (
        <div className="border-b border-gray-100 py-4 last:border-0">
            <div className="flex items-center justify-between mb-3">
                <button onClick={() => setIsOpen(!isOpen)} className="flex items-center gap-2 text-left group flex-1">
                    <h3 className="text-xs font-bold text-gray-900 uppercase tracking-widest group-hover:text-indigo-600 transition">{title}</h3>
                    <ChevronDown size={14} className={`text-gray-400 transition-transform ${isOpen ? "rotate-180" : ""}`} />
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

export interface SiteFilters {
    search: string;
    operationType: string;
    propertyType: string;
    rooms: string;
    priceMin: string;
    priceMax: string;
    currency: string;
}

interface Props {
    filters: SiteFilters;
    setFilters: (f: Partial<SiteFilters>) => void;
    primaryColor: string;
    onClearAll: () => void;
    hasActiveFilters: boolean;
}

export default function SiteFilterSidebar({ filters, setFilters, primaryColor, onClearAll, hasActiveFilters }: Props) {
    return (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden sticky top-24">
            <div className="p-4 bg-gray-50 border-b border-gray-100 flex items-center justify-between">
                <span className="font-bold text-gray-900 flex items-center gap-2 text-sm"><Filter size={16} /> Filtros</span>
                {hasActiveFilters && (
                    <button onClick={onClearAll} className="text-[10px] uppercase font-bold text-red-500 hover:text-red-600 flex items-center gap-1.5 px-2 py-1 bg-red-50 rounded-lg transition-colors">
                        <RotateCcw size={10} /> Limpiar
                    </button>
                )}
            </div>

            <div className="p-5 overflow-y-auto max-h-[calc(100vh-14rem)] space-y-2">
                {/* Search */}
                <div className="mb-6">
                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2 block">Ubicación / Título</label>
                    <div className="relative">
                        <input
                            type="text"
                            placeholder="Barrio, ciudad..."
                            value={filters.search}
                            onChange={e => setFilters({ search: e.target.value })}
                            className="w-full pl-9 pr-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-indigo-500 transition"
                        />
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                    </div>
                </div>

                {/* Tipo de Operación */}
                <FilterSection
                    title="Operación"
                    onClear={filters.operationType !== "Todos" ? () => setFilters({ operationType: "Todos" }) : undefined}
                >
                    <div className="space-y-2">
                        {["Todos", "Venta", "Alquiler", "Temporal"].map(type => (
                            <label key={type} className="flex items-center gap-3 cursor-pointer group">
                                <div className={`w-4 h-4 rounded-full border flex items-center justify-center transition ${filters.operationType === type ? "border-transparent" : "border-gray-300 group-hover:border-indigo-300"}`}
                                    style={filters.operationType === type ? { backgroundColor: primaryColor } : {}}>
                                    {filters.operationType === type && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                                </div>
                                <input type="radio" className="hidden" checked={filters.operationType === type} onChange={() => setFilters({ operationType: type })} />
                                <span className={`text-sm ${filters.operationType === type ? "font-bold text-gray-900" : "text-gray-500"}`}>{type}</span>
                            </label>
                        ))}
                    </div>
                </FilterSection>

                {/* Tipo de Propiedad */}
                <FilterSection
                    title="Propiedad"
                    onClear={filters.propertyType !== "Todos" ? () => setFilters({ propertyType: "Todos" }) : undefined}
                >
                    <div className="space-y-2 max-h-48 overflow-y-auto pr-2 scrollbar-thin">
                        {["Todos", ...PROPERTY_TYPES].map(t => (
                            <label key={t} className="flex items-center gap-3 cursor-pointer group">
                                <div className={`w-4 h-4 rounded-full border flex items-center justify-center transition ${filters.propertyType === t ? "border-transparent" : "border-gray-300 group-hover:border-indigo-300"}`}
                                    style={filters.propertyType === t ? { backgroundColor: primaryColor } : {}}>
                                    {filters.propertyType === t && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                                </div>
                                <input type="radio" className="hidden" checked={filters.propertyType === t} onChange={() => setFilters({ propertyType: t })} />
                                <span className={`text-sm ${filters.propertyType === t ? "font-bold text-gray-900" : "text-gray-500"}`}>{t}</span>
                            </label>
                        ))}
                    </div>
                </FilterSection>

                {/* Precio */}
                <FilterSection
                    title="Precio"
                    onClear={(filters.priceMin || filters.priceMax) ? () => setFilters({ priceMin: "", priceMax: "" }) : undefined}
                >
                    <div className="flex gap-2 mb-3">
                        <input type="number" placeholder="Min" value={filters.priceMin} onChange={e => setFilters({ priceMin: e.target.value })} className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-indigo-500 transition" />
                        <input type="number" placeholder="Max" value={filters.priceMax} onChange={e => setFilters({ priceMax: e.target.value })} className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-indigo-500 transition" />
                    </div>
                    <div className="flex bg-gray-100 p-1 rounded-xl">
                        {["Todos", "USD", "ARS"].map(c => (
                            <button key={c} onClick={() => setFilters({ currency: c })} className={`flex-1 py-1.5 text-[10px] font-bold rounded-lg transition ${filters.currency === c ? "bg-white text-gray-900 shadow-sm" : "text-gray-400"}`}>{c}</button>
                        ))}
                    </div>
                </FilterSection>

                {/* Ambientes */}
                <FilterSection
                    title="Ambientes"
                    onClear={filters.rooms !== "Todos" ? () => setFilters({ rooms: "Todos" }) : undefined}
                >
                    <div className="flex flex-wrap gap-2">
                        {["Todos", "1", "2", "3", "4+"].map(r => (
                            <button key={r} onClick={() => setFilters({ rooms: r })} 
                                className={`w-9 h-9 flex items-center justify-center text-xs rounded-xl border transition ${filters.rooms === r ? "text-white border-transparent" : "bg-white text-gray-500 border-gray-200 hover:border-gray-300"}`}
                                style={filters.rooms === r ? { backgroundColor: primaryColor } : {}}
                            >{r}</button>
                        ))}
                    </div>
                </FilterSection>
            </div>
        </div>
    );
}
