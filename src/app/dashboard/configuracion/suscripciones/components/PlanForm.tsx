"use client";

import { useState } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, Plus, Trash2, HelpCircle } from "lucide-react";
import { Plan } from "@/domain/models/Subscription";
import { subscriptionService } from "@/infrastructure/services/subscriptionService";
import { planSchema, PlanFormData, defaultPlan } from "../schema";
import { toast } from "sonner";
// @ts-ignore
import { doc, setDoc, updateDoc, collection } from "firebase/firestore";
import { db } from "@/infrastructure/firebase/client";

interface PlanFormProps {
    initialData?: Plan;
    onSave: () => void;
    onCancel: () => void;
}

export default function PlanForm({ initialData, onSave, onCancel }: PlanFormProps) {
    const [saving, setSaving] = useState(false);

    // Transform initialData to match schema if needed
    const defaultValues: PlanFormData = initialData ? {
        name: initialData.name,
        tier: initialData.tier,
        description: initialData.description,
        icon: initialData.icon || "Zap",
        popular: initialData.popular || false,
        price: initialData.price,
        features: initialData.features,
        limits: {
            ...initialData.limits,
            // Ensure values match union types properly if they come as loose types
            properties: initialData.limits.properties as number | "unlimited",
            users: initialData.limits.users as number | "unlimited",
            clients: initialData.limits.clients as number | "unlimited",
            tasaciones: initialData.limits.tasaciones as number | "unlimited",
            aiCredits: initialData.limits.aiCredits as number | "unlimited",
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

    const { fields, append, remove } = useFieldArray({
        control,
        name: "features"
    });

    const onSubmit = async (data: PlanFormData) => {
        setSaving(true);
        try {
            if (initialData?.id) {
                // Update existing
                // Using the service would be ideal but we might need to expose updatePlan in service if not already flexible enough
                // `subscriptionService` reads from "plans" collection. Let's make sure we have a way to write to it.
                // Since generic `updateDoc` is available in client code, we can use it or add to service.
                // For now, let's assume we can write directly or via a helper.
                // Checking `subscriptionService.ts`... it has `createSubscription` but misses `createPlan`/`updatePlan`.
                // I will implement the write logic here directly using firebase primitives or extend the service later.
                // Integrating direct firestore write for now as valid "Admin" action.

                const planRef = doc(db, "plans", initialData.id);
                await updateDoc(planRef, {
                    ...data,
                    updatedAt: new Date()
                });

            } else {
                // Create new
                const plansRef = collection(db, "plans");
                await contextFreeCreateRaw(plansRef, data);
            }
            onSave();
        } catch (error) {
            console.error(error);
            toast.error("Error al guardar el plan");
        } finally {
            setSaving(false);
        }
    };

    // Helper to bypass missing service method
    const contextFreeCreateRaw = async (ref: any, data: any) => {
        // We need to generate an ID or let firestore do it
        const { addDoc } = await import("firebase/firestore"); // Dynamic import to be safe or just use global
        await addDoc(ref, {
            ...data,
            createdAt: new Date(),
            updatedAt: new Date()
        });
    }

    return (
        <form onSubmit={handleSubmit(onSubmit)} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                {/* Basic Info */}
                <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">Información Básica</h3>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Nombre del Plan</label>
                        <input
                            {...register("name")}
                            className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                            placeholder="Ej. Profesional"
                        />
                        {errors.name && <span className="text-red-500 text-xs">{errors.name.message}</span>}
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Descripción</label>
                        <textarea
                            {...register("description")}
                            rows={3}
                            className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none resize-none"
                            placeholder="Breve descripción del plan..."
                        />
                        {errors.description && <span className="text-red-500 text-xs">{errors.description.message}</span>}
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Nivel (Tier)</label>
                            <select {...register("tier")} className="w-full px-3 py-2 border rounded-lg bg-white">
                                <option value="free">Gratis (Free)</option>
                                <option value="professional">Profesional</option>
                                <option value="enterprise">Empresarial</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Icono (Lucide)</label>
                            <input
                                {...register("icon")}
                                className="w-full px-3 py-2 border rounded-lg"
                                placeholder="Ej. Zap, Building..."
                            />
                        </div>
                    </div>

                    <div className="flex items-center gap-2 pt-2">
                        <input type="checkbox" {...register("popular")} id="popular" className="w-4 h-4 text-indigo-600 rounded" />
                        <label htmlFor="popular" className="text-sm text-gray-700">Marcar como "Más Popular"</label>
                    </div>
                </div>

                {/* Pricing & Limits */}
                <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">Precios y Límites</h3>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Precio Mensual</label>
                            <div className="relative">
                                <span className="absolute left-3 top-2 text-gray-500">$</span>
                                <input
                                    type="number"
                                    {...register("price.monthly", { valueAsNumber: true })}
                                    className="w-full pl-7 pr-3 py-2 border rounded-lg"
                                />
                            </div>
                            {errors.price?.monthly && <span className="text-red-500 text-xs">{errors.price.monthly.message}</span>}
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Precio Anual</label>
                            <div className="relative">
                                <span className="absolute left-3 top-2 text-gray-500">$</span>
                                <input
                                    type="number"
                                    {...register("price.yearly", { valueAsNumber: true })}
                                    className="w-full pl-7 pr-3 py-2 border rounded-lg"
                                />
                            </div>
                            {errors.price?.yearly && <span className="text-red-500 text-xs">{errors.price.yearly.message}</span>}
                        </div>
                    </div>

                    <div className="space-y-3 pt-2">
                        <p className="text-sm font-medium text-gray-900">Límites de Recursos</p>

                        <ResourceLimitInput label="Propiedades" name="limits.properties" register={register} setValue={setValue} watch={watch} />
                        <ResourceLimitInput label="Usuarios" name="limits.users" register={register} setValue={setValue} watch={watch} />
                        <ResourceLimitInput label="Clientes" name="limits.clients" register={register} setValue={setValue} watch={watch} />
                        <ResourceLimitInput label="Tasaciones" name="limits.tasaciones" register={register} setValue={setValue} watch={watch} />
                        <ResourceLimitInput label="Créditos IA" name="limits.aiCredits" register={register} setValue={setValue} watch={watch} />

                        <div>
                            <label className="block text-xs text-gray-500 mb-1">Almacenamiento (Texto ej: 10GB)</label>
                            <input
                                {...register("limits.storage")}
                                className="w-full px-3 py-1.5 border rounded text-sm"
                            />
                        </div>
                    </div>
                </div>
            </div>

            {/* Features List */}
            <div className="mb-8">
                <div className="flex items-center justify-between border-b pb-2 mb-4">
                    <h3 className="text-lg font-semibold text-gray-900">Características (Features)</h3>
                    <button
                        type="button"
                        onClick={() => append({ name: "", included: true })}
                        className="text-sm text-indigo-600 hover:text-indigo-700 font-medium flex items-center gap-1"
                    >
                        <Plus size={16} /> Agregar Feature
                    </button>
                </div>

                <div className="space-y-2">
                    {fields.map((field: any, index: number) => (
                        <div key={field.id} className="flex items-center gap-3">
                            <input
                                {...register(`features.${index}.included`)}
                                type="checkbox"
                                className="w-4 h-4 text-indigo-600 rounded"
                            />
                            <input
                                {...register(`features.${index}.name`)}
                                className="flex-1 px-3 py-2 border rounded-lg text-sm"
                                placeholder="Nombre de la característica"
                            />
                            <button
                                type="button"
                                onClick={() => remove(index)}
                                className="text-gray-400 hover:text-red-500 transition-colors"
                            >
                                <Trash2 size={16} />
                            </button>
                        </div>
                    ))}
                </div>
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-3 pt-6 border-t">
                <button
                    type="button"
                    onClick={onCancel}
                    className="px-6 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors font-medium"
                >
                    Cancelar
                </button>
                <button
                    type="submit"
                    disabled={saving}
                    className="px-6 py-2 bg-indigo-600 text-white hover:bg-indigo-700 rounded-lg transition-colors font-medium flex items-center gap-2 disabled:opacity-50"
                >
                    {saving && <Loader2 className="w-4 h-4 animate-spin" />}
                    {saving ? "Guardando..." : "Guardar Plan"}
                </button>
            </div>
        </form>
    );
}

function ResourceLimitInput({ label, name, register, setValue, watch }: any) {
    const currentValue = watch(name);
    const isUnlimited = currentValue === 'unlimited';

    return (
        <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600 w-1/3">{label}</span>
            <div className="flex items-center gap-2 w-2/3">
                <input
                    type="number"
                    disabled={isUnlimited}
                    className={`flex-1 px-3 py-1.5 border rounded ${isUnlimited ? 'bg-gray-100 text-gray-400' : ''}`}
                    {...register(name, { valueAsNumber: true })}
                />
                <div className="flex items-center gap-1">
                    <input
                        type="checkbox"
                        checked={isUnlimited}
                        onChange={(e) => {
                            if (e.target.checked) {
                                setValue(name, 'unlimited');
                            } else {
                                setValue(name, 0); // Reset to number
                            }
                        }}
                        className="w-4 h-4 text-indigo-600"
                    />
                    <span className="text-xs text-gray-500">Ilimitado</span>
                </div>
            </div>
        </div>
    )
}
