import "server-only";
import { Timestamp } from "firebase-admin/firestore";
import { adminDb } from "@/infrastructure/firebase/admin";
import { Inquilino } from "@/domain/models/Inquilino";

/** Admin SDK counterpart of inquilinosService for API routes (rules deny anonymous web-SDK access). */
const COLLECTION = "inquilinos";

export const inquilinosAdminService = {
    getInquilinos: async (userId: string): Promise<Inquilino[]> => {
        const snapshot = await adminDb.collection(COLLECTION).where("userId", "==", userId).get();
        return snapshot.docs.map((d) => ({
            id: d.id,
            ...d.data(),
            createdAt: d.data().createdAt?.toDate(),
        } as Inquilino));
    },

    createInquilino: async (inquilino: Omit<Inquilino, "id" | "createdAt">): Promise<string> => {
        const ref = await adminDb.collection(COLLECTION).add({
            ...inquilino,
            createdAt: Timestamp.now(),
        });
        return ref.id;
    },
};
