"use client";

import { Pago } from "@/domain/models/Alquiler";
import { CheckCircle, XCircle, Clock } from "lucide-react";

interface PaymentTableProps {
    payments: Pago[];
    onRegisterPayment: (pagoId: string) => void;
}

export default function PaymentTable({ payments, onRegisterPayment }: PaymentTableProps) {
    const getEstadoIcon = (estado: string) => {
        switch (estado) {
            case 'pagado':
                return <CheckCircle className="w-5 h-5 text-green-600" />;
            case 'vencido':
                return <XCircle className="w-5 h-5 text-red-600" />;
            default:
                return <Clock className="w-5 h-5 text-yellow-600" />;
        }
    };

    const getEstadoBadge = (estado: string) => {
        const styles = {
            pagado: "bg-green-100 text-green-700",
            vencido: "bg-red-100 text-red-700",
            pendiente: "bg-yellow-100 text-yellow-700",
        };
        return styles[estado as keyof typeof styles] || styles.pendiente;
    };

    return (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto">
                <table className="w-full">
                    <thead className="bg-gray-50 border-b border-gray-200">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Período
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Monto
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Vencimiento
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Fecha Pago
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Estado
                            </th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Acciones
                            </th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {payments.length === 0 ? (
                            <tr>
                                <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                                    No hay pagos registrados
                                </td>
                            </tr>
                        ) : (
                            payments.map((pago) => (
                                <tr key={pago.id} className="hover:bg-gray-50 transition-colors">
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-2">
                                            {getEstadoIcon(pago.estado)}
                                            <span className="text-sm font-medium text-gray-900">{pago.mes}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className="text-sm font-medium text-gray-900">
                                            ${pago.monto.toLocaleString()}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-sm text-gray-600">
                                        {new Date(pago.fechaVencimiento).toLocaleDateString()}
                                    </td>
                                    <td className="px-6 py-4 text-sm text-gray-600">
                                        {pago.fechaPago ? new Date(pago.fechaPago).toLocaleDateString() : '-'}
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${getEstadoBadge(pago.estado)}`}>
                                            {pago.estado}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        {pago.estado === 'pendiente' && (
                                            <button
                                                onClick={() => onRegisterPayment(pago.id)}
                                                className="px-3 py-1 text-sm bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                                            >
                                                Registrar Pago
                                            </button>
                                        )}
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
