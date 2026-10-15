"use client";

import { useState } from "react";
import { useForm, useController, Control } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, Check, Shield, Star, DollarSign, Activity, X, ArrowDown, ArrowUp } from "lucide-react";
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
    Coins as CoinsIcon,
    Database as DatabaseIcon
} from "lucide-react";

interface PlanFormProps {
    initialData?: Plan;
    onSave: () => void;
    onCancel: () => void;
}

export default function PlanForm({ initialData, onSave, onCancel }: PlanFormProps) {
    const [saving, setSaving] = useState(false);

    const getFeatures = (initialFeatures: any): string[] => {
        if (Array.isArray(initialFeatures)) {
            return initialFeatures;
        }
        // Fallback for old boolean feature objects: { whatsapp_bot: true, ... }
        if (typeof initialFeatures === 'object' && initialFeatures !== null) {
            const FEATURE_LABELS: Record<string, string> = {
                rentals_management: "Gestión de Alquileres",
                properties_publishing: "Publicación en Portales",
                whatsapp_bot: "Bot WhatsApp IA",
                automatic_agenda: "Agenda Automática",
                automatic_notifications: "Notificaciones Automáticas",
                online_valuations: "Tasador Online",
                tenant_portal: "Portal de Inquilinos",
                custom_branding: "Marca Propia (White Label)",
                multi_branch: "Multi-Sucursal"
            };
            return Object.entries(initialFeatures)
                .filter(([_, enabled]) => enabled === true)
                .map(([key]) => FEATURE_LABELS[key] || key);
        }
        return defaultPlan.features || [];
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
        resolver: zodResolver(planSchema) as any,
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
        <form onSubmit={handleSubmit(onSubmit, onError)} className="bg-[var(--color-paper-2)] rounded-2xl shadow-xl border border-[var(--color-rule-2)] p-8 max-w-5xl mx-auto space-y-12">

            <div className="flex flex-wrap gap-4 items-center justify-between pb-6 border-b border-[var(--color-rule-2)]">
                <div>
                    <h2 className="text-2xl font-extrabold text-[var(--color-ink)] tracking-tight">Configuración de Plan</h2>
                    <p className="text-sm text-[var(--color-muted)] mt-1">Define las características, precios y límites de este plan de suscripción.</p>
                </div>
                {/* Popular Toggle */}
                <label className="flex items-center gap-3 cursor-pointer bg-[var(--color-warning-soft)] px-4 py-2 rounded-full border border-[var(--color-warning)]/30 hover:bg-[var(--color-warning-soft)] transition-colors">
                    <input type="checkbox" {...register("popular")} className="sr-only peer" />
                    <div className="w-10 h-6 bg-[var(--color-paper-4)] peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-[var(--color-warning)] rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-[var(--color-paper-2)] after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-[var(--color-paper-2)] after:border-[var(--color-rule)] after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[var(--color-warning)] relative"></div>
                    <span className="text-sm font-bold text-[var(--color-warning)] flex items-center gap-1"><Star strokeWidth={1.5} className="w-4 h-4 text-[var(--color-warning)] fill-[var(--color-warning)]" /> Plan Popular</span>
                </label>
            </div>

            {/* BLOCK 1: General Info */}
            <section className="space-y-6">
                <div className="flex items-center gap-2 text-[var(--color-accent)] mb-2">
                    <Shield strokeWidth={1.5} className="w-5 h-5" />
                    <h3 className="text-lg font-bold text-[var(--color-ink)]">1. Información General</h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    <div className="col-span-1 lg:col-span-2 relative">
                        <label className="block text-xs font-bold text-[var(--color-muted)] uppercase tracking-wider mb-2">Nombre del Plan</label>
                        <input
                            {...register("name")}
                            className="w-full px-4 py-3 bg-[var(--color-paper)] border border-[var(--color-rule)] rounded-xl focus:ring-2 focus:ring-[var(--color-accent)]/40 focus:bg-[var(--color-paper-2)] outline-none transition-all text-[var(--color-ink)] font-medium"
                            placeholder="Ej. Plan Profesional"
                        />
                        {errors.name && <p className="text-[var(--color-danger)] text-xs mt-1 absolute">{errors.name.message}</p>}
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-[var(--color-muted)] uppercase tracking-wider mb-2">Nivel (Tier)</label>
                        <select {...register("tier")} className="w-full px-4 py-3 bg-[var(--color-paper)] border border-[var(--color-rule)] rounded-xl focus:ring-2 focus:ring-[var(--color-accent)]/40 focus:bg-[var(--color-paper-2)] outline-none transition-all text-[var(--color-ink)] font-medium appearance-none">
                            <option value="basic">Básico</option>
                            <option value="professional">Profesional</option>
                            <option value="enterprise">Empresarial</option>
                        </select>
                    </div>
                    <div className="col-span-1 lg:col-span-3 relative">
                        <label className="block text-xs font-bold text-[var(--color-muted)] uppercase tracking-wider mb-2">Descripción (Marketing)</label>
                        <textarea
                            {...register("description")}
                            rows={2}
                            className="w-full px-4 py-3 bg-[var(--color-paper)] border border-[var(--color-rule)] rounded-xl focus:ring-2 focus:ring-[var(--color-accent)]/40 focus:bg-[var(--color-paper-2)] outline-none transition-all resize-none text-[var(--color-ink)] font-medium"
                            placeholder="Breve descripción que verán los usuarios..."
                        />
                        {errors.description && <p className="text-[var(--color-danger)] text-xs mt-1 absolute">{errors.description.message}</p>}
                    </div>
                </div>
            </section>

            {/* BLOCK 2: Pricing */}
            <section className="space-y-6">
                <div className="flex items-center gap-2 text-[var(--color-positive)] mb-2">
                    <DollarSign strokeWidth={1.5} className="w-5 h-5" />
                    <h3 className="text-lg font-bold text-[var(--color-ink)]">2. Precios</h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-[var(--color-positive-soft)] p-6 rounded-2xl border border-[var(--color-positive)]/30">
                    <div>
                        <label className="block text-xs font-bold text-[var(--color-positive)] uppercase tracking-wider mb-2">Precio Mensual (ARS)</label>
                        <div className="relative">
                            <span className="absolute left-4 top-3.5 text-[var(--color-positive)] font-bold">$</span>
                            <input
                                type="number"
                                {...register("price.monthly", { valueAsNumber: true })}
                                className="w-full pl-8 pr-4 py-3 bg-[var(--color-paper-2)] border border-[var(--color-positive)]/30 rounded-xl focus:border-[var(--color-positive)] focus:ring-2 focus:ring-[var(--color-positive)] outline-none transition-all text-[var(--color-ink)] font-bold text-lg shadow-sm"
                            />
                        </div>
                        {errors.price?.monthly && <p className="text-[var(--color-danger)] text-xs mt-1">{errors.price.monthly.message}</p>}
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-[var(--color-positive)] uppercase tracking-wider mb-2">Precio Anual (ARS)</label>
                        <div className="relative">
                            <span className="absolute left-4 top-3.5 text-[var(--color-positive)] font-bold">$</span>
                            <input
                                type="number"
                                {...register("price.yearly", { valueAsNumber: true })}
                                className="w-full pl-8 pr-4 py-3 bg-[var(--color-paper-2)] border border-[var(--color-positive)]/30 rounded-xl focus:border-[var(--color-positive)] focus:ring-2 focus:ring-[var(--color-positive)] outline-none transition-all text-[var(--color-ink)] font-bold text-lg shadow-sm"
                            />
                        </div>
                        {errors.price?.yearly && <p className="text-[var(--color-danger)] text-xs mt-1">{errors.price.yearly.message}</p>}
                    </div>
                </div>
            </section>

            {/* BLOCK 3: Limits */}
            <section className="space-y-6">
                <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2 text-[var(--color-accent)]">
                        <Activity strokeWidth={1.5} className="w-5 h-5" />
                        <h3 className="text-lg font-bold text-[var(--color-ink)]">3. Límites del Sistema</h3>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                    <ResourceLimitInput label="Propiedades Activas" name="limits.properties" control={control} icon={<HomeIcon strokeWidth={1.5} className="w-4 h-4" />} />
                    <ResourceLimitInput label="Usuarios Extras" name="limits.users" control={control} icon={<UsersIcon strokeWidth={1.5} className="w-4 h-4" />} />
                    <ResourceLimitInput label="Fichas de Clientes" name="limits.clients" control={control} icon={<BriefcaseIcon strokeWidth={1.5} className="w-4 h-4" />} />
                    <ResourceLimitInput label="Tasaciones Online / Mes" name="limits.tasaciones" control={control} icon={<CalculatorIcon strokeWidth={1.5} className="w-4 h-4" />} />
                    <ResourceLimitInput label="Créditos Inteligencia Artificial" name="limits.aiCredits" control={control} icon={<CoinsIcon strokeWidth={1.5} className="w-4 h-4" />} />

                    {/* Storage specifically is string based */}
                    <div className="p-5 rounded-xl border border-[var(--color-rule)] bg-[var(--color-paper-2)] shadow-sm hover:border-[var(--color-accent)]/30 hover:shadow-md transition-all flex flex-col justify-between">
                        <div className="flex items-center gap-2 mb-4">
                            <div className="p-2 rounded-lg bg-[var(--color-paper-3)] text-[var(--color-muted)]">
                                <DatabaseIcon strokeWidth={1.5} className="w-4 h-4" />
                            </div>
                            <span className="text-sm font-bold text-[var(--color-ink)]">Almacenamiento Total</span>
                        </div>
                        <input
                            {...register("limits.storage")}
                            className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-[var(--color-accent)]/40 outline-none bg-[var(--color-paper)] focus:bg-[var(--color-paper-2)] border-[var(--color-rule)] focus:border-[var(--color-accent)] text-[var(--color-ink)] font-bold text-lg transition-colors"
                            placeholder="Ej. 1GB, 10GB, Ilimitado..."
                        />
                    </div>
                </div>
            </section>

            {/* BLOCK 4: Features */}
            <section className="space-y-6">
                <div className="flex items-center gap-2 text-[var(--color-accent)] mb-2">
                    <Check strokeWidth={1.5} className="w-5 h-5" />
                    <h3 className="text-lg font-bold text-[var(--color-ink)]">4. Funcionalidades Incluidas</h3>
                </div>

                <p className="text-sm text-[var(--color-muted)] mb-4">
                    Escribe las características que quieres que se muestren en la tabla de precios para este plan.
                </p>

                <DynamicFeaturesList
                    features={watch("features") || []}
                    onChange={(newFeatures) => setValue("features", newFeatures, { shouldValidate: true, shouldDirty: true })}
                />
                {errors.features && <p className="text-[var(--color-danger)] text-xs mt-1">{errors.features.message}</p>}
            </section>

            {/* Actions */}
            <div className="flex items-center justify-end gap-4 pt-8 border-t border-[var(--color-rule-2)]">
                <button
                    type="button"
                    onClick={onCancel}
                    className="px-6 py-3 text-[var(--color-ink-2)] hover:text-[var(--color-ink)] font-bold transition-colors hover:bg-[var(--color-paper-3)] rounded-xl"
                >
                    Cancelar
                </button>
                <button
                    type="submit"
                    disabled={saving}
                    className="px-8 py-3 bg-[var(--color-ink)] hover:bg-[var(--color-ink-2)] text-[var(--color-paper)] rounded-xl font-bold transition-all flex items-center gap-2 disabled:opacity-50 transform active:scale-95"
                >
                    {saving ? <Loader2 strokeWidth={1.5} className="w-5 h-5 animate-spin" /> : <Check strokeWidth={1.5} className="w-5 h-5" />}
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
        <div className={`p-5 rounded-xl border shadow-sm transition-all duration-200 ${isUnlimited ? 'bg-[var(--color-accent-soft)] border-[var(--color-accent)]/30' : 'bg-[var(--color-paper-2)] border-[var(--color-rule)] hover:border-[var(--color-accent)]/30 hover:shadow-md'}`}>
            <div className="flex flex-col gap-4">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <div className={`p-2 rounded-lg ${isUnlimited ? 'bg-[var(--color-accent-soft)] text-[var(--color-accent)]' : 'bg-[var(--color-paper-3)] text-[var(--color-muted)]'}`}>
                            {icon}
                        </div>
                        <span className={`text-sm font-bold ${isUnlimited ? 'text-[var(--color-accent)]' : 'text-[var(--color-ink)]'}`}>{label}</span>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <input
                        type="number"
                        disabled={isUnlimited}
                        value={isUnlimited ? '' : field.value}
                        onChange={(e) => handleNumberChange(e.target.value)}
                        className={`w-full px-4 py-2 border rounded-lg outline-none font-bold text-lg transition-colors ${isUnlimited ? 'bg-[var(--color-accent)]/7 border-transparent text-[var(--color-accent-2)] cursor-not-allowed placeholder-transparent' : 'bg-[var(--color-paper)] focus:bg-[var(--color-paper-2)] border-[var(--color-rule)] focus:border-[var(--color-accent)] focus:ring-2 focus:ring-[var(--color-accent)]/30 text-[var(--color-ink)]'}`}
                        placeholder={isUnlimited ? "∞" : "0"}
                    />

                    <label className="flex items-center cursor-pointer shrinks-0 gap-2 p-2 rounded-lg hover:bg-[var(--color-paper-3)] transition-colors border border-transparent hover:border-[var(--color-neutral)]">
                        <div className="relative">
                            <input
                                type="checkbox"
                                className="sr-only"
                                checked={isUnlimited}
                                onChange={(e) => field.onChange(e.target.checked ? 'unlimited' : 0)}
                            />
                            <div className={`block w-10 h-6 rounded-full transition-colors ${isUnlimited ? 'bg-[var(--color-accent)]' : 'bg-[var(--color-paper-4)]'}`}></div>
                            <div className={`dot absolute left-1 top-1 bg-[var(--color-paper-2)] w-4 h-4 rounded-full transition-transform ${isUnlimited ? 'transform translate-x-4' : ''}`}></div>
                        </div>
                        <span className="text-[11px] font-extrabold uppercase text-[var(--color-muted)]">Ilimitado</span>
                    </label>
                </div>
            </div>
        </div>
    )
}

function DynamicFeaturesList({ features = [], onChange }: { features: string[], onChange: (f: string[]) => void }) {
    const [inputValue, setInputValue] = useState("");
    const safeFeatures = Array.isArray(features) ? features : [];

    const handleAdd = () => {
        if (!inputValue.trim()) return;
        if (safeFeatures.includes(inputValue.trim())) {
            toast.error("Esta característica ya existe en el plan");
            return;
        }
        onChange([...safeFeatures, inputValue.trim()]);
        setInputValue("");
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === "Enter") {
            e.preventDefault();
            handleAdd();
        }
    };

    const handleRemove = (indexToRemove: number) => {
        onChange(safeFeatures.filter((_, i) => i !== indexToRemove));
    };

    const handleMove = (index: number, direction: 'up' | 'down') => {
        if (
            (direction === 'up' && index === 0) ||
            (direction === 'down' && index === safeFeatures.length - 1)
        ) return;

        const newFeatures = [...safeFeatures];
        const targetIndex = direction === 'up' ? index - 1 : index + 1;

        const temp = newFeatures[index];
        newFeatures[index] = newFeatures[targetIndex];
        newFeatures[targetIndex] = temp;

        onChange(newFeatures);
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
                    className="flex-1 px-4 py-3 bg-[var(--color-paper)] border border-[var(--color-rule)] rounded-xl focus:ring-2 focus:ring-[var(--color-accent)]/40 focus:bg-[var(--color-paper-2)] outline-none transition-all text-[var(--color-ink)] font-medium"
                />
                <button
                    type="button"
                    onClick={handleAdd}
                    disabled={!inputValue.trim()}
                    className="px-6 py-3 border border-[var(--color-rule)] text-[var(--color-ink)] hover:bg-[var(--color-paper-3)] disabled:opacity-50 disabled:cursor-not-allowed rounded-xl font-bold transition-all whitespace-nowrap"
                >
                    Agregar
                </button>
            </div>

            {safeFeatures.length > 0 ? (
                <ul className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-4">
                    {safeFeatures.map((feature, idx) => (
                        <li key={idx} className="flex items-center justify-between p-3 bg-[var(--color-paper-2)] border border-[var(--color-rule)] rounded-xl shadow-sm hover:border-[var(--color-accent)]/30 transition-all group">
                            <span className="text-sm font-semibold text-[var(--color-ink-2)] flex items-center gap-2">
                                <Check strokeWidth={1.5} className="w-4 h-4 text-[var(--color-accent)]" />
                                {feature}
                            </span>
                            <div className="flex items-center gap-1 opacity-100 md:opacity-0 group-hover:opacity-100 transition-opacity">
                                <button
                                    type="button"
                                    onClick={() => handleMove(idx, 'up')}
                                    disabled={idx === 0}
                                    className="p-1.5 text-[var(--color-neutral)] hover:text-[var(--color-ink)] hover:bg-[var(--color-paper-3)] rounded-lg transition-colors disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-[var(--color-neutral)]"
                                    title="Mover arriba"
                                >
                                    <ArrowUp strokeWidth={1.5} className="w-4 h-4" />
                                </button>
                                <button
                                    type="button"
                                    onClick={() => handleMove(idx, 'down')}
                                    disabled={idx === safeFeatures.length - 1}
                                    className="p-1.5 text-[var(--color-neutral)] hover:text-[var(--color-ink)] hover:bg-[var(--color-paper-3)] rounded-lg transition-colors disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-[var(--color-neutral)]"
                                    title="Mover abajo"
                                >
                                    <ArrowDown strokeWidth={1.5} className="w-4 h-4" />
                                </button>
                                <div className="w-px h-4 bg-[var(--color-paper-4)] mx-1"></div>
                                <button
                                    type="button"
                                    onClick={() => handleRemove(idx)}
                                    className="p-1.5 text-[var(--color-neutral)] hover:text-[var(--color-danger)] hover:bg-[var(--color-danger-soft)] rounded-lg transition-colors"
                                    title="Eliminar característica"
                                >
                                    <X strokeWidth={1.5} className="w-4 h-4" />
                                </button>
                            </div>
                        </li>
                    ))}
                </ul>
            ) : (
                <div className="p-8 text-center text-[var(--color-neutral)] bg-[var(--color-paper)] border border-dashed border-[var(--color-rule)] rounded-xl">
                    No has agregado ninguna funcionalidad todavía.
                </div>
            )}
        </div>
    );
}
