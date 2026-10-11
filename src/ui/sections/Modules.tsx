import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { LANDING_PHOTOS, photoSrc } from "./landingPhotos";

// Short pitch per module; each card links to its landing page, where every claim is detailed.
const MODULES = [
    {
        name: "Gestión de alquileres",
        title: "Dejá de perseguir cobros con planillas.",
        body: "Contratos, ajustes por índice, cobros, recibos y liquidaciones a propietarios.",
        href: "/alquileres",
        photo: LANDING_PHOTOS.rentals,
    },
    {
        name: "Administración de propiedades",
        title: "Toda tu cartera, ordenada y a mano.",
        body: "Fichas, interesados, visitas y ventas, desde la captación hasta la escritura.",
        href: "/propiedades-gestion",
        photo: LANDING_PHOTOS.properties,
    },
    {
        name: "Página web propia",
        title: "Tu inmobiliaria con su web, sin contratar a nadie.",
        body: "Tus propiedades se publican solas y las consultas llegan directo a tu panel.",
        href: "/pagina-web",
        photo: LANDING_PHOTOS.website,
    },
];

export default function Modules() {
    return (
        <section className="l-section" aria-labelledby="modules-title">
            <div className="l-container">
                <div className="l-modules__head">
                    <div>
                        <p className="l-eyebrow">Qué incluye</p>
                        <h2 id="modules-title" className="l-section__title">
                            Tres herramientas que trabajan juntas.
                        </h2>
                    </div>
                    <p className="l-section__lede">
                        Empezá por la que más te urge. Las otras ya están ahí cuando las necesites.
                    </p>
                </div>

                <ol className="l-cards">
                    {MODULES.map((module, i) => (
                        <li key={module.href}>
                            <Link href={module.href} className="l-card">
                                <span className="l-card__media">
                                    <Image
                                        src={photoSrc(module.photo, 1200)}
                                        alt={module.photo.alt}
                                        fill
                                        sizes="(max-width: 56rem) 100vw, 33vw"
                                        className="l-card__photo"
                                    />
                                    <span className="l-card__index" aria-hidden="true">
                                        {String(i + 1).padStart(2, "0")}
                                    </span>
                                </span>
                                <span className="l-card__body">
                                    <span className="l-module__name">{module.name}</span>
                                    <span className="l-card__title">{module.title}</span>
                                    <span className="l-card__text">{module.body}</span>
                                    <span className="l-card__more">
                                        Conocer más
                                        <ArrowRight size={16} aria-hidden />
                                    </span>
                                </span>
                            </Link>
                        </li>
                    ))}
                </ol>
            </div>
        </section>
    );
}
