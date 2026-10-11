import Link from 'next/link';
import { CheckCircle2 } from 'lucide-react';
import { PrimaryCta } from '@/ui/sections/PhotoHero';

export const metadata = {
    title: "Servicios | Zeta Prop",
    description: "Todo lo que incluye Zeta Prop: CRM inmobiliario, gestión de alquileres, contratos digitales, agenda, finanzas y más. Conocé lo que tenemos hoy y lo que viene.",
    alternates: {
        canonical: 'https://zetaprop.com.ar/servicios',
    },
};

const available = [
    {
        title: "Gestión de Propiedades",
        description: "Fichas completas con fotos, ubicación en mapa, precios y estados en tiempo real. Generación automática de ficha PDF para compartir con clientes.",
        items: ["Catálogo digital ilimitado", "Publicación al portal federal", "Fichas PDF automáticas", "Historial de cambios de precio"],
    },
    {
        title: "CRM de Clientes",
        description: "Seguimiento completo de cada lead: perfil de búsqueda, historial de interacciones, pipeline visual y alertas de matching automático con propiedades.",
        items: ["Pipeline visual de oportunidades", "Matching automático", "Perfiles de búsqueda", "Scoring y etiquetas de clientes"],
    },
    {
        title: "Administración de Alquileres",
        description: "El ciclo completo del alquiler automatizado: contratos, vencimientos, recibos, punitorios y liquidaciones. Sin Excel, sin errores.",
        items: ["Recibos automáticos mensuales", "Punitorios por mora día a día", "Ajustes ICL / IPC / % fijo", "Liquidaciones a propietarios en PDF"],
    },
    {
        title: "Contratos Digitales",
        description: "Generación automática de contratos de alquiler y venta con los datos del sistema. Listos para descargar e imprimir en segundos.",
        items: ["Contratos de alquiler y venta", "Plantillas actualizadas", "Descarga PDF inmediata", "Datos precargados del sistema"],
    },
    {
        title: "Agenda Inteligente",
        description: "Coordiná visitas sin solapamientos. Sincronización con Google Calendar, recordatorios automáticos y vista de disponibilidad por agente.",
        items: ["Sincronización con Google Calendar", "Recordatorios automáticos", "Vista de equipo", "Gestión de visitas por propiedad"],
    },
    {
        title: "Gestión Financiera",
        description: "Control total de la caja: comisiones, gastos operativos y reportes por período. Todo lo que necesitás para saber cómo está tu negocio.",
        items: ["Cálculo de comisiones por operación", "Control de caja y gastos", "Alertas de pagos pendientes", "Exportación a Excel"],
    },
    {
        title: "Portal del Inquilino",
        description: "Acceso exclusivo para cada inquilino donde puede ver su contrato, el monto del mes, pagos realizados y punitorios. Sin app, sin registro.",
        items: ["Acceso por link único", "Resumen de contrato", "Historial de pagos", "Transparencia total"],
    },
    {
        title: "Dashboard y Analytics",
        description: "Métricas en tiempo real de tu cartera: propiedades activas, pagos del mes, vencimientos próximos y rendimiento por agente.",
        items: ["Dashboard en tiempo real", "Métricas de rendimiento", "Alertas de vencimientos", "Reportes exportables"],
    },
    {
        title: "Red Inmobiliaria Federal",
        description: "Tus propiedades publicadas en el portal de Zeta Prop, visible para compradores e inquilinos de todo el país.",
        items: ["Portal público en zetaprop.com.ar", "Búsqueda por zona y tipo", "Ficha pública de cada propiedad", "Contacto directo con la agencia"],
    },
];

const coming = [
    {
        title: "Mi Sitio — Portal Propio",
        description: "Tu propia web inmobiliaria bajo un subdominio de Zeta Prop. Con tu logo, tus colores y tus propiedades publicadas automáticamente.",
    },
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
        description: "Publicación automática en Argenprop, MercadoLibre y otros portales desde un solo lugar, sin cargar la propiedad dos veces.",
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
                            Funcionalidades en desarrollo que van a estar disponibles próximamente.
                        </p>
                    </div>

                    <div className="s-grid s-after-head">
                        {coming.map((s) => (
                            <article key={s.title} className="s-card s-card--quiet">
                                <span className="s-tag">Próximamente</span>
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
                        Probá todas las funcionalidades gratis y sumate a las inmobiliarias que ya trabajan con Zeta Prop.
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
