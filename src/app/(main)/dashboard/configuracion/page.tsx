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

export default function ConfiguracionPage() {
    const [activeTab, setActiveTab] = useState("tasaciones");
    const [config, setConfig] = useState<AdjustmentConfig>(initialConfig);
    const [saved, setSaved] = useState(false);
    const [basePrice, setBasePrice] = useState<number | null>(null);

    // Example Property State
    const [exampleProperty, setExampleProperty] = useState<ExampleProperty>(initialExampleProperty);
    const [isEditingExample, setIsEditingExample] = useState(false);
    const [tempExample, setTempExample] = useState<ExampleProperty>(initialExampleProperty);

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
            <h1 className="text-2xl font-bold mb-6 text-gray-900">Configuración</h1>

            <div className="flex border-b mb-6">
                <button
                    className={`px-4 py-2 font-medium ${activeTab === "tasaciones" ? "border-b-2 border-black text-black" : "text-gray-500"}`}
                    onClick={() => setActiveTab("tasaciones")}
                >
                    Tasaciones Inteligentes
                </button>
                <button
                    className={`px-4 py-2 font-medium ${activeTab === "mercadopago" ? "border-b-2 border-black text-black" : "text-gray-500"}`}
                    onClick={() => setActiveTab("mercadopago")}
                >
                    Medios de Pago
                </button>
            </div>

            {activeTab === "tasaciones" && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Left Column: Config Form */}
                    <div className="lg:col-span-2">
                        <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-200">
                            {/* Header & Actions */}
                            <div className="flex justify-between items-start mb-8">
                                <div>
                                    <h2 className="text-xl font-bold text-gray-900">Ajustes de Valoración</h2>
                                    <p className="text-sm text-gray-500 mt-1">Configure porcentajes de ajuste manual.</p>
                                </div>
                                <div className="flex items-center gap-3">
                                    <button
                                        onClick={handleReset}
                                        className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                                        title="Resetear valores"
                                    >
                                        <RotateCcw className="w-5 h-5" />
                                    </button>
                                    <button
                                        onClick={handleSave}
                                        className={`px-6 py-2 bg-black text-white text-sm font-medium rounded-lg hover:bg-gray-800 transition-all flex items-center gap-2 ${saved ? 'bg-green-600 hover:bg-green-700' : ''}`}
                                    >
                                        {saved ? <Check className="w-4 h-4" /> : <Save className="w-4 h-4" />}
                                        {saved ? 'Guardado' : 'Guardar'}
                                    </button>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                                {/* Variables Principales */}
                                <div>
                                    <h3 className="text-sm font-semibold text-gray-900 border-b border-gray-200 pb-2 mb-6">Variables Principales</h3>
                                    <div className="space-y-4">
                                        {["area_total", "area_covered", "rooms", "bedrooms", "bathrooms", "floor", "construction_year", "expenses"].map((field) => (
                                            <div key={field} className="flex items-center justify-between group">
                                                <label className="text-sm text-gray-600 font-medium group-hover:text-gray-900 transition-colors">
                                                    {fieldLabels[field]}
                                                </label>
                                                <div className="relative w-24">
                                                    <input
                                                        type="number"
                                                        name={field}
                                                        value={config[field as keyof AdjustmentConfig]}
                                                        onChange={handleChange}
                                                        className="w-full text-right pr-6 py-1.5 border border-gray-300 rounded-md focus:ring-1 focus:ring-black focus:border-black outline-none text-sm transition-all"
                                                        placeholder="0"
                                                    />
                                                    <span className="absolute right-2 top-1.5 text-gray-400 text-sm pointer-events-none">%</span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* Características Adicionales */}
                                <div>
                                    <h3 className="text-sm font-semibold text-gray-900 border-b border-gray-200 pb-2 mb-6">Características Adicionales</h3>
                                    <div className="space-y-4">
                                        {["pileta", "sum", "seguridad", "cochera", "balcon", "terraza", "jardin", "gimnasio", "laundry", "calefaccion"].map((field) => {
                                            const isActive = exampleProperty.all_features.toLowerCase().includes(field);
                                            return (
                                                <div key={field} className={`flex items-center justify-between group ${!isActive ? 'opacity-50' : ''}`}>
                                                    <div className="flex items-center gap-2">
                                                        <label className={`text-sm font-medium transition-colors ${isActive ? 'text-gray-900' : 'text-gray-500'}`}>
                                                            {fieldLabels[field]}
                                                        </label>
                                                        {isActive && <div className="w-1.5 h-1.5 rounded-full bg-green-500"></div>}
                                                    </div>
                                                    <div className="relative w-24">
                                                        <input
                                                            type="number"
                                                            name={field}
                                                            value={config[field as keyof AdjustmentConfig]}
                                                            onChange={handleChange}
                                                            className={`w-full text-right pr-6 py-1.5 border border-gray-300 rounded-md focus:ring-1 focus:ring-black focus:border-black outline-none text-sm transition-all ${!isActive ? 'bg-gray-50' : ''}`}
                                                            placeholder="0"
                                                        />
                                                        <span className="absolute right-2 top-1.5 text-gray-400 text-sm pointer-events-none">%</span>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            </div>

                            <p className="mt-8 text-xs text-gray-400 italic border-t pt-4">
                                * Los porcentajes atenuados no afectan el precio porque la propiedad de ejemplo no tiene esas características.
                            </p>
                        </div>
                    </div>

                    {/* Right Column: Preview */}
                    <div className="lg:col-span-1">
                        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 sticky top-6">
                            <h2 className="text-base font-semibold text-gray-900 mb-6 flex items-center gap-2">
                                <Home className="w-4 h-4 text-gray-500" /> Vista Previa
                            </h2>

                            {/* Property Card */}
                            <div
                                onClick={openEditModal}
                                className="bg-white border border-gray-300 rounded-lg p-4 mb-6 cursor-pointer hover:border-gray-400 transition-all group relative"
                            >
                                <Edit2 className="w-4 h-4 text-gray-300 absolute top-3 right-3 group-hover:text-gray-500" />
                                <div className="text-xs text-gray-500 mb-1">Propiedad Ejemplo (Click para editar)</div>
                                <div className="font-semibold text-gray-900 text-sm mb-1">
                                    {exampleProperty.property_type} en {exampleProperty.barrio}
                                </div>
                                <div className="text-xs text-gray-500 mb-2">
                                    {exampleProperty.area_total}m² • {exampleProperty.rooms} Amb • {exampleProperty.bedrooms} Dorm
                                </div>
                                <div className="text-xs text-gray-400 truncate">
                                    {exampleProperty.all_features}
                                </div>
                            </div>

                            {/* Breakdown */}
                            <div className="mb-6">
                                <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Desglose de Ajustes</h3>
                                <div className="space-y-2">
                                    {impacts.length > 0 ? (
                                        impacts.map((item, idx) => (
                                            <div key={idx} className="flex justify-between text-sm">
                                                <span className="text-gray-600">{item.label} <span className={`text-xs ${item.percent > 0 ? 'text-green-600' : 'text-red-500'}`}>({item.percent > 0 ? '+' : ''}{item.percent}%)</span></span>
                                                <span className={`font-medium ${item.impact > 0 ? 'text-green-600' : 'text-red-600'}`}>
                                                    {item.impact > 0 ? '+' : ''}{item.impact.toLocaleString('es-AR', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 })}
                                                </span>
                                            </div>
                                        ))
                                    ) : (
                                        <p className="text-sm text-gray-400 italic">Sin ajustes configurados</p>
                                    )}
                                </div>
                            </div>

                            <div className="border-t border-gray-200 pt-4 space-y-2">
                                <div className="flex justify-between text-sm text-gray-500">
                                    <span>Precio Base (IA):</span>
                                    <span>{basePrice ? basePrice.toLocaleString('es-AR', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }) : '...'}</span>
                                </div>
                                <div className="flex justify-between text-sm text-green-600 font-medium">
                                    <span>Total Ajustes:</span>
                                    <span>{totalImpact > 0 ? '+' : ''}{totalImpact.toLocaleString('es-AR', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 })}</span>
                                </div>
                            </div>

                            <div className="border-t border-gray-200 mt-4 pt-4 flex justify-between items-end">
                                <span className="text-base font-bold text-gray-900">Precio Final:</span>
                                <span className="text-xl font-bold text-gray-900">
                                    {finalPrice ? finalPrice.toLocaleString('es-AR', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }) : '-'}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {activeTab === "mercadopago" && (
                <MercadoPagoTab />
            )}

            {/* Edit Modal */}
            {isEditingExample && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
                        <div className="flex justify-between items-center p-6 border-b">
                            <h3 className="text-lg font-semibold">Editar Propiedad Ejemplo</h3>
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={loadExampleData}
                                    className="px-3 py-1.5 text-xs font-medium bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-md transition-colors"
                                >
                                    Usar Ejemplo
                                </button>
                                <button onClick={closeEditModal} className="text-gray-400 hover:text-black">
                                    <X className="w-5 h-5" />
                                </button>
                            </div>
                        </div>

                        <div className="p-6 space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Área Total (m²)</label>
                                    <input type="number" name="area_total" value={tempExample.area_total} onChange={handleExampleChange} className="w-full p-2 border rounded-lg" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Área Cubierta (m²)</label>
                                    <input type="number" name="area_covered" value={tempExample.area_covered} onChange={handleExampleChange} className="w-full p-2 border rounded-lg" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Ambientes</label>
                                    <input type="number" name="rooms" value={tempExample.rooms} onChange={handleExampleChange} className="w-full p-2 border rounded-lg" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Dormitorios</label>
                                    <input type="number" name="bedrooms" value={tempExample.bedrooms} onChange={handleExampleChange} className="w-full p-2 border rounded-lg" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Baños</label>
                                    <input type="number" name="bathrooms" value={tempExample.bathrooms} onChange={handleExampleChange} className="w-full p-2 border rounded-lg" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Expensas</label>
                                    <input type="number" name="expenses" value={tempExample.expenses} onChange={handleExampleChange} className="w-full p-2 border rounded-lg" />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Características</label>
                                <div className="grid grid-cols-2 gap-2">
                                    {["pileta", "sum", "seguridad", "cochera", "balcon", "terraza", "jardin", "gimnasio", "laundry", "calefaccion"].map(feature => (
                                        <label key={feature} className="flex items-center gap-2 p-2 border rounded-lg cursor-pointer hover:bg-gray-50">
                                            <input
                                                type="checkbox"
                                                checked={tempExample.all_features.toLowerCase().includes(feature)}
                                                onChange={() => toggleFeature(feature)}
                                                className="rounded border-gray-300 text-black focus:ring-black"
                                            />
                                            <span className="text-sm capitalize">{feature}</span>
                                        </label>
                                    ))}
                                </div>
                            </div>
                        </div>

                        <div className="p-6 border-t bg-gray-50 flex justify-end gap-2 rounded-b-xl">
                            <button onClick={closeEditModal} className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg">Cancelar</button>
                            <button onClick={saveExampleChanges} className="px-4 py-2 text-sm bg-black text-white rounded-lg hover:bg-gray-800 flex items-center gap-2">
                                <Check className="w-4 h-4" /> Aplicar Cambios
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
