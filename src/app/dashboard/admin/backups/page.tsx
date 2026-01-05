"use client";

import { useEffect, useState, useRef } from "react";
import { backupService } from "@/infrastructure/services/backupService";
import { auditLogService, LogEntry } from "@/infrastructure/services/auditLogService";
import { Database, Download, Upload, Clock, AlertTriangle, FileJson, CheckCircle } from "lucide-react";
import { auth } from "@/infrastructure/firebase/client";

export default function BackupsPage() {
    const [loading, setLoading] = useState(false);
    const [logs, setLogs] = useState<LogEntry[]>([]);
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        fetchLogs();
    }, []);

    const fetchLogs = async () => {
        if (!auth.currentUser) return;
        // Fetch logs related to backups. 
        // We filter by resource="system" or action contains "backup".
        // The service matches partial strings if configured? 
        // auditLogService filters are strict equalities usually in Firestore.
        // Let's filter client side or use specific method if available.
        // Looking at service, it has 'action', 'userId', 'resource'.
        // backupService uses resource: 'system' and actions: 'create_backup', 'restore_backup'.

        const allLogs = await auditLogService.getLogs({ resource: 'system' });
        // Filter specifically for backup actions just in case
        const backupLogs = allLogs.filter(l => l.action.includes('backup'));
        setLogs(backupLogs);
    };

    const handleCreateBackup = async () => {
        try {
            setLoading(true);
            if (!auth.currentUser) return;
            await backupService.createBackup(auth.currentUser.uid);
            await fetchLogs(); // Refresh logs
            alert("Backup creado y descargado correctamente.");
        } catch (error) {
            console.error(error);
            alert("Error al crear backup.");
        } finally {
            setLoading(false);
        }
    };

    const handleRestoreClick = () => {
        if (confirm("ADVERTENCIA: Restaurar un backup SOBREESCRIBIRÁ los datos actuales o duplicará registros si no se maneja limpieza. \n\n¿Estás seguro de continuar? Se recomienda hacer un backup antes.")) {
            fileInputRef.current?.click();
        }
    };

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        try {
            setLoading(true);
            if (!auth.currentUser) return;

            await backupService.restoreBackup(file, auth.currentUser.uid);
            await fetchLogs();
            alert("Sistema restaurado correctamente.");
        } catch (error) {
            console.error(error);
            alert("Error al restaurar backup: " + (error as any).message);
        } finally {
            setLoading(false);
            if (fileInputRef.current) fileInputRef.current.value = "";
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col gap-2">
                <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                    <Database className="w-6 h-6 text-indigo-600" />
                    Respaldos y Restauración
                </h1>
                <p className="text-gray-500">
                    Gestiona las copias de seguridad de la base de datos.
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Create Backup */}
                <div className="bg-white p-6 rounded-2xl border border-indigo-100 shadow-sm flex flex-col items-center text-center space-y-4">
                    <div className="p-4 bg-indigo-50 rounded-full">
                        <Download className="w-8 h-8 text-indigo-600" />
                    </div>
                    <div className="flex-1">
                        <h3 className="text-lg font-bold text-gray-900">Crear Copia de Seguridad</h3>
                        <p className="text-sm text-gray-500 mt-2">
                            Descarga un archivo JSON cifrado (si aplica) con toda la información crítica de la base de datos.
                        </p>
                    </div>
                    <button
                        onClick={handleCreateBackup}
                        disabled={loading}
                        className="w-full py-3 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition font-medium flex items-center justify-center gap-2"
                    >
                        {loading ? "Procesando..." : (
                            <>
                                <Download className="w-4 h-4" />
                                Descargar Backup
                            </>
                        )}
                    </button>
                </div>

                {/* Restore Backup */}
                <div className="bg-white p-6 rounded-2xl border border-orange-100 shadow-sm flex flex-col items-center text-center space-y-4">
                    <div className="p-4 bg-orange-50 rounded-full">
                        <Upload className="w-8 h-8 text-orange-600" />
                    </div>
                    <div className="flex-1">
                        <h3 className="text-lg font-bold text-gray-900">Restaurar Sistema</h3>
                        <p className="text-sm text-gray-500 mt-2">
                            Sube un archivo de respaldo para recuperar datos perdidos.
                        </p>
                        <div className="mt-2 text-xs bg-orange-50 text-orange-700 p-2 rounded-lg flex items-start gap-2 text-left">
                            <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                            <span>Acción sensible. Asegurate de tener una copia reciente antes de restaurar.</span>
                        </div>
                    </div>

                    <input
                        type="file"
                        ref={fileInputRef}
                        className="hidden"
                        onChange={handleFileChange}
                        accept=".json"
                    />

                    <button
                        onClick={handleRestoreClick}
                        disabled={loading}
                        className="w-full py-3 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition font-medium flex items-center justify-center gap-2"
                    >
                        {loading ? "Restaurando..." : (
                            <>
                                <Upload className="w-4 h-4" />
                                Subir Archivo
                            </>
                        )}
                    </button>
                </div>
            </div>

            {/* History Table */}
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
                    <h3 className="font-bold text-gray-900 flex items-center gap-2">
                        <Clock className="w-5 h-5 text-gray-500" />
                        Historial de Actividad
                    </h3>
                    <button onClick={fetchLogs} className="text-sm text-indigo-600 hover:text-indigo-800">
                        Refrescar
                    </button>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-gray-50 text-gray-500 font-medium">
                            <tr>
                                <th className="px-6 py-3">Fecha</th>
                                <th className="px-6 py-3">Acción</th>
                                <th className="px-6 py-3">Usuario</th>
                                <th className="px-6 py-3">Detalles</th>
                                <th className="px-6 py-3">Estado</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {logs.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="px-6 py-8 text-center text-gray-500">
                                        No hay registros de backups recientes.
                                    </td>
                                </tr>
                            ) : (
                                logs.map((log) => (
                                    <tr key={log.id} className="hover:bg-gray-50">
                                        <td className="px-6 py-4 text-gray-600">
                                            {log.createdAt.toLocaleString()}
                                        </td>
                                        <td className="px-6 py-4 font-medium text-gray-900">
                                            {log.action === 'create_backup' ? 'Backup Creado' : 'Sistema Restaurado'}
                                        </td>
                                        <td className="px-6 py-4 text-gray-600">
                                            {log.userId}
                                        </td>
                                        <td className="px-6 py-4 text-gray-500 max-w-xs truncate">
                                            {JSON.stringify(log.details)}
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                                <CheckCircle className="w-3 h-3" /> Exitoso
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
