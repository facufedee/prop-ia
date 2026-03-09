"use client";

import { useState, useEffect } from "react";
import { app, auth } from "@/infrastructure/firebase/client";
import { alquileresService } from "@/infrastructure/services/alquileresService";
import { Alquiler, Pago } from "@/domain/models/Alquiler";
import { format, isSameYear, isSameMonth, parseISO, getMonth, getYear, isValid } from "date-fns";
import { es } from "date-fns/locale";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { ArrowLeft, Filter, Download, DollarSign, TrendingUp, Building, User, CreditCard, Banknote } from "lucide-react";
import Link from "next/link";

interface MonthlyData {
    name: string;
    honorarios: number;
    total: number; // Total collected including rent/others for reference
    count: number; // Number of payments
}

interface Transaction {
    id: string;
    type: 'cobro' | 'liquidacion'; // Distinguish between IN and OUT
    date: Date;
    mes: string;
    montoTotal: number;
    honorariosCalculated: number; // Only relevant for 'cobro'
    metodoPago?: string;
    fechaTransferencia?: string;
    nroComprobante?: string;
    contractId: string;
    contractAddress: string;
    clientName: string; // Tenant name for cobro, Owner name for liquidacion
}

export default function FinanzasPage() {
    const [loading, setLoading] = useState(true);
    const [contracts, setContracts] = useState<Alquiler[]>([]);
    const [year, setYear] = useState(new Date().getFullYear());
    const [month, setMonth] = useState<number | 'all'>('all'); // 0-11 or 'all'
    const [txType, setTxType] = useState<'all' | 'cobro' | 'liquidacion'>('all');
    const [chartData, setChartData] = useState<MonthlyData[]>([]);
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [summary, setSummary] = useState({ totalIncome: 0, totalOutgoings: 0, totalTx: 0, avgTicket: 0, totalEfectivo: 0, totalTransferencia: 0 });
    const [sortConfig, setSortConfig] = useState<{ key: keyof Transaction | 'date', direction: 'asc' | 'desc' } | null>(null);

    useEffect(() => {
        const fetchData = async () => {
            if (!auth || !auth.currentUser) return;
            try {
                const data = await alquileresService.getAlquileres(auth.currentUser.uid);
                setContracts(data);
                processData(data, year, month, txType);
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
            processData(contracts, year, month, txType);
        }
    }, [year, month, txType, contracts]);

    const processData = (data: Alquiler[], selectedYear: number, selectedMonth: number | 'all', selectedTxType: 'all' | 'cobro' | 'liquidacion') => {
        // Initialize monthly buckets
        const monthlyStats = Array(12).fill(0).map((_, i) => ({
            name: format(new Date(2024, i, 1), 'MMM', { locale: es }), // Jan, Feb...
            honorarios: 0,
            total: 0,
            count: 0
        }));

        let totalIncome = 0;
        let totalOutgoings = 0; // total paid to owners
        let totalTx = 0;
        let totalEfectivo = 0;
        let totalTransferencia = 0;
        const txList: Transaction[] = [];

        data.forEach(contract => {
            // Process Incomes (Cobros)
            if (selectedTxType === 'all' || selectedTxType === 'cobro') {
                contract.historialPagos.forEach(payment => {
                    if (payment.estado !== 'pagado' || !payment.fechaPago) return;

                    const pDate = new Date(payment.fechaPago);
                    if (!isValid(pDate)) return;

                    if (getYear(pDate) !== selectedYear) return;
                    if (selectedMonth !== 'all' && getMonth(pDate) !== selectedMonth) return;

                    let honorarios = 0;
                    if (payment.desglose?.honorarios) {
                        honorarios = payment.desglose.honorarios;
                    } else if (contract.honorariosTipo === 'fijo' && contract.honorariosValor) {
                        honorarios = contract.honorariosValor;
                    } else if (contract.honorariosTipo === 'porcentaje' && contract.honorariosValor) {
                        const base = payment.montoAlquiler || payment.monto;
                        honorarios = base * (contract.honorariosValor / 100);
                    }

                    const mIndex = getMonth(pDate);
                    monthlyStats[mIndex].honorarios += honorarios;
                    monthlyStats[mIndex].total += payment.monto;
                    monthlyStats[mIndex].count += 1;

                    totalIncome += honorarios;
                    totalTx += 1;

                    if (payment.metodoPago === 'efectivo') {
                        totalEfectivo += honorarios;
                    } else if (payment.metodoPago === 'transferencia') {
                        totalTransferencia += honorarios;
                    }

                    txList.push({
                        id: payment.id,
                        type: 'cobro',
                        date: pDate,
                        mes: payment.mes,
                        montoTotal: payment.monto,
                        honorariosCalculated: honorarios,
                        metodoPago: payment.metodoPago,
                        fechaTransferencia: payment.fechaTransferencia,
                        nroComprobante: payment.nroComprobante,
                        contractId: contract.id,
                        contractAddress: contract.direccion,
                        clientName: contract.nombreInquilino || ('inquilinos' in contract && (contract as any).inquilinos?.[0]?.nombre) || 'Inquilino'
                    });
                });
            }

            // Process Outgoings (Liquidaciones)
            if (selectedTxType === 'all' || selectedTxType === 'liquidacion') {
                (contract.historialLiquidaciones || []).forEach(liquidacion => {
                    if (liquidacion.estado !== 'pagado' || !liquidacion.fechaPago) return;

                    let pDate: Date;
                    if (liquidacion.fechaPago instanceof Date) {
                        pDate = liquidacion.fechaPago;
                    } else if (typeof liquidacion.fechaPago === 'object' && 'seconds' in liquidacion.fechaPago) {
                        pDate = new Date((liquidacion.fechaPago as any).seconds * 1000);
                    } else {
                        pDate = new Date(liquidacion.fechaPago);
                    }

                    if (!isValid(pDate)) return;

                    if (getYear(pDate) !== selectedYear) return;
                    if (selectedMonth !== 'all' && getMonth(pDate) !== selectedMonth) return;

                    totalOutgoings += liquidacion.netoAPagar;
                    totalTx += 1;

                    txList.push({
                        id: liquidacion.id,
                        type: 'liquidacion',
                        date: pDate,
                        mes: liquidacion.mes,
                        montoTotal: liquidacion.netoAPagar,
                        honorariosCalculated: 0,
                        contractId: contract.id,
                        contractAddress: contract.direccion,
                        clientName: contract.nombrePropietario || 'Propietario'
                    });
                });
            }
        });

        // Sort transactions by date desc
        txList.sort((a, b) => b.date.getTime() - a.date.getTime());

        setChartData(monthlyStats);
        setTransactions(txList);
        setSummary({
            totalIncome,
            totalOutgoings,
            totalTx,
            avgTicket: totalTx > 0 ? totalIncome / totalTx : 0,
            totalEfectivo,
            totalTransferencia
        });
    };

    const formatCurrency = (val: number) =>
        new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 }).format(val);

    const handleSort = (key: keyof Transaction | 'date') => {
        let direction: 'asc' | 'desc' = 'asc';
        if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
            direction = 'desc';
        }
        setSortConfig({ key, direction });
    };

    const sortedTransactions = [...transactions].sort((a, b) => {
        if (!sortConfig) return 0; // Default sorting is already done (by date desc) during processData

        const { key, direction } = sortConfig;

        let aValue: any = a[key as keyof Transaction];
        let bValue: any = b[key as keyof Transaction];

        // Specific handling for dates
        if (key === 'date') {
            aValue = a.date.getTime();
            bValue = b.date.getTime();
        } else if (key === 'mes') {
            aValue = new Date(a.mes + '-01').getTime();
            bValue = new Date(b.mes + '-01').getTime();
        }

        if (aValue < bValue) {
            return direction === 'asc' ? -1 : 1;
        }
        if (aValue > bValue) {
            return direction === 'asc' ? 1 : -1;
        }
        return 0;
    });

    return (
        <div className="p-8 max-w-7xl mx-auto space-y-8 animate-in fade-in duration-500">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                    <Link href="/dashboard" className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                        <ArrowLeft className="text-gray-600" />
                    </Link>
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">Reportes</h1>
                        <p className="text-gray-500">Reporte de honorarios y recaudación</p>
                    </div>
                </div>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 max-w-5xl mx-auto mb-8">
                <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
                    <div className="flex justify-between items-start mb-2">
                        <div className="p-2 bg-green-50 text-green-600 rounded-lg">
                            <DollarSign size={20} />
                        </div>
                        <span className="text-xs font-medium text-gray-400 uppercase tracking-wider">Honorarios Netos</span>
                    </div>
                    <div className="text-3xl font-bold text-gray-900">{formatCurrency(summary.totalIncome)}</div>
                    <div className="text-sm text-gray-400 mt-1 capitalize">
                        {month === 'all' ? `En el año ${year}` : `En ${format(new Date(year, Number(month), 1), 'MMMM', { locale: es })}`}
                    </div>
                </div>

                <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
                    <div className="flex justify-between items-start mb-2">
                        <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg">
                            <Banknote size={20} />
                        </div>
                        <span className="text-xs font-medium text-gray-400 uppercase tracking-wider">Honorarios Efectivo</span>
                    </div>
                    <div className="text-2xl font-bold text-gray-900">{formatCurrency(summary.totalEfectivo)}</div>
                </div>

                <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
                    <div className="flex justify-between items-start mb-2">
                        <div className="p-2 bg-red-50 text-red-600 rounded-lg">
                            <CreditCard size={20} />
                        </div>
                        <span className="text-xs font-medium text-gray-400 uppercase tracking-wider">Pagos a Propietarios</span>
                    </div>
                    <div className="text-2xl font-bold text-gray-900">{formatCurrency(summary.totalOutgoings)}</div>
                </div>

                <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
                    <div className="flex justify-between items-start mb-2">
                        <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
                            <CreditCard size={20} />
                        </div>
                        <span className="text-xs font-medium text-gray-400 uppercase tracking-wider">Transferencia</span>
                    </div>
                    <div className="text-2xl font-bold text-gray-900">{formatCurrency(summary.totalTransferencia)}</div>
                </div>
            </div>

            {/* Transaction List */}
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden mb-8">
                <div className="p-6 border-b border-gray-100 flex flex-col xl:flex-row gap-4 justify-between items-start xl:items-center">
                    <div className="flex items-center gap-3">
                        <h3 className="text-lg font-bold text-gray-900">Listado de Transacciones</h3>
                        <span className="text-sm text-gray-500 bg-gray-100 px-2.5 py-0.5 rounded-full font-medium">
                            {transactions.length} registros
                        </span>
                    </div>

                    {/* Table Filters */}
                    <div className="flex flex-wrap gap-3">
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

                        <select
                            value={txType}
                            onChange={(e) => setTxType(e.target.value as any)}
                            className="px-4 py-2 border border-gray-200 rounded-xl bg-white text-sm text-gray-900 focus:ring-2 focus:ring-indigo-500 outline-none cursor-pointer hover:border-indigo-300 transition-colors"
                        >
                            <option value="all">Todo Integrado</option>
                            <option value="cobro">Cobro a Inquilinos</option>
                            <option value="liquidacion">Pago a Propietarios</option>
                        </select>

                        <button className="flex items-center gap-2 px-4 py-2 bg-indigo-50 text-indigo-700 rounded-xl hover:bg-indigo-100 transition-colors text-sm font-medium">
                            <Download size={16} />
                            Exportar
                        </button>
                    </div>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-gray-50">
                            <tr>
                                <th
                                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors"
                                    onClick={() => handleSort('date')}
                                >
                                    <div className="flex items-center gap-1">Fecha / Tipo {sortConfig?.key === 'date' && (sortConfig.direction === 'asc' ? '↑' : '↓')}</div>
                                </th>
                                <th
                                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors"
                                    onClick={() => handleSort('clientName')}
                                >
                                    <div className="flex items-center gap-1">Propiedad / Cliente {sortConfig?.key === 'clientName' && (sortConfig.direction === 'asc' ? '↑' : '↓')}</div>
                                </th>
                                <th
                                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors"
                                    onClick={() => handleSort('mes')}
                                >
                                    <div className="flex items-center gap-1">Periodo {sortConfig?.key === 'mes' && (sortConfig.direction === 'asc' ? '↑' : '↓')}</div>
                                </th>
                                <th
                                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors"
                                    onClick={() => handleSort('metodoPago')}
                                >
                                    <div className="flex items-center gap-1">Método {sortConfig?.key === 'metodoPago' && (sortConfig.direction === 'asc' ? '↑' : '↓')}</div>
                                </th>
                                <th
                                    className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors"
                                    onClick={() => handleSort('montoTotal')}
                                >
                                    <div className="flex items-center justify-end gap-1">Monto Total {sortConfig?.key === 'montoTotal' && (sortConfig.direction === 'asc' ? '↑' : '↓')}</div>
                                </th>
                                <th
                                    className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors"
                                    onClick={() => handleSort('honorariosCalculated')}
                                >
                                    <div className="flex items-center justify-end gap-1">Honorarios {sortConfig?.key === 'honorariosCalculated' && (sortConfig.direction === 'asc' ? '↑' : '↓')}</div>
                                </th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-100">
                            {sortedTransactions.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
                                        No hay transacciones registradas en este periodo.
                                    </td>
                                </tr>
                            ) : (
                                sortedTransactions.map((tx) => (
                                    <tr key={`${tx.contractId}-${tx.id}`} className="hover:bg-gray-50 transition-colors">
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex flex-col gap-1">
                                                <span className="text-sm text-gray-500">
                                                    {tx.date ? format(tx.date, 'dd/MM/yyyy') : '-'}
                                                </span>
                                                <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium w-fit ${tx.type === 'cobro' ? 'bg-green-50 text-green-700 border border-green-100' : 'bg-red-50 text-red-700 border border-red-100'}`}>
                                                    {tx.type === 'cobro' ? 'Cobro' : 'Liquidación'}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex flex-col">
                                                <span className="text-sm font-medium text-gray-900 truncate max-w-[200px]" title={tx.contractAddress}>
                                                    {tx.contractAddress}
                                                </span>
                                                <span className="text-xs text-gray-500 flex items-center gap-1">
                                                    <User size={12} /> {tx.clientName}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 capitalize">
                                            {format(new Date(`${tx.mes}-02`), 'MMMM yyyy', { locale: es })}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            {tx.metodoPago === 'transferencia' ? (
                                                <div className="flex flex-col">
                                                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium bg-blue-50 text-blue-700 border border-blue-100">
                                                        <CreditCard size={14} /> Transferencia
                                                    </span>
                                                    {(tx.fechaTransferencia || tx.nroComprobante) && (
                                                        <span className="text-[10px] text-gray-400 mt-1 max-w-[120px] truncate" title={`${tx.nroComprobante || ''} ${tx.fechaTransferencia ? format(new Date(tx.fechaTransferencia), 'dd/MM/yyyy') : ''}`}>
                                                            {tx.nroComprobante || 'Sin ref'}
                                                        </span>
                                                    )}
                                                </div>
                                            ) : tx.metodoPago === 'efectivo' ? (
                                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-100">
                                                    <Banknote size={14} /> Efectivo
                                                </span>
                                            ) : (
                                                <span className="text-xs text-gray-400">-</span>
                                            )}
                                        </td>
                                        <td className={`px-6 py-4 whitespace-nowrap text-sm text-right font-medium ${tx.type === 'cobro' ? 'text-gray-900' : 'text-red-600'}`}>
                                            {tx.type === 'cobro' ? '' : '-'}{formatCurrency(tx.montoTotal)}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right">
                                            {tx.type === 'cobro' ? (
                                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                                    +{formatCurrency(tx.honorariosCalculated)}
                                                </span>
                                            ) : (
                                                <span className="text-xs text-gray-400">-</span>
                                            )}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
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
        </div>
    );
}
