"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { adminService } from "@/infrastructure/services/adminService";
import { User } from "@/domain/models/User";
import { Subscription, PlanTier } from "@/domain/models/Subscription";
import { format, addDays } from "date-fns";
import { es } from "date-fns/locale";
import { ArrowLeft, User as UserIcon, Calendar, CheckCircle, XCircle, Mail, DollarSign, Home, Users, AlertCircle, Loader2, Trash2 } from "lucide-react";
import { toast } from "sonner";

export default function AdminUserProfilePage() {
    const params = useParams();
    const router = useRouter();
    const uid = params.uid as string;

    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'resumen' | 'suscripcion' | 'pagos' | 'correos'>('resumen');

    const [profileData, setProfileData] = useState<{
        user: User;
        subscription: Subscription | null;
        usage: { properties: number; clients: number; };
        payments: any[];
        sentEmails: any[];
    } | null>(null);

    const [customTemplates, setCustomTemplates] = useState<{type: string, name: string}[]>([]);
    const [emailPage, setEmailPage] = useState(0);
    const EMAIL_PAGE_SIZE = 5;

    const DEFAULT_TEMPLATES_MINIMAL: Record<string, string> = {
        welcome: "Bienvenida",
        payment_confirmed: "Pago Confirmado",
        payment_expiring: "Pago por Vencer",
        new_lead: "Nueva Consulta",
        activation: "Activación",
        value: "Valor (Liquidaciones)",
        social: "Prueba Social",
        conversion: "Conversión",
        promotion: "Promocional (Old)",
        crm_portal: "CRM + Portal"
    };

    // Form inputs for Subscription Tab
    const [planTier, setPlanTier] = useState<PlanTier>("basic");
    const [endDate, setEndDate] = useState<string>("");
    const [updatingSub, setUpdatingSub] = useState(false);

    // Form inputs for Payments Tab
    const [paymentAmount, setPaymentAmount] = useState<string>("");
    const [paymentMethod, setPaymentMethod] = useState<string>("transfer");
    const [paymentDate, setPaymentDate] = useState<string>(new Date().toISOString().split('T')[0]);
    const [paymentDesc, setPaymentDesc] = useState<string>("");
    const [addingPayment, setAddingPayment] = useState(false);

    const loadData = async () => {
        try {
            setLoading(true);
            setEmailPage(0);
            const data = await adminService.getUserProfileData(uid);
            setProfileData(data);

            if (data.subscription) {
                setPlanTier(data.subscription.planTier);
                setEndDate(data.subscription.endDate ? data.subscription.endDate.toISOString().split('T')[0] : "");
            }

            try {
                const templatesRes = await fetch('/api/marketing/templates');
                if (templatesRes.ok) {
                    const temp = await templatesRes.json();
                    setCustomTemplates(temp.templates || []);
                }
            } catch (err) {
                console.error("Error loading custom marketing templates", err);
            }
        } catch (error) {
            console.error("Error loading user profile:", error);
            toast.error("Error al cargar el perfil del usuario");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (uid) loadData();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [uid]);

    const handleUpdateSubscription = async () => {
        if (!endDate) {
            toast.error("Por favor selecciona una fecha de vencimiento");
            return;
        }

        try {
            setUpdatingSub(true);
            const [year, month, day] = endDate.split('-');
            const parsedDate = new Date(Number(year), Number(month) - 1, Number(day), 23, 59, 59, 999);

            await adminService.updateSubscriptionDetails(uid, planTier, parsedDate);
            toast.success("Suscripción actualizada correctamente");
            await loadData(); // Reload to see fresh changes
        } catch (error) {
            console.error("Error updating subscription:", error);
            toast.error("Error al actualizar la suscripción");
        } finally {
            setUpdatingSub(false);
        }
    };

    const handleAddPayment = async () => {
        if (!paymentAmount || Number(paymentAmount) <= 0) {
            toast.error("Ingresa un monto válido");
            return;
        }

        try {
            setAddingPayment(true);
            const parsedDate = new Date(paymentDate);
            // Keep default mid-day or beginning time for payment log

            await adminService.registerManualPayment(uid, {
                amount: Number(paymentAmount),
                paymentMethod,
                description: paymentDesc || "Pago manual registrado por administrador",
                date: parsedDate
            });

            toast.success("Pago registrado correctamente");
            setPaymentAmount("");
            setPaymentDesc("");
            await loadData();
        } catch (error) {
            console.error("Error registering payment:", error);
            toast.error("Error al registrar el pago");
        } finally {
            setAddingPayment(false);
        }
    };

    const handleToggleStatus = async (currentStatus: boolean | undefined) => {
        const newStatus = !currentStatus;
        const action = newStatus ? "suspender" : "restaurar el acceso a";

        if (!confirm(`¿Estás seguro de que querés ${action} este usuario?`)) return;

        try {
            setLoading(true);
            await adminService.toggleUserStatus(uid, newStatus);
            toast.success(`Usuario ${newStatus ? 'suspendido' : 'habilitado'} correctamente`);
            await loadData(); // Reload to refresh the badge
        } catch (error) {
            console.error("Error toggling status:", error);
            toast.error("Error al actualizar el estado");
            setLoading(false);
        }
    };

    const handleDeleteAccount = async () => {
        if (!confirm("ATENCIÓN: ¿Estás seguro de ELIMINAR PERMANENTEMENTE toda la cuenta y los datos de este usuario? Esta acción es irreversible.")) return;

        try {
            setLoading(true);
            await adminService.deleteUser(uid);
            toast.success("Usuario eliminado correctamente");
            router.push('/dashboard/gestion-plataforma');
        } catch (error) {
            console.error("Error deleting user:", error);
            toast.error("Hubo un problema al intentar eliminar la cuenta");
            setLoading(false);
        }
    };

    const handleSendMarketingEmail = async (templateKey: string, templateName: string) => {
        if (!user || !user.email) return;
        if (!confirm(`¿Enviar email "${templateName}" a ${user.email}?`)) return;

        try {
            const response = await fetch('/api/notifications/trigger', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    event: 'marketingEmail',
                    data: {
                        email: user.email,
                        name: user.displayName || user.email,
                        templateKey
                    }
                })
            });

            const result = await response.json();

            if (result.success) {
                toast.success("Email enviado correctamente");
                loadData(); // Reload to see the new email in the list
            } else {
                toast.error("Error al enviar email: " + (result.error || "Desconocido"));
            }
        } catch (error) {
            console.error("Error sending marketing email:", error);
            toast.error("Error de conexión al enviar email");
        }
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center py-20">
                <Loader2 strokeWidth={1.5} className="w-8 h-8 text-[var(--color-accent)] animate-spin" />
            </div>
        );
    }

    if (!profileData) {
        return <div className="p-8 text-center text-[var(--color-danger)]">Usuario no encontrado</div>;
    }

    const { user, subscription, usage, payments, sentEmails } = profileData;

    const isExpired = (() => {
        if (!user || user.disabled) return false;
        const now = new Date();
        if (subscription?.endDate) {
            return now > subscription.endDate;
        } else if (user.createdAt) {
            return now > addDays(user.createdAt, 14);
        }
        return false;
    })();

    return (
        <div className="space-y-6 max-w-6xl mx-auto pb-12">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => router.back()}
                        className="p-2 bg-[var(--color-paper-2)] rounded-full border border-[var(--color-rule)] hover:bg-[var(--color-paper-3)] text-[var(--color-ink-2)] transition-colors"
                    >
                        <ArrowLeft strokeWidth={1.5} className="w-5 h-5" />
                    </button>
                    <div>
                        <h1 className="font-heading text-2xl font-bold text-[var(--color-ink)]">Perfil de Usuario</h1>
                        <p className="text-sm text-[var(--color-muted)] break-all">{user.email}</p>
                    </div>
                </div>
                <div className="flex flex-wrap gap-3 items-center sm:justify-end">
                    {user.disabled ? (
                        <>
                            <span className="inline-flex items-center px-3 py-1 bg-[var(--color-danger-soft)] text-[var(--color-danger)] rounded-full text-sm font-medium gap-1">
                                <XCircle strokeWidth={1.5} className="w-4 h-4" /> Suspendido
                            </span>
                            <button
                                onClick={() => handleToggleStatus(user.disabled)}
                                className="text-sm font-medium text-[var(--color-positive)] hover:underline hover:text-[var(--color-positive)]"
                            >
                                Restaurar Acceso
                            </button>
                        </>
                    ) : isExpired ? (
                        <>
                            <span className="inline-flex items-center px-3 py-1 bg-[var(--color-warning-soft)] text-[var(--color-warning)] rounded-full text-sm font-medium gap-1">
                                <AlertCircle strokeWidth={1.5} className="w-4 h-4" /> Prueba Vencida
                            </span>
                            <button
                                onClick={() => handleToggleStatus(user.disabled)}
                                className="text-sm font-medium text-[var(--color-warning)] hover:underline hover:text-[var(--color-warning)]"
                            >
                                Suspender Manualmente
                            </button>
                        </>
                    ) : (
                        <>
                            <span className="inline-flex items-center px-3 py-1 bg-[var(--color-positive-soft)] text-[var(--color-positive)] rounded-full text-sm font-medium gap-1">
                                <CheckCircle strokeWidth={1.5} className="w-4 h-4" /> Activo
                            </span>
                            <button
                                onClick={() => handleToggleStatus(user.disabled)}
                                className="text-sm font-medium text-[var(--color-warning)] hover:underline hover:text-[var(--color-warning)]"
                            >
                                Suspender Manualmente
                            </button>
                        </>
                    )}

                    {user.unsubscribedMarketing && (
                        <span className="inline-flex items-center px-3 py-1 bg-[var(--color-paper-3)] text-[var(--color-ink)] rounded-full text-sm font-medium gap-1">
                            <Mail strokeWidth={1.5} className="w-4 h-4 opacity-70" /> Baja de Marketing
                        </span>
                    )}

                    <span className="text-[var(--color-ink-2)]">|</span>

                    <button
                        id="btn-delete-account"
                        onClick={handleDeleteAccount}
                        className="text-sm font-medium text-[var(--color-danger)] hover:text-[var(--color-danger)] hover:underline flex items-center gap-1 transition-colors"
                    >
                        <Trash2 strokeWidth={1.5} className="w-4 h-4" /> Eliminar Cuenta
                    </button>
                </div>
            </div>

            {/* Tabs Navigation */}
            <div className="border-b border-[var(--color-rule)] overflow-x-auto scrollbar-hide">
                <nav className="flex space-x-8 min-w-max px-2">
                    {[
                        { id: 'resumen', label: 'Resumen General', icon: UserIcon },
                        { id: 'suscripcion', label: 'Plan y Límites', icon: Calendar },
                        { id: 'pagos', label: 'Pagos Manuales', icon: DollarSign },
                        { id: 'correos', label: 'Correos Enviados', icon: Mail }
                    ].map((tab) => (
                        <button
                            key={tab.id}
                            id={`tab-${tab.id}`}
                            onClick={() => setActiveTab(tab.id as 'resumen' | 'suscripcion' | 'pagos' | 'correos')}
                            className={`flex items-center whitespace-nowrap gap-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors ${activeTab === tab.id
                                ? 'border-[var(--color-accent)] text-[var(--color-accent)]'
                                : 'border-transparent text-[var(--color-muted)] hover:text-[var(--color-ink-2)] hover:border-[var(--color-neutral)]'
                                }`}
                        >
                            <tab.icon strokeWidth={1.5} className="w-4 h-4" />
                            {tab.label}
                        </button>
                    ))}
                </nav>
            </div>

            {/* Tab: Resumen */}
            {activeTab === 'resumen' && (
                <div className="grid md:grid-cols-2 gap-6">
                    <div className="bg-[var(--color-paper-2)] rounded-2xl border border-[var(--color-rule)] p-6 shadow-sm">
                        <h3 className="text-lg font-semibold text-[var(--color-ink)] mb-4 border-b pb-2">Datos Personales</h3>
                        <div className="space-y-4">
                            <div>
                                <p className="text-sm text-[var(--color-muted)]">ID Usuario</p>
                                <p className="font-mono text-sm break-all">{user.uid}</p>
                            </div>
                            <div>
                                <p className="text-sm text-[var(--color-muted)]">Nombre</p>
                                <p className="font-medium text-[var(--color-ink)]">{user.displayName || "No especificado"}</p>
                            </div>
                            <div>
                                <p className="text-sm text-[var(--color-muted)]">Email</p>
                                <p className="font-medium text-[var(--color-ink)]">{user.email}</p>
                            </div>
                            <div>
                                <p className="text-sm text-[var(--color-muted)]">Fecha de Registro</p>
                                <p className="text-[var(--color-ink)]">
                                    {user.createdAt
                                        ? format(user.createdAt, "dd 'de' MMMM, yyyy", { locale: es })
                                        : "Desconocida"}
                                </p>
                            </div>
                            <div>
                                <p className="text-sm text-[var(--color-muted)]">Último Acceso</p>
                                <p className="text-[var(--color-ink)]">
                                    {user.lastLogin
                                        ? format(user.lastLogin, "dd/MM/yyyy HH:mm", { locale: es })
                                        : "Nunca"}
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="space-y-6">
                        <div className="bg-[var(--color-paper-2)] rounded-2xl border border-[var(--color-rule)] p-6 shadow-sm">
                            <h3 className="text-lg font-semibold text-[var(--color-ink)] mb-4 border-b pb-2">Uso Actual</h3>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="bg-[var(--color-paper)] p-4 rounded-xl border border-[var(--color-rule-2)] flex items-center gap-3">
                                    <div className="p-2 bg-[var(--color-paper-3)] text-[var(--color-muted)] rounded-full">
                                        <Home strokeWidth={1.5} className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <p className="text-sm text-[var(--color-muted)]">Propiedades</p>
                                        <p className="font-bold text-xl text-[var(--color-ink)]">{usage.properties}</p>
                                    </div>
                                </div>
                                <div className="bg-[var(--color-paper)] p-4 rounded-xl border border-[var(--color-rule-2)] flex items-center gap-3">
                                    <div className="p-2 bg-[var(--color-paper-3)] text-[var(--color-muted)] rounded-full">
                                        <Users strokeWidth={1.5} className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <p className="text-sm text-[var(--color-muted)]">Clientes</p>
                                        <p className="font-bold text-xl text-[var(--color-ink)]">{usage.clients}</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="bg-[var(--color-paper-2)] rounded-2xl border border-[var(--color-rule)] p-6 shadow-sm">
                            <h3 className="text-lg font-semibold text-[var(--color-ink)] mb-4 border-b pb-2">Plan Actual</h3>
                            {subscription ? (
                                <div className="space-y-3">
                                    <div className="flex justify-between items-center">
                                        <span className="text-[var(--color-ink-2)]">Nivel de Plan:</span>
                                        <span className="px-3 py-1 bg-[var(--color-accent-soft)] text-[var(--color-accent)] rounded-full font-medium capitalize">
                                            {subscription.planTier}
                                        </span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span className="text-[var(--color-ink-2)]">Vence:</span>
                                        <span className="font-medium text-[var(--color-ink)]">
                                            {subscription.endDate
                                                ? format(subscription.endDate, "dd/MM/yyyy")
                                                : user.createdAt
                                                    ? `Prueba (Vence ${format(addDays(user.createdAt, 14), "dd/MM/yyyy")})`
                                                    : "Sin fecha definida"}
                                        </span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span className="text-[var(--color-ink-2)]">Estado:</span>
                                        <span className={`capitalize font-medium ${subscription.status === 'active' ? 'text-[var(--color-positive)]' : 'text-[var(--color-danger)]'}`}>
                                            {subscription.status}
                                        </span>
                                    </div>
                                </div>
                            ) : (
                                <div className="p-4 bg-[var(--color-warning-soft)] text-[var(--color-warning)] rounded-xl border border-[var(--color-warning)]/30 flex items-center gap-2">
                                    <AlertCircle strokeWidth={1.5} className="w-5 h-5" />
                                    <span>Este usuario no tiene una suscripción registrada. El sistema aplica límites gratuitos por defecto.</span>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Tab: Suscripcion */}
            {activeTab === 'suscripcion' && (
                <div className="space-y-6 max-w-2xl">
                    <div className="bg-[var(--color-paper-2)] rounded-2xl border border-[var(--color-rule)] p-6 shadow-sm">
                        <h3 className="text-lg font-semibold text-[var(--color-ink)] mb-4 border-b pb-2">Estado Actual</h3>
                        <div className="flex flex-col sm:flex-row gap-8">
                            <div>
                                <p className="text-sm text-[var(--color-muted)] mb-1">Plan de Suscripción</p>
                                <span className="px-3 py-1 bg-[var(--color-accent-soft)] text-[var(--color-accent)] rounded-full font-bold capitalize">
                                    {subscription?.planTier || "Básico"}
                                </span>
                            </div>
                            <div>
                                <p className="text-sm text-[var(--color-muted)] mb-1">Fecha Límite / Vencimiento</p>
                                <p className="font-bold text-[var(--color-ink)] text-lg">
                                    {subscription?.endDate
                                        ? format(subscription.endDate, "dd/MM/yyyy")
                                        : user.createdAt
                                            ? `Prueba (Vence el ${format(addDays(user.createdAt, 14), "dd/MM/yyyy")})`
                                            : "Sin fecha definida"}
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="bg-[var(--color-paper-2)] rounded-2xl border border-[var(--color-rule)] p-6 shadow-sm">
                        <h3 className="text-lg font-semibold text-[var(--color-ink)] mb-6 border-b pb-2">Modificar Plan y Vencimiento</h3>

                        <div className="space-y-6">
                            <div>
                                <label className="block text-sm font-medium text-[var(--color-ink-2)] mb-1">Plan de Suscripción</label>
                                <select
                                    value={planTier}
                                    onChange={(e) => setPlanTier(e.target.value as PlanTier)}
                                    className="w-full px-4 py-2 border border-[var(--color-rule)] rounded-xl focus:ring-2 focus:ring-[var(--color-accent)]/40 transition-shadow outline-none"
                                >
                                    <option value="basic">Plan Básico (Lite/Free)</option>
                                    <option value="professional">Plan Profesional</option>
                                    <option value="enterprise">Plan Enterprise</option>
                                </select>
                                <p className="mt-1 text-xs text-[var(--color-muted)]">Esto determinará a qué funciones tiene acceso y sus límites (ej. cantidad de propiedades).</p>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-[var(--color-ink-2)] mb-1">Fecha de Vencimiento de este Plan</label>
                                <input
                                    type="date"
                                    value={endDate}
                                    onChange={(e) => setEndDate(e.target.value)}
                                    className="w-full px-4 py-2 border border-[var(--color-rule)] rounded-xl focus:ring-2 focus:ring-[var(--color-accent)]/40 transition-shadow outline-none"
                                />
                                <p className="mt-1 text-xs text-[var(--color-muted)]">Superada esta fecha, las acciones de su cuenta se verán limitadas automáticamente hasta que vuelva a pagar.</p>
                            </div>

                            <div className="pt-4 border-t border-[var(--color-rule-2)] flex justify-end">
                                <button
                                    id="btn-save-sub"
                                    onClick={handleUpdateSubscription}
                                    disabled={updatingSub}
                                    className="px-6 py-2 bg-[var(--color-ink)] text-[var(--color-paper)] rounded-xl hover:bg-[var(--color-ink-2)] transition-colors disabled:opacity-50"
                                >
                                    {updatingSub ? "Guardando..." : "Guardar Cambios"}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Tab: Pagos */}
            {activeTab === 'pagos' && (
                <div className="grid lg:grid-cols-3 gap-6">
                    {/* Form to add payment */}
                    <div className="lg:col-span-1 bg-[var(--color-paper-2)] rounded-2xl border border-[var(--color-rule)] p-6 shadow-sm h-fit">
                        <h3 className="text-lg font-semibold text-[var(--color-ink)] mb-4 border-b pb-2">Registrar Pago</h3>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-[var(--color-ink-2)] mb-1">Monto ($)</label>
                                <input
                                    type="number"
                                    value={paymentAmount}
                                    onChange={(e) => setPaymentAmount(e.target.value)}
                                    placeholder="Ej: 15000"
                                    className="w-full px-4 py-2 border border-[var(--color-rule)] rounded-xl focus:ring-2 focus:ring-[var(--color-accent)]/40 transition-shadow outline-none"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-[var(--color-ink-2)] mb-1">Método</label>
                                <select
                                    value={paymentMethod}
                                    onChange={(e) => setPaymentMethod(e.target.value)}
                                    className="w-full px-4 py-2 border border-[var(--color-rule)] rounded-xl"
                                >
                                    <option value="transfer">Transferencia</option>
                                    <option value="cash">Efectivo</option>
                                    <option value="mercadopago">MercadoPago (Manual)</option>
                                    <option value="usd">Dólares (Efectivo)</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-[var(--color-ink-2)] mb-1">Fecha del Pago</label>
                                <input
                                    type="date"
                                    value={paymentDate}
                                    onChange={(e) => setPaymentDate(e.target.value)}
                                    className="w-full px-4 py-2 border border-[var(--color-rule)] rounded-xl"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-[var(--color-ink-2)] mb-1">Descripción / Referencia</label>
                                <input
                                    type="text"
                                    value={paymentDesc}
                                    onChange={(e) => setPaymentDesc(e.target.value)}
                                    placeholder="Ej: Pago Octubre Transferencia BBVA"
                                    className="w-full px-4 py-2 border border-[var(--color-rule)] rounded-xl"
                                />
                            </div>

                            <button
                                id="btn-add-payment"
                                onClick={handleAddPayment}
                                disabled={addingPayment}
                                className="w-full px-4 py-2 bg-[var(--color-positive)] text-[var(--color-accent-ink)] font-medium rounded-xl hover:bg-[var(--color-positive)] transition-colors disabled:opacity-50 mt-2"
                            >
                                {addingPayment ? "Registrando..." : "Registrar Pago"}
                            </button>

                            <p className="text-xs text-[var(--color-muted)] text-center mt-2">
                                Nota: Registrar el pago aquí <span className="font-semibold underline">no extiende</span> automáticamente el plan. Recordá ir a la pestaña "Suscripción" para estirar la fecha de vencimiento si corresponde.
                            </p>
                        </div>
                    </div>

                    {/* Payments List */}
                    <div className="lg:col-span-2 bg-[var(--color-paper-2)] rounded-2xl border border-[var(--color-rule)] overflow-hidden shadow-sm">
                        <div className="p-6 border-b border-[var(--color-rule)]">
                            <h3 className="text-lg font-semibold text-[var(--color-ink)]">Historial de Pagos</h3>
                        </div>

                        {payments.length === 0 ? (
                            <div className="p-8 text-center text-[var(--color-muted)]">
                                No hay pagos registrados para este usuario.
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full text-left text-sm text-[var(--color-ink-2)]">
                                    <thead className="bg-[var(--color-paper)] text-xs uppercase text-[var(--color-ink-2)] border-b border-[var(--color-rule)]">
                                        <tr>
                                            <th className="px-6 py-4 font-semibold">Fecha</th>
                                            <th className="px-6 py-4 font-semibold">Monto</th>
                                            <th className="px-6 py-4 font-semibold">Método</th>
                                            <th className="px-6 py-4 font-semibold">Estado</th>
                                            <th className="px-6 py-4 font-semibold">Referencia</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-[var(--color-rule-2)]">
                                        {payments.map((payment) => (
                                            <tr key={payment.id} className="hover:bg-[var(--color-paper-3)] transition-colors">
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    {format(new Date(payment.createdAt.seconds * 1000), "dd/MM/yy")}
                                                </td>
                                                <td className="px-6 py-4 font-medium text-[var(--color-ink)]">
                                                    ${Number(payment.amount).toLocaleString('es-AR')}
                                                </td>
                                                <td className="px-6 py-4 capitalize">
                                                    {payment.paymentMethod}
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span className={`px-2 py-1 text-xs rounded-full font-medium ${payment.status === 'completed' ? 'bg-[var(--color-positive-soft)] text-[var(--color-positive)]' :
                                                        payment.status === 'pending' ? 'bg-[var(--color-warning-soft)] text-[var(--color-warning)]' :
                                                            'bg-[var(--color-danger-soft)] text-[var(--color-danger)]'
                                                        }`}>
                                                        {payment.status}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 text-xs text-[var(--color-muted)] max-w-[200px] truncate">
                                                    {payment.description || payment.providerPaymentId || "-"}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Tab: Correos */}
            {activeTab === 'correos' && (
                <div className="bg-[var(--color-paper-2)] rounded-2xl border border-[var(--color-rule)] overflow-hidden shadow-sm">
                    <div className="p-6 border-b border-[var(--color-rule)] flex flex-col md:flex-row justify-between items-center gap-4">
                        <h3 className="text-lg font-semibold text-[var(--color-ink)]">Correos Enviados a {user.email}</h3>

                        <div className="flex items-center gap-2">
                            <span className="text-xs font-medium text-[var(--color-muted)] uppercase">Enviar Nuevo:</span>
                            <select
                                className={`px-3 py-2 border border-[var(--color-rule)] rounded-xl text-sm font-medium focus:outline-none transition-all outline-none ${user.unsubscribedMarketing ? 'bg-[var(--color-paper)] text-[var(--color-neutral)] cursor-not-allowed border-[var(--color-rule)]' : 'bg-[var(--color-paper-2)] text-[var(--color-ink-2)] cursor-pointer hover:border-[var(--color-accent)]/30 shadow-sm focus:ring-2 focus:ring-[var(--color-accent)]/40'}`}
                                onChange={(e) => {
                                    const val = e.target.value;
                                    if (val) {
                                        const text = e.target.options[e.target.selectedIndex].text;
                                        handleSendMarketingEmail(val, text);
                                        e.target.value = ""; // reset selection
                                    }
                                }}
                                disabled={user.unsubscribedMarketing}
                                defaultValue=""
                            >
                                <option value="" disabled>{user.unsubscribedMarketing ? "No mails (Baja)" : "Seleccionar Plantilla..."}</option>
                                {Object.entries(DEFAULT_TEMPLATES_MINIMAL).map(([key, name]) => (
                                    <option key={key} value={key}>{name}</option>
                                ))}
                                {customTemplates.filter(t => !DEFAULT_TEMPLATES_MINIMAL[t.type]).map(t => (
                                    <option key={t.type} value={t.type}>{t.name}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {sentEmails.length === 0 ? (
                        <div className="p-8 text-center text-[var(--color-muted)]">
                            No se han guardado registros de correos para este usuario.
                        </div>
                    ) : (
                        <>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left font-sans">
                                <thead className="bg-[var(--color-paper)] text-xs text-[var(--color-muted)] uppercase font-semibold border-b">
                                    <tr>
                                        <th className="px-6 py-4">Fecha Evento</th>
                                        <th className="px-6 py-4">Status</th>
                                        <th className="px-6 py-4">Asunto / Tipo</th>
                                        <th className="px-6 py-4">Error (Si aplica)</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-[var(--color-rule-2)] text-sm">
                                    {sentEmails.slice(emailPage * EMAIL_PAGE_SIZE, (emailPage + 1) * EMAIL_PAGE_SIZE).map((email) => (
                                        <tr key={email.id} className="hover:bg-[var(--color-paper-3)] transition-colors">
                                            <td className="px-6 py-4 whitespace-nowrap text-[var(--color-muted)]">
                                                {format(new Date(email.sentAt), "dd/MM/yyyy HH:mm")}
                                            </td>
                                            <td className="px-6 py-4 text-[var(--color-ink)]">
                                                {email.status === 'sent' ? (
                                                    <span className="inline-flex items-center gap-1 text-[var(--color-positive)] bg-[var(--color-positive-soft)] px-2 py-1 rounded-md text-xs font-medium border border-[var(--color-positive)]/30">
                                                        <CheckCircle strokeWidth={1.5} className="w-3 h-3" /> Exitoso
                                                    </span>
                                                ) : (
                                                    <span className="inline-flex items-center gap-1 text-[var(--color-danger)] bg-[var(--color-danger-soft)] px-2 py-1 rounded-md text-xs font-medium border border-[var(--color-danger)]/30">
                                                        <XCircle strokeWidth={1.5} className="w-3 h-3" /> Fallo
                                                    </span>
                                                )}
                                            </td>
                                            <td className="px-6 py-4">
                                                <p className="font-medium text-[var(--color-ink)] text-sm">{email.subject}</p>
                                                <p className="text-xs text-[var(--color-accent)] mt-1 uppercase font-mono">{email.type}</p>
                                            </td>
                                            <td className="px-6 py-4 text-xs text-[var(--color-danger)] max-w-[250px] truncate">
                                                {email.error || "-"}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                        {sentEmails.length > EMAIL_PAGE_SIZE && (
                            <div className="px-6 py-4 border-t border-[var(--color-rule-2)] flex items-center justify-between text-sm text-[var(--color-muted)]">
                                <span>{emailPage * EMAIL_PAGE_SIZE + 1}–{Math.min((emailPage + 1) * EMAIL_PAGE_SIZE, sentEmails.length)} de {sentEmails.length}</span>
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => setEmailPage(p => p - 1)}
                                        disabled={emailPage === 0}
                                        className="px-3 py-1 rounded-lg border border-[var(--color-rule)] hover:bg-[var(--color-paper-3)] disabled:opacity-40 disabled:cursor-not-allowed transition"
                                    >
                                        ← Anterior
                                    </button>
                                    <button
                                        onClick={() => setEmailPage(p => p + 1)}
                                        disabled={(emailPage + 1) * EMAIL_PAGE_SIZE >= sentEmails.length}
                                        className="px-3 py-1 rounded-lg border border-[var(--color-rule)] hover:bg-[var(--color-paper-3)] disabled:opacity-40 disabled:cursor-not-allowed transition"
                                    >
                                        Siguiente →
                                    </button>
                                </div>
                            </div>
                        )}
                        </>
                    )}
                </div>
            )}
        </div>
    );
}
