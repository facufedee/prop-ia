"use client";

import { useState, useEffect } from "react";
import { app, auth } from "@/infrastructure/firebase/client";
import { auditLogService } from "@/infrastructure/services/auditLogService";
import { AuditLog, LogAction, LogLevel } from "@/domain/models/AuditLog";
import { FileText, Filter, Download, Search, Calendar, User, Activity } from "lucide-react";

export default function BitacoraPage() {
    const [logs, setLogs] = useState<AuditLog[]>([]);
    const [loading, setLoading] = useState(true);
    const [showFilters, setShowFilters] = useState(false);

    // Pagination State
    const [lastVisible, setLastVisible] = useState<unknown>(null);
    const [pageStack, setPageStack] = useState<unknown[]>([]); // Stack of "lastVisible" for previous pages
    const [pageNumber, setPageNumber] = useState(1);
    const LIMIT = 50;

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
        // Initial fetch logic: 
        // When using pagination, the first fetch has NO startAfterDoc.
        fetchLogs();
    }, []);

    const fetchLogs = async (startAfterDoc: unknown = null, isNextPage: boolean = false, isPrevPage: boolean = false) => {
        if (!auth?.currentUser) return;

        try {
            setLoading(true);

            // Fetch User Role first to determine if Admin
            const { roleService } = await import("@/infrastructure/services/roleService");
            const { doc, getDoc } = await import("firebase/firestore");
            const { db } = await import("@/infrastructure/firebase/client");

            let isAdmin = false;

            // Minimal role check logic (duplicated from Sidebar for safety/speed)
            const userRef = doc(db, "users", auth.currentUser.uid);
            const userSnap = await getDoc(userRef);
            if (userSnap.exists() && userSnap.data().roleId) {
                const role = await roleService.getRoleById(userSnap.data().roleId);
                if (role?.name === "Administrador") {
                    isAdmin = true;
                }
            }

            const { logs: newLogs, lastVisible: newLastVisible } = await auditLogService.getLogs(
                isAdmin ? null : auth.currentUser.uid, // Pass null if admin to see ALL logs
                {
                    module: filters.module || undefined,
                    action: filters.action as LogAction || undefined,
                    level: filters.level as LogLevel || undefined,
                    searchTerm: filters.searchTerm || undefined,
                    startDate: filters.startDate ? new Date(filters.startDate) : undefined,
                    endDate: filters.endDate ? new Date(filters.endDate) : undefined,
                },
                LIMIT,
                startAfterDoc
            );

            setLogs(newLogs);
            setLastVisible(newLastVisible);

            if (isNextPage && startAfterDoc) {
                // Push the doc used to START this page to history
                setPageStack(prev => [...prev, startAfterDoc]);
                setPageNumber(prev => prev + 1);
            } else if (isPrevPage) {
                // Stack popping happens BEFORE calling fetch in handlePrevPage usually,
                // but here we just update page number.
                setPageNumber(prev => Math.max(1, prev - 1));
            } else if (!startAfterDoc) {
                // Reset / First Load
                setPageStack([]);
                setPageNumber(1);
            }

        } catch (error) {
            console.error("Error fetching logs:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleNextPage = () => {
        if (lastVisible) {
            const cursorToPush = lastVisible;
            fetchLogs(cursorToPush, true);
        }
    };

    const handlePrevPage = () => {
        const newStack = [...pageStack];
        newStack.pop(); // Remove cursor for current page (DocB)

        const cursorForPrevPage = newStack.length > 0 ? newStack[newStack.length - 1] : null;

        setPageStack(newStack);
        fetchLogs(cursorForPrevPage, false, true); // isPrevPage=true
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
            info: 'bg-[var(--color-accent-soft)] text-[var(--color-accent)]',
            success: 'bg-[var(--color-positive-soft)] text-[var(--color-positive)]',
            warning: 'bg-[var(--color-warning-soft)] text-[var(--color-warning)]',
            error: 'bg-[var(--color-danger-soft)] text-[var(--color-danger)]',
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
                <div className="text-[var(--color-muted)]">Cargando bitácora...</div>
            </div>
        );
    }

    return (
        <div className="p-6 max-w-7xl mx-auto space-y-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="font-heading text-2xl font-bold text-[var(--color-ink)]">Bitácora de Auditoría</h1>
                    <p className="text-[var(--color-muted)]">Registro completo de todas las acciones del sistema</p>
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={() => setShowFilters(!showFilters)}
                        className="flex items-center gap-2 px-4 py-2 border border-[var(--color-rule)] text-[var(--color-ink-2)] rounded-lg hover:bg-[var(--color-paper-3)] transition-colors"
                    >
                        <Filter strokeWidth={1.5} className="w-5 h-5" />
                        Filtros
                    </button>
                    <button
                        onClick={exportToCSV}
                        className="flex items-center gap-2 px-4 py-2 bg-[var(--color-ink)] text-[var(--color-paper)] rounded-lg hover:bg-[var(--color-ink-2)] transition-colors"
                    >
                        <Download strokeWidth={1.5} className="w-5 h-5" />
                        Exportar
                    </button>
                </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-[var(--color-paper-2)] rounded-xl border border-[var(--color-rule)] p-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-[var(--color-muted)]">Total Registros</p>
                            <p className="text-2xl font-bold text-[var(--color-ink)] mt-1">{logs.length}</p>
                        </div>
                        <div className="p-3 bg-[var(--color-paper-3)] rounded-full">
                            <FileText strokeWidth={1.5} className="w-6 h-6 text-[var(--color-muted)]" />
                        </div>
                    </div>
                </div>

                <div className="bg-[var(--color-paper-2)] rounded-xl border border-[var(--color-rule)] p-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-[var(--color-muted)]">Hoy</p>
                            <p className="text-2xl font-bold text-[var(--color-ink)] mt-1">
                                {logs.filter(l => new Date(l.timestamp).toDateString() === new Date().toDateString()).length}
                            </p>
                        </div>
                        <div className="p-3 bg-[var(--color-paper-3)] rounded-full">
                            <Calendar strokeWidth={1.5} className="w-6 h-6 text-[var(--color-muted)]" />
                        </div>
                    </div>
                </div>

                <div className="bg-[var(--color-paper-2)] rounded-xl border border-[var(--color-rule)] p-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-[var(--color-muted)]">Usuarios Activos</p>
                            <p className="text-2xl font-bold text-[var(--color-ink)] mt-1">
                                {new Set(logs.map(l => l.userId)).size}
                            </p>
                        </div>
                        <div className="p-3 bg-[var(--color-paper-3)] rounded-full">
                            <User strokeWidth={1.5} className="w-6 h-6 text-[var(--color-muted)]" />
                        </div>
                    </div>
                </div>

                <div className="bg-[var(--color-paper-2)] rounded-xl border border-[var(--color-rule)] p-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-[var(--color-muted)]">Errores</p>
                            <p className="text-2xl font-bold text-[var(--color-ink)] mt-1">
                                {logs.filter(l => l.level === 'error').length}
                            </p>
                        </div>
                        <div className="p-3 bg-[var(--color-paper-3)] rounded-full">
                            <Activity strokeWidth={1.5} className="w-6 h-6 text-[var(--color-muted)]" />
                        </div>
                    </div>
                </div>
            </div>

            {/* Filters */}
            {showFilters && (
                <div className="bg-[var(--color-paper-2)] rounded-xl border border-[var(--color-rule)] p-6">
                    <h3 className="text-lg font-semibold text-[var(--color-ink)] mb-4">Filtros Avanzados</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                        <div>
                            <label className="block text-sm font-medium text-[var(--color-ink-2)] mb-2">Módulo</label>
                            <select
                                className="w-full p-2 border border-[var(--color-rule)] rounded-lg"
                                value={filters.module}
                                onChange={(e) => handleFilterChange("module", e.target.value)}
                            >
                                <option value="">Todos</option>
                                <option value="Autenticación">Autenticación</option>
                                <option value="Propiedades">Propiedades</option>
                                <option value="Agentes">Agentes</option>
                                <option value="Alquileres">Alquileres</option>
                                <option value="Visitas">Visitas</option>
                                <option value="Reportes">Reportes</option>
                                <option value="Configuración">Configuración</option>
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-[var(--color-ink-2)] mb-2">Nivel</label>
                            <select
                                className="w-full p-2 border border-[var(--color-rule)] rounded-lg"
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
                            <label className="block text-sm font-medium text-[var(--color-ink-2)] mb-2">Buscar</label>
                            <div className="relative">
                                <Search strokeWidth={1.5} className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-[var(--color-neutral)]" />
                                <input
                                    type="text"
                                    placeholder="Usuario, descripción..."
                                    className="w-full pl-10 p-2 border border-[var(--color-rule)] rounded-lg"
                                    value={filters.searchTerm}
                                    onChange={(e) => handleFilterChange("searchTerm", e.target.value)}
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-[var(--color-ink-2)] mb-2">Fecha Desde</label>
                            <input
                                type="date"
                                className="w-full p-2 border border-[var(--color-rule)] rounded-lg"
                                value={filters.startDate}
                                onChange={(e) => handleFilterChange("startDate", e.target.value)}
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-[var(--color-ink-2)] mb-2">Fecha Hasta</label>
                            <input
                                type="date"
                                className="w-full p-2 border border-[var(--color-rule)] rounded-lg"
                                value={filters.endDate}
                                onChange={(e) => handleFilterChange("endDate", e.target.value)}
                            />
                        </div>
                    </div>

                    <div className="flex justify-end gap-2">
                        <button
                            onClick={handleClearFilters}
                            className="px-4 py-2 border border-[var(--color-rule)] text-[var(--color-ink-2)] rounded-lg hover:bg-[var(--color-paper-3)]"
                        >
                            Limpiar
                        </button>
                        <button
                            onClick={handleApplyFilters}
                            className="px-4 py-2 bg-[var(--color-ink)] text-[var(--color-paper)] rounded-lg hover:bg-[var(--color-ink-2)]"
                        >
                            Aplicar Filtros
                        </button>
                    </div>
                </div>
            )}

            {/* Logs Table */}
            <div className="bg-[var(--color-paper-2)] rounded-xl border border-[var(--color-rule)] overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-[var(--color-paper)] border-b border-[var(--color-rule)]">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-[var(--color-muted)] uppercase">Fecha/Hora</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-[var(--color-muted)] uppercase">Usuario</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-[var(--color-muted)] uppercase">Módulo</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-[var(--color-muted)] uppercase">Acción</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-[var(--color-muted)] uppercase">Descripción</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-[var(--color-muted)] uppercase">Nivel</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-[var(--color-rule)]">
                            {logs.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="px-6 py-12 text-center text-[var(--color-muted)]">
                                        No hay registros en la bitácora
                                    </td>
                                </tr>
                            ) : (
                                logs.map((log) => (
                                    <tr key={log.id} className="hover:bg-[var(--color-paper-3)]">
                                        <td className="px-6 py-4 text-sm text-[var(--color-ink)]">
                                            {new Date(log.timestamp).toLocaleString('es-AR')}
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="text-sm font-medium text-[var(--color-ink)]">{log.userName}</div>
                                            <div className="text-xs text-[var(--color-muted)]">{log.userEmail}</div>
                                        </td>
                                        <td className="px-6 py-4 text-sm text-[var(--color-ink-2)]">{log.module}</td>
                                        <td className="px-6 py-4 text-sm text-[var(--color-ink-2)] font-mono">{log.action}</td>
                                        <td className="px-6 py-4 text-sm text-[var(--color-ink-2)]">{log.description}</td>
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

            {/* Pagination Controls */}
            <div className="flex items-center justify-between bg-[var(--color-paper-2)] p-4 rounded-xl border border-[var(--color-rule)]">
                <div className="text-sm text-[var(--color-muted)]">
                    Página {pageNumber}
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={handlePrevPage}
                        disabled={pageNumber === 1 || loading}
                        className="px-4 py-2 border border-[var(--color-rule)] text-[var(--color-ink-2)] rounded-lg hover:bg-[var(--color-paper-3)] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                        Anterior
                    </button>
                    <button
                        onClick={handleNextPage}
                        disabled={logs.length < LIMIT || loading}
                        className="px-4 py-2 bg-[var(--color-ink)] text-[var(--color-paper)] rounded-lg hover:bg-[var(--color-ink-2)] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                        Siguiente
                    </button>
                </div>
            </div>
        </div>
    );
}
