import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { PhotoHero, PrimaryCta } from "../PhotoHero";
import { LANDING_PHOTOS } from "../landingPhotos";

// Every claim on this page maps to an implemented capability of the rentals module
// (see odd/tasks/landing-light-redesign.md, "Rentals feature inventory").
// Product compositions use illustrative sample data, not real customers.

const AGENDA = [
    { tenant: "Diego Acosta", address: "Belgrano 2215, 7° A", due: "Venció hace 3 días", amount: "$389.500", status: "late", label: "Vencido" },
    { tenant: "Sofía Benítez", address: "Cnel. Paulino Rojas 390", due: "Vence hoy", amount: "$448.900", status: "due", label: "Hoy" },
    { tenant: "Martín Rossi", address: "Gurruchaga 1130, PB", due: "Vence el 15", amount: "$735.000", status: "due", label: "Esta semana" },
    { tenant: "Lucía Fernández", address: "Av. Rivadavia 4520, 3° B", due: "Pagó el 8", amount: "$612.400", status: "paid", label: "Cobrado" },
] as const;

export function RentalsHero() {
    return (
        <PhotoHero photo={LANDING_PHOTOS.rentalsOffice} labelledBy="rentals-title" aside={<RentalsHeroVisual />}>
            <p className="l-hero__eyebrow">Gestión de alquileres</p>
            <h1 id="rentals-title">
                Cobrá, ajustá y liquidá alquileres <em>sin planillas.</em>
            </h1>
            <p className="l-hero__lede">
                Cargás cada contrato una vez. Zeta Prop arma el plan de pagos, calcula los ajustes por ICL o IPC
                con valores oficiales y te deja el recibo y la liquidación listos en PDF.
            </p>
            <div className="l-hero__ctas">
                <PrimaryCta href="/register">Probar 14 días gratis</PrimaryCta>
                <Link href="/precios" className="l-link-arrow">
                    Ver precios
                    <ArrowRight size={16} aria-hidden />
                </Link>
            </div>
            <p className="l-hero__fineprint">Sin tarjeta de crédito ni pagos anticipados.</p>
        </PhotoHero>
    );
}

function RentalsHeroVisual() {
    return (
        <div aria-hidden="true">
            <div className="l-sheet">
                <div className="l-sheet__head">
                    <p className="l-sheet__title">Agenda de cobros</p>
                    <p className="l-sheet__meta">Octubre</p>
                </div>
                <div className="l-tabs">
                    <span className="is-active">Vencidos 2</span>
                    <span>Hoy 3</span>
                    <span>7 días 11</span>
                    <span>30 días 38</span>
                </div>
                <ul className="l-sheet__rows">
                    {AGENDA.map((row) => (
                        <li key={row.tenant} className="l-sheet__row">
                            <div className="l-sheet__address">
                                <p>{row.tenant}</p>
                                <p>
                                    {row.address} · {row.due}
                                </p>
                            </div>
                            <span className="l-sheet__amount">{row.amount}</span>
                            <span className={`l-status l-status--${row.status}`}>{row.label}</span>
                        </li>
                    ))}
                </ul>
            </div>
            <div className="l-hero__note">
                <p>Recibo N° 0001-00482</p>
                <p>
                    PDF con tu logo, listo para compartir por WhatsApp con <strong>Lucía Fernández</strong>.
                </p>
            </div>
        </div>
    );
}

const STEPS = [
    {
        title: "Cargás el contrato",
        body: "Inquilino, propietario, garantía, depósito, monto, día de vencimiento e índice de ajuste. Una sola vez.",
    },
    {
        title: "El sistema arma el plan",
        body: "Cada mes del contrato queda generado, con los ajustes calculados cuando corresponde.",
    },
    {
        title: "Cobrás y liquidás",
        body: "Registrás el pago, emitís el recibo y liquidás al propietario con tus honorarios descontados.",
    },
];

export function RentalsSteps() {
    return (
        <section className="l-section" aria-labelledby="steps-title">
            <div className="l-container">
                <div className="l-modules__head">
                    <h2 id="steps-title" className="l-section__title">
                        Así funciona.
                    </h2>
                    <p className="l-section__lede">
                        Sirve para contratos nuevos y para los que ya tenés en curso: cargás la fecha de inicio original
                        y el plan de pagos se arma desde ahí.
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

function AdjustmentVisual() {
    return (
        <div className="l-sheet">
            <div className="l-sheet__head">
                <p className="l-sheet__title">Ajustes · Gurruchaga 1130, PB</p>
                <p className="l-sheet__meta">ICL · cada 6 meses</p>
            </div>
            <ol className="l-timeline">
                <li className="is-done">
                    <span>
                        Inicio del contrato<small>Abril 2025</small>
                    </span>
                    <span>$560.000</span>
                </li>
                <li className="is-done">
                    <span>
                        Ajuste por ICL<small>Octubre 2025 · valor oficial BCRA</small>
                    </span>
                    <span>$648.200</span>
                </li>
                <li className="is-done">
                    <span>
                        Ajuste por ICL<small>Abril 2026 · valor oficial BCRA</small>
                    </span>
                    <span>$735.000</span>
                </li>
                <li className="is-next">
                    <span>
                        Próximo ajuste<small>Octubre 2026</small>
                    </span>
                    <span>$812.900</span>
                </li>
            </ol>
        </div>
    );
}

function PaymentVisual() {
    return (
        <div className="l-sheet">
            <div className="l-sheet__head">
                <p className="l-sheet__title">Cobro · Octubre</p>
                <p className="l-sheet__meta">Belgrano 2215, 7° A</p>
            </div>
            <dl className="l-ledger">
                <div>
                    <dt>Alquiler</dt>
                    <dd>$389.500</dd>
                </div>
                <div>
                    <dt>Expensas</dt>
                    <dd>$96.300</dd>
                </div>
                <div>
                    <dt>Luz</dt>
                    <dd>$21.750</dd>
                </div>
                <div>
                    <dt>Punitorio sugerido · 3 días al 1%</dt>
                    <dd>$11.685</dd>
                </div>
                <div className="l-ledger__total">
                    <dt>Total</dt>
                    <dd>$519.235</dd>
                </div>
                <div className="l-ledger__note">
                    <dt>Pagó</dt>
                    <dd>
                        $400.000 <span className="l-status l-status--due">Pago parcial</span>
                    </dd>
                </div>
            </dl>
        </div>
    );
}

function SettlementVisual() {
    return (
        <div className="l-sheet">
            <div className="l-sheet__head">
                <p className="l-sheet__title">Liquidación al propietario</p>
                <p className="l-sheet__meta">Octubre · Av. Rivadavia 4520</p>
            </div>
            <dl className="l-ledger">
                <div>
                    <dt>Cobrado al inquilino</dt>
                    <dd>$612.400</dd>
                </div>
                <div>
                    <dt>Honorarios 8%</dt>
                    <dd>−$48.992</dd>
                </div>
                <div className="l-ledger__total">
                    <dt>A pagar a Jorge Méndez</dt>
                    <dd>$563.408</dd>
                </div>
            </dl>
            <div className="l-sheet__actions">
                <span>Descargar PDF</span>
                <span>Compartir por WhatsApp</span>
            </div>
        </div>
    );
}

const FEATURES = [
    {
        name: "Ajustes",
        title: "Los ajustes por ICL e IPC se calculan solos.",
        body: "Zeta Prop toma los valores oficiales que publican el Banco Central y el INDEC. Elegís el índice y cada cuánto se ajusta, y el sistema te dice cuánto pasa a pagar el inquilino en cada período.",
        points: [
            "ICL e IPC con valores oficiales, sin cargarlos a mano",
            "Ajustes cada 3, 4, 6 o 12 meses, o el período que pactes",
            "Porcentaje fijo asistido cuando el contrato lo pide",
        ],
        Visual: AdjustmentVisual,
    },
    {
        name: "Cobros",
        title: "Sabés quién pagó y quién no, sin abrir una planilla.",
        body: "Cada pago queda registrado con su detalle: alquiler, servicios, cargos extra y punitorios. Si el inquilino paga una parte, el sistema lleva la cuenta de lo que falta.",
        points: [
            "Plan de pagos armado desde el primer mes del contrato",
            "Pagos parciales, servicios y punitorios en el mismo cobro",
            "Agenda con lo vencido, lo de hoy, la semana y el mes",
        ],
        Visual: PaymentVisual,
    },
    {
        name: "Recibos y liquidaciones",
        title: "Recibo para el inquilino, liquidación para el dueño.",
        body: "Cuando registrás un pago, el recibo sale numerado y con los datos de tu inmobiliaria. La liquidación al propietario se arma con tus honorarios ya descontados.",
        points: [
            "Recibos en PDF numerados, con tu logo y tus datos",
            "Liquidaciones con honorarios fijos o por porcentaje",
            "Listos para compartir por WhatsApp",
        ],
        Visual: SettlementVisual,
    },
];

export function RentalsFeatures() {
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
    { term: "Garantías", detail: "Garante o seguro de caución, con todos sus datos." },
    { term: "Depósito y moneda", detail: "Alquiler y depósito en pesos o en dólares." },
    { term: "Servicios del mes", detail: "Expensas, luz, gas, agua y otros cargos, cargados por período." },
    { term: "Borrador de contrato", detail: "Un documento Word armado con los datos cargados, para revisar con tu abogado." },
    { term: "Vencimiento de contratos", detail: "Aviso dentro del sistema 30, 15 y 5 días antes de que termine cada contrato." },
    { term: "Portal del inquilino", detail: "Con su código y su DNI ve el contrato, los próximos vencimientos y lo que ya pagó." },
    { term: "Reportes en PDF", detail: "Historial de pagos de cada contrato y resumen de liquidaciones." },
    { term: "Finanzas", detail: "Lo cobrado y lo liquidado, mes a mes y año a año." },
];

export function RentalsIncluded() {
    return (
        <section className="l-section l-section--tinted" aria-labelledby="included-title">
            <div className="l-container">
                <div className="l-modules__head">
                    <h2 id="included-title" className="l-section__title">
                        Lo que también viene incluido.
                    </h2>
                    <p className="l-section__lede">Los detalles que hacen que el día a día de un alquiler no se te escape.</p>
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

export const RENTALS_FAQ = [
    {
        q: "¿De dónde salen los valores del ICL y del IPC?",
        a: "El ICL lo publica el Banco Central y el IPC el INDEC. Zeta Prop toma esos valores oficiales y los mantiene actualizados; no tenés que cargarlos a mano.",
    },
    {
        q: "¿Puedo cargar contratos que ya están en curso?",
        a: "Sí. Cargás la fecha de inicio original y el sistema arma el plan de pagos completo desde ahí, para que registres lo que ya se cobró y sigas desde el mes actual.",
    },
    {
        q: "¿El inquilino puede pagar desde el sistema?",
        a: "Hoy no. El inquilino entra a su portal con un código y su DNI para ver el contrato, los vencimientos y su historial de pagos. El cobro lo registrás vos cuando te paga por transferencia o en efectivo.",
    },
    {
        q: "¿Sirve para alquileres en dólares?",
        a: "Sí. El alquiler y el depósito se pueden cargar en pesos o en dólares.",
    },
    {
        q: "¿Cuánto cuesta?",
        a: "Depende del plan que elijas. Podés probar Zeta Prop 14 días gratis, sin tarjeta de crédito, y ver los planes en la página de precios.",
    },
];

export function RentalsFaq() {
    return (
        <section className="l-section" aria-labelledby="faq-title">
            <div className="l-container l-faq">
                <h2 id="faq-title" className="l-section__title">
                    Preguntas frecuentes.
                </h2>
                <div>
                    {RENTALS_FAQ.map((item) => (
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

export function RentalsCta() {
    return (
        <section className="l-section l-section--tight" aria-labelledby="rentals-cta-title">
            <div className="l-container l-cta-band">
                <h2 id="rentals-cta-title">Cargá tu primer contrato hoy.</h2>
                <p>Probalo 14 días gratis, con tus propios contratos.</p>
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
