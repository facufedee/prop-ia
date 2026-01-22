import * as z from "zod";

export const planSchema = z.object({
    name: z.string().min(1, "El nombre es obligatorio"),
    tier: z.enum(["free", "professional", "enterprise"]),
    description: z.string().min(1, "La descripción es obligatoria"),
    icon: z.string().optional(),
    popular: z.boolean().optional(),
    price: z.object({
        monthly: z.number().min(0, "El precio mensual debe ser 0 o mayor"),
        yearly: z.number().min(0, "El precio anual debe ser 0 o mayor"),
    }),
    features: z.object({
        rentals_management: z.boolean(),
        properties_publishing: z.boolean(),
        whatsapp_bot: z.boolean(),
        automatic_agenda: z.boolean(),
        automatic_notifications: z.boolean(),
        online_valuations: z.boolean(),
        tenant_portal: z.boolean(),
        custom_branding: z.boolean(),
        multi_branch: z.boolean(),
    }),
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
    features: {
        rentals_management: false,
        properties_publishing: true,
        whatsapp_bot: false,
        automatic_agenda: false,
        automatic_notifications: true,
        online_valuations: false,
        tenant_portal: false,
        custom_branding: false,
        multi_branch: false,
    },
    limits: {
        properties: 10,
        users: 1,
        clients: 10,
        tasaciones: 5,
        aiCredits: 100,
        storage: "1GB",
    },
};
