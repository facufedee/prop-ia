import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { PhotoHero, PrimaryCta } from "../PhotoHero";
import { LANDING_PHOTOS, photoThumb } from "../landingPhotos";

// Every claim on this page maps to an implemented capability of the agency website
// (see odd/tasks/landing-light-redesign.md, "Website feature inventory").
// Product compositions use illustrative sample data, not real customers.

const THUMBS = [photoThumb(LANDING_PHOTOS.properties), photoThumb(LANDING_PHOTOS.interior2), photoThumb(LANDING_PHOTOS.dusk)];

function SitePreview({ compact = false }: { compact?: boolean }) {
    const cards = [
        { title: "Casa 4 ambientes", place: "Castelar", price: "USD 189.000" },
        { title: "Depto 2 ambientes", place: "Morón", price: "USD 98.500" },
        { title: "PH con patio", place: "Haedo", price: "$780.000/mes" },
    ];
    return (
        <div className="l-sheet l-browser">
            <div className="l-browser__bar">
                <span className="l-browser__dots">
                    <span />
                    <span />
                    <span />
                </span>
                <span className="l-browser__url">garciapropiedades.zetaprop.com.ar</span>
            </div>
            <div className="l-site">
                <div className="l-site__nav">
                    <span className="l-site__brand">García Propiedades</span>
                    <span>Comprar · Alquilar · Contacto</span>
                </div>
                {!compact && <p className="l-site__hero">Encontrá tu próxima casa en el oeste.</p>}
                <div className="l-site__search">
                    <span>Venta · Casa · 3+ ambientes</span>
                    <span>Buscar</span>
                </div>
                <div className="l-site__cards">
                    {cards.map((card, i) => (
                        <div key={card.title}>
                            <span style={{ ["--thumb" as string]: THUMBS[i] }} />
                            <strong className="l-site__price">{card.price}</strong>
                            {card.title} · {card.place}
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}

export function WebsiteHero() {
    return (
        <PhotoHero photo={LANDING_PHOTOS.website} labelledBy="website-title" aside={<WebsiteHeroVisual />}>
            <p className="l-hero__eyebrow">Página web para inmobiliarias</p>
            <h1 id="website-title">
                Una web con tu marca que se <em>actualiza sola.</em>
            </h1>
            <p className="l-hero__lede">
                Elegís una plantilla, subís tu logo y tus colores, y publicás. Cada propiedad activa que cargás en
                Zeta Prop aparece en tu sitio, y cada consulta que llega por la web entra directo a tu panel.
            </p>
            <div className="l-hero__ctas">
                <PrimaryCta href="/register">Crear mi web gratis</PrimaryCta>
                <Link href="/precios" className="l-link-arrow">
                    Ver precios
                    <ArrowRight size={16} aria-hidden />
                </Link>
            </div>
            <p className="l-hero__fineprint">Incluida en todos los planes. 14 días gratis, sin tarjeta.</p>
        </PhotoHero>
    );
}

function WebsiteHeroVisual() {
    return (
        <div aria-hidden="true">
            <SitePreview />
            <div className="l-hero__note">
                <p>Nueva consulta desde tu web</p>
                <p>
                    <strong>Carla Ruiz</strong> pregunta por la casa de Castelar. Ya está en tus consultas.
                </p>
            </div>
        </div>
    );
}

const STEPS = [
    { title: "Elegís la plantilla", body: "Moderno, Clásico o Minimalista. Las tres se ven bien en la computadora y en el celular." },
    { title: "Le ponés tu marca", body: "Logo, imagen de portada, favicon, colores y el menú en el orden que quieras." },
    { title: "Publicás", body: "Tu sitio queda en tuinmobiliaria.zetaprop.com.ar, con tus propiedades activas ya cargadas." },
];

export function WebsiteSteps() {
    return (
        <section className="l-section" aria-labelledby="website-steps-title">
            <div className="l-container">
                <div className="l-modules__head">
                    <h2 id="website-steps-title" className="l-section__title">
                        Tu web, en tres pasos.
                    </h2>
                    <p className="l-section__lede">
                        Sin diseñadores, sin programadores y sin cargar las propiedades dos veces.
                    </p>
                </div>
                <ol className="l-steps">
                    {STEPS.map((step, i) => (
                        <li key={step.title}>
                            <span className="l-module__index" aria-hidden="true">
                                {String(i + 1).padStart(2, "0")}
                            </span>
                            <h3>{step.title}</h3>
                            <p>{step.body}</p>
                        </li>
                    ))}
                </ol>
            </div>
        </section>
    );
}

function ListingVisual() {
    return (
        <div className="l-sheet">
            <div className="l-sheet__head">
                <p className="l-sheet__title">Propiedades · Venta</p>
                <p className="l-sheet__meta">24 resultados</p>
            </div>
            <div className="l-chips">
                <span className="is-active">Venta</span>
                <span>Casa</span>
                <span>3+ ambientes</span>
                <span>Hasta USD 200.000</span>
                <span>Castelar</span>
            </div>
            <div>
                {[
                    { title: "Casa 4 ambientes con jardín", detail: "Castelar · 180 m² · USD 189.000" },
                    { title: "Casa 3 ambientes", detail: "Castelar norte · 120 m² · USD 154.000" },
                    { title: "Casa en lote propio", detail: "Castelar sur · 210 m² · USD 176.500" },
                ].map((item, i) => (
                    <div key={item.title} className="l-listing">
                        <span className="l-listing__thumb" style={{ ["--thumb" as string]: THUMBS[i] }} />
                        <div>
                            <p>{item.title}</p>
                            <p>{item.detail}</p>
                        </div>
                        <span className="l-sheet__meta">Ver</span>
                    </div>
                ))}
            </div>
        </div>
    );
}

function LeadVisual() {
    return (
        <div className="l-sheet">
            <div className="l-sheet__head">
                <p className="l-sheet__title">Consultas</p>
                <p className="l-sheet__meta">Origen: tu web</p>
            </div>
            <dl className="l-ledger">
                <div>
                    <dt>Nombre</dt>
                    <dd>Carla Ruiz</dd>
                </div>
                <div>
                    <dt>Propiedad</dt>
                    <dd>Casa 4 ambientes · Castelar</dd>
                </div>
                <div>
                    <dt>Teléfono</dt>
                    <dd>11 5432-1098</dd>
                </div>
            </dl>
            <p className="l-quote">“Hola, ¿se puede visitar este sábado a la mañana?”</p>
            <div className="l-sheet__actions">
                <span>Aviso en el sistema</span>
                <span>Email al agente</span>
            </div>
        </div>
    );
}

function BrandVisual() {
    const templates = [
        { name: "Moderno", primary: "oklch(62% 0.12 250)", secondary: photoThumb(LANDING_PHOTOS.dusk) },
        { name: "Clásico", primary: "oklch(60% 0.08 150)", secondary: photoThumb(LANDING_PHOTOS.interior) },
        { name: "Minimalista", primary: "oklch(90% 0.01 85)", secondary: photoThumb(LANDING_PHOTOS.interior2) },
    ];
    return (
        <div className="l-templates">
            {templates.map((t, i) => (
                <div key={t.name} className={`l-template ${i === 0 ? "is-active" : ""}`}>
                    <div className="l-template__frame" style={{ ["--tp" as string]: t.primary, ["--ts" as string]: t.secondary }}>
                        <span className="l-template__bar" />
                        <span className="l-template__hero" />
                        <span className="l-template__grid">
                            <span />
                            <span />
                            <span />
                        </span>
                    </div>
                    <p>{t.name}</p>
                </div>
            ))}
        </div>
    );
}

const FEATURES = [
    {
        name: "Propiedades",
        title: "Tus propiedades se publican solas.",
        body: "Lo que cargás y marcás como activo en Zeta Prop aparece en tu web en cuestión de minutos. Cuando una propiedad deja de estar activa, deja de mostrarse.",
        points: [
            "Búsqueda por operación, tipo, ambientes, precio y zona",
            "Fichas con galería de fotos, video y mapa",
            "Propiedades similares para que el visitante siga mirando",
        ],
        Visual: ListingVisual,
    },
    {
        name: "Consultas",
        title: "Cada consulta entra directo a tu panel.",
        body: "Los formularios de tu web y de cada propiedad cargan la consulta en tu sistema, con un aviso para vos y un email para el agente. Si la misma persona escribe de nuevo, se suma a su historial.",
        points: [
            "Formulario de contacto en el sitio y en cada propiedad",
            "Aviso en el sistema y por email cuando llega una consulta",
            "Botón de WhatsApp, también flotante si lo preferís",
        ],
        Visual: LeadVisual,
    },
    {
        name: "Diseño",
        title: "Con tu logo, tus colores y tu estilo.",
        body: "Tres plantillas pensadas para inmobiliarias, que adaptás a tu identidad sin tocar una línea de código.",
        points: [
            "Tres plantillas: Moderno, Clásico y Minimalista",
            "Logo, portada, favicon y colores propios",
            "Menú que ordenás y editás vos",
        ],
        Visual: BrandVisual,
    },
];

export function WebsiteFeatures() {
    return (
        <section className="l-section" aria-label="Funciones principales">
            <div className="l-container">
                <ol className="l-modules__list l-modules__list--top">
                    {FEATURES.map(({ name, title, body, points, Visual }) => (
                        <li key={name} className="l-module">
                            <div>
                                <p className="l-module__name">{name}</p>
                                <h2 className="l-module__title">{title}</h2>
                                <p className="l-module__body">{body}</p>
                                <ul className="l-module__points">
                                    {points.map((point) => (
                                        <li key={point}>{point}</li>
                                    ))}
                                </ul>
                            </div>
                            <div className="l-module__visual" aria-hidden="true">
                                <Visual />
                            </div>
                        </li>
                    ))}
                </ol>
            </div>
        </section>
    );
}

const INCLUDED = [
    { term: "Subdominio gratis", detail: "Tu sitio en tuinmobiliaria.zetaprop.com.ar desde el primer día." },
    { term: "Pensada para el celular", detail: "Las tres plantillas se adaptan a cualquier pantalla." },
    { term: "Vista previa al compartir", detail: "Título, descripción e imagen cuando pasás el link por WhatsApp o redes." },
    { term: "Favoritos", detail: "Los visitantes guardan las propiedades que les interesan para volver a verlas." },
    { term: "Compartir propiedades", detail: "Cada ficha se comparte en un toque desde el celular." },
    { term: "Publicar y despublicar", detail: "Activás o pausás tu sitio cuando quieras, en un clic." },
];

export function WebsiteIncluded() {
    return (
        <section className="l-section l-section--tinted" aria-labelledby="website-included-title">
            <div className="l-container">
                <div className="l-modules__head">
                    <h2 id="website-included-title" className="l-section__title">
                        También viene incluido.
                    </h2>
                    <p className="l-section__lede">Sin costo extra: la página web está en todos los planes.</p>
                </div>
                <dl className="l-included">
                    {INCLUDED.map((item) => (
                        <div key={item.term}>
                            <dt>{item.term}</dt>
                            <dd>{item.detail}</dd>
                        </div>
                    ))}
                </dl>
            </div>
        </section>
    );
}

export const WEBSITE_FAQ = [
    {
        q: "¿Necesito saber de diseño o de programación?",
        a: "No. Elegís una plantilla, subís tu logo, ajustás los colores y publicás. Todo se hace desde tu panel de Zeta Prop.",
    },
    {
        q: "¿Tengo que cargar las propiedades dos veces?",
        a: "No. Las propiedades que tenés activas en el sistema aparecen en tu web automáticamente, con sus fotos, datos y precio.",
    },
    {
        q: "¿Dónde quedan las consultas que llegan por la web?",
        a: "En el módulo de consultas de tu panel. Recibís un aviso en el sistema y el agente recibe un email con los datos de contacto.",
    },
    {
        q: "¿En qué dirección queda mi sitio?",
        a: "En tuinmobiliaria.zetaprop.com.ar, sin costo. Si ya tenés un dominio propio y querés usarlo, escribinos y vemos juntos cómo conectarlo.",
    },
    {
        q: "¿Cuánto cuesta?",
        a: "La página web viene incluida en todos los planes. Podés probar Zeta Prop 14 días gratis, sin tarjeta de crédito.",
    },
];

export function WebsiteFaq() {
    return (
        <section className="l-section" aria-labelledby="website-faq-title">
            <div className="l-container l-faq">
                <h2 id="website-faq-title" className="l-section__title">
                    Preguntas frecuentes.
                </h2>
                <div>
                    {WEBSITE_FAQ.map((item) => (
                        <details key={item.q}>
                            <summary>{item.q}</summary>
                            <p>{item.a}</p>
                        </details>
                    ))}
                </div>
            </div>
        </section>
    );
}

export function WebsiteCta() {
    return (
        <section className="l-section l-section--tight" aria-labelledby="website-cta-title">
            <div className="l-container l-cta-band">
                <h2 id="website-cta-title">Tu web puede estar online hoy.</h2>
                <p>Creá tu cuenta, elegí una plantilla y publicá tus propiedades.</p>
                <div className="l-hero__ctas">
                    <Link href="/register" className="l-btn l-btn--light">
                        Crear mi web
                    </Link>
                    <Link href="/contacto" className="l-link-arrow l-link-arrow--light">
                        Hablar con nosotros
                        <ArrowRight size={16} aria-hidden />
                    </Link>
                </div>
            </div>
        </section>
    );
}
