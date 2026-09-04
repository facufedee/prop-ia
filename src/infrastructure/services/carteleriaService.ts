import { db, storage } from "@/infrastructure/firebase/client";
import {
    collection,
    doc,
    getDoc,
    getDocs,
    addDoc,
    updateDoc,
    deleteDoc,
    query,
    where,
    orderBy,
    Timestamp,
} from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { Cartel, CartelEstado, CartelMovimiento } from "@/domain/models/Cartel";

const COLLECTION = "carteles";

const deepCleanUndefined = (obj: any): any => {
    if (Array.isArray(obj)) return obj.map((v) => deepCleanUndefined(v));
    if (obj && typeof obj === "object") {
        if (obj instanceof Date || (obj.toDate && typeof obj.toDate === "function")) return obj;
        return Object.entries(obj).reduce((acc, [key, value]) => {
            const cleaned = deepCleanUndefined(value);
            if (cleaned !== undefined) acc[key] = cleaned;
            return acc;
        }, {} as any);
    }
    return obj;
};

const mapDoc = (id: string, data: any): Cartel => ({
    id,
    ...data,
    fechaAdquisicion: data.fechaAdquisicion?.toDate ? data.fechaAdquisicion.toDate() : data.fechaAdquisicion || null,
    fechaInstalacion: data.fechaInstalacion?.toDate ? data.fechaInstalacion.toDate() : data.fechaInstalacion || null,
    createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : new Date(),
    updatedAt: data.updatedAt?.toDate ? data.updatedAt.toDate() : new Date(),
    historial: (data.historial || []).map((m: any) => ({
        ...m,
        fecha: m.fecha?.toDate ? m.fecha.toDate() : new Date(m.fecha),
    })),
    fotos: data.fotos || [],
} as Cartel);

export const carteleriaService = {
    getCarteles: async (userId: string, branchId?: string): Promise<Cartel[]> => {
        if (!db) throw new Error("Firestore not initialized");
        let q = query(collection(db, COLLECTION), where("userId", "==", userId), orderBy("createdAt", "desc"));
        if (branchId && branchId !== "all") {
            q = query(collection(db, COLLECTION), where("userId", "==", userId), where("branchId", "==", branchId), orderBy("createdAt", "desc"));
        }
        const snapshot = await getDocs(q);
        return snapshot.docs.map((d) => mapDoc(d.id, d.data()));
    },

    getCartelById: async (id: string): Promise<Cartel | null> => {
        if (!db) throw new Error("Firestore not initialized");
        const snap = await getDoc(doc(db, COLLECTION, id));
        if (!snap.exists()) return null;
        return mapDoc(snap.id, snap.data());
    },

    createCartel: async (data: Omit<Cartel, "id" | "createdAt" | "updatedAt" | "historial">): Promise<string> => {
        if (!db) throw new Error("Firestore not initialized");
        const initialMovimiento: CartelMovimiento = {
            fecha: new Date(),
            estadoAnterior: null,
            estadoNuevo: data.estado,
            propiedadIdNuevo: data.propiedadId || null,
            propiedadDireccionNuevo: data.propiedadDireccion || null,
            nota: "Alta del cartel",
        };

        const payload = deepCleanUndefined({
            ...data,
            fechaAdquisicion: data.fechaAdquisicion ? Timestamp.fromDate(new Date(data.fechaAdquisicion)) : null,
            fechaInstalacion: data.fechaInstalacion ? Timestamp.fromDate(new Date(data.fechaInstalacion)) : null,
            historial: [{ ...initialMovimiento, fecha: Timestamp.fromDate(initialMovimiento.fecha) }],
            createdAt: Timestamp.now(),
            updatedAt: Timestamp.now(),
        });

        const docRef = await addDoc(collection(db, COLLECTION), payload);
        return docRef.id;
    },

    updateCartel: async (id: string, updates: Partial<Cartel>): Promise<void> => {
        if (!db) throw new Error("Firestore not initialized");
        const updateData: any = { ...updates, updatedAt: Timestamp.now() };
        if (updates.fechaAdquisicion) updateData.fechaAdquisicion = Timestamp.fromDate(new Date(updates.fechaAdquisicion));
        if (updates.fechaInstalacion) updateData.fechaInstalacion = Timestamp.fromDate(new Date(updates.fechaInstalacion));
        await updateDoc(doc(db, COLLECTION, id), deepCleanUndefined(updateData));
    },

    deleteCartel: async (id: string): Promise<void> => {
        if (!db) throw new Error("Firestore not initialized");
        await deleteDoc(doc(db, COLLECTION, id));
    },

    // Changes state (and optionally the associated property / warehouse location),
    // always appending an entry to the sign's movement history — the audit trail
    // an agency owner needs to answer "when did this sign leave that property?".
    cambiarEstado: async (
        id: string,
        nuevoEstado: CartelEstado,
        opts: {
            propiedadId?: string | null;
            propiedadDireccion?: string | null;
            ubicacionAlmacen?: string | null;
            nota?: string;
            usuarioNombre?: string;
        } = {}
    ): Promise<void> => {
        if (!db) throw new Error("Firestore not initialized");
        const cartel = await carteleriaService.getCartelById(id);
        if (!cartel) throw new Error("Cartel no encontrado");

        // `??` treats an explicit `null` (the caller clearing a field) as
        // "not provided" and falls back to the old value — wrong here, since
        // callers do pass explicit `null` to mean "clear this". Only fall
        // back when the key is truly absent (`undefined`).
        const propiedadIdFinal =
            nuevoEstado === "instalado"
                ? opts.propiedadId !== undefined ? opts.propiedadId : cartel.propiedadId ?? null
                : opts.propiedadId !== undefined ? opts.propiedadId : null;
        const propiedadDireccionFinal =
            nuevoEstado === "instalado"
                ? opts.propiedadDireccion !== undefined ? opts.propiedadDireccion : cartel.propiedadDireccion ?? null
                : opts.propiedadDireccion !== undefined ? opts.propiedadDireccion : null;
        const ubicacionAlmacenFinal =
            nuevoEstado === "almacen"
                ? opts.ubicacionAlmacen !== undefined ? opts.ubicacionAlmacen : cartel.ubicacionAlmacen ?? null
                : null;

        const movimiento: CartelMovimiento = {
            fecha: new Date(),
            estadoAnterior: cartel.estado,
            estadoNuevo: nuevoEstado,
            propiedadIdAnterior: cartel.propiedadId || null,
            propiedadDireccionAnterior: cartel.propiedadDireccion || null,
            propiedadIdNuevo: propiedadIdFinal,
            propiedadDireccionNuevo: propiedadDireccionFinal,
            nota: opts.nota,
            usuarioNombre: opts.usuarioNombre,
        };

        const historial = [...(cartel.historial || []), movimiento];

        const updateData: any = {
            estado: nuevoEstado,
            propiedadId: propiedadIdFinal,
            propiedadDireccion: propiedadDireccionFinal,
            ubicacionAlmacen: ubicacionAlmacenFinal,
            historial: historial.map((m) => ({ ...m, fecha: Timestamp.fromDate(m.fecha) })),
            updatedAt: Timestamp.now(),
        };

        if (nuevoEstado === "instalado") {
            updateData.fechaInstalacion = Timestamp.now();
        }

        await updateDoc(doc(db, COLLECTION, id), deepCleanUndefined(updateData));
    },

    uploadFoto: async (file: File, cartelId: string): Promise<string> => {
        if (!storage) throw new Error("Storage not initialized");
        const path = `carteleria/${cartelId}/${Date.now()}-${file.name}`;
        const storageRef = ref(storage, path);
        await uploadBytes(storageRef, file);
        return await getDownloadURL(storageRef);
    },

    // Suggests the next internal code (CART-001, CART-002, ...) based on how
    // many signs the agency already has — purely a convenience default.
    getNextCodigo: async (userId: string): Promise<string> => {
        const carteles = await carteleriaService.getCarteles(userId);
        const numbers = carteles
            .map((c) => c.codigo.match(/CART-(\d+)/)?.[1])
            .filter(Boolean)
            .map((n) => parseInt(n as string, 10));
        const next = (numbers.length > 0 ? Math.max(...numbers) : 0) + 1;
        return `CART-${String(next).padStart(3, "0")}`;
    },
};
