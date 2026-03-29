export type SiteTemplate = "moderno" | "clasico" | "minimalista";

export interface Site {
    id: string;
    userId: string;
    slug: string;                   // e.g. "mariposa" → mariposa.zetaprop.com.ar
    template: SiteTemplate;

    // Identidad
    nombre: string;                 // Nombre de la inmobiliaria
    descripcion: string;
    logoUrl: string;
    coverUrl?: string;              // Hero background image

    // Colores
    colorPrimario: string;          // hex, e.g. "#4f46e5"
    colorSecundario: string;

    // Contacto
    whatsapp?: string;
    email?: string;
    instagram?: string;
    facebook?: string;
    direccion?: string;

    // Estado
    published: boolean;

    // Fase 3: dominio propio
    customDomain?: string;
    customDomainVerified?: boolean;

    createdAt: Date;
    updatedAt: Date;
}

export const DEFAULT_SITE: Omit<Site, "id" | "userId" | "createdAt" | "updatedAt"> = {
    slug: "",
    template: "moderno",
    nombre: "",
    descripcion: "",
    logoUrl: "",
    colorPrimario: "#4f46e5",
    colorSecundario: "#7c3aed",
    published: false,
};
