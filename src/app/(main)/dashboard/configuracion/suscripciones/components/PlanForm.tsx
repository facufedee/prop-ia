"use client";

import { useState } from "react";
import { useForm, useController, Control } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { Plan } from "@/domain/models/Subscription";
import { planSchema, PlanFormData, defaultPlan } from "../schema";
import { toast } from "sonner";
import { doc, updateDoc, collection, addDoc } from "firebase/firestore";
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

    // Helper to transform legacy features array to object if needed
    const getFeatures = (initialFeatures: any) => {
        if (Array.isArray(initialFeatures)) {
            // Legacy format detected: Map known names or default to false
            const defaults = { ...defaultPlan.features };
            return defaults;
        }
        return initialFeatures || defaultPlan.features;
    };

    // Transform initialData to match schema if needed
    const defaultValues: PlanFormData = initialData ? {
        name: initialData.name,
        tier: initialData.tier as "basic" | "professional" | "enterprise",
        description: initialData.description,
        icon: initialData.icon || "Zap",
        popular: initialData.popular || false,
        price: initialData.price,
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
        watch,
        setValue,
        formState: { errors }
    } = useForm<PlanFormData>({
        resolver: zodResolver(planSchema),
        defaultValues
    });

    const onSubmit = async (data: PlanFormData) => {
        console.log("Submitting form data:", data); // DEBUG
        setSaving(true);
        try {
            console.log("Form data valid, proceeding to save..."); // DEBUG
            if (!db) {
                console.error("Firestore DB is undefined"); // DEBUG
                throw new Error("Firestore no inicializado");
            }

            if (initialData?.id) {
                console.log("Updating existing plan: ", initialData.id); // DEBUG
                const planRef = doc(db, "plans", initialData.id);
                await updateDoc(planRef, {
                    ...data,
                    updatedAt: new Date()
                });
                toast.success("Plan actualizado correctamente");
            } else {
                console.log("Creating new plan"); // DEBUG
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

    const onError = (errors: any) => {
        // Only show error if there are actual errors
        const hasErrors = Object.keys(errors).length > 0;
        if (hasErrors) {
            console.error("Form validation errors:", errors);
            toast.error("Hay errores en el formulario, revisa los campos.");
        }
        // Fix applied: prevent showing errors when object is empty
    };

    return (
        <form onSubmit={handleSubmit(onSubmit, onError)} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 space-y-8">

            {/* BLOCK 1: Plan Info */}
            <div className="space-y-4">
                <div className="flex items-center justify-between border-b pb-2">
                    <h3 className="text-lg font-semibold text-gray-900 border-l-4 border-indigo-500 pl-3">1. Información del Plan</h3>
                    <div className="flex items-center gap-2">
                        <input type="checkbox" {...register("popular")} id="popular" className="w-4 h-4 text-indigo-600 rounded" />
                        <label htmlFor="popular" className="text-sm font-medium text-gray-700 select-none">Más Popular</label>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Nombre</label>
                        <input
                            {...register("name")}
                            className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-gray-900"
                            placeholder="Ej. Profesional, Enterprise..."
                        />
                        {errors.name && <span className="text-red-500 text-xs">{errors.name.message}</span>}
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Nivel (Tier)</label>
                        <select {...register("tier")} className="w-full px-3 py-2 border rounded-lg bg-white focus:ring-2 focus:ring-indigo-500 outline-none text-gray-900">
                            <option value="basic">Plan Básico</option>
                            <option value="professional">Plan Profesional</option>
                            <option value="enterprise">Plan Empresarial</option>
                        </select>
                    </div>
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Descripción (Marketing Copy)</label>
                    <textarea
                        {...register("description")}
                        rows={2}
                        className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none resize-none text-gray-900"
                        placeholder="La mejor opción para inmobiliarias en crecimiento..."
                    />
                    {errors.description && <span className="text-red-500 text-xs">{errors.description.message}</span>}
                </div>

                <div className="grid grid-cols-2 gap-6">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Icono (Lucide React)</label>
                        <input
                            {...register("icon")}
                            className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-gray-900"
                            placeholder="Zap, Building, Rocket..."
                        />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-semibold text-gray-500 mb-1 uppercase tracking-wide">Mensual</label>
                            <div className="relative">
                                <span className="absolute left-3 top-2 text-gray-500">$</span>
                                <input
                                    type="number"
                                    {...register("price.monthly", { valueAsNumber: true })}
                                    className="w-full pl-7 pr-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-gray-900"
                                />
                            </div>
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-gray-500 mb-1 uppercase tracking-wide">Anual</label>
                            <div className="relative">
                                <span className="absolute left-3 top-2 text-gray-500">$</span>
                                <input
                                    type="number"
                                    {...register("price.yearly", { valueAsNumber: true })}
                                    className="w-full pl-7 pr-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-gray-900"
                                />
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* BLOCK 2: Limits */}
            <div className="space-y-4">
                <div className="flex items-center gap-2 border-b pb-2 border-l-4 border-blue-500 pl-3">
                    <h3 className="text-lg font-semibold text-gray-900">2. Límites Cuantitativos</h3>
                    <span className="text-xs text-gray-500 font-normal ml-auto">Marca "Ilimitado" para desactivar el input numérico</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    <ResourceLimitInput label="Propiedades Activas" name="limits.properties" control={control} icon={<HomeIcon className="w-4 h-4" />} />
                    <ResourceLimitInput label="Usuarios / Agentes" name="limits.users" control={control} icon={<UsersIcon className="w-4 h-4" />} />
                    <ResourceLimitInput label="Clientes (CRM)" name="limits.clients" control={control} icon={<BriefcaseIcon className="w-4 h-4" />} />
                    <ResourceLimitInput label="Tasaciones / Mes" name="limits.tasaciones" control={control} icon={<CalculatorIcon className="w-4 h-4" />} />
                    <ResourceLimitInput label="Créditos IA / Mes" name="limits.aiCredits" control={control} icon={<BotIcon className="w-4 h-4" />} />

                    <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                        <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                            <DatabaseIcon className="w-4 h-4 text-indigo-500" /> Almacenamiento
                        </label>
                        <input
                            {...register("limits.storage")}
                            className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none bg-white text-gray-900"
                            placeholder="Ej. 10GB, 1TB..."
                        />
                    </div>
                </div>
            </div>

            {/* BLOCK 3: Feature Flags */}
            <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900 border-b pb-2 border-l-4 border-purple-500 pl-3">3. Funcionalidades (Feature Flags)</h3>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    <FeatureSwitch label="Gestión de Alquileres" name="features.rentals_management" register={register} />
                    <FeatureSwitch label="Publicar en Portales" name="features.properties_publishing" register={register} />
                    <FeatureSwitch label="Bot WhatsApp IA" name="features.whatsapp_bot" register={register} />
                    <FeatureSwitch label="Agenda Automática" name="features.automatic_agenda" register={register} />
                    <FeatureSwitch label="Notificaciones Auto" name="features.automatic_notifications" register={register} />
                    <FeatureSwitch label="Tasador Online (Web)" name="features.online_valuations" register={register} />
                    <FeatureSwitch label="Portal Inquilinos" name="features.tenant_portal" register={register} />
                    <FeatureSwitch label="Marca Blanca / Branding" name="features.custom_branding" register={register} />
                    <FeatureSwitch label="Multi-Sucursal" name="features.multi_branch" register={register} />
                </div>
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-3 pt-6 border-t bg-gray-50 -mx-6 -mb-6 p-6 rounded-b-xl">
                <button
                    type="button"
                    onClick={onCancel}
                    className="px-6 py-2 text-gray-700 bg-white border border-gray-300 hover:bg-gray-50 rounded-lg transition-colors font-medium shadow-sm hover:text-gray-900"
                >
                    Cancelar
                </button>
                <button
                    type="submit"
                    disabled={saving}
                    className="px-6 py-2 bg-indigo-600 text-white hover:bg-indigo-700 rounded-lg transition-colors font-medium flex items-center gap-2 disabled:opacity-50 shadow-md hover:shadow-lg transform active:scale-95 duration-200"
                >
                    {saving && <Loader2 className="w-4 h-4 animate-spin" />}
                    {saving ? "Guardando..." : "Guardar Configuración"}
                </button>
            </div>
        </form>
    );
}

function ResourceLimitInput({ label, name, control, icon }: { label: string, name: string, control: Control<any>, icon?: any }) {
    const { field } = useController({
        name,
        control
    });

    // Check if current value is strictly "unlimited" string
    const isUnlimited = field.value === 'unlimited';

    // Helper to safely handle number conversion
    const handleNumberChange = (value: string) => {
        if (value === "") {
            field.onChange(0); // Default to 0 if empty
            return;
        }
        const num = parseFloat(value);
        if (!isNaN(num)) {
            field.onChange(num);
        }
    };

    return (
        <div className={`p-4 rounded-lg border transition-colors ${isUnlimited ? 'bg-indigo-50 border-indigo-200' : 'bg-gray-50 border-gray-200 hover:border-blue-300'}`}>
            <div className="flex items-center gap-2 mb-3">
                {icon && <div className={`${isUnlimited ? 'text-indigo-600' : 'text-gray-500'}`}>{icon}</div>}
                <span className={`text-sm font-medium ${isUnlimited ? 'text-indigo-800' : 'text-gray-700'}`}>{label}</span>
            </div>

            <div className="flex items-center gap-3">
                <input
                    type="number"
                    disabled={isUnlimited}
                    placeholder="0"
                    min="0"
                    value={isUnlimited ? '' : field.value}
                    onChange={(e) => handleNumberChange(e.target.value)}
                    className={`flex-1 px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none transition-colors ${isUnlimited ? 'bg-white/50 text-gray-400 cursor-not-allowed border-indigo-100' : 'bg-white text-gray-900'}`}
                />

                <div className="flex items-center gap-2">
                    <input
                        type="checkbox"
                        checked={isUnlimited}
                        onChange={(e) => {
                            if (e.target.checked) {
                                field.onChange('unlimited');
                            } else {
                                field.onChange(0); // Reset to 0 when unchecking unlimited
                            }
                        }}
                        id={`semilimit-${name}`}
                        className="w-5 h-5 text-indigo-600 rounded border-gray-300 focus:ring-indigo-500 cursor-pointer"
                    />
                    <label htmlFor={`semilimit-${name}`} className="text-sm text-gray-600 cursor-pointer select-none">
                        Ilimitado
                    </label>
                </div>
            </div>
        </div>
    )
}

function FeatureSwitch({ label, name, register }: any) {
    return (
        <label className="flex items-center justify-between p-4 bg-white border border-gray-200 rounded-lg cursor-pointer hover:border-purple-300 transition-all shadow-sm group hover:shadow-md">
            <span className="text-sm font-medium text-gray-700 select-none group-hover:text-gray-900">{label}</span>
            <input
                type="checkbox"
                {...register(name)}
                className="w-5 h-5 text-indigo-600 rounded focus:ring-indigo-500"
            />
        </label>
    );
}
