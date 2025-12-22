export interface User {
    uid: string;
    email: string | null;
    displayName: string | null;
    photoURL: string | null;
    roleId?: string;
    createdAt?: Date;
    lastLogin?: Date;
    organizationId?: string;
    // Subscription info (optional, joined from Subscription collection)
    subscription?: {
        planId: string;
        status: string;
        billingPeriod: string;
    };
}
