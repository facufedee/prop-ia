export type FichaPageSize = "A4" | "A5";
export type FichaPhotoLayout = "hero" | "hero+1" | "hero+3" | "grid4" | "grid12" | "none";

export interface FichaTemplateConfig {
    id: string;
    label: string;
    pageSize: FichaPageSize;
    showMap: boolean;
    showDescription: boolean;
    photoLayout: FichaPhotoLayout;
    showBadges: boolean;
    galleryPage?: boolean; // adds a dedicated second page with up to 12 photos
    qrHero?: boolean; // QR-focused template (Código QR en A4)
}

export const FICHA_TEMPLATES: FichaTemplateConfig[] = [
    {
        id: "a4-mapa-desc-fotos",
        label: "Ficha A4 con mapa, descripción y fotos",
        pageSize: "A4",
        showMap: true,
        showDescription: true,
        photoLayout: "none",
        showBadges: true,
        galleryPage: true,
    },
    {
        id: "a4-1-foto-grande",
        label: "Ficha A4 con 1 foto grande",
        pageSize: "A4",
        showMap: false,
        showDescription: false,
        photoLayout: "hero",
        showBadges: true,
    },
    {
        id: "a4-1-grande-1-chica",
        label: "Ficha A4 con 1 foto grande y 1 foto chica",
        pageSize: "A4",
        showMap: false,
        showDescription: false,
        photoLayout: "hero+1",
        showBadges: true,
    },
    {
        id: "a4-1-grande-3-chicas",
        label: "Ficha A4 con 1 foto grande y 3 fotos chicas",
        pageSize: "A4",
        showMap: false,
        showDescription: false,
        photoLayout: "hero+3",
        showBadges: true,
    },
    {
        id: "a4-1-grande-mapa",
        label: "Ficha A4 con 1 foto grande y mapa",
        pageSize: "A4",
        showMap: true,
        showDescription: false,
        photoLayout: "hero",
        showBadges: true,
    },
    {
        id: "a4-4-fotos",
        label: "Ficha A4 con 4 fotos",
        pageSize: "A4",
        showMap: false,
        showDescription: false,
        photoLayout: "grid4",
        showBadges: true,
    },
    {
        id: "a4-4-fotos-desc",
        label: "Ficha A4 con 4 fotos y descripción",
        pageSize: "A4",
        showMap: false,
        showDescription: true,
        photoLayout: "grid4",
        showBadges: true,
    },
    {
        id: "a4-12-fotos",
        label: "Ficha A4 hasta 12 fotos",
        pageSize: "A4",
        showMap: false,
        showDescription: false,
        photoLayout: "grid12",
        showBadges: false,
    },
    {
        id: "a5",
        label: "Ficha A5 (½ A4)",
        pageSize: "A5",
        showMap: false,
        showDescription: false,
        photoLayout: "hero",
        showBadges: true,
    },
    {
        id: "a5-4-fotos-desc",
        label: "Ficha A5 (½ A4) con 4 fotos y descripción",
        pageSize: "A5",
        showMap: false,
        showDescription: true,
        photoLayout: "grid4",
        showBadges: false,
    },
    {
        id: "a5-1-grande-mapa",
        label: "Ficha A5 (½ A4) con 1 foto grande y mapa",
        pageSize: "A5",
        showMap: true,
        showDescription: false,
        photoLayout: "hero",
        showBadges: false,
    },
    {
        id: "qr-a4",
        label: "Código QR en A4",
        pageSize: "A4",
        showMap: false,
        showDescription: false,
        photoLayout: "none",
        showBadges: false,
        qrHero: true,
    },
];

export const getFichaTemplate = (id: string): FichaTemplateConfig =>
    FICHA_TEMPLATES.find((t) => t.id === id) || FICHA_TEMPLATES[0];
