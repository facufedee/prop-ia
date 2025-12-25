export interface ServiceCharge {
    type: 'luz' | 'gas' | 'agua' | 'expensas' | 'seguridad' | 'otros';
    amount: number;
    description?: string; // Para "otros"
}

export interface RentalService {
    id: string;
    rentalId: string;
    month: number; // 1-12
    year: number;
    charges: ServiceCharge[];
    total: number;
    sent: boolean;
    sentDate?: Date;
    createdAt: Date;
    createdBy: string;
}

export const SERVICE_TYPES = {
    luz: { label: 'Luz', icon: '💡' },
    gas: { label: 'Gas', icon: '🔥' },
    agua: { label: 'Agua', icon: '💧' },
    expensas: { label: 'Expensas', icon: '🏢' },
    seguridad: { label: 'Seguridad', icon: '🛡️' },
    otros: { label: 'Otros Gastos', icon: '📋' }
} as const;
