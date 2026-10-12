// Type-only import so scripts/clean_plan_claims.ts can load this file with
// Node type stripping (the "@/" alias is not resolvable at runtime there).
import type { Plan } from "@/domain/models/Subscription";

export interface UIPlan extends Plan {
    featuresList: string[];
}

export const PLANS: UIPlan[] = [
    {
        id: "basic",
        name: "Básico",
        tier: "basic",
        description: "Gestión de alquileres y propiedades",
        price: {
            monthly: 42000,
            yearly: 42000 * 12,
        },
        features: [
            "Gestión de Propiedades",
            "Gestión de Alquileres",
            "Portal de inquilinos (vencimientos e historial de pagos)"
        ],
        limits: {
            properties: 25,
            users: 1,
            clients: 80,
            tasaciones: 0,
            aiCredits: 0,
            storage: "10GB",
        },
        featuresList: [
            "Gestión de alquileres con ajuste automático por ICL/IPC",
            "Alta y administración de contratos de alquiler",
            "Control de vencimientos de alquiler",
            "Registro de pagos y estado de cobros",
            "Gestión de propiedades",
            "Gestión básica de clientes (propietarios e inquilinos)",
            "Portal de inquilinos de consulta (vencimientos e historial de pagos)",
            "1 usuario",
            "Hasta 25 propiedades",
            "Hasta 80 clientes",
        ],
        createdAt: new Date(),
        updatedAt: new Date(),
    },
    {
        id: "professional",
        name: "Profesional",
        tier: "professional",
        description: "Alquileres, ventas, consultas y tasaciones con IA",
        popular: true,
        price: {
            monthly: 69000,
            yearly: 69000 * 12,
        },
        features: [
            "Gestión de Propiedades",
            "Gestión de Alquileres",
            "Portal de inquilinos (vencimientos e historial de pagos)",
            "Cobros a inquilinos con recibo PDF",
            "Liquidacion a Propietarios",
            "Calculo de Comisiones",
            "Pipeline de ventas",
            "Agenda"
        ],
        limits: {
            properties: 150,
            users: 5,
            clients: 'unlimited',
            tasaciones: 'unlimited',
            aiCredits: 'unlimited',
            storage: "50GB",
        },
        featuresList: [
            "Agenda de visitas y eventos",
            "Tasación de propiedades con IA",
            "Gestión de emprendimientos inmobiliarios",
            "Multi-sucursal",
            "CRM de consultas con notas e historial",
            "Hasta 5 usuarios",
            "Hasta 150 propiedades",
            "Clientes ilimitados",
        ],
        createdAt: new Date(),
        updatedAt: new Date(),
    },
    {
        id: "enterprise",
        name: "Enterprise",
        tier: "enterprise",
        description: "Usuarios y propiedades ilimitados, con tu marca en recibos y sitio web",
        price: {
            monthly: 99000,
            yearly: 99000 * 12,
        },
        features: [
            "Gestión de Propiedades",
            "Gestión de Alquileres",
            "Portal de inquilinos (vencimientos e historial de pagos)",
            "Cobros a inquilinos con recibo PDF",
            "Liquidacion a Propietarios",
            "Calculo de Comisiones",
            "Recibos con logo de la Inmobiliaria",
            "Pipeline de ventas",
            "Agenda",
            "Consultas",
            "Chat Zeta Prop (asistente con IA)",
            "Recordatorios de pago por WhatsApp (envío manual)",
            "Multi-sucursal",
            "Gestion de Agentes Inmobiliarios"
        ],
        limits: {
            properties: 'unlimited',
            users: 'unlimited',
            clients: 'unlimited',
            tasaciones: 'unlimited',
            aiCredits: 'unlimited',
            storage: "Unlimited",
        },
        featuresList: [
            "Sitio web con tu logo y colores (subdominio)",
            "Reportes de ventas y finanzas",
            "Usuarios ilimitados",
            "Soporte por tickets desde el panel",
            "Propiedades ilimitadas",
        ],
        createdAt: new Date(),
        updatedAt: new Date(),
    },
];
