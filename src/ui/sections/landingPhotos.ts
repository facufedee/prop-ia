// Landing photography. The hero is a local image supplied by the owner (AI-generated, no text).
// The rest are free under the Unsplash License (not Unsplash+), hotlinked from the Unsplash CDN
// as Unsplash recommends. Verified 2026-10-11 via the photo JSON (premium: false, plus: false).

export interface LandingPhoto {
    /** Unsplash photo id; ignored when `src` is set. */
    id: string;
    /** Local image under /public, used instead of the Unsplash CDN. */
    src?: string;
    alt: string;
    author: string;
    /** Unsplash photo page, kept for attribution. */
    page: string;
}

export const LANDING_PHOTOS = {
    hero: {
        id: "",
        src: "/assets/img/hero-casa.webp",
        alt: "Casa moderna con grandes ventanales iluminados y una piscina al anochecer",
        author: "Zeta Prop",
        page: "",
    },
    dusk: {
        id: "1728721647044-fd8a9c830531",
        alt: "Casa moderna iluminada al anochecer, con el piso mojado por la lluvia",
        author: "islam allam",
        page: "https://unsplash.com/photos/BIoLZTSra78",
    },
    rentals: {
        id: "1776702879021-7875264157bf",
        alt: "Fachada de un edificio de departamentos con balcones y toldos",
        author: "Alpha Perspective",
        page: "https://unsplash.com/photos/xumPysHICwk",
    },
    properties: {
        id: "1494526585095-c41746248156",
        alt: "Casa moderna con garaje y luces encendidas al anochecer",
        author: "Brian Babb",
        page: "https://unsplash.com/photos/XbwHrt87mQ0",
    },
    website: {
        id: "1758957701419-2c6e266f7988",
        alt: "Living moderno con sofá seccional y obras de arte",
        author: "Aalo Lens",
        page: "https://unsplash.com/photos/ugIfsN9l_q4",
    },
    interior: {
        id: "1704040686510-b747ff423ebb",
        alt: "Living cálido con un gran ventanal",
        author: "Ariel Domenden",
        page: "https://unsplash.com/photos/aObxGPf7J1o",
    },
    interior2: {
        id: "1637649228998-6c78a67dfa6c",
        alt: "Sala de estar moderna con un gran ventanal",
        author: "Billy Jo Catbagan",
        page: "https://unsplash.com/photos/PbS9rXhsYIU",
    },
} satisfies Record<string, LandingPhoto>;

/** Source URL for next/image; capped so the optimizer never pulls the full-size original. */
export function photoSrc(photo: LandingPhoto, width = 2400): string {
    if (photo.src) return photo.src;
    return `https://images.unsplash.com/photo-${photo.id}?auto=format&fit=crop&w=${width}&q=80`;
}

/** Small CSS background for thumbnails inside product mockups. */
export function photoThumb(photo: LandingPhoto): string {
    if (photo.src) return `url(${photo.src})`;
    return `url(https://images.unsplash.com/photo-${photo.id}?auto=format&fit=crop&w=320&h=240&q=60)`;
}
