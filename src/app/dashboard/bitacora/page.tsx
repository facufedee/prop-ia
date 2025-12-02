"use client";

import { useState, useEffect } from "react";
import { app } from "@/infrastructure/firebase/client";
import { getAuth } from "firebase/auth";

const auth = getAuth(app);
import { auditLogService } from "@/infrastructure/services/auditLogService";
import { AuditLog, LogAction, LogLevel } from "@/domain/models/AuditLog";
import { FileText, Filter, Download, Search, Calendar, User, Activity } from "lucide-react";

export default function BitacoraPage() {
    const [logs, setLogs] = useState<AuditLog[]>([]);
    const [loading, setLoading] = useState(true);
    const [showFilters, setShowFilters] = useState(false);

    const [filters, setFilters] = useState({
        module: "",
        action: "",
        level: "",
        userId: "",
        searchTerm: "",
        startDate: "",
        endDate: "",
    });

    useEffect(() => {
        fetchLogs();
    }, []);

    const fetchLogs = async () => {
        if (!auth.currentUser) return;

        try {
            setLoading(true);
            const data = await auditLogService.getLogs(
                auth.currentUser.uid,
                {
                    module: filters.module || undefined,
                    action: filters.action as LogAction || undefined,
                    level: filters.level as LogLevel || undefined,
                    searchTerm: filters.searchTerm || undefined,
                    startDate: filters.startDate ? new Date(filters.startDate) : undefined,
                    endDate: filters.endDate ? new Date(filters.endDate) : undefined,
                },
                200
            );
            setLogs(data);
        } catch (error) {
            console.error("Error fetching logs:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleFilterChange = (field: string, value: string) => {
        setFilters(prev => ({ ...prev, [field]: value }));
    };

    const handleApplyFilters = () => {
        fetchLogs();
    };

    const handleClearFilters = () => {
        setFilters({
            module: "",
            action: "",
            level: "",
            userId: "",
            searchTerm: "",
            startDate: "",
            endDate: "",
        });
        setTimeout(() => fetchLogs(), 100);
    };

    const getLevelColor = (level: LogLevel) => {
        const colors = {
            info: 'bg-blue-100 text-blue-700',
            success: 'bg-green-100 text-green-700',
            warning: 'bg-yellow-100 text-yellow-700',
            error: 'bg-red-100 text-red-700',
        };
        return colors[level];
    };

    const getLevelIcon = (level: LogLevel) => {
        return level.charAt(0).toUpperCase() + level.slice(1);
    };

    const exportToCSV = () => {
        const headers = ['Fecha', 'Usuario', 'Módulo', 'Acción', 'Descripción', 'Nivel'];
        const rows = logs.map(log => [
            new Date(log.timestamp).toLocaleString('es-AR'),
            log.userName,
            log.module,
            log.action,
            log.description,
            log.level,
        ]);

        const csv = [headers, ...rows].map(row => row.join(',')).join('\n');
        const blob = new Blob([csv], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `bitacora_${new Date().toISOString().split('T')[0]}.csv`;
        a.click();
    };

    if (loading) {
        return (
            <div className="p-6 flex items-center justify-center min-h-[400px]">
                <div className="text-gray-500">Cargando bitácora...</div>
            </div>
        );
    }

    return (
        <div className="p-6 max-w-7xl mx-auto space-y-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Bitácora de Auditoría</h1>
                    <p className="text-gray-500">Registro completo de todas las acciones del sistema</p>
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={() => setShowFilters(!showFilters)}
                        className="flex items-center gap-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                        <Filter className="w-5 h-5" />
                        Filtros
                    </button>
                    <button
                        onClick={exportToCSV}
                        className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                    >
                        <Download className="w-5 h-5" />
                        Exportar
                    </button>
                </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-white rounded-xl border border-gray-200 p-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-500">Total Registros</p>
                            <p className="text-2xl font-bold text-gray-900 mt-1">{logs.length}</p>
                        </div>
                        <div className="p-3 bg-indigo-100 rounded-lg">
                            <FileText className="w-6 h-6 text-indigo-600" />
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-xl border border-gray-200 p-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-500">Hoy</p>
                            <p className="text-2xl font-bold text-gray-900 mt-1">
                                {logs.filter(l => new Date(l.timestamp).toDateString() === new Date().toDateString()).length}
                            </p>
                        </div>
                        <div className="p-3 bg-green-100 rounded-lg">
                            <Calendar className="w-6 h-6 text-green-600" />
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-xl border border-gray-200 p-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-500">Usuarios Activos</p>
                            <p className="text-2xl font-bold text-gray-900 mt-1">
                                {new Set(logs.map(l => l.userId)).size}
                            </p>
                        </div>
                        <div className="p-3 bg-blue-100 rounded-lg">
                            <User className="w-6 h-6 text-blue-600" />
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-xl border border-gray-200 p-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-500">Errores</p>
                            <p className="text-2xl font-bold text-gray-900 mt-1">
                                {logs.filter(l => l.level === 'error').length}
                            </p>
                        </div>
                        <div className="p-3 bg-red-100 rounded-lg">
                            <Activity className="w-6 h-6 text-red-600" />
                        </div>
                    </div>
                </div>
            </div>

            {/* Filters */}
            {showFilters && (
                <div className="bg-white rounded-xl border border-gray-200 p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Filtros Avanzados</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Módulo</label>
                            <select
                                className="w-full p-2 border border-gray-300 rounded-lg"
                                value={filters.module}
                                onChange={(e) => handleFilterChange("module", e.target.value)}
                            >
                                <option value="">Todos</option>
                                <option value="Autenticación">Autenticación</option>
                                <option value="Propiedades">Propiedades</option>
                                <option value="Agentes">Agentes</option>
                                <option value="Alquileres">Alquileres</option>
                                <option value="Visitas">Visitas</option>
                                <option value="Finanzas">Finanzas</option>
                                <option value="Configuración">Configuración</option>
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Nivel</label>
                            <select
                                className="w-full p-2 border border-gray-300 rounded-lg"
                                value={filters.level}
                                onChange={(e) => handleFilterChange("level", e.target.value)}
                            >
                                <option value="">Todos</option>
                                <option value="info">Info</option>
                                <option value="success">Success</option>
                                <option value="warning">Warning</option>
                                <option value="error">Error</option>
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Buscar</label>
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                                <input
                                    type="text"
                                    placeholder="Usuario, descripción..."
                                    className="w-full pl-10 p-2 border border-gray-300 rounded-lg"
                                    value={filters.searchTerm}
                                    onChange={(e) => handleFilterChange("searchTerm", e.target.value)}
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Fecha Desde</label>
                            <input
                                type="date"
                                className="w-full p-2 border border-gray-300 rounded-lg"
                                value={filters.startDate}
                                onChange={(e) => handleFilterChange("startDate", e.target.value)}
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Fecha Hasta</label>
                            <input
                                type="date"
                                className="w-full p-2 border border-gray-300 rounded-lg"
                                value={filters.endDate}
                                onChange={(e) => handleFilterChange("endDate", e.target.value)}
                            />
                        </div>
                    </div>

                    <div className="flex justify-end gap-2">
                        <button
                            onClick={handleClearFilters}
                            className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                        >
                            Limpiar
                        </button>
                        <button
                            onClick={handleApplyFilters}
                            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
                        >
                            Aplicar Filtros
                        </button>
                    </div>
                </div>
            )}

            {/* Logs Table */}
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-gray-50 border-b border-gray-200">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Fecha/Hora</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Usuario</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Módulo</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Acción</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Descripción</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Nivel</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                            {logs.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                                        No hay registros en la bitácora
                                    </td>
                                </tr>
                            ) : (
                                logs.map((log) => (
                                    <tr key={log.id} className="hover:bg-gray-50">
                                        <td className="px-6 py-4 text-sm text-gray-900">
                                            {new Date(log.timestamp).toLocaleString('es-AR')}
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="text-sm font-medium text-gray-900">{log.userName}</div>
                                            <div className="text-xs text-gray-500">{log.userEmail}</div>
                                        </td>
                                        <td className="px-6 py-4 text-sm text-gray-600">{log.module}</td>
                                        <td className="px-6 py-4 text-sm text-gray-600 font-mono">{log.action}</td>
                                        <td className="px-6 py-4 text-sm text-gray-700">{log.description}</td>
                                        <td className="px-6 py-4">
                                            <span className={`px-2 py-1 text-xs font-medium rounded-full ${getLevelColor(log.level)}`}>
                                                {getLevelIcon(log.level)}
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
