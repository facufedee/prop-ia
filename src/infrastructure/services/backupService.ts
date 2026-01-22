import { db } from "@/infrastructure/firebase/client";
import { collection, getDocs, writeBatch, doc } from "firebase/firestore";

interface BackupData {
    version: string;
    timestamp: Date;
    collections: {
        [collectionName: string]: any[];
    };
}

const COLLECTIONS_TO_BACKUP = [
    'properties',
    'alquileres',
    'inquilinos',
    'agentes',
    'transacciones',
    'propietarios',
    'leads',
    'visitas',
    'audit_logs',
    'configuracion_comisiones',
    'roles',
    'users',
];

export const backupService = {
    // Crear backup completo
    createBackup: async (userId: string): Promise<BackupData> => {
        const backup: BackupData = {
            version: '1.0',
            timestamp: new Date(),
            collections: {},
        };

        for (const collectionName of COLLECTIONS_TO_BACKUP) {
            try {
                if (!db) throw new Error("Firestore not initialized");
                const q = collection(db, collectionName);
                const snapshot = await getDocs(q);

                backup.collections[collectionName] = snapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data(),
                    // Convert Timestamps to ISO strings for JSON serialization
                    _timestamps: Object.keys(doc.data()).reduce((acc, key) => {
                        const value = doc.data()[key];
                        if (value?.toDate) {
                            acc[key] = value.toDate().toISOString();
                        }
                        return acc;
                    }, {} as any),
                }));

                console.log(`Backed up ${backup.collections[collectionName].length} documents from ${collectionName}`);
            } catch (error) {
                console.error(`Error backing up ${collectionName}:`, error);
                backup.collections[collectionName] = [];
            }
        }

        return backup;
    },

    // Descargar backup como JSON
    downloadBackup: async (userId: string): Promise<void> => {
        const backup = await backupService.createBackup(userId);

        const dataStr = JSON.stringify(backup, null, 2);
        const blob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(blob);

        const a = document.createElement('a');
        a.href = url;
        a.download = `propia-backup-${new Date().toISOString().split('T')[0]}.json`;
        a.click();

        URL.revokeObjectURL(url);
    },

    // Restaurar desde backup
    restoreBackup: async (backupData: BackupData, userId: string): Promise<{
        success: boolean;
        restored: number;
        errors: string[];
    }> => {
        const errors: string[] = [];
        let restored = 0;

        for (const [collectionName, documents] of Object.entries(backupData.collections)) {
            try {
                // Restore in batches of 500 (Firestore limit)
                const batchSize = 500;
                for (let i = 0; i < documents.length; i += batchSize) {
                    if (!db) throw new Error("Firestore not initialized");
                    const batch = writeBatch(db);
                    const batchDocs = documents.slice(i, i + batchSize);

                    for (const docData of batchDocs) {
                        const { id, _timestamps, ...data } = docData;

                        // Restore timestamps
                        if (_timestamps) {
                            Object.keys(_timestamps).forEach(key => {
                                if (_timestamps[key]) {
                                    data[key] = new Date(_timestamps[key]);
                                }
                            });
                        }

                        const docRef = doc(db, collectionName, id);
                        batch.set(docRef, data);
                        restored++;
                    }

                    await batch.commit();
                }

                console.log(`Restored ${documents.length} documents to ${collectionName}`);
            } catch (error: any) {
                const errorMsg = `Error restoring ${collectionName}: ${error.message}`;
                console.error(errorMsg);
                errors.push(errorMsg);
            }
        }

        return {
            success: errors.length === 0,
            restored,
            errors,
        };
    },

    // Validar backup
    validateBackup: (backupData: any): { valid: boolean; errors: string[] } => {
        const errors: string[] = [];

        if (!backupData.version) {
            errors.push('Backup version missing');
        }

        if (!backupData.timestamp) {
            errors.push('Backup timestamp missing');
        }

        if (!backupData.collections || typeof backupData.collections !== 'object') {
            errors.push('Backup collections missing or invalid');
        }

        return {
            valid: errors.length === 0,
            errors,
        };
    },

    // Obtener estadísticas del backup
    getBackupStats: (backupData: BackupData): {
        totalDocuments: number;
        collections: { name: string; count: number }[];
        size: string;
    } => {
        const collections = Object.entries(backupData.collections).map(([name, docs]) => ({
            name,
            count: docs.length,
        }));

        const totalDocuments = collections.reduce((sum, col) => sum + col.count, 0);

        const sizeInBytes = new Blob([JSON.stringify(backupData)]).size;
        const sizeInMB = (sizeInBytes / (1024 * 1024)).toFixed(2);

        return {
            totalDocuments,
            collections,
            size: `${sizeInMB} MB`,
        };
    },
};
