export type ContactOrigen = "click-whatsapp" | "click-email" | "click-telefono";

const NOMBRES: Record<ContactOrigen, string> = {
    "click-whatsapp": "Contacto por WhatsApp",
    "click-email": "Contacto por Email",
    "click-telefono": "Contacto por Teléfono",
};

/**
 * Registra un click de contacto como consulta anónima en Firestore.
 * Fire-and-forget: no bloquea la navegación del usuario.
 */
export function trackContact(params: {
    userId: string;
    origen: ContactOrigen;
    propertyId?: string | null;
    propertyTitle?: string | null;
}) {
    fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            nombre: NOMBRES[params.origen],
            userId: params.userId,
            origen: params.origen,
            propertyId: params.propertyId ?? null,
            propertyTitle: params.propertyTitle ?? null,
        }),
    }).catch(() => {});
}
