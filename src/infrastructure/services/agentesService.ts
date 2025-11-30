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
    Timestamp
} from "firebase/firestore";
import { Agente, Transaccion, ConfiguracionComisiones } from "@/domain/models/Agente";

const AGENTES_COLLECTION = "agentes";
const TRANSACCIONES_COLLECTION = "transacciones";
const CONFIG_COLLECTION = "configuracion_comisiones";

export const agentesService = {
    // ========== AGENTES ==========

    getAgentes: async (userId: string): Promise<Agente[]> => {
        const q = query(collection(db, AGENTES_COLLECTION), where("userId", "==", userId));
        const snapshot = await getDocs(q);

        return snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
            fechaIngreso: doc.data().fechaIngreso?.toDate() || new Date(),
            createdAt: doc.data().createdAt?.toDate() || new Date(),
            updatedAt: doc.data().updatedAt?.toDate() || new Date(),
        })) as Agente[];
    },

    getAgenteById: async (id: string): Promise<Agente | null> => {
        const docRef = doc(db, AGENTES_COLLECTION, id);
        const docSnap = await getDoc(docRef);

        if (!docSnap.exists()) return null;

        return {
            id: docSnap.id,
            ...docSnap.data(),
            fechaIngreso: docSnap.data().fechaIngreso?.toDate() || new Date(),
            createdAt: docSnap.data().createdAt?.toDate() || new Date(),
            updatedAt: docSnap.data().updatedAt?.toDate() || new Date(),
        } as Agente;
    },

    createAgente: async (data: Omit<Agente, "id" | "createdAt" | "updatedAt">): Promise<string> => {
        const docRef = await addDoc(collection(db, AGENTES_COLLECTION), {
            ...data,
            fechaIngreso: Timestamp.fromDate(data.fechaIngreso),
            createdAt: Timestamp.now(),
            updatedAt: Timestamp.now(),
        });
        return docRef.id;
    },

    updateAgente: async (id: string, data: Partial<Agente>): Promise<void> => {
        const docRef = doc(db, AGENTES_COLLECTION, id);
        const updateData: any = {
            ...data,
            updatedAt: Timestamp.now(),
        };

        if (data.fechaIngreso) {
            updateData.fechaIngreso = Timestamp.fromDate(data.fechaIngreso);
        }

        await updateDoc(docRef, updateData);
    },

    deleteAgente: async (id: string): Promise<void> => {
        const docRef = doc(db, AGENTES_COLLECTION, id);
        await deleteDoc(docRef);
    },

    // Actualizar estadísticas del agente
    updateStats: async (
        agenteId: string,
        stats: Partial<Pick<Agente, 'totalVentas' | 'totalAlquileres' | 'totalVisitas' | 'totalComisiones'>>
    ): Promise<void> => {
        const agente = await agentesService.getAgenteById(agenteId);
        if (!agente) return;

        await agentesService.updateAgente(agenteId, {
            totalVentas: stats.totalVentas !== undefined ? stats.totalVentas : agente.totalVentas,
            totalAlquileres: stats.totalAlquileres !== undefined ? stats.totalAlquileres : agente.totalAlquileres,
            totalVisitas: stats.totalVisitas !== undefined ? stats.totalVisitas : agente.totalVisitas,
            totalComisiones: stats.totalComisiones !== undefined ? stats.totalComisiones : agente.totalComisiones,
        });
    },

    // ========== TRANSACCIONES ==========

    getTransacciones: async (userId: string): Promise<Transaccion[]> => {
        const q = query(collection(db, TRANSACCIONES_COLLECTION), where("userId", "==", userId));
        const snapshot = await getDocs(q);

        return snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
            fechaTransaccion: doc.data().fechaTransaccion?.toDate() || new Date(),
            fechaPago: doc.data().fechaPago?.toDate(),
            createdAt: doc.data().createdAt?.toDate() || new Date(),
            updatedAt: doc.data().updatedAt?.toDate() || new Date(),
        })) as Transaccion[];
    },

    getTransaccionesByAgente: async (userId: string, agenteId: string): Promise<Transaccion[]> => {
        const q = query(
            collection(db, TRANSACCIONES_COLLECTION),
            where("userId", "==", userId),
            where("agenteId", "==", agenteId)
        );
        const snapshot = await getDocs(q);

        return snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
            fechaTransaccion: doc.data().fechaTransaccion?.toDate() || new Date(),
            fechaPago: doc.data().fechaPago?.toDate(),
            createdAt: doc.data().createdAt?.toDate() || new Date(),
            updatedAt: doc.data().updatedAt?.toDate() || new Date(),
        })) as Transaccion[];
    },

    createTransaccion: async (data: Omit<Transaccion, "id" | "createdAt" | "updatedAt">): Promise<string> => {
        const docRef = await addDoc(collection(db, TRANSACCIONES_COLLECTION), {
            ...data,
            fechaTransaccion: Timestamp.fromDate(data.fechaTransaccion),
            fechaPago: data.fechaPago ? Timestamp.fromDate(data.fechaPago) : null,
            createdAt: Timestamp.now(),
            updatedAt: Timestamp.now(),
        });

        // Actualizar estadísticas del agente
        const agente = await agentesService.getAgenteById(data.agenteId);
        if (agente) {
            const updates: any = {
                totalComisiones: agente.totalComisiones + data.comisionMonto,
            };

            if (data.tipo === 'venta') {
                updates.totalVentas = agente.totalVentas + 1;
            } else {
                updates.totalAlquileres = agente.totalAlquileres + 1;
            }

            await agentesService.updateStats(data.agenteId, updates);
        }

        return docRef.id;
    },

    marcarComoPagada: async (id: string): Promise<void> => {
        const docRef = doc(db, TRANSACCIONES_COLLECTION, id);
        await updateDoc(docRef, {
            estado: 'pagada',
            fechaPago: Timestamp.now(),
            updatedAt: Timestamp.now(),
        });
    },

    // Calcular comisión
    calcularComision: async (
        agenteId: string,
        montoTotal: number,
        tipo: 'venta' | 'alquiler',
        esPropiedadPropia: boolean
    ): Promise<{ comisionPorcentaje: number; comisionMonto: number; comisionExtra?: number }> => {
        const agente = await agentesService.getAgenteById(agenteId);
        if (!agente) throw new Error("Agente no encontrado");

        const porcentajeBase = tipo === 'venta' ? agente.comisionVenta : agente.comisionAlquiler;
        let comisionMonto = montoTotal * (porcentajeBase / 100);
        let comisionExtra = 0;

        if (esPropiedadPropia) {
            comisionExtra = montoTotal * (agente.comisionPropiedadPropia / 100);
            comisionMonto += comisionExtra;
        }

        return {
            comisionPorcentaje: porcentajeBase + (esPropiedadPropia ? agente.comisionPropiedadPropia : 0),
            comisionMonto,
            comisionExtra: esPropiedadPropia ? comisionExtra : undefined,
        };
    },

    // ========== CONFIGURACIÓN ==========

    getConfiguracion: async (userId: string): Promise<ConfiguracionComisiones | null> => {
        const q = query(collection(db, CONFIG_COLLECTION), where("userId", "==", userId));
        const snapshot = await getDocs(q);

        if (snapshot.empty) return null;

        const doc = snapshot.docs[0];
        return {
            id: doc.id,
            ...doc.data(),
            updatedAt: doc.data().updatedAt?.toDate() || new Date(),
        } as ConfiguracionComisiones;
    },

    createOrUpdateConfiguracion: async (
        userId: string,
        data: Omit<ConfiguracionComisiones, "id" | "userId" | "updatedAt">
    ): Promise<void> => {
        const existing = await agentesService.getConfiguracion(userId);

        if (existing) {
            const docRef = doc(db, CONFIG_COLLECTION, existing.id);
            await updateDoc(docRef, {
                ...data,
                updatedAt: Timestamp.now(),
            });
        } else {
            await addDoc(collection(db, CONFIG_COLLECTION), {
                ...data,
                userId,
                updatedAt: Timestamp.now(),
            });
        }
    },
};
