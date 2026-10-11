import Link from "next/link";
import { ArrowRight } from "lucide-react";

// Illustrative sample data for the module compositions (not real customers).
function RentalsVisual() {
    return (
        <div className="l-sheet">
            <div className="l-sheet__head">
                <p className="l-sheet__title">Contrato · Av. Rivadavia 4520, 3° B</p>
                <p className="l-sheet__meta">Ajuste semestral por IPC</p>
            </div>
            <ol className="l-timeline">
                <li className="is-done">
                    <span>
                        Inicio del contrato<small>Mayo 2025</small>
                    </span>
                    <span>$480.000</span>
                </li>
                <li className="is-done">
                    <span>
                        Primer ajuste<small>Noviembre 2025</small>
                    </span>
                    <span>$543.100</span>
                </li>
                <li className="is-done">
                    <span>
                        Segundo ajuste<small>Mayo 2026</small>
                    </span>
                    <span>$612.400</span>
                </li>
                <li className="is-next">
                    <span>
                        Próximo ajuste<small>Noviembre 2026</small>
                    </span>
                    <span>$689.300</span>
                </li>
            </ol>
        </div>
    );
}

const LISTINGS = [
    { title: "Departamento 2 ambientes", detail: "Palermo · 48 m² · USD 128.000", status: "paid", label: "Publicada", thumb: "oklch(86% 0.03 60)" },
    { title: "PH 3 ambientes con patio", detail: "Caballito · 92 m² · USD 165.000", status: "due", label: "Reservada", thumb: "oklch(84% 0.03 150)" },
    { title: "Casa 4 ambientes", detail: "Castelar · 180 m² · $1.150.000/mes", status: "paid", label: "En alquiler", thumb: "oklch(85% 0.025 250)" },
    { title: "Local a la calle", detail: "Morón centro · 60 m²", status: "late", label: "Sin fotos", thumb: "oklch(88% 0.015 85)" },
] as const;

function PropertiesVisual() {
    return (
        <div className="l-sheet">
            <div className="l-sheet__head">
                <p className="l-sheet__title">Cartera</p>
                <p className="l-sheet__meta">68 propiedades · 9 consultas nuevas</p>
            </div>
            <div>
                {LISTINGS.map((item) => (
                    <div key={item.title} className="l-listing">
                        <span className="l-listing__thumb" style={{ ["--thumb" as string]: item.thumb }} />
                        <div>
                            <p>{item.title}</p>
                            <p>{item.detail}</p>
                        </div>
                        <span className={`l-status l-status--${item.status}`}>{item.label}</span>
                    </div>
                ))}
            </div>
        </div>
    );
}

function WebsiteVisual() {
    return (
        <div className="l-sheet l-browser">
            <div className="l-browser__bar">
                <span className="l-browser__dots">
                    <span />
                    <span />
                    <span />
                </span>
                <span className="l-browser__url">garciapropiedades.com.ar</span>
            </div>
            <div className="l-site">
                <div className="l-site__nav">
                    <span className="l-site__brand">García Propiedades</span>
                    <span>Comprar · Alquilar · Contacto</span>
                </div>
                <p className="l-site__hero">Encontrá tu próxima casa en el oeste.</p>
                <div className="l-site__search">
                    <span>Barrio, tipo de propiedad…</span>
                    <span>Buscar</span>
                </div>
                <div className="l-site__cards">
                    <div>
                        <span style={{ ["--thumb" as string]: "oklch(86% 0.03 60)" }} />
                        Casa en Castelar
                    </div>
                    <div>
                        <span style={{ ["--thumb" as string]: "oklch(84% 0.03 150)" }} />
                        Depto en Morón
                    </div>
                    <div>
                        <span style={{ ["--thumb" as string]: "oklch(85% 0.025 250)" }} />
                        PH en Haedo
                    </div>
                </div>
            </div>
        </div>
    );
}

const MODULES = [
    {
        name: "Gestión de alquileres",
        title: "Dejá de perseguir cobros con planillas.",
        body: "Cargás el contrato una vez y Zeta Prop se ocupa del resto: calcula los ajustes, te muestra los vencimientos y quién pagó y quién no.",
        points: [
            "Ajustes por índice calculados automáticamente",
            "Cobros, recibos y liquidaciones a propietarios",
            "Portal del inquilino con vencimientos e historial de pagos",
        ],
        href: "/alquileres",
        Visual: RentalsVisual,
    },
    {
        name: "Administración de propiedades",
        title: "Toda tu cartera, ordenada y a mano.",
        body: "Cada propiedad con su ficha, sus dueños, sus interesados y su historia. Sabés en qué estado está todo sin abrir cinco archivos distintos.",
        points: [
            "Fichas con fotos, características y estado",
            "Consultas y visitas de interesados en un solo lugar",
            "Tasación asistida para definir el precio",
        ],
        Visual: PropertiesVisual,
    },
    {
        name: "Página web propia",
        title: "Tu inmobiliaria con su web, sin contratar a nadie.",
        body: "Un sitio con tu marca y tu dominio donde se publican tus propiedades activas. Lo que cambiás en el sistema, aparece en la web.",
        points: [
            "Propiedades publicadas y actualizadas solas",
            "Tu logo, tus colores y tu dominio",
            "Lista para compartir en redes y WhatsApp",
        ],
        Visual: WebsiteVisual,
    },
];

export default function Modules() {
    return (
        <section className="l-section" aria-labelledby="modules-title">
            <div className="l-container">
                <div className="l-modules__head">
                    <h2 id="modules-title" className="l-section__title">
                        Tres herramientas que trabajan juntas.
                    </h2>
                    <p className="l-section__lede">
                        Pensadas para el día a día de una inmobiliaria chica o mediana. La propiedad que cargás se
                        publica en tu web, y el contrato que firmás queda listo para cobrar.
                    </p>
                </div>

                <ol className="l-modules__list">
                    {MODULES.map(({ name, title, body, points, href, Visual }, i) => (
                        <li key={name} className="l-module">
                            <div>
                                <span className="l-module__index" aria-hidden="true">
                                    {String(i + 1).padStart(2, "0")}
                                </span>
                                <p className="l-module__name">{name}</p>
                                <h3 className="l-module__title">{title}</h3>
                                <p className="l-module__body">{body}</p>
                                <ul className="l-module__points">
                                    {points.map((point) => (
                                        <li key={point}>{point}</li>
                                    ))}
                                </ul>
                                <Link href={href ?? "/register"} className="l-link-arrow">
                                    {href ? `Conocer ${name.toLowerCase()}` : `Empezar con ${name.toLowerCase()}`}
                                    <ArrowRight size={16} aria-hidden />
                                </Link>
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
