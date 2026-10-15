import { db } from "../firebase/client";
import { collection, addDoc, updateDoc, doc } from "firebase/firestore";
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

    // Anonymous visitors cannot query `invitations` under the Firestore rules, so the
    // token is validated by the server (Admin SDK): GET /api/invitations/[token].
    async validateInvitation(token: string): Promise<Invitation | null> {
        const res = await fetch(`/api/invitations/${encodeURIComponent(token)}`, { cache: "no-store" });
        if (res.status === 404) return null;
        if (!res.ok) throw new Error("Error al validar la invitación");

        const data = await res.json();
        return { ...data, expiresAt: new Date(data.expiresAt) } as Invitation;
    },

    async markAsUsed(invitationId: string) {
        const ref = doc(db, COLLECTION_NAME, invitationId);
        await updateDoc(ref, { status: 'used' });
    }
};
