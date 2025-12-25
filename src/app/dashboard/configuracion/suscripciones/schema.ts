import * as z from "zod";

export const planSchema = z.object({
    name: z.string().min(1, "El nombre es obligatorio"),
    tier: z.enum(["free", "professional", "enterprise"]),
    description: z.string().min(1, "La descripción es obligatoria"),
    icon: z.string().optional(),
    popular: z.boolean().default(false),
    price: z.object({
        monthly: z.number().min(0, "El precio mensual debe ser 0 o mayor"),
        yearly: z.number().min(0, "El precio anual debe ser 0 o mayor"),
    }),
    features: z.array(z.object({
        name: z.string().min(1, "El nombre de la característica es obligatorio"),
        included: z.boolean(),
        limit: z.union([z.number(), z.string()]).optional(),
    })),
    limits: z.object({
        properties: z.union([z.number(), z.literal("unlimited")]),
        users: z.union([z.number(), z.literal("unlimited")]),
        clients: z.union([z.number(), z.literal("unlimited")]), // Added clients limit
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
    features: [
        { name: "Hasta 5 propiedades", included: true },
        { name: "Soporte básico", included: true },
    ],
    limits: {
        properties: 10,
        users: 1,
        clients: 10,
        tasaciones: 5,
        aiCredits: 100,
        storage: "1GB",
    },
};
