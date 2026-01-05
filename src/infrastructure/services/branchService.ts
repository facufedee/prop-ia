import { db } from "@/infrastructure/firebase/client";
import { collection, doc, getDocs, getDoc, addDoc, updateDoc, deleteDoc, query, where, Timestamp } from "firebase/firestore";
import { Branch } from "@/domain/models/Branch";

const COLLECTION = "branches";

export const branchService = {
    // Get all branches for an organization (user)
    getBranches: async (organizationId: string): Promise<Branch[]> => {
        if (!db) throw new Error("Firestore not initialized");
        const q = query(
            collection(db, COLLECTION),
            where("organizationId", "==", organizationId)
        );
        const snapshot = await getDocs(q);
        return snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
            createdAt: doc.data().createdAt?.toDate(),
            updatedAt: doc.data().updatedAt?.toDate(),
        } as Branch));
    },

    // Create a new branch
    createBranch: async (branch: Omit<Branch, "id" | "createdAt" | "updatedAt">): Promise<string> => {
        if (!db) throw new Error("Firestore not initialized");
        const docRef = await addDoc(collection(db, COLLECTION), {
            ...branch,
            isActive: true,
            createdAt: Timestamp.now(),
            updatedAt: Timestamp.now(),
        });
        return docRef.id;
    },

    // Update a branch
    updateBranch: async (id: string, updates: Partial<Branch>): Promise<void> => {
        if (!db) throw new Error("Firestore not initialized");
        const docRef = doc(db, COLLECTION, id);
        await updateDoc(docRef, {
            ...updates,
            updatedAt: Timestamp.now(),
        });
    },

    // Delete a branch
    deleteBranch: async (id: string): Promise<void> => {
        if (!db) throw new Error("Firestore not initialized");
        await deleteDoc(doc(db, COLLECTION, id));
    }
};
