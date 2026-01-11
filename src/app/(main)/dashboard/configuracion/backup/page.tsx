"use client";

import { useState } from "react";
import { app, auth } from "@/infrastructure/firebase/client";
import { backupService } from "@/infrastructure/services/backupService";
import { Database, Download, Upload, AlertTriangle, CheckCircle, FileJson } from "lucide-react";

export default function BackupPage() {
    const [loading, setLoading] = useState(false);
    const [restoring, setRestoring] = useState(false);
    const [backupStats, setBackupStats] = useState<any>(null);
    const [restoreResult, setRestoreResult] = useState<any>(null);

    const handleCreateBackup = async () => {
        if (!auth?.currentUser) return;

        try {
            setLoading(true);
            await backupService.downloadBackup(auth.currentUser.uid);
            alert("Backup descargado exitosamente");
        } catch (error) {
            console.error("Error creating backup:", error);
            alert("Error al crear el backup");
        } finally {
            setLoading(false);
        }
    };

    const handlePreviewBackup = async () => {
        if (!auth?.currentUser) return;

        try {
            setLoading(true);
            const backup = await backupService.createBackup(auth?.currentUser?.uid || '');
            const stats = backupService.getBackupStats(backup);
            setBackupStats(stats);
        } catch (error) {
            console.error("Error previewing backup:", error);
            alert("Error al previsualizar el backup");
        } finally {
            setLoading(false);
        }
    };

    const handleRestoreBackup = async (event: React.ChangeEvent<HTMLInputElement>) => {
        if (!auth?.currentUser || !event.target.files?.[0]) return;

        const file = event.target.files[0];
        const reader = new FileReader();

        reader.onload = async (e) => {
            try {
                setRestoring(true);
                const backupData = JSON.parse(e.target?.result as string);

                // Validate backup
                const validation = backupService.validateBackup(backupData);
                if (!validation.valid) {
                    alert(`Backup inválido:\n${validation.errors.join('\n')}`);
                    return;
                }

                // Confirm restore
                if (!confirm('⚠️ ADVERTENCIA: Esto sobrescribirá todos los datos actuales. ¿Continuar?')) {
                    return;
                }

                // Restore
                if (auth?.currentUser) {
                    const result = await backupService.restoreBackup(backupData, auth.currentUser.uid);
                    setRestoreResult(result);

                    if (result.success) {
                        alert(`✅ Backup restaurado exitosamente!\n${result.restored} documentos restaurados.`);
                    } else {
                        alert(`⚠️ Backup restaurado con errores:\n${result.errors.join('\n')}`);
                    }
                }
            } catch (error) {
                console.error("Error restoring backup:", error);
                alert("Error al restaurar el backup");
            } finally {
                setRestoring(false);
            }
        };

        reader.readAsText(file);
    };

    return (
        <div className="p-6 max-w-4xl mx-auto space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-bold text-gray-900">Backup y Restauración</h1>
                <p className="text-gray-500">Gestión de copias de seguridad de la base de datos</p>
            </div>

            {/* Warning */}
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <div className="flex items-start gap-3">
                    <AlertTriangle className="w-5 h-5 text-yellow-600 mt-0.5" />
                    <div>
                        <h3 className="text-sm font-semibold text-yellow-900">Importante</h3>
                        <p className="text-sm text-yellow-800 mt-1">
                            Esta funcionalidad es solo para administradores. Restaurar un backup sobrescribirá TODOS los datos actuales.
                            Asegúrate de crear un backup antes de restaurar.
                        </p>
                    </div>
                </div>
            </div>

            {/* Backup Section */}
            <div className="bg-white rounded-xl border border-gray-200 p-6">
                <div className="flex items-center gap-3 mb-4">
                    <div className="p-3 bg-indigo-100 rounded-lg">
                        <Database className="w-6 h-6 text-indigo-600" />
                    </div>
                    <div>
                        <h2 className="text-lg font-semibold text-gray-900">Crear Backup</h2>
                        <p className="text-sm text-gray-500">Exportar todos los datos a un archivo JSON</p>
                    </div>
                </div>

                <div className="space-y-4">
                    <div className="flex gap-3">
                        <button
                            onClick={handlePreviewBackup}
                            disabled={loading}
                            className="flex items-center gap-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
                        >
                            <FileJson className="w-5 h-5" />
                            {loading ? "Cargando..." : "Previsualizar"}
                        </button>

                        <button
                            onClick={handleCreateBackup}
                            disabled={loading}
                            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50"
                        >
                            <Download className="w-5 h-5" />
                            {loading ? "Creando..." : "Descargar Backup"}
                        </button>
                    </div>

                    {backupStats && (
                        <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                            <h4 className="text-sm font-semibold text-gray-900 mb-3">Estadísticas del Backup</h4>
                            <div className="grid grid-cols-2 gap-4 mb-4">
                                <div>
                                    <p className="text-xs text-gray-500">Total Documentos</p>
                                    <p className="text-lg font-bold text-gray-900">{backupStats.totalDocuments}</p>
                                </div>
                                <div>
                                    <p className="text-xs text-gray-500">Tamaño Estimado</p>
                                    <p className="text-lg font-bold text-gray-900">{backupStats.size}</p>
                                </div>
                            </div>

                            <div>
                                <p className="text-xs text-gray-500 mb-2">Colecciones:</p>
                                <div className="space-y-1">
                                    {backupStats.collections.map((col: any) => (
                                        <div key={col.name} className="flex justify-between text-sm">
                                            <span className="text-gray-700">{col.name}</span>
                                            <span className="text-gray-900 font-medium">{col.count} docs</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Restore Section */}
            <div className="bg-white rounded-xl border border-gray-200 p-6">
                <div className="flex items-center gap-3 mb-4">
                    <div className="p-3 bg-green-100 rounded-lg">
                        <Upload className="w-6 h-6 text-green-600" />
                    </div>
                    <div>
                        <h2 className="text-lg font-semibold text-gray-900">Restaurar Backup</h2>
                        <p className="text-sm text-gray-500">Importar datos desde un archivo JSON</p>
                    </div>
                </div>

                <div className="space-y-4">
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                        <input
                            type="file"
                            accept=".json"
                            onChange={handleRestoreBackup}
                            disabled={restoring}
                            className="hidden"
                            id="restore-file"
                        />
                        <label
                            htmlFor="restore-file"
                            className="cursor-pointer flex flex-col items-center gap-2"
                        >
                            <Upload className="w-8 h-8 text-gray-400" />
                            <p className="text-sm text-gray-600">
                                {restoring ? "Restaurando..." : "Click para seleccionar archivo JSON"}
                            </p>
                            <p className="text-xs text-gray-500">Solo archivos .json</p>
                        </label>
                    </div>

                    {restoreResult && (
                        <div className={`p-4 rounded-lg ${restoreResult.success ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'
                            }`}>
                            <div className="flex items-start gap-3">
                                {restoreResult.success ? (
                                    <CheckCircle className="w-5 h-5 text-green-600 mt-0.5" />
                                ) : (
                                    <AlertTriangle className="w-5 h-5 text-red-600 mt-0.5" />
                                )}
                                <div>
                                    <h4 className={`text-sm font-semibold ${restoreResult.success ? 'text-green-900' : 'text-red-900'
                                        }`}>
                                        {restoreResult.success ? 'Restauración Exitosa' : 'Restauración con Errores'}
                                    </h4>
                                    <p className={`text-sm mt-1 ${restoreResult.success ? 'text-green-800' : 'text-red-800'
                                        }`}>
                                        {restoreResult.restored} documentos restaurados
                                    </p>
                                    {restoreResult.errors.length > 0 && (
                                        <div className="mt-2 text-xs text-red-700">
                                            {restoreResult.errors.map((error: string, idx: number) => (
                                                <p key={idx}>• {error}</p>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Info */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h4 className="text-sm font-semibold text-blue-900 mb-2">💡 Recomendaciones</h4>
                <ul className="text-sm text-blue-800 space-y-1 list-disc list-inside">
                    <li>Crea backups regularmente (semanal o mensual)</li>
                    <li>Guarda los backups en un lugar seguro (Google Drive, Dropbox, etc.)</li>
                    <li>Prueba la restauración en un ambiente de desarrollo primero</li>
                    <li>Los backups incluyen TODOS los datos: propiedades, agentes, clientes, etc.</li>
                </ul>
            </div>
        </div>
    );
}
