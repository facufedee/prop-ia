"use client";

import { useEffect, useState } from "react";
import { Plus, Edit, Trash2, Check, X, Loader2 } from "lucide-react";
import { subscriptionService } from "@/infrastructure/services/subscriptionService";
import { Plan } from "@/domain/models/Subscription";
import PlanForm from "./components/PlanForm";
import { toast } from "sonner";
import { RoleProtection } from "@/ui/components/auth/RoleProtection";

import { MoreVertical } from "lucide-react";

export default function SubscriptionsPage() {
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
        if (!confirm("¿Estás seguro de que deseas eliminar este plan? Esta acción no se puede deshacer.")) return;

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
            <RoleProtection requiredPermission="/dashboard/configuracion/suscripciones">
                <div className="space-y-6">
                    <div className="flex items-center justify-between">
                        <h1 className="text-2xl font-bold text-gray-900">
                            {selectedPlan ? "Editar Plan" : "Nuevo Plan"}
                        </h1>
                        <button
                            onClick={handleClose}
                            className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
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
            </RoleProtection>
        );
    }

    return (
        <RoleProtection requiredPermission="/dashboard/configuracion/suscripciones">
            <div className="space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">Planes y Suscripciones</h1>
                        <p className="text-gray-500">Gestiona los planes disponibles en la plataforma</p>
                    </div>
                    <button
                        onClick={handleCreate}
                        className="flex items-center justify-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                    >
                        <Plus size={20} />
                        Crear Plan
                    </button>
                </div>

                {loading ? (
                    <div className="flex justify-center py-12">
                        <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {plans.map((plan) => (
                            <div
                                key={plan.id}
                                className={`bg-white rounded-xl shadow-sm border p-6 hover:shadow-md transition-shadow relative ${plan.popular ? 'ring-2 ring-indigo-500 border-transparent' : 'border-gray-200'}`}
                            >
                                {plan.popular && (
                                    <div className="absolute top-0 right-0 bg-indigo-600 text-white text-xs font-bold px-3 py-1 rounded-bl-lg rounded-tr-lg mr-[40px]">
                                        POPULAR
                                    </div>
                                )}

                                <div className="flex justify-between items-start mb-4">
                                    <div>
                                        <h3 className="text-lg font-bold text-gray-900">{plan.name}</h3>
                                        <p className="text-sm text-gray-500 capitalize">{plan.tier}</p>
                                    </div>

                                    <div className="relative">
                                        <button
                                            type="button"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                setOpenMenuId(openMenuId === plan.id ? null : plan.id);
                                            }}
                                            className={`p-2 rounded-lg transition-colors ${openMenuId === plan.id ? 'bg-indigo-50 text-indigo-600' : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100'}`}
                                        >
                                            <MoreVertical size={20} />
                                        </button>

                                        {openMenuId === plan.id && (
                                            <>
                                                {/* Backdrop to close menu */}
                                                <div
                                                    className="fixed inset-0 z-30 opacity-0 cursor-default"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        setOpenMenuId(null);
                                                    }}
                                                />

                                                {/* Menu Content */}
                                                <div className="absolute right-0 top-full mt-1 w-40 bg-white rounded-lg shadow-xl border border-gray-100 py-1 z-40 overflow-hidden">
                                                    <button
                                                        type="button"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            handleEdit(plan);
                                                        }}
                                                        className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 text-left transition-colors"
                                                    >
                                                        <Edit size={16} />
                                                        Editar
                                                    </button>
                                                    <div className="h-px bg-gray-100 my-0.5" />
                                                    <button
                                                        type="button"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            handleDelete(plan.id);
                                                        }}
                                                        className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 text-left transition-colors font-medium"
                                                    >
                                                        <Trash2 size={16} />
                                                        Eliminar
                                                    </button>
                                                </div>
                                            </>
                                        )}
                                    </div>
                                </div>

                                <p className="text-gray-600 text-sm mb-6 h-10 line-clamp-2">
                                    {plan.description}
                                </p>

                                <div className="mb-6">
                                    <div className="flex items-baseline gap-1">
                                        <span className="text-2xl font-bold text-gray-900">
                                            ${plan.price.monthly.toLocaleString('es-AR')}
                                        </span>
                                        <span className="text-gray-500 text-sm">/mes</span>
                                    </div>
                                    <div className="text-xs text-gray-400 mt-1">
                                        ${plan.price.yearly.toLocaleString('es-AR')} al año
                                    </div>
                                </div>

                                <div className="space-y-2 mb-6">
                                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Límites</p>
                                    <div className="grid grid-cols-2 gap-y-1 text-sm text-gray-700">
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
                            <div className="col-span-full text-center py-12 bg-gray-50 rounded-xl border border-dashed border-gray-300">
                                <p className="text-gray-500">No hay planes configurados aún.</p>
                                <button
                                    onClick={handleCreate}
                                    className="mt-2 text-indigo-600 hover:text-indigo-700 font-medium"
                                >
                                    Crear el primero
                                </button>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </RoleProtection>
    );
}
