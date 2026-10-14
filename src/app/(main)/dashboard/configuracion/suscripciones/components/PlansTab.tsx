"use client";

import { useEffect, useState } from "react";
import { Plus, Edit, Trash2, Loader2, MoreVertical } from "lucide-react";
import { subscriptionService } from "@/infrastructure/services/subscriptionService";
import { Plan } from "@/domain/models/Subscription";
import PlanForm from "./PlanForm";
import { toast } from "sonner";

interface PlansTabProps {
    onEditingChange?: (isEditing: boolean) => void;
}

export default function PlansTab({ onEditingChange }: PlansTabProps) {
    const [plans, setPlans] = useState<Plan[]>([]);
    const [loading, setLoading] = useState(true);
    const [isEditing, setIsEditing] = useState(false);
    const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null);
    const [openMenuId, setOpenMenuId] = useState<string | null>(null);

    const loadPlans = async () => {
        setLoading(true);
        try {
            const data = await subscriptionService.getAllPlans();
            setPlans(data.sort((a, b) => a.price.monthly - b.price.monthly));
        } catch (error) {
            console.error(error);
            toast.error("Error al cargar los planes");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadPlans();
    }, []);

    useEffect(() => {
        onEditingChange?.(isEditing);
    }, [isEditing, onEditingChange]);

    const handleCreate = () => {
        setSelectedPlan(null);
        setIsEditing(true);
    };

    const handleEdit = (plan: Plan) => {
        setSelectedPlan(plan);
        setIsEditing(true);
        setOpenMenuId(null);
    };

    const handleDelete = async (planId: string) => {
        if (!confirm("¿Estás seguro de que deseas eliminar este plan?")) return;

        try {
            setLoading(true);
            await subscriptionService.deletePlan(planId);
            toast.success("Plan eliminado correctamente");
            await loadPlans();
        } catch (error) {
            console.error(error);
            toast.error("Error al eliminar el plan");
            setLoading(false);
        }
    };

    const handleClose = () => {
        setIsEditing(false);
        setSelectedPlan(null);
    };

    const handleSaved = () => {
        handleClose();
        loadPlans();
        toast.success("Plan guardado correctamente");
    };

    if (isEditing) {
        return (
            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <h2 className="text-xl font-bold text-[var(--color-ink)]">
                        {selectedPlan ? "Editar Plan" : "Nuevo Plan"}
                    </h2>
                    <button
                        onClick={handleClose}
                        className="px-4 py-2 text-[var(--color-ink-2)] hover:bg-[var(--color-paper-3)] rounded-lg transition-colors"
                    >
                        Cancelar
                    </button>
                </div>
                <PlanForm
                    initialData={selectedPlan || undefined}
                    onSave={handleSaved}
                    onCancel={handleClose}
                />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex justify-end">
                <button
                    onClick={handleCreate}
                    className="flex items-center gap-2 px-4 py-2 bg-[var(--color-ink)] text-[var(--color-paper)] rounded-lg hover:bg-[var(--color-ink-2)] transition-colors"
                >
                    <Plus strokeWidth={1.5} size={20} />
                    Crear Plan
                </button>
            </div>

            {loading ? (
                <div className="flex justify-center py-12">
                    <Loader2 strokeWidth={1.5} className="w-8 h-8 animate-spin text-[var(--color-accent)]" />
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {plans.map((plan) => (
                        <div
                            key={plan.id}
                            className={`bg-[var(--color-paper-2)] rounded-xl shadow-sm border p-6 hover:shadow-md transition-shadow relative ${plan.popular ? 'ring-2 ring-[var(--color-accent)] border-transparent' : 'border-[var(--color-rule)]'}`}
                        >
                            {plan.popular && (
                                <div className="absolute top-0 right-0 bg-[var(--color-accent)] text-[var(--color-accent-ink)] text-xs font-bold px-3 py-1 rounded-bl-lg rounded-tr-lg mr-[40px]">
                                    POPULAR
                                </div>
                            )}

                            <div className="flex justify-between items-start mb-4">
                                <div>
                                    <h3 className="text-lg font-bold text-[var(--color-ink)]">{plan.name}</h3>
                                    <p className="text-sm text-[var(--color-muted)] capitalize">{plan.tier}</p>
                                </div>

                                <div className="relative">
                                    <button
                                        type="button"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            setOpenMenuId(openMenuId === plan.id ? null : plan.id);
                                        }}
                                        className={`p-2 rounded-lg transition-colors ${openMenuId === plan.id ? 'bg-[var(--color-accent-soft)] text-[var(--color-accent)]' : 'text-[var(--color-neutral)] hover:text-[var(--color-ink-2)] hover:bg-[var(--color-paper-3)]'}`}
                                    >
                                        <MoreVertical strokeWidth={1.5} size={20} />
                                    </button>

                                    {openMenuId === plan.id && (
                                        <>
                                            <div
                                                className="fixed inset-0 z-30"
                                                onClick={() => setOpenMenuId(null)}
                                            />
                                            <div className="absolute right-0 top-full mt-1 w-40 bg-[var(--color-paper-2)] rounded-lg shadow-xl border border-[var(--color-rule-2)] py-1 z-40">
                                                <button
                                                    type="button"
                                                    onClick={() => handleEdit(plan)}
                                                    className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-[var(--color-ink-2)] hover:bg-[var(--color-paper-3)]"
                                                >
                                                    <Edit strokeWidth={1.5} size={16} />
                                                    Editar
                                                </button>
                                                <div className="h-px bg-[var(--color-paper-3)]" />
                                                <button
                                                    type="button"
                                                    onClick={() => handleDelete(plan.id)}
                                                    className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-[var(--color-danger)] hover:bg-[var(--color-danger-soft)]"
                                                >
                                                    <Trash2 strokeWidth={1.5} size={16} />
                                                    Eliminar
                                                </button>
                                            </div>
                                        </>
                                    )}
                                </div>
                            </div>

                            <p className="text-[var(--color-ink-2)] text-sm mb-6 h-10 line-clamp-2">
                                {plan.description}
                            </p>

                            <div className="mb-6">
                                <div className="flex items-baseline gap-1">
                                    <span className="text-2xl font-bold text-[var(--color-ink)]">
                                        ${plan.price.monthly.toLocaleString('es-AR')}
                                    </span>
                                    <span className="text-[var(--color-muted)] text-sm">/mes</span>
                                </div>
                                <div className="text-xs text-[var(--color-neutral)] mt-1">
                                    ${plan.price.yearly.toLocaleString('es-AR')} al año
                                </div>
                            </div>

                            <div className="space-y-2">
                                <p className="text-xs font-semibold text-[var(--color-muted)] uppercase tracking-wider">Límites</p>
                                <div className="grid grid-cols-2 gap-y-1 text-sm text-[var(--color-ink-2)]">
                                    <div>Propiedades:</div>
                                    <div className="font-medium text-right">{plan.limits.properties === 'unlimited' ? 'Ilimitadas' : plan.limits.properties}</div>
                                    <div>Usuarios:</div>
                                    <div className="font-medium text-right">{plan.limits.users === 'unlimited' ? 'Ilimitados' : plan.limits.users}</div>
                                    <div>Clientes:</div>
                                    <div className="font-medium text-right">{plan.limits.clients === 'unlimited' ? 'Ilimitados' : plan.limits.clients}</div>
                                </div>
                            </div>
                        </div>
                    ))}

                    {plans.length === 0 && (
                        <div className="col-span-full text-center py-12 bg-[var(--color-paper)] rounded-xl border border-dashed border-[var(--color-rule)]">
                            <p className="text-[var(--color-muted)]">No hay planes configurados aún.</p>
                            <button
                                onClick={handleCreate}
                                className="mt-2 text-[var(--color-accent)] hover:text-[var(--color-accent-2)] font-medium"
                            >
                                Crear el primero
                            </button>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
