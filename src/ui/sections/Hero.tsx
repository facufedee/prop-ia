import { PhotoHero, PrimaryCta } from "./PhotoHero";
import { LitHouseBackdrop } from "./LitHouseBackdrop";
import { LANDING_PHOTOS } from "./landingPhotos";

// Deliberately minimal: one promise, one sentence, one action. The house carries the mood.
export default function Hero() {
    return (
        <PhotoHero photo={LANDING_PHOTOS.hero} labelledBy="hero-title" variant="statement" backdrop={<LitHouseBackdrop />}>
            <h1 id="hero-title">
                Tu inmobiliaria, <em>en orden.</em>
            </h1>
            <p className="l-hero__lede">
                Cobrá alquileres, mostrá tus propiedades y recibí consultas desde un solo lugar. Sin planillas.
            </p>
            <div className="l-hero__ctas">
                <PrimaryCta href="/register">Probar 14 días gratis</PrimaryCta>
                <span className="l-hero__note-inline">Sin tarjeta de crédito</span>
            </div>
        </PhotoHero>
    );
}
