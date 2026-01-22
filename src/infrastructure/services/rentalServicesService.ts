import { db } from "@/infrastructure/firebase/client";
import {
    collection,
    addDoc,
    getDocs,
    query,
    where,
    orderBy,
    doc,
    updateDoc,
    getDoc
} from "firebase/firestore";
import { RentalService, ServiceCharge } from "@/domain/models/RentalService";

export const rentalServicesService = {
    /**
     * Crear servicios para un mes específico
     */
    async createMonthlyServices(
        rentalId: string,
        month: number,
        year: number,
        charges: ServiceCharge[],
        userId: string
    ): Promise<string> {
        if (!db) throw new Error("Firestore not initialized");

        // Calcular total
        const total = charges.reduce((sum, charge) => sum + charge.amount, 0);

        const serviceData: any = {
            rentalId,
            month,
            year,
            charges,
            total,
            sent: false,
            createdAt: new Date(),
            createdBy: userId
        };

        // Filtrar campos undefined (Firestore no los permite)
        Object.keys(serviceData).forEach(key => {
            if (serviceData[key] === undefined) {
                delete serviceData[key];
            }
        });

        const docRef = await addDoc(collection(db, "rentalServices"), serviceData);
        return docRef.id;
    },

    /**
     * Obtener todos los servicios de un alquiler
     */
    async getServicesByRental(rentalId: string): Promise<RentalService[]> {
        if (!db) throw new Error("Firestore not initialized");

        const q = query(
            collection(db, "rentalServices"),
            where("rentalId", "==", rentalId),
            orderBy("year", "desc"),
            orderBy("month", "desc")
        );

        const snapshot = await getDocs(q);
        return snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        } as RentalService));
    },

    /**
     * Obtener servicios de un mes específico
     */
    async getServicesByMonth(
        rentalId: string,
        month: number,
        year: number
    ): Promise<RentalService | null> {
        if (!db) throw new Error("Firestore not initialized");

        const q = query(
            collection(db, "rentalServices"),
            where("rentalId", "==", rentalId),
            where("month", "==", month),
            where("year", "==", year)
        );

        const snapshot = await getDocs(q);
        if (snapshot.empty) return null;

        const doc = snapshot.docs[0];
        return {
            id: doc.id,
            ...doc.data()
        } as RentalService;
    },

    /**
     * Actualizar servicios existentes
     */
    async updateServices(
        serviceId: string,
        charges: ServiceCharge[]
    ): Promise<void> {
        if (!db) throw new Error("Firestore not initialized");

        const total = charges.reduce((sum, charge) => sum + charge.amount, 0);

        await updateDoc(doc(db, "rentalServices", serviceId), {
            charges,
            total,
            updatedAt: new Date()
        });
    },

    /**
     * Marcar servicios como enviados
     */
    async markAsSent(serviceId: string): Promise<void> {
        if (!db) throw new Error("Firestore not initialized");

        await updateDoc(doc(db, "rentalServices", serviceId), {
            sent: true,
            sentDate: new Date()
        });
    },

    /**
     * Obtener alquileres que necesitan carga de servicios
     * (alquileres activos sin servicios del mes anterior)
     */
    async getPendingRentalsForServices(userId: string): Promise<any[]> {
        if (!db) throw new Error("Firestore not initialized");

        // Obtener alquileres activos del usuario
        const rentalsQuery = query(
            collection(db, "alquileres"),
            where("userId", "==", userId),
            where("estado", "==", "activo")
        );

        const rentalsSnapshot = await getDocs(rentalsQuery);
        const rentals = rentalsSnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));

        // Obtener mes anterior
        const now = new Date();
        const lastMonth = now.getMonth(); // 0-11
        const lastMonthYear = lastMonth === 0 ? now.getFullYear() - 1 : now.getFullYear();
        const lastMonthNumber = lastMonth === 0 ? 12 : lastMonth;

        // Filtrar alquileres sin servicios del mes anterior
        const pending = [];
        for (const rental of rentals) {
            const services = await this.getServicesByMonth(
                rental.id,
                lastMonthNumber,
                lastMonthYear
            );
            if (!services) {
                pending.push(rental);
            }
        }

        return pending;
    },

    /**
     * Verificar si un alquiler tiene servicios cargados para el mes actual
     */
    async hasServicesForCurrentMonth(rentalId: string): Promise<boolean> {
        const now = new Date();
        const month = now.getMonth() + 1; // 1-12
        const year = now.getFullYear();

        const services = await this.getServicesByMonth(rentalId, month, year);
        return services !== null;
    }
};
