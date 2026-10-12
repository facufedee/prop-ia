import Link from 'next/link';
import { CheckCircle2 } from 'lucide-react';
import { PrimaryCta } from '@/ui/sections/PhotoHero';

export const metadata = {
    title: "Servicios | Zeta Prop",
    description: "Todo lo que incluye Zeta Prop: CRM inmobiliario, gestión de alquileres, contratos de alquiler, agenda, finanzas y más. Conocé lo que tenemos hoy y lo que viene.",
    alternates: {
        canonical: 'https://zetaprop.com.ar/servicios',
    },
};

const available = [
    {
        title: "Gestión de Propiedades",
        description: "Fichas completas con fotos, video, ubicación en mapa, precio y estado. Ficha imprimible para compartir con clientes.",
        items: ["Catálogo digital según el límite de tu plan", "Publicación al portal federal", "Fichas para imprimir y compartir", "Asignación por sucursal (plan Profesional)"],
    },
    {
        title: "CRM de Consultas",
        description: "Desde el plan Profesional: cada interesado con sus datos, zona, presupuesto, notas e interacciones, organizado en un tablero por etapas.",
        items: ["Pipeline visual de oportunidades", "Historial de interacciones", "Prioridad por consulta", "Tasa de conversión del pipeline"],
    },
    {
        title: "Administración de Alquileres",
        description: "El ciclo del alquiler en un solo lugar: contratos, calendario de vencimientos, recibos, punitorios y liquidaciones.",
        items: ["Recibo en PDF al registrar cada cobro", "Recargo por mora fijo o porcentual", "Ajustes ICL / IPC / % fijo", "Liquidaciones a propietarios en PDF"],
    },
    {
        title: "Contratos de Alquiler",
        description: "Generación del contrato de alquiler con los datos cargados en el sistema, listo para descargar en Word, revisar e imprimir.",
        items: ["Contrato de alquiler", "Descarga en Word (.docx)", "Datos precargados del sistema", "Editable antes de imprimir"],
    },
    {
        title: "Agenda de Visitas",
        description: "Desde el plan Profesional: agendá visitas en un calendario con el cliente, la propiedad y el agente asignado.",
        items: ["Calendario de visitas", "Asignación a agentes", "Próximas visitas en el inicio del panel", "Gestión de visitas por propiedad"],
    },
    {
        title: "Gestión Financiera",
        description: "Cobros a inquilinos y pagos a propietarios por período, y cálculo de comisiones en cada venta.",
        items: ["Cálculo de comisiones por venta", "Cobros y liquidaciones por período", "Pagos vencidos marcados en el panel", "Reportes de contrato en PDF"],
    },
    {
        title: "Portal del Inquilino",
        description: "Acceso para cada inquilino donde puede ver su contrato y el historial de sus pagos. Sin app, sin registro.",
        items: ["Acceso con código de contrato y DNI", "Resumen de contrato", "Historial de pagos", "Sin usuario ni contraseña"],
    },
    {
        title: "Panel de Inicio",
        description: "Un resumen de tu cartera al entrar: propiedades, alquileres, próximos vencimientos, próximas visitas y nuevas consultas.",
        items: ["Resumen por módulo", "Próximos vencimientos", "Comisiones por agente", "Reportes de ventas"],
    },
    {
        title: "Mi Sitio — Web de tu inmobiliaria",
        description: "Tu propia web inmobiliaria bajo un subdominio de Zeta Prop, con tus propiedades publicadas.",
        items: ["Subdominio tuinmobiliaria.zetaprop.com.ar", "Plantillas de diseño", "Tus propiedades publicadas", "Contacto directo con la agencia"],
    },
    {
        title: "Red Inmobiliaria Federal",
        description: "Tus propiedades publicadas en el portal de Zeta Prop, visible para compradores e inquilinos de todo el país.",
        items: ["Portal público en zetaprop.com.ar", "Búsqueda por zona y tipo", "Ficha pública de cada propiedad", "Contacto directo con la agencia"],
    },
];

const coming = [
    {
        title: "Pago Online del Alquiler",
        description: "Integración con MercadoPago para que los inquilinos paguen el alquiler directamente desde su portal, sin transferencias manuales.",
    },
    {
        title: "Firma Digital de Contratos",
        description: "Firma electrónica con validez legal para contratos de alquiler y venta, sin necesidad de presencia física.",
    },
    {
        title: "Integración con Portales",
        description: "Publicación en Zonaprop y Argenprop desde Zeta Prop, sin cargar la propiedad dos veces.",
    },
    {
        title: "App Móvil",
        description: "Toda la plataforma en tu celular. Gestioná propiedades, respondé leads y revisá tu caja desde donde estés.",
    },
];

export default function ServicesPage() {
    return (
        <main className="flex-1">

            {/* ── Page header ── */}
            <section className="l-section s-page-head" aria-labelledby="servicios-title">
                <div className="l-container">
                    <div className="s-page-head__inner">
                        <p className="l-eyebrow">Servicios</p>
                        <h1 id="servicios-title" className="s-page-title">
                            Todo lo que necesita tu inmobiliaria, en un solo lugar
                        </h1>
                        <p className="s-page-lede">
                            Sin integraciones complicadas, sin costos ocultos. Un ecosistema completo pensado para la realidad inmobiliaria argentina.
                        </p>
                        <div className="l-hero__ctas s-page-head__actions">
                            <PrimaryCta href="/register">Comenzar gratis</PrimaryCta>
                            <Link href="/precios" className="l-btn l-btn--secondary">
                                Ver precios
                            </Link>
                        </div>
                    </div>
                </div>
            </section>

            {/* ── Disponible hoy ── */}
            <section className="l-section l-section--tight" aria-labelledby="available-title">
                <div className="l-container">
                    <div className="l-modules__head">
                        <div>
                            <p className="l-eyebrow">Disponible ahora</p>
                            <h2 id="available-title" className="l-section__title">Lo que tenemos hoy</h2>
                        </div>
                        <p className="l-section__lede">
                            Funcionalidades activas en la plataforma, listas para usar desde el primer día.
                        </p>
                    </div>

                    <div className="s-grid s-after-head">
                        {available.map((s) => (
                            <article key={s.title} className="s-card">
                                <h3 className="s-card__title">{s.title}</h3>
                                <p className="s-card__body">{s.description}</p>
                                <ul className="s-check-list">
                                    {s.items.map((item) => (
                                        <li key={item}>
                                            <CheckCircle2 size={16} aria-hidden="true" />
                                            {item}
                                        </li>
                                    ))}
                                </ul>
                            </article>
                        ))}
                    </div>
                </div>
            </section>

            {/* ── Próximamente ── */}
            <section className="l-section l-section--tight l-section--tinted" aria-labelledby="coming-title">
                <div className="l-container">
                    <div className="l-modules__head">
                        <div>
                            <p className="l-eyebrow">En camino</p>
                            <h2 id="coming-title" className="l-section__title">Lo que viene</h2>
                        </div>
                        <p className="l-section__lede">
                            Ideas en las que estamos trabajando. Todavía no tienen fecha de lanzamiento confirmada.
                        </p>
                    </div>

                    <div className="s-grid s-after-head">
                        {coming.map((s) => (
                            <article key={s.title} className="s-card s-card--quiet">
                                <span className="s-tag">En evaluación</span>
                                <h3 className="s-card__title">{s.title}</h3>
                                <p className="s-card__body">{s.description}</p>
                            </article>
                        ))}
                    </div>
                </div>
            </section>

            {/* ── CTA ── */}
            <section className="l-section l-section--tight" aria-labelledby="servicios-cta-title">
                <div className="l-container l-cta-band">
                    <h2 id="servicios-cta-title">Empezá hoy, sin compromiso</h2>
                    <p>
                        Probá Zeta Prop gratis durante 14 días, sin tarjeta de crédito.
                    </p>
                    <div className="l-hero__ctas">
                        <PrimaryCta href="/register">Crear cuenta gratis</PrimaryCta>
                        <Link href="/faqs" className="l-btn l-btn--secondary">
                            Ver preguntas frecuentes
                        </Link>
                    </div>
                </div>
            </section>

        </main>
    );
}
