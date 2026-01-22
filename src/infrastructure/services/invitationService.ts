import { db } from "../firebase/client";
import { collection, addDoc, query, where, getDocs, updateDoc, doc, getDoc } from "firebase/firestore";
import { v4 as uuidv4 } from "uuid";

export interface Invitation {
    id?: string;
    token: string;
    agenteId: string;
    email: string;
    branchId: string;
    organizationId: string; // The admin's ID
    expiresAt: Date;
    status: 'pending' | 'used' | 'expired';
    createdAt: Date;
}

const COLLECTION_NAME = "invitations";

export const invitationService = {
    async createInvitation(agenteId: string, email: string, branchId: string, organizationId: string): Promise<string> {
        const token = uuidv4();
        const invitation: Invitation = {
            token,
            agenteId,
            email,
            branchId,
            organizationId,
            expiresAt: new Date(Date.now() + 48 * 60 * 60 * 1000), // 48 hours
            status: 'pending',
            createdAt: new Date()
        };

        await addDoc(collection(db, COLLECTION_NAME), invitation);
        return token;
    },

    async validateInvitation(token: string): Promise<Invitation | null> {
        const q = query(collection(db, COLLECTION_NAME), where("token", "==", token), where("status", "==", "pending"));
        const snapshot = await getDocs(q);

        if (snapshot.empty) return null;

        const docData = snapshot.docs[0].data() as any;
        const invitation: Invitation = { ...docData, id: snapshot.docs[0].id, expiresAt: docData.expiresAt.toDate() };

        if (invitation.expiresAt < new Date()) {
            // Mark as expired if needed, or just return null
            return null;
        }

        return invitation;
    },

    async markAsUsed(invitationId: string) {
        const ref = doc(db, COLLECTION_NAME, invitationId);
        await updateDoc(ref, { status: 'used' });
    }
};
