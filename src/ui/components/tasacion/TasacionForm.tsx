"use client";

import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import Link from "next/link";
import { PropertyData } from "@/lib/prediction/preprocessor";
import { 
    Home, Ruler, Building2, Clock, Bath, BedDouble, Landmark, 
    MapPin, Hash, CircleDollarSign, CheckCircle
} from "lucide-react";
import { auth } from "@/infrastructure/firebase/client";
import { auditLogService } from "@/infrastructure/services/auditLogService";

// UI Components
import { InputField } from "./components/InputField";
import { SelectField } from "./components/SelectField";
import { FeatureCheckbox } from "./components/FeatureCheckbox";
import { ResultPanel } from "./components/ResultPanel";

// Constants & Data
import { SIMULATED_STEPS, COMMON_FEATURES, PROPERTY_TYPE_OPTIONS } from "./constants";
import { LOCATION_DATA, PROVINCIA_OPTIONS } from "./data/locations";

const initialFormState: PropertyData = {
    bedrooms: null,
    bathrooms: null,
    area_total: null,
    area_covered: null,
    floor: null,
    construction_year: null,
    rooms: null,
    expenses: null,
    property_type: '',
    barrio: '',
    ciudad: '',
    provincia: '',
    all_features: '',
};

const exampleProperty: PropertyData = {
    bedrooms: 3,
    bathrooms: 2,
    area_total: 150,
    area_covered: 120,
    floor: 5,
    construction_year: 2010,
    rooms: 4,
    expenses: 5000,
    property_type: 'Departamento',
    barrio: 'Palermo',
    ciudad: 'Capital Federal',
    provincia: 'Capital Federal',
    all_features: 'pileta, sum, seguridad, cochera, balcon',
};

export default function TasacionForm() {
    const [form, setForm] = useState<PropertyData>(initialFormState);
    const [selectedFeatures, setSelectedFeatures] = useState<string[]>([]);
    const [result, setResult] = useState<number | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [loadingMessage, setLoadingMessage] = useState<string>("");
    const [progress, setProgress] = useState<number>(0);
    const [comparisons, setComparisons] = useState<number>(0);
    const abortControllerRef = useRef<AbortController | null>(null);

    // Dynamic Select Options
    const currentProvinciaData = useMemo(() => {
        return form.provincia ? LOCATION_DATA[form.provincia] : null;
    }, [form.provincia]);

    const ciudadOptions = useMemo(() => {
        return currentProvinciaData?.ciudades || [];
    }, [currentProvinciaData]);

    const barrioOptions = useMemo(() => {
        return currentProvinciaData?.barrios || [];
    }, [currentProvinciaData]);

    // Handlers
    const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        if (e.target.type === 'number' && value !== '' && Number(value) < 0) return;
        setForm(prev => ({ ...prev, [name]: value }));
    }, []);

    const handleFeatureChange = useCallback((feature: string, checked: boolean) => {
        setSelectedFeatures(prev => checked ? [...prev, feature] : prev.filter(f => f !== feature));
    }, []);

    const handleProvinciaChange = useCallback((value: string) => {
        setForm(prev => ({ ...prev, provincia: value, ciudad: '', barrio: '' }));
        setResult(null);
    }, []);

    const handleCiudadChange = useCallback((value: string) => {
        setForm(prev => ({ ...prev, ciudad: value, barrio: '' }));
        setResult(null);
    }, []);

    const isFormValid = useCallback(() => {
        return !!(
            form.property_type &&
            form.provincia &&
            form.ciudad &&
            form.barrio &&
            form.area_total &&
            form.area_covered &&
            form.rooms &&
            form.bathrooms
        );
    }, [form]);

    const handleFillExample = useCallback(() => {
        setForm(exampleProperty);
        setSelectedFeatures(['pileta', 'sum', 'seguridad', 'cochera', 'balcon']);
        setResult(null);
    }, []);

    const handleCancel = useCallback(() => {
        if (abortControllerRef.current) {
            abortControllerRef.current.abort();
            setLoading(false);
            setLoadingMessage("Cálculo cancelado");
            setProgress(0);
        }
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        setResult(null);
        setProgress(0);
        setComparisons(0);
        
        abortControllerRef.current = new AbortController();
        const signal = abortControllerRef.current.signal;

        try {
            const totalComparisons = Math.floor(Math.random() * (420000 - 120000 + 1)) + 120000;
            const stepDuration = 600;

            for (let i = 0; i < SIMULATED_STEPS.length; i++) {
                if (signal.aborted) throw new Error("AbortError");
                
                setLoadingMessage(SIMULATED_STEPS[i].msg);
                setProgress(SIMULATED_STEPS[i].progress);

                if (i === 2) { // Comparison simulation
                    const start = 0;
                    const end = totalComparisons;
                    const duration = stepDuration * 2;
                    const startTime = Date.now();

                    while (Date.now() - startTime < duration) {
                        if (signal.aborted) throw new Error("AbortError");
                        const elapsed = Date.now() - startTime;
                        const progress = Math.min(elapsed / duration, 1);
                        const ease = 1 - Math.pow(1 - progress, 4);
                        setComparisons(Math.floor(start + (end - start) * ease));
                        await new Promise(r => setTimeout(r, 16));
                    }
                    setComparisons(totalComparisons);
                } else {
                    await new Promise(resolve => setTimeout(resolve, stepDuration));
                }
            }

            if (signal.aborted) throw new Error("AbortError");
            setProgress(100);

            const { predictionService } = await import('@/lib/prediction/predictionService');
            const predictionData = { ...form, all_features: selectedFeatures.join(', ') };
            const price = await predictionService.predict(predictionData);
            
            setResult(price);

            if (auth?.currentUser) {
                await auditLogService.logValuation(
                    auth.currentUser.uid, auth.currentUser.email || '', auth.currentUser.displayName || 'Usuario',
                    form.property_type, `${form.ciudad}, ${form.provincia}`, price, "default-org-id"
                );
            }

        } catch (err: any) {
            if (err.name === "AbortError" || err.message === "AbortError") {
                setError("La operación fue cancelada.");
            } else {
                setError(`Error en la predicción: ${err.message}`);
            }
            console.error(err);
        } finally {
            setLoading(false);
            abortControllerRef.current = null;
        }
    };

    return (
        <div className="w-full grid grid-cols-1 lg:grid-cols-3 gap-8 items-start animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* COLUMN 1: Location Info */}
            <div className="bg-white p-6 md:p-8 rounded-3xl shadow-xl border border-gray-100 ring-1 ring-gray-900/5 transition-all hover:shadow-2xl">
                <div className="flex justify-between items-center mb-8">
                    <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
                        <div className="p-2 bg-indigo-50 rounded-lg">
                            <MapPin className="w-6 h-6 text-indigo-600" />
                        </div>
                        Ubicación
                    </h2>
                    <Link href="/modelo" className="text-sm font-semibold text-indigo-600 hover:text-indigo-800 transition-colors px-3 py-1 bg-indigo-50 rounded-full">
                        Algoritmo IA
                    </Link>
                </div>

                <div className="space-y-6">
                    <SelectField name="property_type" label="Tipo de Propiedad" icon={<Landmark />} options={PROPERTY_TYPE_OPTIONS} value={form.property_type || ''} onChange={(v) => setForm(p => ({ ...p, property_type: v }))} />
                    <SelectField name="provincia" label="Provincia" icon={<MapPin />} options={PROVINCIA_OPTIONS} value={form.provincia || ''} onChange={handleProvinciaChange} />
                    <SelectField name="ciudad" label="Ciudad" icon={<MapPin />} options={ciudadOptions} value={form.ciudad || ''} disabled={!form.provincia} onChange={handleCiudadChange} />
                    <SelectField name="barrio" label="Barrio" icon={<MapPin />} options={barrioOptions} value={form.barrio || ''} disabled={!form.ciudad} onChange={(v) => setForm(p => ({ ...p, barrio: v }))} />
                </div>
            </div>

            {/* COLUMN 2: Property Details */}
            <div className="bg-white p-6 md:p-8 rounded-3xl shadow-xl border border-gray-100 ring-1 ring-gray-900/5 transition-all hover:shadow-2xl">
                <div className="flex justify-between items-center mb-8">
                    <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
                        <div className="p-2 bg-emerald-50 rounded-lg">
                            <Ruler className="w-6 h-6 text-emerald-600" />
                        </div>
                        Detalles
                    </h2>
                    <button type="button" onClick={handleFillExample} className="text-xs font-bold uppercase tracking-wider bg-gray-900 text-white px-4 py-2 rounded-xl hover:bg-gray-800 transition-all shadow-md active:scale-95">
                        Ejemplo
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-8">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                        <InputField name="area_total" label="Área Total (m²)" icon={<Ruler className="w-4 h-4" />} type="number" value={form.area_total || ''} onChange={handleChange} />
                        <InputField name="area_covered" label="Área Cubierta" icon={<Ruler className="w-4 h-4" />} type="number" value={form.area_covered || ''} onChange={handleChange} />
                        <InputField name="rooms" label="Ambientes" icon={<Building2 className="w-4 h-4" />} type="number" value={form.rooms || ''} onChange={handleChange} />
                        <InputField name="bedrooms" label="Dormitorios" icon={<BedDouble className="w-4 h-4" />} type="number" value={form.bedrooms || ''} onChange={handleChange} />
                        <InputField name="bathrooms" label="Baños" icon={<Bath className="w-4 h-4" />} type="number" value={form.bathrooms || ''} onChange={handleChange} />
                        <InputField name="floor" label="Piso" icon={<Hash className="w-4 h-4" />} type="number" value={form.floor || ''} onChange={handleChange} />
                        <InputField name="construction_year" label="Año Const." icon={<Clock className="w-4 h-4" />} type="number" value={form.construction_year || ''} onChange={handleChange} />
                        <InputField name="expenses" label="Expensas ($)" icon={<CircleDollarSign className="w-4 h-4" />} type="number" value={form.expenses || ''} onChange={handleChange} />
                    </div>

                    <div>
                        <h3 className="text-sm font-bold text-gray-700 mb-4 flex items-center gap-2">
                             <CheckCircle className="w-4 h-4 text-gray-400" />
                             Características Adicionales
                        </h3>
                        <div className="grid grid-cols-2 gap-3">
                            {COMMON_FEATURES.map(feature => (
                                <FeatureCheckbox key={feature} feature={feature} checked={selectedFeatures.includes(feature)} onChange={handleFeatureChange} />
                            ))}
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={loading || !isFormValid()}
                        className="group relative w-full bg-indigo-600 text-white py-4 rounded-2xl hover:bg-indigo-700 transition-all font-bold shadow-lg shadow-indigo-200 disabled:bg-gray-200 disabled:text-gray-400 disabled:shadow-none overflow-hidden"
                    >
                        <div className="relative z-10 flex items-center justify-center gap-2">
                            {loading ? 'Calculando Valoración...' : !isFormValid() ? 'Complete el Formulario' : 'Iniciar Tasación IA'}
                        </div>
                        {!loading && isFormValid() && (
                            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:animate-shimmer" />
                        )}
                    </button>
                </form>
            </div>

            {/* COLUMN 3: Results Panel */}
            <div className="lg:sticky lg:top-24 mt-4 lg:mt-0 pb-8">
                <ResultPanel 
                    result={result}
                    loading={loading}
                    error={error}
                    loadingMessage={loadingMessage}
                    progress={progress}
                    comparisons={comparisons}
                    propertyType={form.property_type || ''}
                    location={`${form.ciudad ? form.ciudad + ', ' : ''}${form.provincia || ''}`}
                    onCancel={handleCancel}
                />
            </div>
        </div>
    );
}