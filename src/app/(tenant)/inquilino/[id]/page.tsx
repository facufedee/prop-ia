"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { alquileresService } from "@/infrastructure/services/alquileresService";
import { Alquiler } from "@/domain/models/Alquiler";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { Download, AlertCircle, CheckCircle2, Clock, Calendar, Building2, User, ChevronRight } from "lucide-react";

export default function TenantDashboardPage() {
    const params = useParams();
    const router = useRouter();
    const [rental, setRental] = useState<Alquiler | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        const fetchRental = async () => {
            if (!params.id) return;

            // Security Check
            const sessionRaw = sessionStorage.getItem("zeta_tenant_session");
            if (!sessionRaw) {
                router.replace('/inquilino');
                return;
            }

            try {
                const session = JSON.parse(sessionRaw);
                // Verify ID match
                if (session.allowedId !== params.id) {
                    throw new Error("Acceso no autorizado");
                }
                // Verify expiration (e.g., 2 hours)
                const TWO_HOURS = 2 * 60 * 60 * 1000;
                if (Date.now() - session.timestamp > TWO_HOURS) {
                    sessionStorage.removeItem("zeta_tenant_session");
                    router.replace('/inquilino');
                    return;
                }

                // Proceed to fetch
                const data = await alquileresService.getAlquilerById(params.id as string);

                if (!data) {
                    throw new Error("Contrato no encontrado");
                }
                setRental(data);
            } catch (err: any) {
                setError("No tenés permiso para ver este contrato o la sesión expiró.");
                console.error(err);
                if (err.message === "Acceso no autorizado") {
                    router.replace('/inquilino');
                }
            } finally {
                setLoading(false);
            }
        };

        fetchRental();
    }, [params.id, router]);

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
            </div>
        );
    }

    if (error || !rental) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
                <div className="bg-white p-8 rounded-2xl shadow-lg text-center max-w-md">
                    <div className="mx-auto w-12 h-12 bg-red-100 rounded-full flex items-center justify-center text-red-600 mb-4">
                        <AlertCircle size={24} />
                    </div>
                    <h2 className="text-xl font-bold text-gray-900 mb-2">Error de Acceso</h2>
                    <p className="text-gray-600 mb-6">{error || "No se encontró el contrato solicitado."}</p>
                    <button
                        onClick={() => router.push('/inquilino')}
                        className="bg-indigo-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-indigo-700 transition"
                    >
                        Volver al inicio
                    </button>
                </div>
            </div>
        );
    }

    const formatDate = (date: Date | any) => {
        if (!date) return "-";
        const d = new Date(date);
        return format(d, "dd 'de' MMMM 'de' yyyy", { locale: es });
    };

    const formatMoney = (amount: number) => {
        return new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS" }).format(amount);
    };

    return (
        <div className="min-h-screen bg-gray-50 pb-20">
            {/* Header */}
            <div className="bg-indigo-900 text-white pb-16 pt-8 px-4 md:px-8">
                <div className="max-w-4xl mx-auto">
                    <div className="flex justify-between items-start mb-6">
                        <div>
                            <h1 className="text-2xl font-bold mb-1">Detalle de Alquiler</h1>
                            <p className="text-indigo-200 text-sm">Contrato #{rental.codigoAlquiler || 'S/C'}</p>
                        </div>
                        <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide 
                            ${rental.estado === 'activo' ? 'bg-green-500/20 text-green-200 border border-green-500/30' : 'bg-gray-500/20 text-gray-200'}`}>
                            {rental.estado}
                        </span>
                    </div>
                </div>
            </div>

            <div className="max-w-4xl mx-auto px-4 md:px-8 -mt-10 space-y-6">

                {/* Property Card */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                    <div className="p-6">
                        <div className="flex items-start gap-4">
                            <div className="p-3 bg-indigo-50 rounded-xl text-indigo-600">
                                <Building2 size={24} />
                            </div>
                            <div className="flex-1">
                                <h2 className="text-lg font-bold text-gray-900">{rental.direccion}</h2>
                                <p className="text-gray-500 text-sm mb-4">{rental.propiedadTipo}</p>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm mt-4 pt-4 border-t border-gray-50">
                                    <div className="flex items-center gap-2 text-gray-700">
                                        <Calendar size={16} className="text-gray-400" />
                                        <span>Inicio: {formatDate(rental.fechaInicio)}</span>
                                    </div>
                                    <div className="flex items-center gap-2 text-gray-700">
                                        <Calendar size={16} className="text-gray-400" />
                                        <span>Fin: {formatDate(rental.fechaFin)}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Tenant & Owner Info */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
                                <User size={20} />
                            </div>
                            <h3 className="font-bold text-gray-900">Inquilino</h3>
                        </div>
                        <div className="space-y-2 text-sm">
                            <p className="text-gray-500">Nombre</p>
                            <p className="font-medium text-gray-900">{rental.nombreInquilino}</p>
                            <p className="text-gray-500 mt-2">DNI</p>
                            <p className="font-medium text-gray-900">{rental.dniInquilino || '-'}</p>
                        </div>
                    </div>

                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="p-2 bg-purple-50 text-purple-600 rounded-lg">
                                <User size={20} />
                            </div>
                            <h3 className="font-bold text-gray-900">Propietario</h3>
                        </div>
                        <div className="space-y-2 text-sm">
                            <p className="text-gray-500">Nombre</p>
                            <p className="font-medium text-gray-900">{rental.nombrePropietario || 'No especificado'}</p>
                            <p className="text-gray-500 mt-2">Email</p>
                            <p className="font-medium text-gray-900">{rental.emailPropietario || '-'}</p>
                        </div>
                    </div>
                </div>

                {/* Payments Section */}
                <div className="space-y-8">
                    {(() => {
                        if (!rental) return null;

                        // ---------------------------------------------------------
                        // Logic mirrored from PaymentPlanTable.tsx
                        // ---------------------------------------------------------
                        const parseDateSafe = (dateStr: Date | string) => {
                            if (typeof dateStr === 'string') {
                                if (dateStr.includes('T')) return new Date(dateStr);
                                return new Date(dateStr + 'T12:00:00');
                            }
                            return new Date(dateStr);
                        };

                        const start = new Date(rental.fechaInicio);
                        // Standardize start/end to avoid timezone shifts
                        // We use the same helpers as Admin but streamlined here

                        const generatePeriods = () => {
                            // Helper from Admin Dashboard
                            const toMonthStart = (d: Date) => new Date(d.getFullYear(), d.getMonth(), 1);

                            const startDate = toMonthStart(parseDateSafe(rental.fechaInicio));
                            const endDate = toMonthStart(parseDateSafe(rental.fechaFin));

                            const paymentMap = new Map(
                                rental.historialPagos.map(p => [p.mes, p])
                            );

                            const allPeriods = [];
                            let current = startDate;
                            let limit = 0;

                            while (current <= endDate && limit < 60) {
                                const periodKey = format(current, 'yyyy-MM');
                                const existing = paymentMap.get(periodKey);

                                if (existing) {
                                    allPeriods.push(existing);
                                } else {
                                    // Create projected payment
                                    const day = (rental.diaVencimiento && rental.diaVencimiento > 0 && rental.diaVencimiento <= 31)
                                        ? rental.diaVencimiento
                                        : 10;

                                    allPeriods.push({
                                        id: `proj-${periodKey}`,
                                        mes: periodKey,
                                        monto: rental.montoMensual,
                                        fechaVencimiento: new Date(current.getFullYear(), current.getMonth(), day),
                                        estado: 'pendiente'
                                    });
                                }
                                current = new Date(current.getFullYear(), current.getMonth() + 1, 1);
                                limit++;
                            }
                            return allPeriods;
                        };

                        const periods = generatePeriods();

                        // Sort: Pending (Oldest first), Paid (Newest first)
                        const pendingPayments = periods.filter(p => p.estado !== 'pagado')
                            .sort((a, b) => new Date(a.mes).getTime() - new Date(b.mes).getTime());

                        const paidPayments = periods.filter(p => p.estado === 'pagado')
                            .sort((a, b) => new Date(b.mes).getTime() - new Date(a.mes).getTime());

                        return (
                            <>
                                {/* Pending Payments */}
                                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                                    <div className="p-6 border-b border-amber-50 bg-amber-50/30 flex justify-between items-center">
                                        <div className="flex items-center gap-3">
                                            <div className="p-2 bg-amber-100/50 text-amber-600 rounded-lg">
                                                <AlertCircle size={20} />
                                            </div>
                                            <h3 className="font-bold text-gray-900">Próximos Vencimientos</h3>
                                        </div>
                                        {pendingPayments.length > 0 && (
                                            <span className="bg-amber-100 text-amber-700 px-3 py-1 rounded-full text-xs font-bold">
                                                {pendingPayments.length} Pendientes
                                            </span>
                                        )}
                                    </div>

                                    <div className="overflow-x-auto">
                                        <table className="w-full text-sm text-left">
                                            <thead className="bg-gray-50 text-gray-500 font-medium">
                                                <tr>
                                                    <th className="px-6 py-3">Periodo</th>
                                                    <th className="px-6 py-3">Vencimiento</th>
                                                    <th className="px-6 py-3">Importe</th>
                                                    <th className="px-6 py-3">Estado</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-gray-50">
                                                {pendingPayments.length > 0 ? (
                                                    pendingPayments.map((pago: any) => (
                                                        <tr key={pago.id} className="hover:bg-amber-50/30 transition">
                                                            <td className="px-6 py-4 font-medium text-gray-900 capitalize">
                                                                {format(new Date(pago.mes + "-02"), "MMMM yyyy", { locale: es })}
                                                            </td>
                                                            <td className="px-6 py-4 text-gray-600">
                                                                {formatDate(pago.fechaVencimiento)}
                                                            </td>
                                                            <td className="px-6 py-4 font-bold text-gray-900">
                                                                {formatMoney(pago.monto)}
                                                            </td>
                                                            <td className="px-6 py-4">
                                                                <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase
                                                                    ${pago.estado === 'vencido' ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'}`}>
                                                                    <Clock size={12} />
                                                                    {pago.estado}
                                                                </span>
                                                            </td>
                                                        </tr>
                                                    ))
                                                ) : (
                                                    <tr>
                                                        <td colSpan={4} className="px-6 py-12 text-center">
                                                            <div className="flex flex-col items-center justify-center text-gray-400">
                                                                <CheckCircle2 size={32} className="text-green-500 mb-2 opacity-50" />
                                                                <p>¡Estás al día! No hay pagos pendientes.</p>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                )}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>

                                {/* Payment History */}
                                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                                    <div className="p-6 border-b border-gray-50 flex justify-between items-center">
                                        <div className="flex items-center gap-3">
                                            <div className="p-2 bg-green-50 text-green-600 rounded-lg">
                                                <CheckCircle2 size={20} />
                                            </div>
                                            <h3 className="font-bold text-gray-900">Historial de Pagos</h3>
                                        </div>
                                    </div>

                                    <div className="overflow-x-auto">
                                        <table className="w-full text-sm text-left">
                                            <thead className="bg-gray-50 text-gray-500 font-medium">
                                                <tr>
                                                    <th className="px-6 py-3">Mes</th>
                                                    <th className="px-6 py-3">Pagado el</th>
                                                    <th className="px-6 py-3">Monto</th>
                                                    <th className="px-6 py-3">Estado</th>
                                                    <th className="px-6 py-3 w-10"></th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-gray-50">
                                                {paidPayments.length > 0 ? (
                                                    paidPayments.map((pago: any) => (
                                                        <tr key={pago.id} className="hover:bg-gray-50/50 transition">
                                                            <td className="px-6 py-4 font-medium text-gray-900 capitalize">
                                                                {format(new Date(pago.mes + "-02"), "MMMM yyyy", { locale: es })}
                                                            </td>
                                                            <td className="px-6 py-4 text-gray-500">
                                                                {pago.fechaPago ? formatDate(pago.fechaPago) : '-'}
                                                            </td>
                                                            <td className="px-6 py-4 font-medium text-gray-900">
                                                                {formatMoney(pago.monto)}
                                                            </td>
                                                            <td className="px-6 py-4">
                                                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold uppercase bg-green-100 text-green-700">
                                                                    <CheckCircle2 size={12} />
                                                                    Pagado
                                                                </span>
                                                            </td>
                                                            <td className="px-6 py-4 text-right">
                                                                {/* Future: Download Receipt Button */}
                                                            </td>
                                                        </tr>
                                                    ))
                                                ) : (
                                                    <tr>
                                                        <td colSpan={5} className="px-6 py-8 text-center text-gray-400">
                                                            No hay pagos registrados aún.
                                                        </td>
                                                    </tr>
                                                )}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            </>
                        );
                    })()}
                </div>

                <div className="flex justify-center pt-8">
                    <p className="text-gray-400 text-xs">
                        Esta información es privada y confidencial.
                    </p>
                </div>
            </div>
        </div>
    );
}
