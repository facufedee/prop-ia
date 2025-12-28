import { db } from "@/infrastructure/firebase/client";
import {
    collection,
    doc,
    getDocs,
    getDoc,
    addDoc,
    updateDoc,
    deleteDoc,
    query,
    where,
    orderBy,
    Timestamp
} from "firebase/firestore";
import { Alquiler, Pago, Incidencia } from "@/domain/models/Alquiler";

const COLLECTION = "alquileres";

export const alquileresService = {
    // Get all contracts for a user
    getAlquileres: async (userId: string): Promise<Alquiler[]> => {
        if (!db) throw new Error("Firestore not initialized");
        const q = query(
            collection(db, COLLECTION),
            where("userId", "==", userId),
            orderBy("createdAt", "desc")
        );
        const snapshot = await getDocs(q);
        return snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
            fechaInicio: doc.data().fechaInicio?.toDate(),
            fechaFin: doc.data().fechaFin?.toDate(),
            createdAt: doc.data().createdAt?.toDate(),
            updatedAt: doc.data().updatedAt?.toDate(),
            historialPagos: (doc.data().historialPagos || []).map((p: any) => ({
                ...p,
                fechaVencimiento: p.fechaVencimiento?.toDate ? p.fechaVencimiento.toDate() : (p.fechaVencimiento ? new Date(p.fechaVencimiento) : undefined),
                fechaPago: p.fechaPago?.toDate ? p.fechaPago.toDate() : (p.fechaPago ? new Date(p.fechaPago) : undefined),
            })),
        } as Alquiler));
    },

    // Get contract by ID
    getAlquilerById: async (id: string): Promise<Alquiler | null> => {
        if (!db) throw new Error("Firestore not initialized");
        const docRef = doc(db, COLLECTION, id);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
            const data = docSnap.data();
            return {
                id: docSnap.id,
                ...data,
                fechaInicio: data.fechaInicio?.toDate(),
                fechaFin: data.fechaFin?.toDate(),
                createdAt: data.createdAt?.toDate(),
                updatedAt: data.updatedAt?.toDate(),
                historialPagos: (data.historialPagos || []).map((p: any) => ({
                    ...p,
                    fechaVencimiento: p.fechaVencimiento?.toDate ? p.fechaVencimiento.toDate() : (p.fechaVencimiento ? new Date(p.fechaVencimiento) : undefined),
                    fechaPago: p.fechaPago?.toDate ? p.fechaPago.toDate() : (p.fechaPago ? new Date(p.fechaPago) : undefined),
                })),
                incidencias: (data.incidencias || []).map((i: any) => ({
                    ...i,
                    fechaCreacion: i.fechaCreacion?.toDate ? i.fechaCreacion.toDate() : (i.fechaCreacion ? new Date(i.fechaCreacion) : undefined),
                    fechaResolucion: i.fechaResolucion?.toDate ? i.fechaResolucion.toDate() : (i.fechaResolucion ? new Date(i.fechaResolucion) : undefined),
                })),
            } as Alquiler;
        }
        return null;
    },

    // Create new contract
    createAlquiler: async (alquiler: Omit<Alquiler, "id" | "createdAt" | "updatedAt">): Promise<string> => {
        if (!db) throw new Error("Firestore not initialized");
        const docRef = await addDoc(collection(db, COLLECTION), {
            ...alquiler,
            fechaInicio: Timestamp.fromDate(new Date(alquiler.fechaInicio)),
            fechaFin: Timestamp.fromDate(new Date(alquiler.fechaFin)),
            createdAt: Timestamp.now(),
            updatedAt: Timestamp.now(),
        });
        return docRef.id;
    },


    // Update contract
    updateAlquiler: async (id: string, updates: Partial<Alquiler>): Promise<void> => {
        if (!db) throw new Error("Firestore not initialized");
        const docRef = doc(db, COLLECTION, id);

        // Helper for deep cleaning
        const deepCleanUndefined = (obj: any): any => {
            if (Array.isArray(obj)) {
                return obj.map(v => deepCleanUndefined(v));
            }
            if (obj && typeof obj === 'object') {
                // If it's a Firestore Timestamp or Date, return as is
                if (obj instanceof Date || (obj.toDate && typeof obj.toDate === 'function') || (obj.seconds && obj.nanoseconds)) {
                    return obj;
                }
                return Object.entries(obj).reduce((acc, [key, value]) => {
                    const cleaned = deepCleanUndefined(value);
                    if (cleaned !== undefined) {
                        acc[key] = cleaned;
                    }
                    return acc;
                }, {} as any);
            }
            return obj;
        };

        const updateData: any = {
            ...updates,
            updatedAt: Timestamp.now(),
        };

        if (updates.fechaInicio) {
            updateData.fechaInicio = Timestamp.fromDate(new Date(updates.fechaInicio));
        }
        if (updates.fechaFin) {
            updateData.fechaFin = Timestamp.fromDate(new Date(updates.fechaFin));
        }

        const sanitizedData = deepCleanUndefined(updateData);

        await updateDoc(docRef, sanitizedData);
    },

    // Delete contract
    deleteAlquiler: async (id: string): Promise<void> => {
        if (!db) throw new Error("Firestore not initialized");
        await deleteDoc(doc(db, COLLECTION, id));
    },

    // Register payment
    registrarPago: async (alquilerId: string, pago: Pago): Promise<void> => {
        const alquiler = await alquileresService.getAlquilerById(alquilerId);
        if (!alquiler) throw new Error("Contrato no encontrado");

        // Helper to remove undefined values which Firestore rejects
        const cleanUndefined = (obj: any) => {
            return Object.entries(obj).reduce((acc, [key, value]) => {
                if (value !== undefined) {
                    acc[key] = value;
                }
                return acc;
            }, {} as any);
        };

        const pagoSanitizado = cleanUndefined(pago);
        const historialActualizado = [...alquiler.historialPagos];
        const index = historialActualizado.findIndex(p => p.id === pago.id);

        if (index >= 0) {
            historialActualizado[index] = pagoSanitizado;
        } else {
            historialActualizado.push(pagoSanitizado);
        }

        await alquileresService.updateAlquiler(alquilerId, {
            historialPagos: historialActualizado,
        });
    },

    // Create maintenance request
    crearIncidencia: async (alquilerId: string, incidencia: Omit<Incidencia, "id" | "fechaCreacion">): Promise<void> => {
        const alquiler = await alquileresService.getAlquilerById(alquilerId);
        if (!alquiler) throw new Error("Contrato no encontrado");

        const nuevaIncidencia: Incidencia = {
            ...incidencia,
            id: Date.now().toString(),
            fechaCreacion: new Date(),
        };

        const incidenciasActualizadas = [...(alquiler.incidencias || []), nuevaIncidencia];

        await alquileresService.updateAlquiler(alquilerId, {
            incidencias: incidenciasActualizadas,
        });
    },

    // Get active contracts
    getAlquileresActivos: async (userId: string): Promise<Alquiler[]> => {
        if (!db) throw new Error("Firestore not initialized");
        const q = query(
            collection(db, COLLECTION),
            where("userId", "==", userId),
            where("estado", "==", "activo")
        );
        const snapshot = await getDocs(q);
        return snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
            fechaInicio: doc.data().fechaInicio?.toDate(),
            fechaFin: doc.data().fechaFin?.toDate(),
            createdAt: doc.data().createdAt?.toDate(),
            updatedAt: doc.data().updatedAt?.toDate(),
        } as Alquiler));
    },

    // Calculate if payment is due
    calcularVencimiento: (alquiler: Alquiler): { vencido: boolean; diasRestantes: number } => {
        const hoy = new Date();
        const diaActual = hoy.getDate();
        const mesActual = hoy.getMonth();
        const añoActual = hoy.getFullYear();

        const fechaVencimiento = new Date(añoActual, mesActual, alquiler.diaVencimiento);
        const diferencia = fechaVencimiento.getTime() - hoy.getTime();
        const diasRestantes = Math.ceil(diferencia / (1000 * 60 * 60 * 24));

        return {
            vencido: diasRestantes < 0,
            diasRestantes,
        };
    },

    // Calculate adjustment
    calcularAjuste: (montoActual: number, tipo: string, valor: number): number => {
        if (tipo === 'porcentaje') {
            return montoActual * (1 + valor / 100);
        }
        if (tipo === 'manual') {
            return valor;
        }
        // ICL would require external API call
        return montoActual;
    },
};
