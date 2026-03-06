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
            const data = await adminService.getUserProfileData(uid);
            setProfileData(data);

            if (data.subscription) {
                setPlanTier(data.subscription.planTier);
                setEndDate(data.subscription.endDate ? data.subscription.endDate.toISOString().split('T')[0] : "");
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
        if (!confirm("🚨 ATENCIÓN: ¿Estás seguro de ELIMINAR PERMANENTEMENTE toda la cuenta y los datos de este usuario? Esta acción es irreversible.")) return;

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
                <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
            </div>
        );
    }

    if (!profileData) {
        return <div className="p-8 text-center text-red-500">Usuario no encontrado</div>;
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
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => router.back()}
                        className="p-2 bg-white rounded-full border border-gray-200 hover:bg-gray-50 text-gray-600 transition-colors"
                    >
                        <ArrowLeft className="w-5 h-5" />
                    </button>
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">Perfil de Usuario</h1>
                        <p className="text-sm text-gray-500">{user.email}</p>
                    </div>
                </div>
                <div className="flex gap-4 items-center">
                    {user.disabled ? (
                        <>
                            <span className="inline-flex items-center px-3 py-1 bg-red-100 text-red-800 rounded-full text-sm font-medium gap-1">
                                <XCircle className="w-4 h-4" /> Suspendido
                            </span>
                            <button
                                onClick={() => handleToggleStatus(user.disabled)}
                                className="text-sm font-medium text-green-600 hover:underline hover:text-green-700"
                            >
                                Restaurar Acceso
                            </button>
                        </>
                    ) : isExpired ? (
                        <>
                            <span className="inline-flex items-center px-3 py-1 bg-orange-100 text-orange-800 rounded-full text-sm font-medium gap-1">
                                <AlertCircle className="w-4 h-4" /> Prueba Vencida
                            </span>
                            <button
                                onClick={() => handleToggleStatus(user.disabled)}
                                className="text-sm font-medium text-amber-600 hover:underline hover:text-amber-700"
                            >
                                Suspender Manualmente
                            </button>
                        </>
                    ) : (
                        <>
                            <span className="inline-flex items-center px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-medium gap-1">
                                <CheckCircle className="w-4 h-4" /> Activo
                            </span>
                            <button
                                onClick={() => handleToggleStatus(user.disabled)}
                                className="text-sm font-medium text-amber-600 hover:underline hover:text-amber-700"
                            >
                                Suspender Manualmente
                            </button>
                        </>
                    )}

                    {user.unsubscribedMarketing && (
                        <span className="inline-flex items-center px-3 py-1 bg-gray-100 text-gray-800 rounded-full text-sm font-medium gap-1">
                            <Mail className="w-4 h-4 opacity-70" /> Baja de Marketing
                        </span>
                    )}

                    <span className="text-gray-200">|</span>

                    <button
                        onClick={handleDeleteAccount}
                        className="text-sm font-medium text-red-500 hover:text-red-700 hover:underline flex items-center gap-1 transition-colors"
                    >
                        <Trash2 className="w-4 h-4" /> Eliminar Cuenta
                    </button>
                </div>
            </div>

            {/* Tabs Navigation */}
            <div className="border-b border-gray-200">
                <nav className="flex space-x-8">
                    {[
                        { id: 'resumen', label: 'Resumen General', icon: UserIcon },
                        { id: 'suscripcion', label: 'Plan y Límites', icon: Calendar },
                        { id: 'pagos', label: 'Pagos Manuales', icon: DollarSign },
                        { id: 'correos', label: 'Correos Enviados', icon: Mail }
                    ].map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id as 'resumen' | 'suscripcion' | 'pagos' | 'correos')}
                            className={`flex items-center gap-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors ${activeTab === tab.id
                                ? 'border-indigo-500 text-indigo-600'
                                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                }`}
                        >
                            <tab.icon className="w-4 h-4" />
                            {tab.label}
                        </button>
                    ))}
                </nav>
            </div>

            {/* Tab: Resumen */}
            {activeTab === 'resumen' && (
                <div className="grid md:grid-cols-2 gap-6">
                    <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
                        <h3 className="text-lg font-semibold text-gray-900 mb-4 border-b pb-2">Datos Personales</h3>
                        <div className="space-y-4">
                            <div>
                                <p className="text-sm text-gray-500">ID Usuario</p>
                                <p className="font-mono text-sm break-all">{user.uid}</p>
                            </div>
                            <div>
                                <p className="text-sm text-gray-500">Nombre</p>
                                <p className="font-medium text-gray-900">{user.displayName || "No especificado"}</p>
                            </div>
                            <div>
                                <p className="text-sm text-gray-500">Email</p>
                                <p className="font-medium text-gray-900">{user.email}</p>
                            </div>
                            <div>
                                <p className="text-sm text-gray-500">Fecha de Registro</p>
                                <p className="text-gray-900">
                                    {user.createdAt
                                        ? format(user.createdAt, "dd 'de' MMMM, yyyy", { locale: es })
                                        : "Desconocida"}
                                </p>
                            </div>
                            <div>
                                <p className="text-sm text-gray-500">Último Acceso</p>
                                <p className="text-gray-900">
                                    {user.lastLogin
                                        ? format(user.lastLogin, "dd/MM/yyyy HH:mm", { locale: es })
                                        : "Nunca"}
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="space-y-6">
                        <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
                            <h3 className="text-lg font-semibold text-gray-900 mb-4 border-b pb-2">Uso Actual</h3>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="bg-gray-50 p-4 rounded-xl border border-gray-100 flex items-center gap-3">
                                    <div className="p-2 bg-blue-100 text-blue-600 rounded-lg">
                                        <Home className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <p className="text-sm text-gray-500">Propiedades</p>
                                        <p className="font-bold text-xl text-gray-900">{usage.properties}</p>
                                    </div>
                                </div>
                                <div className="bg-gray-50 p-4 rounded-xl border border-gray-100 flex items-center gap-3">
                                    <div className="p-2 bg-purple-100 text-purple-600 rounded-lg">
                                        <Users className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <p className="text-sm text-gray-500">Clientes</p>
                                        <p className="font-bold text-xl text-gray-900">{usage.clients}</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
                            <h3 className="text-lg font-semibold text-gray-900 mb-4 border-b pb-2">Plan Actual</h3>
                            {subscription ? (
                                <div className="space-y-3">
                                    <div className="flex justify-between items-center">
                                        <span className="text-gray-600">Nivel de Plan:</span>
                                        <span className="px-3 py-1 bg-indigo-100 text-indigo-700 rounded-full font-medium capitalize">
                                            {subscription.planTier}
                                        </span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span className="text-gray-600">Vence:</span>
                                        <span className="font-medium text-gray-900">
                                            {subscription.endDate
                                                ? format(subscription.endDate, "dd/MM/yyyy")
                                                : user.createdAt
                                                    ? `Prueba (Vence ${format(addDays(user.createdAt, 14), "dd/MM/yyyy")})`
                                                    : "Sin fecha definida"}
                                        </span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span className="text-gray-600">Estado:</span>
                                        <span className={`capitalize font-medium ${subscription.status === 'active' ? 'text-green-600' : 'text-red-500'}`}>
                                            {subscription.status}
                                        </span>
                                    </div>
                                </div>
                            ) : (
                                <div className="p-4 bg-yellow-50 text-yellow-800 rounded-xl border border-yellow-200 flex items-center gap-2">
                                    <AlertCircle className="w-5 h-5" />
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
                    <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
                        <h3 className="text-lg font-semibold text-gray-900 mb-4 border-b pb-2">Estado Actual</h3>
                        <div className="flex flex-col sm:flex-row gap-8">
                            <div>
                                <p className="text-sm text-gray-500 mb-1">Plan de Suscripción</p>
                                <span className="px-3 py-1 bg-indigo-100 text-indigo-700 rounded-full font-bold capitalize">
                                    {subscription?.planTier || "Básico"}
                                </span>
                            </div>
                            <div>
                                <p className="text-sm text-gray-500 mb-1">Fecha Límite / Vencimiento</p>
                                <p className="font-bold text-gray-900 text-lg">
                                    {subscription?.endDate
                                        ? format(subscription.endDate, "dd/MM/yyyy")
                                        : user.createdAt
                                            ? `Prueba (Vence el ${format(addDays(user.createdAt, 14), "dd/MM/yyyy")})`
                                            : "Sin fecha definida"}
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
                        <h3 className="text-lg font-semibold text-gray-900 mb-6 border-b pb-2">Modificar Plan y Vencimiento</h3>

                        <div className="space-y-6">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Plan de Suscripción</label>
                                <select
                                    value={planTier}
                                    onChange={(e) => setPlanTier(e.target.value as PlanTier)}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 transition-shadow outline-none"
                                >
                                    <option value="basic">Plan Básico (Lite/Free)</option>
                                    <option value="professional">Plan Profesional</option>
                                    <option value="enterprise">Plan Enterprise</option>
                                </select>
                                <p className="mt-1 text-xs text-gray-500">Esto determinará a qué funciones tiene acceso y sus límites (ej. cantidad de propiedades).</p>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Fecha de Vencimiento de este Plan</label>
                                <input
                                    type="date"
                                    value={endDate}
                                    onChange={(e) => setEndDate(e.target.value)}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 transition-shadow outline-none"
                                />
                                <p className="mt-1 text-xs text-gray-500">Superada esta fecha, las acciones de su cuenta se verán limitadas automáticamente hasta que vuelva a pagar.</p>
                            </div>

                            <div className="pt-4 border-t border-gray-100 flex justify-end">
                                <button
                                    onClick={handleUpdateSubscription}
                                    disabled={updatingSub}
                                    className="px-6 py-2 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-colors disabled:opacity-50"
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
                    <div className="lg:col-span-1 bg-white rounded-2xl border border-gray-200 p-6 shadow-sm h-fit">
                        <h3 className="text-lg font-semibold text-gray-900 mb-4 border-b pb-2">Registrar Pago</h3>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Monto ($)</label>
                                <input
                                    type="number"
                                    value={paymentAmount}
                                    onChange={(e) => setPaymentAmount(e.target.value)}
                                    placeholder="Ej: 15000"
                                    className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 transition-shadow outline-none"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Método</label>
                                <select
                                    value={paymentMethod}
                                    onChange={(e) => setPaymentMethod(e.target.value)}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-xl"
                                >
                                    <option value="transfer">Transferencia</option>
                                    <option value="cash">Efectivo</option>
                                    <option value="mercadopago">MercadoPago (Manual)</option>
                                    <option value="usd">Dólares (Efectivo)</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Fecha del Pago</label>
                                <input
                                    type="date"
                                    value={paymentDate}
                                    onChange={(e) => setPaymentDate(e.target.value)}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-xl"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Descripción / Referencia</label>
                                <input
                                    type="text"
                                    value={paymentDesc}
                                    onChange={(e) => setPaymentDesc(e.target.value)}
                                    placeholder="Ej: Pago Octubre Transferencia BBVA"
                                    className="w-full px-4 py-2 border border-gray-300 rounded-xl"
                                />
                            </div>

                            <button
                                onClick={handleAddPayment}
                                disabled={addingPayment}
                                className="w-full px-4 py-2 bg-green-600 text-white font-medium rounded-xl hover:bg-green-700 transition-colors disabled:opacity-50 mt-2"
                            >
                                {addingPayment ? "Registrando..." : "Registrar Pago"}
                            </button>

                            <p className="text-xs text-gray-500 text-center mt-2">
                                Nota: Registrar el pago aquí <span className="font-semibold underline">no extiende</span> automáticamente el plan. Recordá ir a la pestaña "Suscripción" para estirar la fecha de vencimiento si corresponde.
                            </p>
                        </div>
                    </div>

                    {/* Payments List */}
                    <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
                        <div className="p-6 border-b border-gray-200">
                            <h3 className="text-lg font-semibold text-gray-900">Historial de Pagos</h3>
                        </div>

                        {payments.length === 0 ? (
                            <div className="p-8 text-center text-gray-500">
                                No hay pagos registrados para este usuario.
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full text-left text-sm text-gray-600">
                                    <thead className="bg-gray-50 text-xs uppercase text-gray-700 border-b border-gray-200">
                                        <tr>
                                            <th className="px-6 py-4 font-semibold">Fecha</th>
                                            <th className="px-6 py-4 font-semibold">Monto</th>
                                            <th className="px-6 py-4 font-semibold">Método</th>
                                            <th className="px-6 py-4 font-semibold">Estado</th>
                                            <th className="px-6 py-4 font-semibold">Referencia</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100">
                                        {payments.map((payment) => (
                                            <tr key={payment.id} className="hover:bg-gray-50/50 transition-colors">
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    {format(new Date(payment.createdAt.seconds * 1000), "dd/MM/yy")}
                                                </td>
                                                <td className="px-6 py-4 font-medium text-gray-900">
                                                    ${Number(payment.amount).toLocaleString('es-AR')}
                                                </td>
                                                <td className="px-6 py-4 capitalize">
                                                    {payment.paymentMethod}
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span className={`px-2 py-1 text-xs rounded-full font-medium ${payment.status === 'completed' ? 'bg-green-100 text-green-700' :
                                                        payment.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                                                            'bg-red-100 text-red-700'
                                                        }`}>
                                                        {payment.status}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 text-xs text-gray-500 max-w-[200px] truncate">
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
                <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
                    <div className="p-6 border-b border-gray-200 flex flex-col md:flex-row justify-between items-center gap-4">
                        <h3 className="text-lg font-semibold text-gray-900">Correos Enviados a {user.email}</h3>

                        <div className="flex items-center gap-2">
                            <span className="text-xs font-medium text-gray-500 uppercase">Enviar Nuevo:</span>
                            <select
                                className={`px-3 py-2 border border-gray-200 rounded-xl text-sm font-medium focus:outline-none transition-all outline-none ${user.unsubscribedMarketing ? 'bg-gray-50 text-gray-400 cursor-not-allowed border-gray-200' : 'bg-white text-gray-700 cursor-pointer hover:border-indigo-300 shadow-sm focus:ring-2 focus:ring-indigo-500'}`}
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
                                <option value="welcome">1. Bienvenida</option>
                                <option value="activation">2. Activación</option>
                                <option value="value">3. Valor (Liquidaciones)</option>
                                <option value="social">4. Prueba Social</option>
                                <option value="conversion">5. Conversión</option>
                                <option value="promotion">6. Promocional (Old)</option>
                                <option value="crm_portal">7. CRM + Portal</option>
                            </select>
                        </div>
                    </div>

                    {sentEmails.length === 0 ? (
                        <div className="p-8 text-center text-gray-500">
                            No se han guardado registros de correos para este usuario.
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-left font-sans">
                                <thead className="bg-gray-50 text-xs text-gray-500 uppercase font-semibold border-b">
                                    <tr>
                                        <th className="px-6 py-4">Fecha Evento</th>
                                        <th className="px-6 py-4">Status</th>
                                        <th className="px-6 py-4">Asunto / Tipo</th>
                                        <th className="px-6 py-4">Error (Si aplica)</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100 text-sm">
                                    {sentEmails.map((email) => (
                                        <tr key={email.id} className="hover:bg-gray-50 transition-colors">
                                            <td className="px-6 py-4 whitespace-nowrap text-gray-500">
                                                {format(new Date(email.sentAt), "dd/MM/yyyy HH:mm")}
                                            </td>
                                            <td className="px-6 py-4 text-gray-900">
                                                {email.status === 'success' ? (
                                                    <span className="inline-flex items-center gap-1 text-green-600 bg-green-50 px-2 py-1 rounded-md text-xs font-medium border border-green-200">
                                                        <CheckCircle className="w-3 h-3" /> Exitoso
                                                    </span>
                                                ) : (
                                                    <span className="inline-flex items-center gap-1 text-red-600 bg-red-50 px-2 py-1 rounded-md text-xs font-medium border border-red-200">
                                                        <XCircle className="w-3 h-3" /> Fallo
                                                    </span>
                                                )}
                                            </td>
                                            <td className="px-6 py-4">
                                                <p className="font-medium text-gray-900 text-sm">{email.subject}</p>
                                                <p className="text-xs text-indigo-500 mt-1 uppercase font-mono">{email.templateKey}</p>
                                            </td>
                                            <td className="px-6 py-4 text-xs text-red-500 max-w-[250px] truncate">
                                                {email.error || "-"}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
