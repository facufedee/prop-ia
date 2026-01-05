export interface User {
    uid: string;
    email: string | null;
    displayName: string | null;
    photoURL: string | null;
    roleId?: string;
    createdAt?: Date;
    lastLogin?: Date;
    organizationId?: string;
    branchId?: string; // The branch this user belongs to (if agent) or currently managing (if admin context)
    // Subscription info (optional, joined from Subscription collection)
    subscription?: {
        planId: string;
        status: string;
        billingPeriod: string;
    };
    // Identity & Verification
    isVerified?: boolean;
    verificationStatus?: 'pending' | 'verified' | 'rejected' | 'none';
    identityDocument?: string; // URL to document or business domain
    logoUrl?: string; // URL to agency logo
}
