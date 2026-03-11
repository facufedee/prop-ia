"use client";

import { useState } from "react";
import { useForm, useController, Control } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, Check, Shield, Star, DollarSign, Activity, X } from "lucide-react";
import { Plan } from "@/domain/models/Subscription";
import { planSchema, PlanFormData, defaultPlan } from "../schema";
import { toast } from "sonner";
import { doc, collection, addDoc, setDoc } from "firebase/firestore";
import { db } from "@/infrastructure/firebase/client";

import {
    Home as HomeIcon,
    Users as UsersIcon,
    Briefcase as BriefcaseIcon,
    Calculator as CalculatorIcon,
    Bot as BotIcon,
    Database as DatabaseIcon
} from "lucide-react";

interface PlanFormProps {
    initialData?: Plan;
    onSave: () => void;
    onCancel: () => void;
}

export default function PlanForm({ initialData, onSave, onCancel }: PlanFormProps) {
    const [saving, setSaving] = useState(false);

    const getFeatures = (initialFeatures: any) => {
        const defaults = { ...defaultPlan.features };
        if (Array.isArray(initialFeatures)) return defaults;
        if (typeof initialFeatures === 'object' && initialFeatures !== null) {
            return { ...defaults, ...initialFeatures };
        }
        return defaults;
    };

    const defaultValues: PlanFormData = initialData ? {
        name: initialData.name,
        tier: (initialData.tier as "basic" | "professional" | "enterprise") || "basic",
        description: initialData.description,
        icon: initialData.icon || "Zap",
        popular: initialData.popular || false,
        price: initialData.price || { monthly: 0, yearly: 0 },
        features: getFeatures(initialData.features),
        limits: {
            properties: initialData.limits?.properties ?? 0,
            users: initialData.limits?.users ?? 0,
            clients: initialData.limits?.clients ?? 0,
            tasaciones: initialData.limits?.tasaciones ?? 0,
            aiCredits: initialData.limits?.aiCredits ?? 0,
            storage: initialData.limits?.storage ?? "1GB",
        }
    } : defaultPlan;

    const {
        register,
        control,
        handleSubmit,
        setValue,
        watch,
        formState: { errors }
    } = useForm<PlanFormData>({
        resolver: zodResolver(planSchema),
        defaultValues
    });

    const onSubmit = async (data: PlanFormData) => {
        setSaving(true);
        try {
            if (!db) throw new Error("Firestore no inicializado");

            if (initialData?.id) {
                const planRef = doc(db, "plans", initialData.id);
                await setDoc(planRef, {
                    ...data,
                    updatedAt: new Date()
                }, { merge: true });
                toast.success("Plan actualizado correctamente");
            } else {
                const plansRef = collection(db, "plans");
                await addDoc(plansRef, {
                    ...data,
                    createdAt: new Date(),
                    updatedAt: new Date()
                });
                toast.success("Plan creado correctamente");
            }
            onSave();
        } catch (error) {
            console.error("Error saving plan:", error);
            toast.error("Error al guardar el plan: " + (error as Error).message);
        } finally {
            setSaving(false);
        }
    };

    const onError = (formErrors: any) => {
        // Deep stringify to catch hidden Zod errors or Proxy objects
        const stringifiedErrors = JSON.stringify(formErrors, (key, value) => {
            if (value !== null && typeof value === 'object' && value.type) {
                return `${value.type} - ${value.message}`;
            }
            return value;
        }, 2);

        console.error("Validation Errors Details:", stringifiedErrors);
        toast.error("Hay errores de validación. Revisa los campos marcados en rojo.");
    };

    return (
        <form onSubmit={handleSubmit(onSubmit, onError)} className="bg-white rounded-2xl shadow-xl border border-gray-100 p-8 max-w-5xl mx-auto space-y-12">

            <div className="flex flex-wrap gap-4 items-center justify-between pb-6 border-b border-gray-100">
                <div>
                    <h2 className="text-2xl font-extrabold text-gray-900 tracking-tight">Configuración de Plan</h2>
                    <p className="text-sm text-gray-500 mt-1">Define las características, precios y límites de este plan de suscripción.</p>
                </div>
                {/* Popular Toggle */}
                <label className="flex items-center gap-3 cursor-pointer bg-amber-50 px-4 py-2 rounded-full border border-amber-200 hover:bg-amber-100 transition-colors">
                    <input type="checkbox" {...register("popular")} className="sr-only peer" />
                    <div className="w-10 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-amber-500 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-amber-500 relative"></div>
                    <span className="text-sm font-bold text-amber-900 flex items-center gap-1"><Star className="w-4 h-4 text-amber-500 fill-amber-500" /> Plan Popular</span>
                </label>
            </div>

            {/* BLOCK 1: General Info */}
            <section className="space-y-6">
                <div className="flex items-center gap-2 text-indigo-600 mb-2">
                    <Shield className="w-5 h-5" />
                    <h3 className="text-lg font-bold text-gray-900">1. Información General</h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    <div className="col-span-1 lg:col-span-2 relative">
                        <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Nombre del Plan</label>
                        <input
                            {...register("name")}
                            className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:bg-white outline-none transition-all text-gray-900 font-medium"
                            placeholder="Ej. Plan Profesional"
                        />
                        {errors.name && <p className="text-red-500 text-xs mt-1 absolute">{errors.name.message}</p>}
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Nivel (Tier)</label>
                        <select {...register("tier")} className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:bg-white outline-none transition-all text-gray-900 font-medium appearance-none">
                            <option value="basic">⭐ Básico</option>
                            <option value="professional">🌟 Profesional</option>
                            <option value="enterprise">🚀 Empresarial</option>
                        </select>
                    </div>
                    <div className="col-span-1 lg:col-span-3 relative">
                        <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Descripción (Marketing)</label>
                        <textarea
                            {...register("description")}
                            rows={2}
                            className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:bg-white outline-none transition-all resize-none text-gray-900 font-medium"
                            placeholder="Breve descripción que verán los usuarios..."
                        />
                        {errors.description && <p className="text-red-500 text-xs mt-1 absolute">{errors.description.message}</p>}
                    </div>
                </div>
            </section>

            {/* BLOCK 2: Pricing */}
            <section className="space-y-6">
                <div className="flex items-center gap-2 text-emerald-600 mb-2">
                    <DollarSign className="w-5 h-5" />
                    <h3 className="text-lg font-bold text-gray-900">2. Precios</h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-emerald-50/50 p-6 rounded-2xl border border-emerald-100">
                    <div>
                        <label className="block text-xs font-bold text-emerald-800 uppercase tracking-wider mb-2">Precio Mensual (ARS)</label>
                        <div className="relative">
                            <span className="absolute left-4 top-3.5 text-emerald-600 font-bold">$</span>
                            <input
                                type="number"
                                {...register("price.monthly", { valueAsNumber: true })}
                                className="w-full pl-8 pr-4 py-3 bg-white border border-emerald-200 rounded-xl focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500 outline-none transition-all text-gray-900 font-bold text-lg shadow-sm"
                            />
                        </div>
                        {errors.price?.monthly && <p className="text-red-500 text-xs mt-1">{errors.price.monthly.message}</p>}
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-emerald-800 uppercase tracking-wider mb-2">Precio Anual (ARS)</label>
                        <div className="relative">
                            <span className="absolute left-4 top-3.5 text-emerald-600 font-bold">$</span>
                            <input
                                type="number"
                                {...register("price.yearly", { valueAsNumber: true })}
                                className="w-full pl-8 pr-4 py-3 bg-white border border-emerald-200 rounded-xl focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500 outline-none transition-all text-gray-900 font-bold text-lg shadow-sm"
                            />
                        </div>
                        {errors.price?.yearly && <p className="text-red-500 text-xs mt-1">{errors.price.yearly.message}</p>}
                    </div>
                </div>
            </section>

            {/* BLOCK 3: Limits */}
            <section className="space-y-6">
                <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2 text-blue-600">
                        <Activity className="w-5 h-5" />
                        <h3 className="text-lg font-bold text-gray-900">3. Límites del Sistema</h3>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                    <ResourceLimitInput label="Propiedades Activas" name="limits.properties" control={control} icon={<HomeIcon className="w-4 h-4" />} />
                    <ResourceLimitInput label="Usuarios Extras" name="limits.users" control={control} icon={<UsersIcon className="w-4 h-4" />} />
                    <ResourceLimitInput label="Fichas de Clientes" name="limits.clients" control={control} icon={<BriefcaseIcon className="w-4 h-4" />} />
                    <ResourceLimitInput label="Tasaciones Online / Mes" name="limits.tasaciones" control={control} icon={<CalculatorIcon className="w-4 h-4" />} />
                    <ResourceLimitInput label="Créditos Inteligencia Artificial" name="limits.aiCredits" control={control} icon={<BotIcon className="w-4 h-4" />} />

                    {/* Storage specifically is string based */}
                    <div className="p-5 rounded-xl border border-gray-200 bg-white shadow-sm hover:border-blue-300 hover:shadow-md transition-all flex flex-col justify-between">
                        <div className="flex items-center gap-2 mb-4">
                            <div className="p-2 rounded-lg bg-gray-100 text-gray-500">
                                <DatabaseIcon className="w-4 h-4" />
                            </div>
                            <span className="text-sm font-bold text-gray-800">Almacenamiento Total</span>
                        </div>
                        <input
                            {...register("limits.storage")}
                            className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-gray-50 focus:bg-white border-gray-200 focus:border-blue-500 text-gray-900 font-bold text-lg transition-colors"
                            placeholder="Ej. 1GB, 10GB, Ilimitado..."
                        />
                    </div>
                </div>
            </section>

            {/* BLOCK 4: Features */}
            <section className="space-y-6">
                <div className="flex items-center gap-2 text-purple-600 mb-2">
                    <Check className="w-5 h-5" />
                    <h3 className="text-lg font-bold text-gray-900">4. Funcionalidades Incluidas</h3>
                </div>
                
                <p className="text-sm text-gray-500 mb-4">
                    Escribe las características que quieres que se muestren en la tabla de precios para este plan.
                </p>

                <DynamicFeaturesList
                    features={watch("features") || []}
                    onChange={(newFeatures) => setValue("features", newFeatures, { shouldValidate: true, shouldDirty: true })}
                />
                {errors.features && <p className="text-red-500 text-xs mt-1">{errors.features.message}</p>}
            </section>

            {/* Actions */}
            <div className="flex items-center justify-end gap-4 pt-8 border-t border-gray-100">
                <button
                    type="button"
                    onClick={onCancel}
                    className="px-6 py-3 text-gray-600 hover:text-gray-900 font-bold transition-colors hover:bg-gray-100 rounded-xl"
                >
                    Cancelar
                </button>
                <button
                    type="submit"
                    disabled={saving}
                    className="px-8 py-3 bg-gradient-to-r from-indigo-600 to-violet-600 text-white hover:from-indigo-700 hover:to-violet-700 rounded-xl font-bold transition-all shadow-lg hover:shadow-indigo-500/30 flex items-center gap-2 disabled:opacity-50 transform active:scale-95"
                >
                    {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Check className="w-5 h-5" />}
                    {saving ? "Guardando..." : "Guardar Plan"}
                </button>
            </div>
        </form>
    );
}

function ResourceLimitInput({ label, name, control, icon }: { label: string, name: string, control: Control<any>, icon?: any }) {
    const { field } = useController({ name, control });
    const isUnlimited = field.value === 'unlimited';

    const handleNumberChange = (value: string) => {
        if (value === "") { field.onChange(0); return; }
        const num = parseFloat(value);
        if (!isNaN(num)) field.onChange(num);
    };

    return (
        <div className={`p-5 rounded-xl border shadow-sm transition-all duration-200 ${isUnlimited ? 'bg-indigo-50/50 border-indigo-200 shadow-indigo-100/50' : 'bg-white border-gray-200 hover:border-blue-300 hover:shadow-md'}`}>
            <div className="flex flex-col gap-4">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <div className={`p-2 rounded-lg ${isUnlimited ? 'bg-indigo-100 text-indigo-600' : 'bg-gray-100 text-gray-500'}`}>
                            {icon}
                        </div>
                        <span className={`text-sm font-bold ${isUnlimited ? 'text-indigo-900' : 'text-gray-800'}`}>{label}</span>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <input
                        type="number"
                        disabled={isUnlimited}
                        value={isUnlimited ? '' : field.value}
                        onChange={(e) => handleNumberChange(e.target.value)}
                        className={`w-full px-4 py-2 border rounded-lg outline-none font-bold text-lg transition-colors ${isUnlimited ? 'bg-indigo-50/30 border-transparent text-indigo-300 cursor-not-allowed placeholder-transparent' : 'bg-gray-50 focus:bg-white border-gray-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 text-gray-900'}`}
                        placeholder={isUnlimited ? "∞" : "0"}
                    />

                    <label className="flex items-center cursor-pointer shrinks-0 gap-2 p-2 rounded-lg hover:bg-gray-50 transition-colors border border-transparent hover:border-gray-200">
                        <div className="relative">
                            <input
                                type="checkbox"
                                className="sr-only"
                                checked={isUnlimited}
                                onChange={(e) => field.onChange(e.target.checked ? 'unlimited' : 0)}
                            />
                            <div className={`block w-10 h-6 rounded-full transition-colors ${isUnlimited ? 'bg-indigo-500' : 'bg-gray-300'}`}></div>
                            <div className={`dot absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform ${isUnlimited ? 'transform translate-x-4' : ''}`}></div>
                        </div>
                        <span className="text-[11px] font-extrabold uppercase text-gray-500">Ilimitado</span>
                    </label>
                </div>
            </div>
        </div>
    )
}

function DynamicFeaturesList({ features, onChange }: { features: string[], onChange: (f: string[]) => void }) {
    const [inputValue, setInputValue] = useState("");

    const handleAdd = () => {
        if (!inputValue.trim()) return;
        if (features.includes(inputValue.trim())) {
            toast.error("Esta característica ya existe en el plan");
            return;
        }
        onChange([...features, inputValue.trim()]);
        setInputValue("");
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === "Enter") {
            e.preventDefault();
            handleAdd();
        }
    };

    const handleRemove = (indexToRemove: number) => {
        onChange(features.filter((_, i) => i !== indexToRemove));
    };

    return (
        <div className="space-y-4">
            <div className="flex gap-2">
                <input
                    type="text"
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Ej. 'Gestión de Inquilinos'"
                    className="flex-1 px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:bg-white outline-none transition-all text-gray-900 font-medium"
                />
                <button
                    type="button"
                    onClick={handleAdd}
                    disabled={!inputValue.trim()}
                    className="px-6 py-3 bg-purple-100 text-purple-700 hover:bg-purple-200 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl font-bold transition-all whitespace-nowrap"
                >
                    Agregar
                </button>
            </div>

            {features.length > 0 ? (
                <ul className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-4">
                    {features.map((feature, idx) => (
                        <li key={idx} className="flex items-center justify-between p-3 bg-white border border-gray-200 rounded-xl shadow-sm hover:border-purple-300 transition-all group">
                            <span className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                                <Check className="w-4 h-4 text-purple-500" />
                                {feature}
                            </span>
                            <button
                                type="button"
                                onClick={() => handleRemove(idx)}
                                className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                                title="Eliminar característica"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </li>
                    ))}
                </ul>
            ) : (
                <div className="p-8 text-center text-gray-400 bg-gray-50 border border-dashed border-gray-200 rounded-xl">
                    No has agregado ninguna funcionalidad todavía.
                </div>
            )}
        </div>
    );
}
