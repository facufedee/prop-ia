import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { LANDING_PHOTOS, photoSrc, type LandingPhoto } from "./landingPhotos";

// One large block per tool, right after the hero. Rentals is featured (full width).
// Each block links to its landing page, where every claim is detailed and verified.

interface Tool {
    name: string;
    tagline: string;
    highlights: string[];
    href: string;
    photo: LandingPhoto;
    featured?: boolean;
}

const TOOLS: Tool[] = [
    {
        name: "Gestión de alquileres",
        tagline: "Dejá de perseguir cobros con planillas.",
        highlights: ["Ajustes por ICL e IPC", "Recibos en PDF", "Liquidaciones a propietarios"],
        href: "/alquileres",
        photo: LANDING_PHOTOS.rentals,
        featured: true,
    },
    {
        name: "Administración de propiedades",
        tagline: "Tu cartera, de la captación al cierre.",
        highlights: ["Fichas en PDF", "Interesados y visitas", "Ventas hasta la escritura"],
        href: "/propiedades-gestion",
        photo: LANDING_PHOTOS.properties,
    },
    {
        name: "Página web propia",
        tagline: "Tus propiedades se publican solas.",
        highlights: ["Tres plantillas", "Consultas a tu panel", "En todos los planes"],
        href: "/pagina-web",
        photo: LANDING_PHOTOS.website,
    },
];

export default function Modules() {
    return (
        <section className="l-section l-tools" aria-labelledby="tools-title">
            <div className="l-container">
                <h2 id="tools-title" className="l-eyebrow">
                    Herramientas
                </h2>
                <ul className="l-tools__grid">
                    {TOOLS.map((tool) => (
                        <li key={tool.href} className={tool.featured ? "l-tool l-tool--featured" : "l-tool"}>
                            <Link href={tool.href} className="l-tool__link">
                                <Image
                                    src={photoSrc(tool.photo, tool.featured ? 2000 : 1400)}
                                    alt=""
                                    fill
                                    sizes={tool.featured ? "(max-width: 78rem) 100vw, 78rem" : "(max-width: 56rem) 100vw, 39rem"}
                                    className="l-tool__photo"
                                />
                                <span className="l-tool__scrim" aria-hidden="true" />
                                <span className="l-tool__body">
                                    <span className="l-tool__name">{tool.name}</span>
                                    <span className="l-tool__tagline">{tool.tagline}</span>
                                    <span className="l-tool__tags">
                                        {tool.highlights.map((highlight) => (
                                            <span key={highlight}>{highlight}</span>
                                        ))}
                                    </span>
                                    <span className="l-tool__more">
                                        Conocer más
                                        <ArrowRight size={16} aria-hidden />
                                    </span>
                                </span>
                            </Link>
                        </li>
                    ))}
                </ul>
            </div>
        </section>
    );
}
