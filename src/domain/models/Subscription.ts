export type PlanTier = 'basic' | 'professional' | 'enterprise';
export type BillingPeriod = 'monthly' | 'yearly';
export type SubscriptionStatus = 'active' | 'cancelled' | 'expired' | 'trial';

// Feature Flags (Boolean capabilities)
export type AppFeature =
    | 'rentals_management'
    | 'properties_publishing'
    | 'whatsapp_bot'
    | 'automatic_agenda'
    | 'automatic_notifications'
    | 'online_valuations'
    | 'tenant_portal'
    | 'custom_branding'
    | 'multi_branch';

export interface Plan {
    id: string;
    name: string;
    tier: PlanTier;
    description: string;
    price: {
        monthly: number;
        yearly: number;
    };
    // Replaced array with strict boolean record
    features: Record<AppFeature, boolean>;
    limits: {
        properties: number | 'unlimited';
        users: number | 'unlimited';
        clients: number | 'unlimited';
        tasaciones: number | 'unlimited';
        aiCredits: number | 'unlimited';
        storage: string; // e.g., "10GB", "unlimited"
    };
    popular?: boolean;
    icon?: string; // Icon name from Lucide
    createdAt: Date;
    updatedAt: Date;
}

export interface Subscription {
    id: string;
    userId: string;
    planId: string;
    planTier: PlanTier;
    status: SubscriptionStatus;
    billingPeriod: BillingPeriod;

    // Pricing
    amount: number;
    currency: string;

    // Dates
    startDate: Date;
    endDate: Date;
    trialEndDate?: Date;
    cancelledAt?: Date;

    // Payment
    paymentMethod?: string;
    lastPaymentDate?: Date;
    nextPaymentDate?: Date;

    // Usage
    usage: {
        properties: number;
        users: number;
        clients: number; // Added clients usage
        tasaciones: number;
        aiCredits: number;
    };

    createdAt: Date;
    updatedAt: Date;
}

export interface Payment {
    id: string;
    userId: string;
    subscriptionId: string;

    // Amount
    amount: number;
    currency: string;

    // Payment details
    paymentMethod: 'mercadopago' | 'stripe' | 'transfer';
    paymentId?: string; // External payment ID
    status: 'pending' | 'completed' | 'failed' | 'refunded';

    // Metadata
    description: string;
    metadata?: Record<string, any>;

    createdAt: Date;
    updatedAt: Date;
}

export interface Addon {
    id: string;
    name: string;
    description: string;
    price: number;
    type: 'one_time' | 'recurring';
    category: 'tasaciones' | 'ai_credits' | 'users' | 'storage' | 'other';
    quantity: number; // What you get (e.g., 100 tasaciones)
    createdAt: Date;
}
