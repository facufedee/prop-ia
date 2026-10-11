import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { LANDING_PHOTOS, photoSrc } from "./landingPhotos";

const VALUES = [
    {
        title: "Todo conectado",
        body: "La propiedad que cargás se publica en tu web y el contrato que firmás queda listo para cobrar.",
    },
    {
        title: "Datos oficiales",
        body: "Los ajustes por ICL e IPC usan los valores que publican el Banco Central y el INDEC.",
    },
    {
        title: "Sin letra chica",
        body: "Catorce días gratis, sin tarjeta, y tu página web incluida en todos los planes.",
    },
];

export default function Intro() {
    return (
        <section className="l-section" aria-labelledby="intro-title">
            <div className="l-container l-intro">
                <div>
                    <p className="l-eyebrow">Por qué Zeta Prop</p>
                    <h2 id="intro-title" className="l-section__title">
                        Hecho para inmobiliarias que quieren trabajar con orden.
                    </h2>
                    <p className="l-section__lede">
                        Menos planillas, menos chats sueltos y menos carpetas. Un solo sistema para el día a día de una
                        inmobiliaria chica o mediana.
                    </p>
                    <ol className="l-values">
                        {VALUES.map((value, i) => (
                            <li key={value.title}>
                                <span className="l-values__index" aria-hidden="true">
                                    {String(i + 1).padStart(2, "0")}
                                </span>
                                <h3>{value.title}</h3>
                                <p>{value.body}</p>
                            </li>
                        ))}
                    </ol>
                    <Link href="/precios" className="l-link-arrow">
                        Ver planes y precios
                        <ArrowRight size={16} aria-hidden />
                    </Link>
                </div>
                <figure className="l-intro__media">
                    <Image
                        src={photoSrc(LANDING_PHOTOS.interior, 1600)}
                        alt={LANDING_PHOTOS.interior.alt}
                        fill
                        sizes="(max-width: 56rem) 100vw, 50vw"
                        className="l-intro__photo"
                    />
                    <figcaption className="l-glass-badge">
                        <strong>3 herramientas</strong>
                        <span>un solo sistema</span>
                    </figcaption>
                </figure>
            </div>
        </section>
    );
}
