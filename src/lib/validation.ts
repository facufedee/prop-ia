import { z } from 'zod';

// ========== PROPERTY SCHEMAS ==========

export const propertySchema = z.object({
    title: z.string().min(5, 'El título debe tener al menos 5 caracteres').max(100, 'El título no puede exceder 100 caracteres'),
    description: z.string().min(20, 'La descripción debe tener al menos 20 caracteres').max(2000, 'La descripción no puede exceder 2000 caracteres'),
    type: z.enum([
        'Departamento',
        'Bodega-Galpon',
        'Bóveda, nicho o parcela',
        'Cama Náutica',
        'Casa',
        'Consultorio',
        'Depósito',
        'Edificio',
        'Fondo de comercio',
        'Cochera',
        'Hotel',
        'Local comercial',
        'Oficina comercial',
        'PH',
        'Quinta Vacacional',
        'Terreno', // Keeping Terreno just in case legacy data exists or user forgot it (it was in previous validation)
        'Otro'
    ]),
    operation: z.enum(['venta', 'alquiler', 'alquiler_temporal']),
    price: z.number().positive('El precio debe ser mayor a 0').max(999999999, 'Precio inválido'),
    currency: z.enum(['ARS', 'USD']),

    // Location
    address: z.string().min(5, 'La dirección debe tener al menos 5 caracteres').max(200),
    city: z.string().min(2, 'La ciudad debe tener al menos 2 caracteres').max(100),
    province: z.string().min(2, 'La provincia debe tener al menos 2 caracteres').max(100),
    neighborhood: z.string().max(100).optional(),

    // Details
    bedrooms: z.number().int().min(0).max(50).optional(),
    bathrooms: z.number().int().min(0).max(50).optional(),
    area: z.number().positive('El área debe ser mayor a 0').max(999999).optional(),
    coveredArea: z.number().positive().max(999999).optional(),

    // Features
    features: z.array(z.string().max(50)).max(50, 'Máximo 50 características').optional(),
    images: z.array(z.string().url('URL de imagen inválida')).max(30, 'Máximo 30 imágenes').optional(),

    // Status
    status: z.enum(['draft', 'active', 'sold', 'rented', 'inactive']),
    featured: z.boolean().optional(),
});

export type PropertyInput = z.infer<typeof propertySchema>;

// ========== USER SCHEMAS ==========

export const userRegistrationSchema = z.object({
    email: z.string().email('Email inválido').toLowerCase(),
    password: z.string()
        .min(8, 'La contraseña debe tener al menos 8 caracteres')
        .max(100, 'La contraseña no puede exceder 100 caracteres')
        .regex(/[A-Z]/, 'Debe contener al menos una mayúscula')
        .regex(/[a-z]/, 'Debe contener al menos una minúscula')
        .regex(/[0-9]/, 'Debe contener al menos un número'),
    displayName: z.string().min(2, 'El nombre debe tener al menos 2 caracteres').max(100),
    agencyName: z.string().min(2, 'El nombre de la agencia debe tener al menos 2 caracteres').max(200),
    phone: z.string().regex(/^\+?[0-9]{8,15}$/, 'Teléfono inválido').optional(),
});

export const userLoginSchema = z.object({
    email: z.string().email('Email inválido').toLowerCase(),
    password: z.string().min(1, 'La contraseña es requerida'),
});

export type UserRegistrationInput = z.infer<typeof userRegistrationSchema>;
export type UserLoginInput = z.infer<typeof userLoginSchema>;

// ========== AGENT SCHEMAS ==========

export const agentSchema = z.object({
    nombre: z.string().min(2, 'El nombre debe tener al menos 2 caracteres').max(100),
    email: z.string().email('Email inválido').toLowerCase(),
    telefono: z.string().regex(/^\+?[0-9]{8,15}$/, 'Teléfono inválido'),
    comisionVenta: z.number().min(0, 'La comisión debe ser mayor o igual a 0').max(100, 'La comisión no puede exceder 100%'),
    comisionAlquiler: z.number().min(0).max(100),
    comisionPropiedadPropia: z.number().min(0).max(100),
    activo: z.boolean(),
});

export type AgentInput = z.infer<typeof agentSchema>;

// ========== TICKET SCHEMAS ==========

export const ticketSchema = z.object({
    title: z.string().min(5, 'El título debe tener al menos 5 caracteres').max(200),
    description: z.string().min(10, 'La descripción debe tener al menos 10 caracteres').max(5000),
    category: z.enum(['soporte_tecnico', 'mejora', 'bug', 'consulta', 'administrativo', 'otro']),
    priority: z.enum(['baja', 'media', 'alta', 'urgente']),
});

export const ticketMessageSchema = z.object({
    message: z.string().min(1, 'El mensaje no puede estar vacío').max(5000),
});

export type TicketInput = z.infer<typeof ticketSchema>;
export type TicketMessageInput = z.infer<typeof ticketMessageSchema>;

// ========== LEAD SCHEMAS ==========

export const leadSchema = z.object({
    name: z.string().min(2, 'El nombre debe tener al menos 2 caracteres').max(100),
    email: z.string().email('Email inválido').toLowerCase().optional(),
    phone: z.string().regex(/^\+?[0-9]{8,15}$/, 'Teléfono inválido'),
    message: z.string().max(1000, 'El mensaje no puede exceder 1000 caracteres').optional(),
    propertyId: z.string().optional(),
    source: z.enum(['web', 'phone', 'email', 'whatsapp', 'referral', 'other']).optional(),
});

export type LeadInput = z.infer<typeof leadSchema>;

// ========== SANITIZATION HELPERS ==========

export const sanitizeString = (str: string): string => {
    return str
        .trim()
        .replace(/[<>]/g, '') // Remove < and >
        .replace(/javascript:/gi, '') // Remove javascript: protocol
        .replace(/on\w+=/gi, ''); // Remove event handlers
};

export const sanitizeEmail = (email: string): string => {
    return email.toLowerCase().trim();
};

export const sanitizePhone = (phone: string): string => {
    return phone.replace(/[^\d+]/g, '');
};

// ========== URL VALIDATION ==========

export const isValidUrl = (url: string): boolean => {
    try {
        const parsed = new URL(url);
        return ['http:', 'https:'].includes(parsed.protocol);
    } catch {
        return false;
    }
};

export const sanitizeUrl = (url: string): string | null => {
    if (!isValidUrl(url)) return null;

    const parsed = new URL(url);
    // Only allow http and https
    if (!['http:', 'https:'].includes(parsed.protocol)) return null;

    return url;
};

// ========== VALIDATION HELPERS ==========

export const validateAndSanitize = <T>(
    schema: z.ZodSchema<T>,
    data: unknown
): { success: true; data: T } | { success: false; errors: string[] } => {
    try {
        const validated = schema.parse(data);
        return { success: true, data: validated };
    } catch (error) {
        if (error instanceof z.ZodError) {
            return {
                success: false,
                errors: error.issues.map(e => `${e.path.join('.')}: ${e.message}`),
            };
        }
        return {
            success: false,
            errors: ['Error de validación desconocido'],
        };
    }
};
