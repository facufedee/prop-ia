"use client";

import { useState, useEffect } from "react";
import { Save, RotateCcw, Home, Edit2, X, Check } from "lucide-react";
import { predictionService } from "@/lib/prediction/predictionService";

interface AdjustmentConfig {
    // Numeric fields (percentage adjustment)
    area_total: number;
    area_covered: number;
    rooms: number;
    bedrooms: number;
    bathrooms: number;
    floor: number;
    construction_year: number;
    expenses: number;

    // Boolean features (percentage adjustment if present)
    pileta: number;
    sum: number;
    seguridad: number;
    cochera: number;
    balcon: number;
    terraza: number;
    jardin: number;
    gimnasio: number;
    laundry: number;
    calefaccion: number;
}

const initialConfig: AdjustmentConfig = {
    area_total: 0,
    area_covered: 0,
    rooms: 0,
    bedrooms: 0,
    bathrooms: 0,
    floor: 0,
    construction_year: 0,
    expenses: 0,
    pileta: 0,
    sum: 0,
    seguridad: 0,
    cochera: 0,
    balcon: 0,
    terraza: 0,
    jardin: 0,
    gimnasio: 0,
    laundry: 0,
    calefaccion: 0
};

const fieldLabels: Record<string, string> = {
    area_total: "Área Total",
    area_covered: "Área Cubierta",
    rooms: "Ambientes",
    bedrooms: "Dormitorios",
    bathrooms: "Baños",
    floor: "Piso",
    construction_year: "Año Const.",
    expenses: "Expensas",
    pileta: "Pileta",
    sum: "SUM",
    seguridad: "Seguridad",
    cochera: "Cochera",
    balcon: "Balcón",
    terraza: "Terraza",
    jardin: "Jardín",
    gimnasio: "Gimnasio",
    laundry: "Laundry",
    calefaccion: "Calefacción"
};

interface ExampleProperty {
    property_type: string;
    location: string;
    barrio: string;
    ciudad: string;
    provincia: string;
    area_total: number;
    area_covered: number;
    rooms: number;
    bedrooms: number;
    bathrooms: number;
    floor: number;
    construction_year: number;
    expenses: number;
    all_features: string;
}

const initialExampleProperty: ExampleProperty = {
    property_type: 'Departamento',
    location: 'Palermo, Capital Federal',
    barrio: 'Palermo',
    ciudad: 'Capital Federal',
    provincia: 'Capital Federal',
    area_total: 150,
    area_covered: 120,
    rooms: 4,
    bedrooms: 3,
    bathrooms: 2,
    floor: 5,
    construction_year: 2010,
    expenses: 5000,
    all_features: "pileta, sum, seguridad, cochera, balcon"
};

import PortalesTab from "./components/PortalesTab";
import MercadoPagoTab from "./components/MercadoPagoTab";
import NotificationsTab from "./components/NotificationsTab";
import InmobiliariaTab from "./components/InmobiliariaTab";
import { IndicesData } from "@/lib/financial/indices";
import { auth } from "@/infrastructure/firebase/client";

// Helper to get month name
const MONTHS = [
    "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
    "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"
];

const CURRENT_YEAR = new Date().getFullYear();
const INDEX_YEARS = [CURRENT_YEAR, CURRENT_YEAR - 1];

export default function ConfiguracionPage() {
    const [activeTab, setActiveTab] = useState("tasaciones");
    const [config, setConfig] = useState<AdjustmentConfig>(initialConfig);
    const [saved, setSaved] = useState(false);
    const [basePrice, setBasePrice] = useState<number | null>(null);

    // Example Property State
    const [exampleProperty, setExampleProperty] = useState<ExampleProperty>(initialExampleProperty);
    const [isEditingExample, setIsEditingExample] = useState(false);
    const [tempExample, setTempExample] = useState<ExampleProperty>(initialExampleProperty);

    // Indices State (IPC from INDEC, ICL from BCRA — read-only, synced automatically)
    const [indices, setIndices] = useState<IndicesData>({ years: {} });
    const [indicesRefreshing, setIndicesRefreshing] = useState(false);
    const [indicesError, setIndicesError] = useState<string | null>(null);

    useEffect(() => {
        fetch('/api/config/indices')
            .then(res => res.json())
            .then(data => {
                if (data.years) {
                    setIndices(data);
                }
            })
            .catch(err => console.error("Error loading indices:", err));
    }, []);

    const refreshIndices = async () => {
        setIndicesRefreshing(true);
        setIndicesError(null);
        try {
            const token = await auth?.currentUser?.getIdToken();
            const res = await fetch('/api/config/indices', {
                method: 'POST',
                headers: token ? { Authorization: `Bearer ${token}` } : {},
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || "No se pudo actualizar");
            setIndices(data);
        } catch (err: any) {
            setIndicesError(err.message || "No se pudo actualizar");
        } finally {
            setIndicesRefreshing(false);
        }
    };

    const iclDates = Object.keys(indices.icl ?? {}).sort();
    const latestIclDate = iclDates[iclDates.length - 1];
    const latestIcl = latestIclDate ? indices.icl![latestIclDate] : null;

    useEffect(() => {
        // Load config from server API
        fetch('/api/config/tasacion')
            .then(res => res.json())
            .then(data => {
                if (Object.keys(data).length > 0) {
                    setConfig(data);
                }
            })
            .catch(err => console.error("Error loading config:", err));
    }, []);

    // Recalculate base price whenever example property changes
    useEffect(() => {
        predictionService.predict(exampleProperty as any, { skipConfig: true })
            .then(price => setBasePrice(price))
            .catch(err => console.error("Error calculating base price:", err));
    }, [exampleProperty]);

    const handleSave = async () => {
        try {
            await fetch('/api/config/tasacion', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(config)
            });
            setSaved(true);
            setTimeout(() => setSaved(false), 2000);
        } catch (err) {
            console.error("Error saving config:", err);
        }
    };

    const handleReset = async () => {
        setConfig(initialConfig);
        try {
            await fetch('/api/config/tasacion', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(initialConfig)
            });
        } catch (err) {
            console.error("Error resetting config:", err);
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setConfig(prev => ({ ...prev, [name]: Number(value) }));
    };

    // Edit Modal Handlers
    const openEditModal = () => {
        setTempExample({ ...exampleProperty });
        setIsEditingExample(true);
    };

    const closeEditModal = () => {
        setIsEditingExample(false);
    };

    const saveExampleChanges = () => {
        setExampleProperty({ ...tempExample });
        setIsEditingExample(false);
    };

    const handleExampleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value, type } = e.target;
        setTempExample(prev => ({
            ...prev,
            [name]: type === 'number' ? Number(value) : value
        }));
    };

    const toggleFeature = (feature: string) => {
        const features = tempExample.all_features.toLowerCase().split(',').map(f => f.trim()).filter(f => f);
        if (features.includes(feature)) {
            setTempExample(prev => ({ ...prev, all_features: features.filter(f => f !== feature).join(', ') }));
        } else {
            features.push(feature);
            setTempExample(prev => ({ ...prev, all_features: features.join(', ') }));
        }
    };

    const loadExampleData = () => {
        setTempExample({
            property_type: 'Departamento',
            location: 'Palermo, Capital Federal',
            barrio: 'Palermo',
            ciudad: 'Capital Federal',
            provincia: 'Capital Federal',
            area_total: 150,
            area_covered: 120,
            rooms: 4,
            bedrooms: 3,
            bathrooms: 2,
            floor: 5,
            construction_year: 2010,
            expenses: 5000,
            all_features: 'pileta, sum, seguridad, cochera, balcon'
        });
    };

    // Calculate Impacts
    const getImpacts = () => {
        if (!basePrice) return [];

        const impacts: { label: string, value: string, impact: number, percent: number }[] = [];
        const featureList = exampleProperty.all_features.toLowerCase().split(',').map(f => f.trim());

        // Numeric Fields
        const numericFields = ["area_total", "area_covered", "rooms", "bedrooms", "bathrooms", "floor", "construction_year", "expenses"];
        numericFields.forEach(field => {
            const percent = config[field as keyof AdjustmentConfig];
            if (percent !== 0) {
                const impact = basePrice * (percent / 100);
                impacts.push({
                    label: fieldLabels[field],
                    value: exampleProperty[field as keyof ExampleProperty].toString(),
                    impact,
                    percent
                });
            }
        });

        // Boolean Fields
        const booleanFields = ["pileta", "sum", "seguridad", "cochera", "balcon", "terraza", "jardin", "gimnasio", "laundry", "calefaccion"];
        booleanFields.forEach(field => {
            if (featureList.includes(field)) {
                const percent = config[field as keyof AdjustmentConfig];
                if (percent !== 0) {
                    const impact = basePrice * (percent / 100);
                    impacts.push({
                        label: fieldLabels[field],
                        value: "Sí",
                        impact,
                        percent
                    });
                }
            }
        });

        return impacts;
    };

    const impacts = getImpacts();
    const totalImpact = impacts.reduce((sum, item) => sum + item.impact, 0);
    const finalPrice = (basePrice || 0) + totalImpact;

    return (
        <div className="max-w-7xl mx-auto">
            <h1 className="font-heading text-2xl font-bold mb-6 text-[var(--color-ink)]">Configuración</h1>

            <div className="flex border-b mb-6 overflow-x-auto">
                <button
                    className={`px-4 py-2 font-medium shrink-0 ${activeTab === "inmobiliaria" ? "border-b-2 border-[var(--color-rule)] text-[var(--color-ink)]" : "text-[var(--color-muted)] hover:text-[var(--color-ink-2)]"}`}
                    onClick={() => setActiveTab("inmobiliaria")}
                >
                    Mi Inmobiliaria
                </button>
                <button
                    className={`px-4 py-2 font-medium shrink-0 ${activeTab === "tasaciones" ? "border-b-2 border-[var(--color-rule)] text-[var(--color-ink)]" : "text-[var(--color-muted)] hover:text-[var(--color-ink-2)]"}`}
                    onClick={() => setActiveTab("tasaciones")}
                >
                    Tasaciones Inteligentes
                </button>
                <button
                    className={`px-4 py-2 font-medium shrink-0 ${activeTab === "indices" ? "border-b-2 border-[var(--color-rule)] text-[var(--color-ink)]" : "text-[var(--color-muted)] hover:text-[var(--color-ink-2)]"}`}
                    onClick={() => setActiveTab("indices")}
                >
                    Índices (IPC)
                </button>
                <button
                    className={`px-4 py-2 font-medium shrink-0 ${activeTab === "mercadopago" ? "border-b-2 border-[var(--color-rule)] text-[var(--color-ink)]" : "text-[var(--color-muted)] hover:text-[var(--color-ink-2)]"}`}
                    onClick={() => setActiveTab("mercadopago")}
                >
                    Medios de Pago
                </button>
                <button
                    className={`px-4 py-2 font-medium shrink-0 ${activeTab === "notificaciones" ? "border-b-2 border-[var(--color-rule)] text-[var(--color-ink)]" : "text-[var(--color-muted)] hover:text-[var(--color-ink-2)]"}`}
                    onClick={() => setActiveTab("notificaciones")}
                >
                    Notificaciones
                </button>
            </div>

            {activeTab === "tasaciones" && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Left Column: Config Form */}
                    <div className="lg:col-span-2">
                        <div className="bg-[var(--color-paper-2)] p-8 rounded-xl shadow-sm border border-[var(--color-rule)]">
                            {/* Header & Actions */}
                            <div className="flex justify-between items-start mb-8">
                                <div>
                                    <h2 className="text-xl font-bold text-[var(--color-ink)]">Ajustes de Valoración</h2>
                                    <p className="text-sm text-[var(--color-muted)] mt-1">Configure porcentajes de ajuste manual.</p>
                                </div>
                                <div className="flex items-center gap-3">
                                    <button
                                        onClick={handleReset}
                                        className="p-2 text-[var(--color-neutral)] hover:text-[var(--color-ink-2)] hover:bg-[var(--color-paper-3)] rounded-lg transition-colors"
                                        title="Resetear valores"
                                    >
                                        <RotateCcw strokeWidth={1.5} className="w-5 h-5" />
                                    </button>
                                    <button
                                        onClick={handleSave}
                                        className={`px-6 py-2 bg-[var(--color-ink)] text-[var(--color-accent-ink)] text-sm font-medium rounded-lg hover:bg-[var(--color-ink-2)] transition-all flex items-center gap-2 ${saved ? 'bg-[var(--color-positive)] hover:bg-[var(--color-positive)]' : ''}`}
                                    >
                                        {saved ? <Check strokeWidth={1.5} className="w-4 h-4" /> : <Save strokeWidth={1.5} className="w-4 h-4" />}
                                        {saved ? 'Guardado' : 'Guardar'}
                                    </button>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                                {/* Variables Principales */}
                                <div>
                                    <h3 className="text-sm font-semibold text-[var(--color-ink)] border-b border-[var(--color-rule)] pb-2 mb-6">Variables Principales</h3>
                                    <div className="space-y-4">
                                        {["area_total", "area_covered", "rooms", "bedrooms", "bathrooms", "floor", "construction_year", "expenses"].map((field) => (
                                            <div key={field} className="flex items-center justify-between group">
                                                <label className="text-sm text-[var(--color-ink-2)] font-medium group-hover:text-[var(--color-ink)] transition-colors">
                                                    {fieldLabels[field]}
                                                </label>
                                                <div className="relative w-24">
                                                    <input
                                                        type="number"
                                                        name={field}
                                                        value={config[field as keyof AdjustmentConfig]}
                                                        onChange={handleChange}
                                                        className="w-full text-right pr-6 py-1.5 border border-[var(--color-rule)] rounded-md focus:ring-1 focus:ring-[var(--color-rule)] focus:border-[var(--color-rule)] outline-none text-sm transition-all"
                                                        placeholder="0"
                                                    />
                                                    <span className="absolute right-2 top-1.5 text-[var(--color-neutral)] text-sm pointer-events-none">%</span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* Características Adicionales */}
                                <div>
                                    <h3 className="text-sm font-semibold text-[var(--color-ink)] border-b border-[var(--color-rule)] pb-2 mb-6">Características Adicionales</h3>
                                    <div className="space-y-4">
                                        {["pileta", "sum", "seguridad", "cochera", "balcon", "terraza", "jardin", "gimnasio", "laundry", "calefaccion"].map((field) => {
                                            const isActive = exampleProperty.all_features.toLowerCase().includes(field);
                                            return (
                                                <div key={field} className={`flex items-center justify-between group ${!isActive ? 'opacity-50' : ''}`}>
                                                    <div className="flex items-center gap-2">
                                                        <label className={`text-sm font-medium transition-colors ${isActive ? 'text-[var(--color-ink)]' : 'text-[var(--color-muted)]'}`}>
                                                            {fieldLabels[field]}
                                                        </label>
                                                        {isActive && <div className="w-1.5 h-1.5 rounded-full bg-[var(--color-positive)]"></div>}
                                                    </div>
                                                    <div className="relative w-24">
                                                        <input
                                                            type="number"
                                                            name={field}
                                                            value={config[field as keyof AdjustmentConfig]}
                                                            onChange={handleChange}
                                                            className={`w-full text-right pr-6 py-1.5 border border-[var(--color-rule)] rounded-md focus:ring-1 focus:ring-[var(--color-rule)] focus:border-[var(--color-rule)] outline-none text-sm transition-all ${!isActive ? 'bg-[var(--color-paper)]' : ''}`}
                                                            placeholder="0"
                                                        />
                                                        <span className="absolute right-2 top-1.5 text-[var(--color-neutral)] text-sm pointer-events-none">%</span>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            </div>

                            <p className="mt-8 text-xs text-[var(--color-neutral)] italic border-t pt-4">
                                * Los porcentajes atenuados no afectan el precio porque la propiedad de ejemplo no tiene esas características.
                            </p>
                        </div>
                    </div>

                    {/* Right Column: Preview */}
                    <div className="lg:col-span-1">
                        <div className="bg-[var(--color-paper-2)] rounded-xl shadow-sm border border-[var(--color-rule)] p-6 sticky top-6">
                            <h2 className="text-base font-semibold text-[var(--color-ink)] mb-6 flex items-center gap-2">
                                <Home strokeWidth={1.5} className="w-4 h-4 text-[var(--color-muted)]" /> Vista Previa
                            </h2>

                            {/* Property Card */}
                            <div
                                onClick={openEditModal}
                                className="bg-[var(--color-paper-2)] border border-[var(--color-rule)] rounded-lg p-4 mb-6 cursor-pointer hover:border-[var(--color-neutral)] transition-all group relative"
                            >
                                <Edit2 strokeWidth={1.5} className="w-4 h-4 text-[var(--color-neutral)] absolute top-3 right-3 group-hover:text-[var(--color-muted)]" />
                                <div className="text-xs text-[var(--color-muted)] mb-1">Propiedad Ejemplo (Click para editar)</div>
                                <div className="font-semibold text-[var(--color-ink)] text-sm mb-1">
                                    {exampleProperty.property_type} en {exampleProperty.barrio}
                                </div>
                                <div className="text-xs text-[var(--color-muted)] mb-2">
                                    {exampleProperty.area_total}m² • {exampleProperty.rooms} Amb • {exampleProperty.bedrooms} Dorm
                                </div>
                                <div className="text-xs text-[var(--color-neutral)] truncate">
                                    {exampleProperty.all_features}
                                </div>
                            </div>

                            {/* Breakdown */}
                            <div className="mb-6">
                                <h3 className="text-xs font-bold text-[var(--color-neutral)] uppercase tracking-wider mb-3">Desglose de Ajustes</h3>
                                <div className="space-y-2">
                                    {impacts.length > 0 ? (
                                        impacts.map((item, idx) => (
                                            <div key={idx} className="flex justify-between text-sm">
                                                <span className="text-[var(--color-ink-2)]">{item.label} <span className={`text-xs ${item.percent > 0 ? 'text-[var(--color-positive)]' : 'text-[var(--color-danger)]'}`}>({item.percent > 0 ? '+' : ''}{item.percent}%)</span></span>
                                                <span className={`font-medium ${item.impact > 0 ? 'text-[var(--color-positive)]' : 'text-[var(--color-danger)]'}`}>
                                                    {item.impact > 0 ? '+' : ''}{item.impact.toLocaleString('es-AR', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 })}
                                                </span>
                                            </div>
                                        ))
                                    ) : (
                                        <p className="text-sm text-[var(--color-neutral)] italic">Sin ajustes configurados</p>
                                    )}
                                </div>
                            </div>

                            <div className="border-t border-[var(--color-rule)] pt-4 space-y-2">
                                <div className="flex justify-between text-sm text-[var(--color-muted)]">
                                    <span>Precio Base (IA):</span>
                                    <span>{basePrice ? basePrice.toLocaleString('es-AR', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }) : '...'}</span>
                                </div>
                                <div className="flex justify-between text-sm text-[var(--color-positive)] font-medium">
                                    <span>Total Ajustes:</span>
                                    <span>{totalImpact > 0 ? '+' : ''}{totalImpact.toLocaleString('es-AR', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 })}</span>
                                </div>
                            </div>

                            <div className="border-t border-[var(--color-rule)] mt-4 pt-4 flex justify-between items-end">
                                <span className="text-base font-bold text-[var(--color-ink)]">Precio Final:</span>
                                <span className="text-xl font-bold text-[var(--color-ink)]">
                                    {finalPrice ? finalPrice.toLocaleString('es-AR', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }) : '-'}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {activeTab === "indices" && (
                <div className="bg-[var(--color-paper-2)] p-8 rounded-xl shadow-sm border border-[var(--color-rule)]">
                    <div className="flex justify-between items-start mb-8">
                        <div>
                            <h2 className="text-xl font-bold text-[var(--color-ink)]">Índices de Ajuste (IPC e ICL)</h2>
                            <p className="text-sm text-[var(--color-muted)] mt-1">
                                Se actualizan solos desde las fuentes oficiales: el IPC desde el INDEC y el ICL desde el BCRA.
                                Los usamos para calcular los ajustes de los contratos.
                            </p>
                            <p className="text-xs text-[var(--color-neutral)] mt-2">
                                {indices.syncedAt
                                    ? `Última actualización: ${new Date(indices.syncedAt).toLocaleString('es-AR')}`
                                    : 'Todavía no se actualizó.'}
                            </p>
                        </div>
                        <button
                            onClick={refreshIndices}
                            disabled={indicesRefreshing}
                            className="px-6 py-2 bg-[var(--color-ink)] text-[var(--color-paper)] text-sm font-medium rounded-lg hover:bg-[var(--color-ink-2)] transition-all flex items-center gap-2 disabled:opacity-60"
                        >
                            <RotateCcw strokeWidth={1.5} className={`w-4 h-4 ${indicesRefreshing ? 'animate-spin' : ''}`} />
                            {indicesRefreshing ? 'Actualizando...' : 'Actualizar ahora'}
                        </button>
                    </div>

                    {indicesError && (
                        <p className="mb-6 text-sm text-[var(--color-danger)] bg-[var(--color-danger-soft)] border border-[var(--color-danger)]/30 rounded-lg px-4 py-3">{indicesError}</p>
                    )}

                    {latestIcl !== null && (
                        <div className="mb-8 border rounded-xl px-6 py-4 bg-[var(--color-paper)] flex flex-wrap items-baseline gap-x-3">
                            <span className="text-xs text-[var(--color-muted)] uppercase tracking-wider">ICL al {latestIclDate.split('-').reverse().join('/')}</span>
                            <span className="text-2xl font-bold text-[var(--color-ink)]">{latestIcl.toLocaleString('es-AR', { minimumFractionDigits: 2 })}</span>
                            <span className="text-xs text-[var(--color-neutral)]">base 30/6/2020 = 1</span>
                        </div>
                    )}

                    <div className="space-y-8">
                        {INDEX_YEARS.map(year => (
                            <div key={year} className="border rounded-xl overflow-hidden">
                                <div className="bg-[var(--color-paper)] px-6 py-3 border-b flex items-center gap-2">
                                    <span className="font-bold text-[var(--color-ink)]">{year}</span>
                                    <span className="text-xs text-[var(--color-muted)] uppercase tracking-wider">IPC mensual INDEC (%)</span>
                                </div>
                                <div className="p-6 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                                    {MONTHS.map((monthName, idx) => {
                                        const value = indices.years[year]?.[idx + 1];
                                        return (
                                            <div key={idx}>
                                                <span className="block text-xs font-medium text-[var(--color-ink-2)] mb-1">{monthName}</span>
                                                <span className={`block px-3 py-2 border rounded-lg text-sm ${value === undefined ? 'text-[var(--color-neutral)] bg-[var(--color-paper)]' : 'text-[var(--color-ink)]'}`}>
                                                    {value === undefined ? 'Sin publicar' : `${value.toLocaleString('es-AR', { minimumFractionDigits: 1 })} %`}
                                                </span>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {activeTab === "inmobiliaria" && (
                <InmobiliariaTab />
            )}

            {activeTab === "mercadopago" && (
                <MercadoPagoTab />
            )}

            {activeTab === "notificaciones" && (
                <NotificationsTab />
            )}

            {/* Edit Modal */}
            {isEditingExample && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-[var(--color-paper-2)] rounded-xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
                        <div className="flex justify-between items-center p-6 border-b">
                            <h3 className="text-lg font-semibold">Editar Propiedad Ejemplo</h3>
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={loadExampleData}
                                    className="px-3 py-1.5 text-xs font-medium bg-[var(--color-paper-3)] hover:bg-[var(--color-paper-4)] text-[var(--color-ink-2)] rounded-md transition-colors"
                                >
                                    Usar Ejemplo
                                </button>
                                <button onClick={closeEditModal} className="text-[var(--color-neutral)] hover:text-[var(--color-ink)]">
                                    <X strokeWidth={1.5} className="w-5 h-5" />
                                </button>
                            </div>
                        </div>

                        <div className="p-6 space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-[var(--color-ink-2)] mb-1">Área Total (m²)</label>
                                    <input type="number" name="area_total" value={tempExample.area_total} onChange={handleExampleChange} className="w-full p-2 border rounded-lg" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-[var(--color-ink-2)] mb-1">Área Cubierta (m²)</label>
                                    <input type="number" name="area_covered" value={tempExample.area_covered} onChange={handleExampleChange} className="w-full p-2 border rounded-lg" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-[var(--color-ink-2)] mb-1">Ambientes</label>
                                    <input type="number" name="rooms" value={tempExample.rooms} onChange={handleExampleChange} className="w-full p-2 border rounded-lg" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-[var(--color-ink-2)] mb-1">Dormitorios</label>
                                    <input type="number" name="bedrooms" value={tempExample.bedrooms} onChange={handleExampleChange} className="w-full p-2 border rounded-lg" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-[var(--color-ink-2)] mb-1">Baños</label>
                                    <input type="number" name="bathrooms" value={tempExample.bathrooms} onChange={handleExampleChange} className="w-full p-2 border rounded-lg" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-[var(--color-ink-2)] mb-1">Expensas</label>
                                    <input type="number" name="expenses" value={tempExample.expenses} onChange={handleExampleChange} className="w-full p-2 border rounded-lg" />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-[var(--color-ink-2)] mb-2">Características</label>
                                <div className="grid grid-cols-2 gap-2">
                                    {["pileta", "sum", "seguridad", "cochera", "balcon", "terraza", "jardin", "gimnasio", "laundry", "calefaccion"].map(feature => (
                                        <label key={feature} className="flex items-center gap-2 p-2 border rounded-lg cursor-pointer hover:bg-[var(--color-paper-3)]">
                                            <input
                                                type="checkbox"
                                                checked={tempExample.all_features.toLowerCase().includes(feature)}
                                                onChange={() => toggleFeature(feature)}
                                                className="rounded border-[var(--color-rule)] text-[var(--color-ink)] focus:ring-[var(--color-rule)]"
                                            />
                                            <span className="text-sm capitalize">{feature}</span>
                                        </label>
                                    ))}
                                </div>
                            </div>
                        </div>

                        <div className="p-6 border-t bg-[var(--color-paper)] flex justify-end gap-2 rounded-b-xl">
                            <button onClick={closeEditModal} className="px-4 py-2 text-sm text-[var(--color-ink-2)] hover:bg-[var(--color-paper-3)] rounded-lg">Cancelar</button>
                            <button onClick={saveExampleChanges} className="px-4 py-2 text-sm bg-[var(--color-ink)] text-[var(--color-paper)] rounded-lg hover:bg-[var(--color-ink-2)] flex items-center gap-2">
                                <Check strokeWidth={1.5} className="w-4 h-4" /> Aplicar Cambios
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
