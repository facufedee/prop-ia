import { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import { Linkedin } from 'lucide-react';
import { PrimaryCta } from '@/ui/sections/PhotoHero';

export const metadata: Metadata = {
    title: 'Nosotros',
    description: 'Conocé al equipo detrás de Zeta Prop: construimos un software pensado para la gestión diaria de las inmobiliarias argentinas, desde Ituzaingó, Buenos Aires.',
    alternates: {
        canonical: 'https://zetaprop.com.ar/nosotros',
    },
};

const values = [
    {
        title: "Velocidad",
        desc: "Escuchamos a quienes usan la plataforma y la mejoramos de forma continua."
    },
    {
        title: "Confianza",
        desc: "La información de nuestros clientes es sagrada. Los administradores pueden generar copias de seguridad desde el panel."
    },
    {
        title: "Cercanía",
        desc: "No somos una empresa anónima. Somos accesibles y tomamos cada feedback en serio."
    },
    {
        title: "Crecimiento",
        desc: "Queremos que cada inmobiliaria que usa Zeta Prop opere mejor, cierre más y pierda menos tiempo."
    },
];

const team = [
    {
        name: "Facundo Flores",
        role: "CEO & Fundador",
        photo: "/assets/img/facundo.jpg",
        bio: "Lidera la estrategia, el producto y la visión de Zeta Prop.",
        linkedin: "https://www.linkedin.com/in/floreszamoranofacundo/",
    },
    {
        name: "Nahuel Serrano",
        role: "CTO",
        photo: "/assets/img/nahuel.jpg",
        bio: "Responsable de la arquitectura y la infraestructura técnica de la plataforma.",
        linkedin: "https://www.linkedin.com/in/nahuelserrano/",
    },
];

export default function AboutPage() {
    return (
        <main className="flex-1">

            {/* ── Page header ── */}
            <section className="l-section s-page-head" aria-labelledby="nosotros-title">
                <div className="l-container">
                    <div className="s-page-head__inner">
                        <p className="l-eyebrow">Sobre Nosotros</p>
                        <h1 id="nosotros-title" className="s-page-title">
                            Construimos el CRM que las inmobiliarias argentinas merecen
                        </h1>
                        <p className="s-page-lede">
                            Nacimos para reemplazar el Excel, los cuadernos y los recordatorios en papel por un sistema que ayude a las inmobiliarias a operar con más orden.
                        </p>
                    </div>
                </div>
            </section>

            {/* ── Historia / Por qué existimos ── */}
            <section className="l-section l-section--tight" aria-labelledby="historia-title">
                <div className="l-container">
                    <div className="l-modules__head">
                        <div>
                            <p className="l-eyebrow">Nuestra historia</p>
                            <h2 id="historia-title" className="l-section__title">
                                Por qué existe Zeta Prop
                            </h2>
                        </div>
                    </div>
                    <div className="s-prose s-after-head">
                        <p>
                            En muchas inmobiliarias se repite el mismo problema: contratos en papel, pagos anotados a mano, liquidaciones calculadas en Excel y clientes perdidos por falta de seguimiento.
                        </p>
                        <p>
                            Creamos Zeta Prop para cambiar eso. No con una herramienta genérica adaptada a la fuerza, sino con un sistema pensado desde cero para la realidad inmobiliaria argentina: contratos con ajuste por ICL o IPC, cálculo de punitorios por mora, portal del inquilino, CRM de clientes y gestión financiera en un solo lugar.
                        </p>
                        <p>
                            Seguimos escuchando cada sugerencia y mejorando la plataforma de forma continua.
                        </p>
                    </div>
                </div>
            </section>

            {/* ── Misión y Visión ── */}
            <section className="l-section l-section--tight l-section--tinted">
                <div className="l-container s-grid s-grid--2">
                    <article className="s-card">
                        <h2 className="s-card__title">Nuestra Misión</h2>
                        <p className="s-card__body">
                            Darle a cada inmobiliaria, sin importar su tamaño, herramientas para automatizar tareas administrativas y ofrecer una experiencia profesional a sus clientes, sin complicaciones.
                        </p>
                    </article>
                    <article className="s-card">
                        <h2 className="s-card__title">Nuestra Visión</h2>
                        <p className="s-card__body">
                            Ser la plataforma de referencia para inmobiliarias en Argentina y Latinoamérica. Un ecosistema donde la tecnología se encarga de lo administrativo y los profesionales pueden enfocarse en lo que realmente importa: las personas.
                        </p>
                    </article>
                </div>
            </section>

            {/* ── Valores ── */}
            <section className="l-section l-section--tight" aria-labelledby="valores-title">
                <div className="l-container">
                    <div className="l-modules__head">
                        <div>
                            <p className="l-eyebrow">Cómo trabajamos</p>
                            <h2 id="valores-title" className="l-section__title">Nuestros valores</h2>
                        </div>
                    </div>
                    <ul className="s-grid s-grid--4 s-after-head list-none p-0">
                        {values.map(({ title, desc }) => (
                            <li key={title} className="s-card">
                                <h3 className="s-card__title">{title}</h3>
                                <p className="s-card__body">{desc}</p>
                            </li>
                        ))}
                    </ul>
                </div>
            </section>

            {/* ── Equipo ── */}
            <section className="l-section l-section--tight l-section--tinted" aria-labelledby="equipo-title">
                <div className="l-container">
                    <div className="l-modules__head">
                        <div>
                            <p className="l-eyebrow">El equipo</p>
                            <h2 id="equipo-title" className="l-section__title">Las personas detrás de Zeta Prop</h2>
                        </div>
                        <p className="l-section__lede">
                            Un equipo chico con foco en construir algo grande para el sector inmobiliario argentino.
                        </p>
                    </div>

                    <div className="s-grid s-grid--2 s-after-head">
                        {team.map((person) => (
                            <article key={person.name} className="s-card s-person">
                                <div className="s-person__photo">
                                    <Image
                                        src={person.photo}
                                        alt={person.name}
                                        fill
                                        className="object-cover"
                                        sizes="72px"
                                        loading="lazy"
                                    />
                                </div>
                                <h3 className="s-card__title">{person.name}</h3>
                                <p className="s-card__role">{person.role}</p>
                                <p className="s-card__body">{person.bio}</p>
                                <a
                                    href={person.linkedin}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="l-btn l-btn--secondary"
                                >
                                    <Linkedin size={16} aria-hidden="true" />
                                    LinkedIn
                                </a>
                            </article>
                        ))}
                    </div>
                </div>
            </section>

            {/* ── CTA Final ── */}
            <section className="l-section l-section--tight" aria-labelledby="nosotros-cta-title">
                <div className="l-container l-cta-band">
                    <h2 id="nosotros-cta-title">¿Querés ser parte del cambio?</h2>
                    <p>Probá Zeta Prop para gestionar tu inmobiliaria.</p>
                    <div className="l-hero__ctas">
                        <PrimaryCta href="/register">Comenzar gratis</PrimaryCta>
                        <Link href="/contacto" className="l-btn l-btn--secondary">
                            Hablar con el equipo
                        </Link>
                    </div>
                </div>
            </section>

        </main>
    );
}
