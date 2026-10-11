import { PrimaryCta } from "./PhotoHero";

export function CTA() {
    return (
        <section className="l-section l-section--tight" aria-labelledby="cta-title">
            <div className="l-container l-cta-band">
                <h2 id="cta-title">Probá Zeta Prop gratis</h2>
                <p>Comenzá ahora y descubrí cómo la IA puede transformar tu negocio inmobiliario.</p>
                <PrimaryCta href="/dashboard">Empezar ahora</PrimaryCta>
            </div>
        </section>
    );
}
