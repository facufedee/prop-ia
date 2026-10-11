import Link from "next/link";
import { ArrowRight } from "lucide-react";

// Every claim on this page maps to an implemented capability of the property module
// (see odd/tasks/landing-light-redesign.md, "Properties feature inventory").
// Leads, visits, valuation, sales reports, team and branches are Pro-plan features.
// Product compositions use illustrative sample data, not real customers.

const PIPELINE = [
    { stage: "Nuevo", count: 6, cards: [{ name: "Carla Ruiz", detail: "Casa en Castelar · Web" }, { name: "Pablo Díaz", detail: "Depto en Morón · WhatsApp" }] },
    { stage: "Contactado", count: 4, cards: [{ name: "Ana Torres", detail: "PH en Haedo · Instagram" }, { name: "Diego Sosa", detail: "Local en Morón · Teléfono" }] },
    { stage: "Visita", count: 3, cards: [{ name: "Jorge Paz", detail: "Casa en Ituzaingó · Referido" }, { name: "Sofía Vera", detail: "Depto en Haedo · Web" }] },
    { stage: "Negociación", count: 2, cards: [{ name: "Laura Gil", detail: "Depto en Palermo · Portal" }, { name: "Hugo Rey", detail: "Casa en Castelar · Email" }] },
];

export function PropertiesHero() {
    return (
        <section className="l-hero" aria-labelledby="properties-title">
            <div className="l-hero__grid">
                <div className="l-reveal" style={{ ["--i" as string]: 0 }}>
                    <p className="l-hero__eyebrow">Administración de propiedades</p>
                    <h1 id="properties-title">
                        Tu cartera ordenada, <em>de la captación al cierre.</em>
                    </h1>
                    <p className="l-hero__lede">
                        Cargás cada propiedad en cinco pasos, seguís a cada interesado en un tablero, agendás las visitas
                        y llevás cada venta desde la oferta hasta la escritura.
                    </p>
                    <div className="l-hero__ctas">
                        <Link href="/register" className="l-btn l-btn--primary">
                            Probar 14 días gratis
                        </Link>
                        <Link href="/precios" className="l-link-arrow">
                            Ver precios
                            <ArrowRight size={16} aria-hidden />
                        </Link>
                    </div>
                    <p className="l-hero__fineprint">Sin tarjeta de crédito ni pagos anticipados.</p>
                </div>

                <div className="l-hero__visual l-reveal" style={{ ["--i" as string]: 1 }} aria-hidden="true">
                    <div className="l-sheet">
                        <div className="l-sheet__head">
                            <p className="l-sheet__title">Interesados</p>
                            <p className="l-sheet__meta">15 en curso · 3 cerrados este mes</p>
                        </div>
                        <div className="l-board">
                            {PIPELINE.map((col) => (
                                <div key={col.stage} className="l-board__col">
                                    <p className="l-board__head">
                                        {col.stage} <span>{col.count}</span>
                                    </p>
                                    {col.cards.map((card) => (
                                        <div key={card.name} className="l-board__card">
                                            <p>{card.name}</p>
                                            <p>{card.detail}</p>
                                        </div>
                                    ))}
                                </div>
                            ))}
                        </div>
                    </div>
                    <div className="l-hero__note">
                        <p>Visita agendada · sábado 11:00</p>
                        <p>
                            <strong>Carla Ruiz</strong> visita la casa de Castelar con Martín.
                        </p>
                    </div>
                </div>
            </div>
        </section>
    );
}

const STEPS = [
    { title: "Cargás la propiedad", body: "Operación, ubicación, características, precio y fotos, en un asistente de cinco pasos." },
    { title: "Seguís a los interesados", body: "Cada consulta entra al tablero y avanza por etapas, con su historial y sus visitas." },
    { title: "Cerrás la operación", body: "Registrás oferta, seña, boleto y escritura, con la comisión de cada agente." },
];

export function PropertiesSteps() {
    return (
        <section className="l-section" aria-labelledby="properties-steps-title">
            <div className="l-container">
                <div className="l-modules__head">
                    <h2 id="properties-steps-title" className="l-section__title">
                        Un solo lugar para todo el recorrido.
                    </h2>
                    <p className="l-section__lede">
                        Desde que entra una propiedad hasta que se firma la escritura, sin saltar entre planillas,
                        chats y carpetas.
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

function WizardVisual() {
    const steps = ["Operación", "Ubicación", "Características", "Precio", "Multimedia"];
    return (
        <div className="l-sheet">
            <div className="l-sheet__head">
                <p className="l-sheet__title">Nueva propiedad</p>
                <p className="l-sheet__meta">Paso 5 de 5</p>
            </div>
            <ol className="l-stepper">
                {steps.map((step, i) => (
                    <li key={step} className={i < 4 ? "is-done" : "is-current"}>
                        {step}
                    </li>
                ))}
            </ol>
            <div className="l-photos">
                <span className="is-cover" style={{ ["--thumb" as string]: "oklch(86% 0.03 60)" }}>
                    Portada
                </span>
                <span style={{ ["--thumb" as string]: "oklch(84% 0.03 150)" }} />
                <span style={{ ["--thumb" as string]: "oklch(85% 0.025 250)" }} />
                <span style={{ ["--thumb" as string]: "oklch(88% 0.015 85)" }} />
            </div>
            <dl className="l-ledger">
                <div>
                    <dt>Video</dt>
                    <dd>youtube.com/watch?v=…</dd>
                </div>
                <div>
                    <dt>Precio de venta</dt>
                    <dd>USD 189.000</dd>
                </div>
            </dl>
        </div>
    );
}

function LeadVisual() {
    return (
        <div className="l-sheet">
            <div className="l-sheet__head">
                <p className="l-sheet__title">Carla Ruiz</p>
                <p className="l-sheet__meta">Etapa: Visita</p>
            </div>
            <ol className="l-timeline">
                <li className="is-done">
                    <span>
                        Consulta desde la web<small>Casa 4 ambientes · Castelar</small>
                    </span>
                    <span>2 oct</span>
                </li>
                <li className="is-done">
                    <span>
                        Nota: busca con jardín, tiene crédito aprobado<small>Martín</small>
                    </span>
                    <span>3 oct</span>
                </li>
                <li className="is-done">
                    <span>
                        Volvió a consultar desde la web<small>Se sumó a su historial</small>
                    </span>
                    <span>7 oct</span>
                </li>
                <li className="is-next">
                    <span>
                        Visita agendada<small>Sábado 11:00 · con Martín</small>
                    </span>
                    <span>12 oct</span>
                </li>
            </ol>
        </div>
    );
}

function SaleVisual() {
    const stages = ["Oferta", "Aceptada", "Seña", "Boleto", "Escritura"];
    return (
        <div className="l-sheet">
            <div className="l-sheet__head">
                <p className="l-sheet__title">Venta · Casa en Castelar</p>
                <p className="l-sheet__meta">USD 182.000</p>
            </div>
            <ol className="l-stepper">
                {stages.map((stage, i) => (
                    <li key={stage} className={i < 3 ? "is-done" : i === 3 ? "is-current" : ""}>
                        {stage}
                    </li>
                ))}
            </ol>
            <dl className="l-ledger">
                <div>
                    <dt>Seña recibida</dt>
                    <dd>USD 9.100</dd>
                </div>
                <div>
                    <dt>Comisión 3%</dt>
                    <dd>USD 5.460</dd>
                </div>
                <div className="l-ledger__total">
                    <dt>Martín · 40%</dt>
                    <dd>USD 2.184</dd>
                </div>
            </dl>
        </div>
    );
}

const FEATURES = [
    {
        name: "Propiedades",
        plan: null,
        title: "Cargar una propiedad lleva cinco pasos, no una tarde.",
        body: "Un asistente te guía por operación, ubicación, características, precio y fotos. La dirección se ubica sola en el mapa y la propiedad queda lista para tu web y para imprimir.",
        points: [
            "Fotos con portada, video de YouTube y ubicación en el mapa",
            "Venta, alquiler y alquiler temporal, en pesos o en dólares",
            "Doce modelos de ficha en PDF para imprimir o enviar",
        ],
        Visual: WizardVisual,
    },
    {
        name: "Interesados y visitas",
        plan: "Plan Pro",
        title: "Cada interesado, con su historia y su próximo paso.",
        body: "Las consultas avanzan por etapas en un tablero que movés arrastrando. Si alguien vuelve a escribir, se suma a su historial en lugar de duplicarse, y cada visita queda atada a la propiedad, al agente y al cliente.",
        points: [
            "Tablero por etapas, de la primera consulta al cierre",
            "Origen de cada consulta, notas y todo el historial",
            "Visitas con su agente, sus notas y el nivel de interés",
        ],
        Visual: LeadVisual,
    },
    {
        name: "Ventas",
        plan: null,
        title: "De la oferta a la escritura, sin perder un dato.",
        body: "Cada operación tiene su ficha con comprador, vendedor, seña, boleto y escritura. La comisión se reparte entre los agentes que participaron.",
        points: [
            "Etapas de oferta, contraoferta, seña, boleto y escritura",
            "Comisión por operación y reparto por agente",
            "Reportes de cierres y comisiones por mes (plan Pro)",
        ],
        Visual: SaleVisual,
    },
];

export function PropertiesFeatures() {
    return (
        <section className="l-section" aria-label="Funciones principales">
            <div className="l-container">
                <ol className="l-modules__list l-modules__list--top">
                    {FEATURES.map(({ name, plan, title, body, points, Visual }) => (
                        <li key={name} className="l-module">
                            <div>
                                <p className="l-module__name">
                                    {name}
                                    {plan && <span className="l-plan-tag">{plan}</span>}
                                </p>
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
    { term: "Tasación con IA", plan: "Plan Pro", detail: "Un precio sugerido en dólares para departamentos, casas y PH, según características y ubicación." },
    { term: "Propietarios", plan: null, detail: "Datos, cuenta bancaria y porcentaje de comisión de cada dueño." },
    { term: "Equipo y permisos", plan: "Plan Pro", detail: "Agentes con sus comisiones y roles con permisos a medida." },
    { term: "Sucursales", plan: "Plan Pro", detail: "Si tenés más de una oficina, filtrás la cartera por sucursal." },
    { term: "Cartelería", plan: null, detail: "Dónde está cada cartel, en qué estado y cuánto costó." },
    { term: "Feed XML", plan: "Plan Pro", detail: "Tus propiedades activas en un feed XML para los portales que lo aceptan." },
    { term: "Duplicar y etiquetar", plan: null, detail: "Copiás una propiedad parecida en un clic y la marcás con tus propias etiquetas." },
    { term: "Tu web, al día", plan: null, detail: "Cada propiedad activa aparece en la página web de tu inmobiliaria." },
];

export function PropertiesIncluded() {
    return (
        <section className="l-section l-section--tinted" aria-labelledby="properties-included-title">
            <div className="l-container">
                <div className="l-modules__head">
                    <h2 id="properties-included-title" className="l-section__title">
                        Lo que también viene incluido.
                    </h2>
                    <p className="l-section__lede">Herramientas para el día a día de la oficina y del equipo.</p>
                </div>
                <dl className="l-included">
                    {INCLUDED.map((item) => (
                        <div key={item.term}>
                            <dt>
                                {item.term}
                                {item.plan && <span className="l-plan-tag">{item.plan}</span>}
                            </dt>
                            <dd>{item.detail}</dd>
                        </div>
                    ))}
                </dl>
            </div>
        </section>
    );
}

export const PROPERTIES_FAQ = [
    {
        q: "¿Qué incluye cada plan?",
        a: "Propiedades, fichas en PDF, propietarios, ventas, cartelería y tu página web están en todos los planes. Interesados, agenda de visitas, tasación, reportes de ventas, equipo y sucursales vienen desde el plan Pro.",
    },
    {
        q: "¿Puedo publicar en Zonaprop o Argenprop desde Zeta Prop?",
        a: "La publicación automática todavía no está activa. Hoy podés generar un feed XML con tus propiedades activas para los portales que lo aceptan.",
    },
    {
        q: "¿Cómo funciona la tasación?",
        a: "Un modelo entrenado estima un precio en dólares según ambientes, superficies, antigüedad, expensas, características y ubicación. Es una referencia para empezar la conversación con el propietario, no una tasación formal.",
    },
    {
        q: "¿Puedo trabajar con mi equipo?",
        a: "Sí, desde el plan Pro. Invitás a tus agentes, definís qué puede ver y hacer cada rol, y la comisión de cada venta se reparte entre quienes participaron.",
    },
    {
        q: "¿Las propiedades aparecen en mi web?",
        a: "Sí. Cada propiedad activa se publica sola en la página web de tu inmobiliaria, que viene incluida en todos los planes.",
    },
];

export function PropertiesFaq() {
    return (
        <section className="l-section" aria-labelledby="properties-faq-title">
            <div className="l-container l-faq">
                <h2 id="properties-faq-title" className="l-section__title">
                    Preguntas frecuentes.
                </h2>
                <div>
                    {PROPERTIES_FAQ.map((item) => (
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

export function PropertiesCta() {
    return (
        <section className="l-section l-section--tight" aria-labelledby="properties-cta-title">
            <div className="l-container l-cta-band">
                <h2 id="properties-cta-title">Cargá tu cartera y empezá a ordenarla hoy.</h2>
                <p>Probalo 14 días gratis, con tus propias propiedades.</p>
                <div className="l-hero__ctas">
                    <Link href="/register" className="l-btn l-btn--light">
                        Crear mi cuenta
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
