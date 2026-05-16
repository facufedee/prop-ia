import { tool } from "ai";
import { z } from "zod";
import { adminDb } from "@/infrastructure/firebase/admin";
import { PLANS } from "@/infrastructure/data/plans";

export function getChatTools(userId: string) {
    return {
        get_plans_info: tool({
            description: "Obtiene información sobre los planes y precios de suscripción de Zeta Prop. Usá esto cuando el usuario pregunte sobre precios, planes, funciones incluidas, límites, diferencias entre planes, etc.",
            parameters: z.object({
                plan_name: z.string().optional().describe("Nombre del plan específico a consultar: 'basico', 'profesional', 'enterprise'. Omitir para obtener todos."),
            }),
            execute: async ({ plan_name }) => getPlansInfo(plan_name),
        }),

        get_blog_posts: tool({
            description: "Obtiene artículos recientes del blog de Zeta Prop. Usá esto cuando el usuario pregunte por noticias, novedades, artículos o el blog.",
            parameters: z.object({
                limit: z.number().optional().describe("Cantidad de artículos a retornar (máximo 5)"),
            }),
            execute: async ({ limit }) => getBlogPosts(limit),
        }),

        get_contact_info: tool({
            description: "Obtiene información de contacto y soporte de Zeta Prop.",
            parameters: z.object({}),
            execute: async () => getContactInfo(),
        }),

        get_platform_features: tool({
            description: "Obtiene información detallada sobre las funcionalidades y módulos de la plataforma Zeta Prop.",
            parameters: z.object({
                module: z.string().optional().describe("Módulo específico: 'propiedades', 'alquileres', 'leads', 'tasacion', 'portal_inquilinos', 'sitio_web', 'marketing'. Omitir para obtener todos."),
            }),
            execute: async ({ module }) => getPlatformFeatures(module),
        }),

        search_user_properties: tool({
            description: "Busca propiedades del usuario en el sistema. Usá esto cuando el usuario pregunte por sus propiedades cargadas.",
            parameters: z.object({
                status: z.string().optional().describe("Estado: 'active', 'inactive', 'reserved', 'sold'"),
                limit: z.number().optional().describe("Cantidad máxima de resultados (máximo 5)"),
            }),
            execute: async ({ status, limit }) => searchUserProperties(userId, status, limit),
        }),
    };
}

function getPlansInfo(planName?: string) {
    const formatPrice = (n: number) =>
        new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS", maximumFractionDigits: 0 }).format(n);

    const formatLimit = (v: number | string) => (v === "unlimited" || (typeof v === "number" && v > 900000) ? "Ilimitado" : String(v));

    const plans = PLANS.map((p) => ({
        nombre: p.name,
        tier: p.tier,
        descripcion: p.description,
        precio_mensual: formatPrice(p.price.monthly),
        precio_anual: formatPrice(p.price.yearly),
        funciones: p.featuresList,
        limites: {
            propiedades: formatLimit(p.limits.properties),
            usuarios: formatLimit(p.limits.users),
            clientes: formatLimit(p.limits.clients),
            almacenamiento: p.limits.storage,
        },
        popular: p.popular || false,
    }));

    if (planName) {
        const normalized = planName.toLowerCase();
        const found = plans.find(
            (p) =>
                p.tier === normalized ||
                p.nombre.toLowerCase().includes(normalized) ||
                normalized.includes(p.tier)
        );
        return found ? { plan: found } : { error: "Plan no encontrado", planes_disponibles: plans.map((p) => p.nombre) };
    }

    return { planes: plans, prueba_gratis: "14 días sin tarjeta de crédito" };
}

async function getBlogPosts(limitCount?: number) {
    const max = Math.min(limitCount || 3, 5);
    try {
        const snapshot = await adminDb
            .collection("blog_posts")
            .where("published", "==", true)
            .orderBy("createdAt", "desc")
            .limit(max)
            .get();

        if (snapshot.empty) {
            return { posts: [], mensaje: "No hay artículos publicados aún." };
        }

        const posts = snapshot.docs.map((d) => {
            const data = d.data();
            return {
                titulo: data.title,
                resumen: data.excerpt || "",
                categoria: data.category || "General",
                fecha: data.publishedAt?.toDate?.()?.toLocaleDateString("es-AR") || data.createdAt?.toDate?.()?.toLocaleDateString("es-AR") || "",
                url: `/blog/${data.slug}`,
            };
        });

        return { posts };
    } catch {
        return { posts: [], mensaje: "No se pudieron cargar los artículos en este momento." };
    }
}

function getContactInfo() {
    return {
        email_soporte: "zetaprop.com.ar@gmail.com",
        whatsapp: "+54 9 11 2388-9745",
        sitio_web: "https://zetaprop.com.ar",
        horario_atencion: "Lunes a Viernes de 9 a 18hs (Argentina)",
        redes_sociales: {
            instagram: "@zetaprop",
            linkedin: "linkedin.com/company/zetaprop",
        },
        seccion_soporte: "/dashboard/soporte",
        faqs: "/faqs",
    };
}

function getPlatformFeatures(module?: string) {
    const features: Record<string, any> = {
        propiedades: {
            nombre: "Gestión de Propiedades",
            descripcion: "CRUD completo de inmuebles con carga de imágenes, geolocalización y asignación a sucursales.",
            funciones: [
                "Alta, edición y baja de propiedades",
                "Carga múltiple de imágenes",
                "Geolocalización en mapa",
                "Asignación a agentes y sucursales",
                "Publicación automática en portales",
                "Filtros avanzados de búsqueda",
            ],
            ruta: "/dashboard/propiedades",
        },
        alquileres: {
            nombre: "Administración de Alquileres",
            descripcion: "Gestión completa de contratos locativos con ajustes automáticos y generación de documentos.",
            funciones: [
                "Contratos de alquiler digitales",
                "Generación automática de períodos de pago",
                "Ajustes por IPC e ICL",
                "Cálculo de punitorios por mora",
                "Generación de contratos en Word (.docx)",
                "Historial de pagos",
                "Liquidaciones a propietarios",
            ],
            ruta: "/dashboard/alquileres",
        },
        leads: {
            nombre: "CRM & Leads",
            descripcion: "Pipeline de ventas con tablero Kanban y clasificación automática por IA.",
            funciones: [
                "Tablero Kanban (Nuevo → Contactado → Visita → Reservado)",
                "Clasificación automática de leads por IA",
                "Historial de interacciones",
                "Asignación a agentes",
                "Notificaciones automáticas",
            ],
            ruta: "/dashboard/leads",
        },
        tasacion: {
            nombre: "Tasación IA",
            descripcion: "Estimación de precios de propiedades mediante modelos de machine learning.",
            funciones: [
                "Tasación automática por ML",
                "Análisis de mercado local",
                "Comparables de zona",
                "Reporte de tasación exportable",
            ],
            ruta: "/dashboard/tasacion",
        },
        portal_inquilinos: {
            nombre: "Portal de Inquilinos",
            descripcion: "Acceso sin contraseña para inquilinos mediante código único + DNI.",
            funciones: [
                "Acceso con código de alquiler + DNI",
                "Visualización de estado de cuenta",
                "Historial de pagos",
                "Próximos vencimientos",
                "Sin necesidad de crear usuario",
            ],
            ruta: "/inquilino",
        },
        sitio_web: {
            nombre: "Sitio Web Propio",
            descripcion: "Cada inmobiliaria obtiene su propio sitio web con dominio personalizado.",
            funciones: [
                "Sitio web profesional incluido",
                "Dominio personalizado",
                "Publicación automática de propiedades activas",
                "Personalización de colores y logo",
                "SEO optimizado",
                "Formulario de contacto integrado",
            ],
            ruta: "/dashboard/mi-sitio",
        },
        marketing: {
            nombre: "Marketing",
            descripcion: "Herramientas de email marketing y automatizaciones para captar y fidelizar clientes.",
            funciones: [
                "Campañas de email marketing",
                "Emails automáticos de vencimientos",
                "Notificaciones por WhatsApp",
                "Plantillas personalizables",
            ],
            ruta: "/dashboard/marketing",
        },
    };

    if (module) {
        const key = module.toLowerCase().replace(/ /g, "_");
        return features[key] || { error: "Módulo no encontrado", modulos_disponibles: Object.keys(features) };
    }

    return {
        modulos: Object.values(features).map((f) => ({
            nombre: f.nombre,
            descripcion: f.descripcion,
            ruta: f.ruta,
        })),
    };
}

export async function searchUserProperties(userId: string, status?: string, limitCount?: number) {
    const max = Math.min(limitCount || 5, 5);
    try {
        let q = adminDb.collection("properties").where("userId", "==", userId);
        if (status) q = q.where("status", "==", status) as any;

        const snapshot = await (q as any).limit(max).get();

        if (snapshot.empty) {
            return { propiedades: [], total: 0, mensaje: "No se encontraron propiedades con esos criterios." };
        }

        const props = snapshot.docs.map((d: any) => {
            const data = d.data();
            return {
                titulo: data.title || "Sin título",
                tipo: `${data.property_type || ""} en ${data.type || ""}`.trim(),
                precio: data.price ? `${data.currency || "ARS"} ${data.price.toLocaleString("es-AR")}` : "Consultar",
                direccion: `${data.address || ""}, ${data.city || ""}`.trim().replace(/^,\s*/, ""),
                estado: data.status,
                ambientes: data.rooms || null,
            };
        });

        return { propiedades: props, total: snapshot.size };
    } catch {
        return { error: "No se pudieron cargar las propiedades." };
    }
}
