import "server-only";
import { Timestamp } from "firebase-admin/firestore";
import { adminDb } from "@/infrastructure/firebase/admin";
import { Alquiler, Pago, Incidencia } from "@/domain/models/Alquiler";

/**
 * Server-side (Admin SDK) counterpart of alquileresService for API routes, cron
 * jobs and the tenant portal. Firestore rules deny the `alquileres` collection
 * to unauthenticated web-SDK callers, so server code must use this module.
 * Read/write shapes mirror src/infrastructure/services/alquileresService.ts.
 */

const COLLECTION = "alquileres";

import type { DocumentData } from "firebase-admin/firestore";

type Data = DocumentData;

const toDateValue = (value: unknown): Date | undefined => {
    if (!value) return undefined;
    const withToDate = value as { toDate?: () => Date };
    if (typeof withToDate.toDate === "function") return withToDate.toDate();
    return new Date(value as string | number | Date);
};

const mapPagos = (pagos: Data[] = []) =>
    pagos.map((p) => ({
        ...p,
        fechaVencimiento: toDateValue(p.fechaVencimiento),
        fechaPago: toDateValue(p.fechaPago),
    }));

const mapIncidencias = (incidencias: Data[] = []) =>
    incidencias.map((i) => ({
        ...i,
        fechaCreacion: toDateValue(i.fechaCreacion),
        fechaResolucion: toDateValue(i.fechaResolucion),
    }));

const mapBase = (id: string, data: Data) => ({
    id,
    ...data,
    fechaInicio: data.fechaInicio?.toDate(),
    fechaFin: data.fechaFin?.toDate(),
    createdAt: data.createdAt?.toDate(),
    updatedAt: data.updatedAt?.toDate(),
});

// Removes undefined values (Firestore rejects them); keeps Dates/Timestamps intact.
const deepCleanUndefined = (obj: unknown): unknown => {
    if (Array.isArray(obj)) return obj.map((v) => deepCleanUndefined(v));
    if (obj && typeof obj === "object") {
        const o = obj as Data;
        if (o instanceof Date || typeof o.toDate === "function" || (o.seconds && o.nanoseconds)) {
            return o;
        }
        return Object.entries(o).reduce((acc, [key, value]) => {
            const cleaned = deepCleanUndefined(value);
            if (cleaned !== undefined) acc[key] = cleaned;
            return acc;
        }, {} as Data);
    }
    return obj;
};

/** Normalizes an address into the base of a rental code: upper case, no accents, dashes. */
export function rentalCodeBase(direccion: string): string {
    return direccion
        .toUpperCase()
        .normalize("NFD")
        .replace(/[̀-ͯ]/g, "") // Remove accents
        .replace(/[^A-Z0-9\s]/g, "")
        .trim()
        .replace(/\s+/g, "-");
}

export const alquileresAdminService = {
    getAlquileres: async (userId: string): Promise<Alquiler[]> => {
        const snapshot = await adminDb
            .collection(COLLECTION)
            .where("userId", "==", userId)
            .orderBy("createdAt", "desc")
            .get();
        return snapshot.docs.map((d) => {
            const data = d.data();
            return { ...mapBase(d.id, data), historialPagos: mapPagos(data.historialPagos) } as Alquiler;
        });
    },

    getAlquilerById: async (id: string): Promise<Alquiler | null> => {
        const snap = await adminDb.collection(COLLECTION).doc(id).get();
        if (!snap.exists) return null;
        const data = snap.data() as Data;
        return {
            ...mapBase(snap.id, data),
            historialPagos: mapPagos(data.historialPagos),
            incidencias: mapIncidencias(data.incidencias),
        } as Alquiler;
    },

    /** Globally unique rental code (the tenant portal looks rentals up by it). */
    generateUniqueCode: async (direccion: string): Promise<string> => {
        const baseCode = rentalCodeBase(direccion);
        let finalCode = baseCode;
        let counter = 1;
        // Duplicates per address are rare (< 5), so a sequential probe is fine.
        while (true) {
            const snap = await adminDb
                .collection(COLLECTION)
                .where("codigoAlquiler", "==", finalCode)
                .limit(1)
                .get();
            if (snap.empty) return finalCode;
            finalCode = `${baseCode}-${counter}`;
            counter++;
        }
    },

    createAlquiler: async (alquiler: Omit<Alquiler, "id" | "createdAt" | "updatedAt">): Promise<string> => {
        const codigoAlquiler = await alquileresAdminService.generateUniqueCode(alquiler.direccion);
        const ref = await adminDb.collection(COLLECTION).add({
            ...alquiler,
            codigoAlquiler,
            fechaInicio: Timestamp.fromDate(new Date(alquiler.fechaInicio)),
            fechaFin: Timestamp.fromDate(new Date(alquiler.fechaFin)),
            createdAt: Timestamp.now(),
            updatedAt: Timestamp.now(),
        });
        return ref.id;
    },

    updateAlquiler: async (id: string, updates: Partial<Alquiler>): Promise<void> => {
        const updateData: Data = { ...updates, updatedAt: Timestamp.now() };
        if (updates.fechaInicio) updateData.fechaInicio = Timestamp.fromDate(new Date(updates.fechaInicio));
        if (updates.fechaFin) updateData.fechaFin = Timestamp.fromDate(new Date(updates.fechaFin));
        await adminDb.collection(COLLECTION).doc(id).update(deepCleanUndefined(updateData) as Data);
    },

    deleteAlquiler: async (id: string): Promise<void> => {
        await adminDb.collection(COLLECTION).doc(id).delete();
    },

    registrarPago: async (alquilerId: string, pago: Pago): Promise<void> => {
        const alquiler = await alquileresAdminService.getAlquilerById(alquilerId);
        if (!alquiler) throw new Error("Contrato no encontrado");

        const pagoSanitizado = Object.entries(pago).reduce((acc, [key, value]) => {
            if (value !== undefined) acc[key] = value;
            return acc;
        }, {} as Data) as Pago;

        const historialActualizado = [...alquiler.historialPagos];
        const index = historialActualizado.findIndex((p) => p.id === pago.id);
        if (index >= 0) historialActualizado[index] = pagoSanitizado;
        else historialActualizado.push(pagoSanitizado);

        await alquileresAdminService.updateAlquiler(alquilerId, { historialPagos: historialActualizado });
    },

    crearIncidencia: async (alquilerId: string, incidencia: Omit<Incidencia, "id" | "fechaCreacion">): Promise<void> => {
        const alquiler = await alquileresAdminService.getAlquilerById(alquilerId);
        if (!alquiler) throw new Error("Contrato no encontrado");

        const nuevaIncidencia: Incidencia = {
            ...incidencia,
            id: Date.now().toString(),
            fechaCreacion: new Date(),
        };

        await alquileresAdminService.updateAlquiler(alquilerId, {
            incidencias: [...(alquiler.incidencias || []), nuevaIncidencia],
        });
    },

    /** All active contracts across users (cron jobs). */
    getAllActiveAlquileres: async (): Promise<Alquiler[]> => {
        const snapshot = await adminDb.collection(COLLECTION).where("estado", "==", "activo").get();
        return snapshot.docs.map((d) => mapBase(d.id, d.data()) as Alquiler);
    },

    /**
     * Tenant portal access: rental code + tenant DNI. Same matching as the former
     * client-side verifyTenantAccess (code upper-cased and trimmed, exact DNI).
     * Returns the rental id or null; callers must not reveal which part failed.
     */
    findRentalForTenant: async (code: string, dni: string): Promise<{ id: string; data: Data } | null> => {
        const normalizedCode = code.toUpperCase().trim();
        if (!normalizedCode || !dni) return null;
        const snapshot = await adminDb
            .collection(COLLECTION)
            .where("codigoAlquiler", "==", normalizedCode)
            .get();
        if (snapshot.empty) return null;
        const rentalDoc = snapshot.docs[0];
        const data = rentalDoc.data();
        if (data.dniInquilino !== dni) return null;
        return { id: rentalDoc.id, data };
    },
};
