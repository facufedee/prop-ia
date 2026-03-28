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
    Timestamp,
} from "firebase/firestore";
import { VentaOperacion, VentaEtapa, EventoVenta } from "@/domain/models/Venta";

const COLLECTION = "ventas";

// ── Helpers ───────────────────────────────────────────────────────────────────

const deepCleanUndefined = (obj: any): any => {
    if (Array.isArray(obj)) return obj.map(deepCleanUndefined);
    if (obj && typeof obj === "object") {
        if (
            obj instanceof Date ||
            (obj.toDate && typeof obj.toDate === "function") ||
            (obj.seconds !== undefined && obj.nanoseconds !== undefined)
        ) return obj;
        return Object.entries(obj).reduce((acc: any, [k, v]) => {
            const cleaned = deepCleanUndefined(v);
            if (cleaned !== undefined) acc[k] = cleaned;
            return acc;
        }, {});
    }
    return obj;
};

const toDate = (value: any): Date | undefined => {
    if (!value) return undefined;
    if (typeof value.toDate === "function") return value.toDate();
    const d = new Date(value);
    return isNaN(d.getTime()) ? undefined : d;
};

const deserializeVenta = (id: string, data: any): VentaOperacion => ({
    id,
    ...data,
    createdAt:        toDate(data.createdAt)!,
    updatedAt:        toDate(data.updatedAt)!,
    fechaEtapaActual: toDate(data.fechaEtapaActual)!,
    cotiFecha:        toDate(data.cotiFecha),
    fechaBoleto:      toDate(data.fechaBoleto),
    seña: data.seña ? {
        ...data.seña,
        fecha: toDate(data.seña.fecha)!,
    } : undefined,
    escritura: data.escritura ? {
        ...data.escritura,
        fechaPrevista:  toDate(data.escritura.fechaPrevista),
        fechaRealizada: toDate(data.escritura.fechaRealizada),
    } : undefined,
    eventos: (data.eventos || []).map((e: any) => ({
        ...e,
        fecha: toDate(e.fecha)!,
    })),
});

// ── Service ───────────────────────────────────────────────────────────────────

export const ventasService = {

    getVentas: async (userId: string): Promise<VentaOperacion[]> => {
        if (!db) throw new Error("Firestore not initialized");
        const q = query(
            collection(db, COLLECTION),
            where("userId", "==", userId),
            orderBy("createdAt", "desc")
        );
        const snap = await getDocs(q);
        return snap.docs.map(d => deserializeVenta(d.id, d.data()));
    },

    getVentaById: async (id: string): Promise<VentaOperacion | null> => {
        if (!db) throw new Error("Firestore not initialized");
        const snap = await getDoc(doc(db, COLLECTION, id));
        if (!snap.exists()) return null;
        return deserializeVenta(snap.id, snap.data());
    },

    createVenta: async (
        data: Omit<VentaOperacion, "id" | "createdAt" | "updatedAt">
    ): Promise<string> => {
        if (!db) throw new Error("Firestore not initialized");
        const now = Timestamp.now();
        const payload = deepCleanUndefined({
            ...data,
            fechaEtapaActual: now,
            createdAt: now,
            updatedAt: now,
        });
        const ref = await addDoc(collection(db, COLLECTION), payload);
        return ref.id;
    },

    updateVenta: async (id: string, updates: Partial<VentaOperacion>): Promise<void> => {
        if (!db) throw new Error("Firestore not initialized");
        const updateData: any = { ...updates, updatedAt: Timestamp.now() };
        await updateDoc(doc(db, COLLECTION, id), deepCleanUndefined(updateData));
    },

    deleteVenta: async (id: string): Promise<void> => {
        if (!db) throw new Error("Firestore not initialized");
        await deleteDoc(doc(db, COLLECTION, id));
    },

    actualizarEtapa: async (
        ventaId: string,
        etapa: VentaEtapa,
        agenteNombre?: string
    ): Promise<void> => {
        if (!db) throw new Error("Firestore not initialized");
        const snap = await getDoc(doc(db, COLLECTION, ventaId));
        if (!snap.exists()) return;

        const data = snap.data();
        const eventos = data.eventos || [];
        const nuevoEvento = {
            id:          crypto.randomUUID(),
            tipo:        "estado",
            descripcion: `Etapa cambiada a: ${etapa.replace("_", " ")}`,
            fecha:       Timestamp.now(),
            agenteNombre,
        };

        await updateDoc(doc(db, COLLECTION, ventaId), deepCleanUndefined({
            etapa,
            fechaEtapaActual: Timestamp.now(),
            updatedAt:        Timestamp.now(),
            estado:           etapa === "cerrada" ? "cerrado" : etapa === "caida" ? "caido" : "activo",
            eventos:          [...eventos, nuevoEvento],
        }));
    },

    updatePropertyStatus: async (
        propertyId: string,
        status: "active" | "sold" | "inactive"
    ): Promise<void> => {
        if (!db) throw new Error("Firestore not initialized");
        await updateDoc(doc(db, "properties", propertyId), {
            status,
            updated_at: new Date().toISOString(),
        });
    },

    agregarEvento: async (
        ventaId: string,
        evento: Omit<EventoVenta, "id">
    ): Promise<void> => {
        if (!db) throw new Error("Firestore not initialized");
        const snap = await getDoc(doc(db, COLLECTION, ventaId));
        if (!snap.exists()) return;

        const eventos = snap.data().eventos || [];
        const nuevo = {
            ...evento,
            id:   crypto.randomUUID(),
            fecha: Timestamp.fromDate(new Date(evento.fecha)),
        };

        await updateDoc(doc(db, COLLECTION, ventaId), deepCleanUndefined({
            eventos:   [...eventos, nuevo],
            updatedAt: Timestamp.now(),
        }));
    },
};
