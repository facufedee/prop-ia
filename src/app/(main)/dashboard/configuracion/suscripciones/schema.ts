import * as z from "zod";

export const planSchema = z.object({
    name: z.string().min(1, "El nombre es obligatorio"),
    tier: z.enum(["basic", "professional", "enterprise"]).default("basic"),
    description: z.string().min(1, "La descripción es obligatoria"),
    icon: z.string().optional(),
    popular: z.boolean().optional(),
    price: z.object({
        monthly: z.number({ invalid_type_error: "Debe ser un número" }).min(0, "El precio mensual debe ser 0 o mayor").default(0),
        yearly: z.number({ invalid_type_error: "Debe ser un número" }).min(0, "El precio anual debe ser 0 o mayor").default(0),
    }),
    features: z.array(z.string()),
    limits: z.object({
        properties: z.union([z.number(), z.literal("unlimited")]),
        users: z.union([z.number(), z.literal("unlimited")]),
        clients: z.union([z.number(), z.literal("unlimited")]),
        tasaciones: z.union([z.number(), z.literal("unlimited")]),
        aiCredits: z.union([z.number(), z.literal("unlimited")]),
        storage: z.string(),
    }),
});

export type PlanFormData = z.infer<typeof planSchema>;

export const defaultPlan: PlanFormData = {
    name: "",
    tier: "professional",
    description: "",
    icon: "Zap",
    popular: false,
    price: {
        monthly: 0,
        yearly: 0,
    },
    features: ["Gestión de Propiedades", "Gestión de Alquileres", "Reporte de Inquilinos"],
    limits: {
        properties: 10,
        users: 1,
        clients: 10,
        tasaciones: 5,
        aiCredits: 100,
        storage: "1GB",
    },
};
