import { db } from "@/infrastructure/firebase/client";
import {
    collection,
    addDoc,
    query,
    where,
    orderBy,
    onSnapshot,
    Timestamp,
    updateDoc,
    doc,
    arrayUnion,
    limit,
    or
} from "firebase/firestore";

export interface AppNotification {
    id: string;
    title: string;
    message: string;
    type: 'info' | 'success' | 'warning' | 'error';
    targetRole?: string; // e.g., 'Administrador'
    targetUserId?: string; // For specific user notifications (optional)
    readBy: string[]; // List of user IDs who have read this notification
    createdAt: Date;
    link?: string; // Optional link to redirect
}

const NOTIFICATIONS_COLLECTION = "notifications";

export const notificationService = {
    /**
     * Create a new notification
     */
    createNotification: async (
        title: string,
        message: string,
        type: AppNotification['type'] = 'info',
        targetRole?: string,
        link?: string
    ) => {
        if (!db) throw new Error("Firestore not initialized");

        await addDoc(collection(db, NOTIFICATIONS_COLLECTION), {
            title,
            message,
            type,
            targetRole,
            readBy: [],
            createdAt: Timestamp.now(),
            link
        });
    },

    /**
     * Mark a notification as read for a specific user
     */
    markAsRead: async (notificationId: string, userId: string) => {
        if (!db) throw new Error("Firestore not initialized");

        const notifRef = doc(db, NOTIFICATIONS_COLLECTION, notificationId);
        await updateDoc(notifRef, {
            readBy: arrayUnion(userId)
        });
    },

    /**
     * Subscribe to unread notifications for a user (based on role)
     */
    subscribeToNotifications: (
        userId: string,
        userRole: string | null | undefined, // Can be null if loading
        callback: (notifications: AppNotification[]) => void
    ) => {
        if (!db || !userRole) return () => { };

        // Query: Notifications targeting the user's role OR specific user, 
        // ordered by creation time.
        // Note: Firestore query limitations might require client-side filtering for 'readBy' if array-contains logic gets complex with role.
        // Strategy: Fetch recent relevant notifications and filter 'readBy' in client for simplicity and realtime speed on small datasets.
        // Logic: targetRole == userRole

        // To avoid Firebase composite index requirements for OR + orderBy queries,
        // we perform two separate queries and combine the results in memory.
        let roleNotifications: AppNotification[] = [];
        let userNotifications: AppNotification[] = [];

        const emitCombined = () => {
            const combinedMap = new Map<string, AppNotification>();
            roleNotifications.forEach(n => combinedMap.set(n.id, n));
            userNotifications.forEach(n => combinedMap.set(n.id, n));

            const combinedArray = Array.from(combinedMap.values());
            combinedArray.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

            callback(combinedArray.slice(0, 50));
        };

        const qRole = query(
            collection(db, NOTIFICATIONS_COLLECTION),
            where("targetRole", "==", userRole),
            orderBy("createdAt", "desc"),
            limit(50)
        );

        const qUser = query(
            collection(db, NOTIFICATIONS_COLLECTION),
            where("targetUserId", "==", userId),
            orderBy("createdAt", "desc"),
            limit(50)
        );

        const unsubRole = onSnapshot(qRole, (snapshot) => {
            roleNotifications = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data(),
                createdAt: doc.data().createdAt?.toDate() || new Date()
            })) as AppNotification[];
            emitCombined();
        }, (error) => {
            console.error("Error fetching role notifications:", error);
        });

        const unsubUser = onSnapshot(qUser, (snapshot) => {
            userNotifications = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data(),
                createdAt: doc.data().createdAt?.toDate() || new Date()
            })) as AppNotification[];
            emitCombined();
        }, (error) => {
            console.error("Error fetching user notifications:", error);
        });

        return () => {
            unsubRole();
            unsubUser();
        };
    }
};
