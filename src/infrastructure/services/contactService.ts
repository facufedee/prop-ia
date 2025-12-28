import { db } from "@/infrastructure/firebase/client";
import { collection, addDoc, Timestamp, getDocs, query, orderBy, doc, updateDoc, getDoc, deleteDoc } from "firebase/firestore";
import { ContactMessage } from "@/domain/models/ContactMessage";

const COLLECTION_NAME = "contact_messages";

export const contactService = {
    // Create new contact message
    createMessage: async (data: ContactMessage): Promise<string> => {
        if (!db) throw new Error("Firestore not initialized");

        const docRef = await addDoc(collection(db, COLLECTION_NAME), {
            ...data,
            read: false,
            createdAt: Timestamp.now(),
        });

        return docRef.id;
    },

    // Get all messages
    getMessages: async (): Promise<ContactMessage[]> => {
        if (!db) throw new Error("Firestore not initialized");
        const q = query(collection(db, COLLECTION_NAME), orderBy("createdAt", "desc"));
        const snapshot = await getDocs(q);

        return snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
            createdAt: doc.data().createdAt?.toDate() || new Date(),
        })) as ContactMessage[];
    },

    // Mark message as read
    markAsRead: async (id: string): Promise<void> => {
        if (!db) throw new Error("Firestore not initialized");
        const docRef = doc(db, COLLECTION_NAME, id);
        await updateDoc(docRef, {
            read: true
        });
    },

    // Delete message
    deleteMessage: async (id: string): Promise<void> => {
        if (!db) throw new Error("Firestore not initialized");
        await deleteDoc(doc(db, COLLECTION_NAME, id));
    },
};
