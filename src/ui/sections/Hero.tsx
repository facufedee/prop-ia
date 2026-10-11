import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { PhotoHero, PrimaryCta } from "./PhotoHero";
import { LitHouseBackdrop } from "./LitHouseBackdrop";
import { LANDING_PHOTOS } from "./landingPhotos";

// Every fact below is verifiable in the product (trial terms, official indices, website in all plans).
const FACTS = [
    { value: "14 días", label: "de prueba gratis, sin tarjeta" },
    { value: "ICL + IPC", label: "ajustes con valores oficiales" },
    { value: "Tu web", label: "incluida en todos los planes" },
];

export default function Hero() {
    return (
        <PhotoHero
            photo={LANDING_PHOTOS.hero}
            labelledBy="hero-title"
            wordmark="ZETA PROP"
            backdrop={<LitHouseBackdrop />}
            aside={
                <ul className="l-facts">
                    {FACTS.map((fact) => (
                        <li key={fact.value}>
                            <strong>{fact.value}</strong>
                            <span>{fact.label}</span>
                        </li>
                    ))}
                </ul>
            }
        >
            <p className="l-hero__eyebrow">Software para inmobiliarias</p>
            <h1 id="hero-title">
                Alquileres al día. Propiedades en orden. <em>Tu propia web.</em>
            </h1>
            <p className="l-hero__lede">
                Zeta Prop reúne lo que una inmobiliaria usa todos los días: contratos y cobros de alquileres, tu cartera
                de propiedades y un sitio web con tu marca que se actualiza solo.
            </p>
            <div className="l-hero__ctas">
                <PrimaryCta href="/register">Probar 14 días gratis</PrimaryCta>
                <Link href="/precios" className="l-link-arrow">
                    Ver precios
                    <ArrowRight size={16} aria-hidden />
                </Link>
            </div>
        </PhotoHero>
    );
}
