"use client";

import { useState, useEffect } from "react";
import { app, auth } from "@/infrastructure/firebase/client";
import { alquileresService } from "@/infrastructure/services/alquileresService";
import { Alquiler, Pago } from "@/domain/models/Alquiler";
import { format, isSameYear, isSameMonth, parseISO, getMonth, getYear, isValid } from "date-fns";
import { es } from "date-fns/locale";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { ArrowLeft, Filter, Download, DollarSign, TrendingUp, Building, User } from "lucide-react";
import Link from "next/link";

interface MonthlyData {
    name: string;
    honorarios: number;
    total: number; // Total collected including rent/others for reference
    count: number; // Number of payments
}

interface Transaction extends Pago {
    contractId: string;
    contractAddress: string;
    tenantName: string;
    honorariosCalculated: number;
}

export default function FinanzasPage() {
    const [loading, setLoading] = useState(true);
    const [contracts, setContracts] = useState<Alquiler[]>([]);
    const [year, setYear] = useState(new Date().getFullYear());
    const [month, setMonth] = useState<number | 'all'>('all'); // 0-11 or 'all'
    const [chartData, setChartData] = useState<MonthlyData[]>([]);
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [summary, setSummary] = useState({ totalIncome: 0, totalTx: 0, avgTicket: 0 });

    useEffect(() => {
        const fetchData = async () => {
            if (!auth || !auth.currentUser) return;
            try {
                const data = await alquileresService.getAlquileres(auth.currentUser.uid);
                setContracts(data);
                processData(data, year, month);
            } catch (error) {
                console.error("Error fetching finance data:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    useEffect(() => {
        if (contracts.length > 0) {
            processData(contracts, year, month);
        }
    }, [year, month, contracts]);

    const processData = (data: Alquiler[], selectedYear: number, selectedMonth: number | 'all') => {
        // Initialize monthly buckets
        const monthlyStats = Array(12).fill(0).map((_, i) => ({
            name: format(new Date(2024, i, 1), 'MMM', { locale: es }), // Jan, Feb...
            honorarios: 0,
            total: 0,
            count: 0
        }));

        let totalIncome = 0;
        let totalTx = 0;
        const txList: Transaction[] = [];

        data.forEach(contract => {
            contract.historialPagos.forEach(payment => {
                // Filter: must be paid (or partial?) - User wants income, so 'pagado'
                if (payment.estado !== 'pagado' || !payment.fechaPago) return;

                const pDate = new Date(payment.fechaPago);
                if (!isValid(pDate)) return;

                if (getYear(pDate) !== selectedYear) return;

                // If filtering by specific month
                if (selectedMonth !== 'all' && getMonth(pDate) !== selectedMonth) return;

                // Calculate Honorarios
                let honorarios = 0;
                if (payment.desglose?.honorarios) {
                    honorarios = payment.desglose.honorarios;
                } else if (contract.honorariosTipo === 'fijo' && contract.honorariosValor) {
                    honorarios = contract.honorariosValor;
                } else if (contract.honorariosTipo === 'porcentaje' && contract.honorariosValor) {
                    const base = payment.montoAlquiler || payment.monto;
                    honorarios = base * (contract.honorariosValor / 100);
                }

                // Add to stats
                const mIndex = getMonth(pDate);
                monthlyStats[mIndex].honorarios += honorarios;
                monthlyStats[mIndex].total += payment.monto;
                monthlyStats[mIndex].count += 1;

                totalIncome += honorarios;
                totalTx += 1;

                txList.push({
                    ...payment,
                    contractId: contract.id,
                    contractAddress: contract.direccion,
                    // Safe access to tenant name if it exists in updated model or fallback
                    tenantName: contract.nombreInquilino || ('inquilinos' in contract && (contract as any).inquilinos?.[0]?.nombre) || 'Inquilino',
                    honorariosCalculated: honorarios
                });
            });
        });

        // Sort transactions by date desc
        txList.sort((a, b) => {
            const dateA = a.fechaPago ? new Date(a.fechaPago).getTime() : 0;
            const dateB = b.fechaPago ? new Date(b.fechaPago).getTime() : 0;
            return dateB - dateA;
        });

        setChartData(monthlyStats);
        setTransactions(txList);
        setSummary({
            totalIncome,
            totalTx,
            avgTicket: totalTx > 0 ? totalIncome / totalTx : 0
        });
    };

    const formatCurrency = (val: number) =>
        new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 }).format(val);

    return (
        <div className="p-8 max-w-7xl mx-auto space-y-8 animate-in fade-in duration-500">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                    <Link href="/dashboard" className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                        <ArrowLeft className="text-gray-600" />
                    </Link>
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">Finanzas e Ingresos</h1>
                        <p className="text-gray-500">Reporte de honorarios y recaudación</p>
                    </div>
                </div>

                {/* Global Filters */}
                <div className="flex gap-3">
                    <select
                        value={year}
                        onChange={(e) => setYear(Number(e.target.value))}
                        className="px-4 py-2 border border-gray-200 rounded-xl bg-white text-sm text-gray-900 focus:ring-2 focus:ring-indigo-500 outline-none cursor-pointer hover:border-indigo-300 transition-colors"
                    >
                        {[2023, 2024, 2025, 2026].map(y => (
                            <option key={y} value={y}>{y}</option>
                        ))}
                    </select>

                    <select
                        value={month}
                        onChange={(e) => setMonth(e.target.value === 'all' ? 'all' : Number(e.target.value))}
                        className="px-4 py-2 border border-gray-200 rounded-xl bg-white text-sm text-gray-900 focus:ring-2 focus:ring-indigo-500 outline-none cursor-pointer hover:border-indigo-300 transition-colors"
                    >
                        <option value="all">Todo el año</option>
                        {Array.from({ length: 12 }, (_, i) => (
                            <option key={i} value={i}>
                                {format(new Date(2024, i, 1), 'MMMM', { locale: es })}
                            </option>
                        ))}
                    </select>

                    <button className="flex items-center gap-2 px-4 py-2 bg-indigo-50 text-indigo-700 rounded-xl hover:bg-indigo-100 transition-colors text-sm font-medium">
                        <Download size={16} />
                        Exportar
                    </button>
                </div>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
                    <div className="flex justify-between items-start mb-2">
                        <div className="p-2 bg-green-50 text-green-600 rounded-lg">
                            <DollarSign size={20} />
                        </div>
                        <span className="text-xs font-medium text-gray-400 uppercase tracking-wider">Ingresos Netos (Honorarios)</span>
                    </div>
                    <div className="text-3xl font-bold text-gray-900">{formatCurrency(summary.totalIncome)}</div>
                    <div className="text-sm text-gray-400 mt-1 capitalize">
                        {month === 'all' ? `En el año ${year}` : `En ${format(new Date(year, Number(month), 1), 'MMMM', { locale: es })}`}
                    </div>
                </div>

                <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
                    <div className="flex justify-between items-start mb-2">
                        <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
                            <TrendingUp size={20} />
                        </div>
                        <span className="text-xs font-medium text-gray-400 uppercase tracking-wider">Transacciones</span>
                    </div>
                    <div className="text-3xl font-bold text-gray-900">{summary.totalTx}</div>
                    <div className="text-sm text-gray-400 mt-1">Cobros registrados</div>
                </div>

                <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
                    <div className="flex justify-between items-start mb-2">
                        <div className="p-2 bg-purple-50 text-purple-600 rounded-lg">
                            <Building size={20} />
                        </div>
                        <span className="text-xs font-medium text-gray-400 uppercase tracking-wider">Promedio / Cobro</span>
                    </div>
                    <div className="text-3xl font-bold text-gray-900">{formatCurrency(summary.avgTicket)}</div>
                </div>
            </div>

            {/* Charts Section */}
            <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
                <h3 className="text-lg font-bold text-gray-900 mb-6">Evolución de Ingresos Mensuales</h3>
                <div className="h-[350px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                            <XAxis
                                dataKey="name"
                                axisLine={false}
                                tickLine={false}
                                tick={{ fill: '#6B7280', fontSize: 12 }}
                                dy={10}
                            />
                            <YAxis
                                axisLine={false}
                                tickLine={false}
                                tick={{ fill: '#6B7280', fontSize: 12 }}
                                tickFormatter={(val) => `$${val / 1000}k`}
                            />
                            <Tooltip
                                contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                cursor={{ fill: '#F3F4F6' }}
                            />
                            <Bar
                                dataKey="honorarios"
                                name="Honorarios"
                                fill="#4F46E5"
                                radius={[4, 4, 0, 0]}
                                barSize={40}
                            />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* Transaction List */}
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden mb-8">
                <div className="p-6 border-b border-gray-100 flex justify-between items-center">
                    <h3 className="text-lg font-bold text-gray-900">Detalle de Cobros</h3>
                    <span className="text-sm text-gray-500">
                        {transactions.length} registros encontrados
                    </span>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Fecha</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Propiedad / Inquilino</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Periodo</th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Monto Cobrado</th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Honorarios</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-100">
                            {transactions.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="px-6 py-8 text-center text-gray-500">
                                        No hay cobros registrados en este periodo.
                                    </td>
                                </tr>
                            ) : (
                                transactions.map((tx) => (
                                    <tr key={`${tx.contractId}-${tx.id}`} className="hover:bg-gray-50 transition-colors">
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            {tx.fechaPago ? format(new Date(tx.fechaPago), 'dd/MM/yyyy') : '-'}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex flex-col">
                                                <span className="text-sm font-medium text-gray-900 truncate max-w-[200px]" title={tx.contractAddress}>
                                                    {tx.contractAddress}
                                                </span>
                                                <span className="text-xs text-gray-500 flex items-center gap-1">
                                                    <User size={12} /> {tx.tenantName}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 capitalize">
                                            {format(new Date(`${tx.mes}-02`), 'MMMM yyyy', { locale: es })}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right font-medium">
                                            {formatCurrency(tx.monto)}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right">
                                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                                +{formatCurrency(tx.honorariosCalculated)}
                                            </span>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
