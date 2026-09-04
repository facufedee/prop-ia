import { tool, jsonSchema } from "ai";
import { adminDb } from "@/infrastructure/firebase/admin";
import { PLANS } from "@/infrastructure/data/plans";

// Live plan data as edited by the admin in /dashboard/configuracion/suscripciones,
// falling back to the local seed data only if the "plans" collection is empty.
async function fetchPlans() {
    const snapshot = await adminDb.collection("plans").get();
    if (snapshot.empty) return PLANS;
    return snapshot.docs.map((d) => ({ id: d.id, ...d.data() })) as (typeof PLANS)[number][];
}

export function buildAgentTools(userId: string) {
    return {
        get_plans_info: tool({
            description: "Obtiene planes y precios de Zeta Prop. Usar cuando pregunte sobre precios, planes, límites o diferencias entre planes.",
            parameters: jsonSchema<{ plan_name?: string }>({
                type: "object",
                properties: {
                    plan_name: { type: "string", description: "'basico', 'profesional' o 'enterprise'. Omitir para todos." },
                },
            }),
            execute: async ({ plan_name }) => await getPlansInfo(plan_name),
        }),

        get_blog_posts: tool({
            description: "Obtiene artículos recientes del blog.",
            parameters: jsonSchema<{ limit?: number }>({
                type: "object",
                properties: {
                    limit: { type: "number", description: "Cantidad de artículos (máx 5)" },
                },
            }),
            execute: async ({ limit }) => getBlogPosts(limit),
        }),

        get_contact_info: tool({
            description: "Obtiene información de contacto y soporte de Zeta Prop.",
            parameters: jsonSchema<Record<string, never>>({ type: "object", properties: {} }),
            execute: async () => getContactInfo(),
        }),

        get_platform_features: tool({
            description: "Obtiene información sobre módulos y funcionalidades de la plataforma.",
            parameters: jsonSchema<{ module?: string }>({
                type: "object",
                properties: {
                    module: { type: "string", description: "'propiedades', 'alquileres', 'leads', 'tasacion', 'portal_inquilinos', 'sitio_web', 'marketing'" },
                },
            }),
            execute: async ({ module }) => getPlatformFeatures(module),
        }),

        get_user_properties: tool({
            description: "Busca las propiedades del usuario. Usar cuando pregunte por sus propiedades, inmuebles, cartera.",
            parameters: jsonSchema<{ status?: string; limit?: number }>({
                type: "object",
                properties: {
                    status: { type: "string", description: "'active', 'inactive', 'reserved', 'sold'" },
                    limit: { type: "number", description: "Máximo de resultados (máx 10)" },
                },
            }),
            execute: async ({ status, limit }) => getUserProperties(userId, status, limit),
        }),

        get_user_alquileres: tool({
            description: "Obtiene contratos de alquiler del usuario. Usar cuando pregunte por alquileres, contratos, inquilinos, pagos, vencimientos, mora.",
            parameters: jsonSchema<{ status?: string; limit?: number }>({
                type: "object",
                properties: {
                    status: { type: "string", description: "'active', 'inactive', 'pending'" },
                    limit: { type: "number", description: "Máximo de resultados (máx 10)" },
                },
            }),
            execute: async ({ status, limit }) => getUserAlquileres(userId, status, limit),
        }),

        get_user_leads: tool({
            description: "Obtiene leads y consultas del usuario. Usar cuando pregunte por leads, clientes interesados, pipeline, CRM, seguimiento.",
            parameters: jsonSchema<{ status?: string; limit?: number }>({
                type: "object",
                properties: {
                    status: { type: "string", description: "Estado: 'nuevo', 'contactado', 'visita', 'reservado', 'cerrado'" },
                    limit: { type: "number", description: "Máximo de resultados (máx 10)" },
                },
            }),
            execute: async ({ status, limit }) => getUserLeads(userId, status, limit),
        }),

        get_user_stats: tool({
            description: "Obtiene estadísticas generales del negocio: propiedades activas, alquileres activos, leads nuevos. Usar para resúmenes.",
            parameters: jsonSchema<Record<string, never>>({ type: "object", properties: {} }),
            execute: async () => getUserStats(userId),
        }),
    };
}

// ─── Implementations ──────────────────────────────────────────────────────────

async function getPlansInfo(planName?: string) {
    const fmt = (n: number) =>
        new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS", maximumFractionDigits: 0 }).format(n);
    const fmtLimit = (v: number | string) =>
        v === "unlimited" || (typeof v === "number" && v > 900000) ? "Ilimitado" : String(v);

    const livePlans = await fetchPlans();
    const plans = livePlans.map((p: any) => ({
        nombre: p.name,
        tier: p.tier,
        precio_mensual: fmt(p.price.monthly),
        precio_anual: fmt(p.price.yearly),
        funciones: p.featuresList || p.features,
        limites: {
            propiedades: fmtLimit(p.limits.properties),
            usuarios: fmtLimit(p.limits.users),
            clientes: fmtLimit(p.limits.clients),
        },
    }));

    if (planName) {
        const norm = planName.toLowerCase();
        const found = plans.find((p) => p.tier === norm || p.nombre.toLowerCase().includes(norm));
        return found ? { plan: found } : { error: "Plan no encontrado", disponibles: plans.map((p) => p.nombre) };
    }
    return { planes: plans, prueba_gratis: "14 días sin tarjeta de crédito" };
}

async function getBlogPosts(limitCount?: number) {
    const max = Math.min(limitCount || 3, 5);
    try {
        const snap = await adminDb
            .collection("blog_posts")
            .where("published", "==", true)
            .orderBy("createdAt", "desc")
            .limit(max)
            .get();
        if (snap.empty) return { posts: [], mensaje: "No hay artículos publicados." };
        return {
            posts: snap.docs.map((d) => {
                const data = d.data();
                return {
                    titulo: data.title,
                    resumen: data.excerpt || "",
                    fecha: data.publishedAt?.toDate?.()?.toLocaleDateString("es-AR") || "",
                };
            }),
        };
    } catch {
        return { posts: [], mensaje: "No se pudieron cargar los artículos." };
    }
}

function getContactInfo() {
    return {
        email: "zetaprop.com.ar@gmail.com",
        whatsapp: "+54 9 11 2388-9745",
        sitio_web: "https://zetaprop.com.ar",
        horario: "Lunes a Viernes 9-18hs (Argentina)",
    };
}

function getPlatformFeatures(module?: string) {
    const features: Record<string, object> = {
        propiedades: { nombre: "Gestión de Propiedades", funciones: ["CRUD completo", "Imágenes", "Geolocalización", "Agentes"], ruta: "/dashboard/propiedades" },
        alquileres: { nombre: "Alquileres", funciones: ["Contratos", "Ajustes IPC/ICL", "Punitorios", "DOCX", "Liquidaciones"], ruta: "/dashboard/alquileres" },
        leads: { nombre: "CRM & Leads", funciones: ["Kanban", "Clasificación IA", "Asignación agentes"], ruta: "/dashboard/leads" },
        tasacion: { nombre: "Tasación IA", funciones: ["Estimación ML", "Análisis de mercado"], ruta: "/dashboard/tasacion" },
        portal_inquilinos: { nombre: "Portal Inquilinos", funciones: ["Sin contraseña (código + DNI)", "Estado de cuenta"], ruta: "/inquilino" },
        sitio_web: { nombre: "Sitio Web Propio", funciones: ["Sitio personalizado", "Dominio propio", "Publicación automática"], ruta: "/dashboard/mi-sitio" },
        marketing: { nombre: "Marketing", funciones: ["Email campaigns", "WhatsApp automático"], ruta: "/dashboard/marketing" },
    };

    if (module) {
        const key = module.toLowerCase().replace(/ /g, "_");
        return features[key] ?? { error: "Módulo no encontrado", disponibles: Object.keys(features) };
    }
    return { modulos: Object.values(features).map((f: any) => ({ nombre: f.nombre, ruta: f.ruta })) };
}

async function getUserProperties(userId: string, status?: string, limitCount?: number) {
    const max = Math.min(limitCount || 5, 10);
    try {
        let q: FirebaseFirestore.Query = adminDb.collection("properties").where("userId", "==", userId);
        if (status) q = q.where("status", "==", status);
        const snap = await q.limit(max).get();
        if (snap.empty) return { propiedades: [], total: 0, mensaje: "No se encontraron propiedades." };
        return {
            propiedades: snap.docs.map((d) => {
                const data = d.data();
                return {
                    id: d.id,
                    titulo: data.title || "Sin título",
                    tipo: `${data.property_type || ""} en ${data.type || ""}`.trim(),
                    precio: data.price ? `${data.currency || "ARS"} ${data.price.toLocaleString("es-AR")}` : "Consultar",
                    direccion: `${data.address || ""}, ${data.city || ""}`.replace(/^,\s*/, ""),
                    estado: data.status,
                    ambientes: data.rooms || null,
                };
            }),
            total: snap.size,
        };
    } catch {
        return { error: "No se pudieron cargar las propiedades." };
    }
}

async function getUserAlquileres(userId: string, status?: string, limitCount?: number) {
    const max = Math.min(limitCount || 5, 10);
    try {
        let q: FirebaseFirestore.Query = adminDb.collection("alquileres").where("userId", "==", userId);
        if (status) q = q.where("status", "==", status);
        const snap = await q.limit(max).get();
        if (snap.empty) return { alquileres: [], total: 0, mensaje: "No se encontraron contratos." };
        return {
            alquileres: snap.docs.map((d) => {
                const data = d.data();
                return {
                    id: d.id,
                    propiedad: data.propertyAddress || "Sin dirección",
                    inquilino: data.tenantName || "Sin nombre",
                    alquiler_mensual: data.monthlyRent
                        ? `${data.currency || "ARS"} ${Number(data.monthlyRent).toLocaleString("es-AR")}`
                        : "No definido",
                    periodo: `${data.startDate?.toDate?.()?.toLocaleDateString("es-AR") || ""} - ${data.endDate?.toDate?.()?.toLocaleDateString("es-AR") || ""}`,
                    estado: data.status || "activo",
                };
            }),
            total: snap.size,
        };
    } catch {
        return { error: "No se pudieron cargar los contratos de alquiler." };
    }
}

async function getUserLeads(userId: string, status?: string, limitCount?: number) {
    const max = Math.min(limitCount || 5, 10);
    try {
        let q: FirebaseFirestore.Query = adminDb.collection("leads").where("userId", "==", userId);
        if (status) q = q.where("estado", "==", status);
        const snap = await q.orderBy("createdAt", "desc").limit(max).get();
        if (snap.empty) return { leads: [], total: 0, mensaje: "No se encontraron leads." };
        return {
            leads: snap.docs.map((d) => {
                const data = d.data();
                return {
                    id: d.id,
                    nombre: data.nombre || "Sin nombre",
                    estado: data.estado || "nuevo",
                    origen: data.origen || "web",
                    busca: data.mensaje || data.interes || "",
                    fecha: data.createdAt?.toDate?.()?.toLocaleDateString("es-AR") || "",
                };
            }),
            total: snap.size,
        };
    } catch {
        return { error: "No se pudieron cargar los leads." };
    }
}

async function getUserStats(userId: string) {
    try {
        const [props, alquileres, leads] = await Promise.all([
            adminDb.collection("properties").where("userId", "==", userId).where("status", "==", "active").limit(200).get(),
            adminDb.collection("alquileres").where("userId", "==", userId).where("status", "==", "active").limit(200).get(),
            adminDb.collection("leads").where("userId", "==", userId).where("estado", "==", "nuevo").limit(200).get(),
        ]);
        return {
            propiedades_activas: props.size,
            alquileres_activos: alquileres.size,
            leads_nuevos: leads.size,
        };
    } catch {
        return { error: "No se pudieron cargar las estadísticas." };
    }
}
