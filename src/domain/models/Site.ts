export type SiteTemplate = "moderno" | "clasico" | "minimalista";

export interface NavItem {
    label: string;
    href: string;   // relative to site root, e.g. "/propiedades?operacion=venta"
    enabled: boolean;
}

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

    // Menú de navegación personalizable
    navItems?: NavItem[];

    // Estado
    published: boolean;

    // Dominio propio
    customDomain?: string;
    customDomainVerified?: boolean;

    createdAt: Date;
    updatedAt: Date;
}

export const DEFAULT_NAV_ITEMS: NavItem[] = [
    { label: "Propiedades", href: "/propiedades",                       enabled: true },
    { label: "Venta",       href: "/propiedades?operacion=venta",       enabled: true },
    { label: "Alquiler",    href: "/propiedades?operacion=alquiler",    enabled: true },
    { label: "Nosotros",    href: "#nosotros",                          enabled: true },
    { label: "Contacto",    href: "#contacto",                          enabled: true },
];

export const DEFAULT_SITE: Omit<Site, "id" | "userId" | "createdAt" | "updatedAt"> = {
    slug: "",
    template: "moderno",
    nombre: "",
    descripcion: "",
    logoUrl: "",
    colorPrimario: "#4f46e5",
    colorSecundario: "#7c3aed",
    navItems: DEFAULT_NAV_ITEMS,
    published: false,
    customDomain: "",
    customDomainVerified: false,
};
