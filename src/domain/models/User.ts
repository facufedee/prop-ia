import { PlanTier } from "./Subscription";

export interface InmobiliariaProfile {
    nombreComercial?: string;    // Ej: "Inmobiliaria Müller"
    cuit?: string;               // Ej: "20-37083028-3"
    condicionIva?: string;       // "Responsable Monotributo" | "Responsable Inscripto" | "Exento"
    direccion?: string;          // Ej: "Av. San Martín 1543, Ituzaingó"
    telefono?: string;
    firmante?: string;           // Ej: "By Nahuel Müller"
    cargoFirmante?: string;      // Ej: "Administrador / Martillero"
    logoUrl?: string;            // Resolved at call site from User.logoUrl
}

export interface User {
    uid: string;
    email: string | null;
    displayName: string | null;
    photoURL: string | null;
    roleId?: string;
    createdAt?: Date;
    lastLogin?: Date;
    loginCount?: number;
    organizationId?: string;
    branchId?: string; // The branch this user belongs to (if agent) or currently managing (if admin context)
    alquileresCount?: number;
    // Subscription info (optional, joined from Subscription collection)
    subscription?: {
        planId: string;
        planTier: PlanTier;
        status: string;
        billingPeriod: string;
        endDate?: Date;
    };
    // Identity & Verification
    isVerified?: boolean;
    verificationStatus?: 'pending' | 'verified' | 'rejected' | 'none';
    identityDocument?: string; // URL to document or business domain
    logoUrl?: string; // URL to agency logo
    inmobiliariaProfile?: InmobiliariaProfile;
    disabled?: boolean;
    // Manual Payment Flow Flags
    pendingPaymentApproval?: boolean;
    showPaymentWelcome?: boolean;
    hasRequestedExtension?: boolean;
    unsubscribedMarketing?: boolean;
}
