import { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
    title: 'Política de Cookies | Zeta Prop',
    description: 'Información detallada sobre el uso de cookies en Zeta Prop. Transparencia sobre cómo y por qué utilizamos tecnologías de rastreo.',
    alternates: {
        canonical: 'https://zetaprop.com.ar/cookies',
    },
};

export default function CookiesPage() {
    return (
        <main className="flex-1">
            {/* Header */}
            <section className="l-section s-page-head s-legal-head" aria-labelledby="cookies-title">
                <div className="l-container">
                    <div className="s-page-head__inner">
                        <p className="l-eyebrow">Legal</p>
                        <h1 id="cookies-title" className="s-page-title">Política de Cookies</h1>
                        <p className="s-legal-updated">
                            Última actualización: {new Date().toLocaleDateString('es-AR', { year: 'numeric', month: 'long', day: 'numeric' })}
                        </p>
                    </div>
                </div>
            </section>

            <div className="l-section s-flush-top">
                <div className="l-container">
                    <div className="s-legal">
                        {/* Intro */}
                        <div className="s-legal__intro">
                            <p>
                                En <strong>Zeta Prop</strong>, creemos en ser claros y abiertos sobre cómo recopilamos y usamos los datos relacionados con usted. Esta política de cookies proporciona información detallada sobre cómo y cuándo utilizamos cookies.
                            </p>
                            <p>
                                Al continuar navegando por nuestro sitio web o utilizar nuestros servicios, usted acepta el uso de cookies y tecnologías similares para los fines que describimos en esta política.
                            </p>
                        </div>

                        {/* 1. ¿Qué es una cookie? */}
                        <section className="s-legal__section">
                            <h2>1. ¿Qué es una cookie?</h2>
                            <p>
                                Una &quot;cookie&quot; es un pequeño archivo de texto que se almacena en su computadora, tableta o teléfono inteligente cuando visita un sitio web. Las cookies permiten que el sitio web recuerde sus acciones y preferencias (como inicio de sesión, idioma, tamaño de fuente y otras preferencias de visualización) durante un período de tiempo, para que no tenga que volver a ingresarlas cada vez que regrese al sitio o navegue de una página a otra.
                            </p>
                        </section>

                        {/* 2. ¿Qué tipos de cookies utilizamos? */}
                        <section className="s-legal__section">
                            <h2>2. Tipos de Cookies que Utilizamos</h2>
                            <p>Utilizamos los siguientes tipos de cookies en nuestra plataforma:</p>

                            <div className="s-legal__grid">
                                {/* Esenciales */}
                                <div>
                                    <h3>Cookies Esenciales</h3>
                                    <p>
                                        Son estrictamente necesarias para el funcionamiento del sitio. Sin ellas, no podríamos ofrecerle servicios básicos como el inicio de sesión seguro o el acceso a su panel de control.
                                    </p>
                                </div>

                                {/* Funcionalidad */}
                                <div>
                                    <h3>Cookies de Funcionalidad</h3>
                                    <p>
                                        Permiten que el sitio web recuerde las elecciones que usted hace (como su nombre de usuario, idioma o la región en la que se encuentra) para ofrecer funcionalidades mejoradas y personalizadas.
                                    </p>
                                </div>

                                {/* Analíticas */}
                                <div>
                                    <h3>Cookies de Análisis</h3>
                                    <p>
                                        Nos ayudan a entender cómo los visitantes interactúan con el sitio web, recopilando y reportando información de forma anónima. Usamos estos datos para mejorar nuestro rendimiento y diseño.
                                    </p>
                                </div>

                                {/* Publicidad */}
                                <div>
                                    <h3>Cookies de Marketing</h3>
                                    <p>
                                        Se utilizan para rastrear a los visitantes a través de los sitios web. La intención es mostrar anuncios que sean relevantes y atractivos para el usuario individual.
                                    </p>
                                </div>
                            </div>
                        </section>

                        {/* 3. Control de Cookies */}
                        <section className="s-legal__section">
                            <h2>3. Cómo Controlar las Cookies</h2>
                            <p>
                                Usted tiene el derecho de aceptar o rechazar las cookies. Puede controlar y/o eliminar las cookies según lo desee. Puede eliminar todas las cookies que ya están en su computadora y puede configurar la mayoría de los navegadores para evitar que se coloquen.
                            </p>
                            <p>
                                Sin embargo, si hace esto, es posible que tenga que ajustar manualmente algunas preferencias cada vez que visite un sitio y que algunos servicios y funcionalidades no funcionen correctamente (por ejemplo, mantener su sesión iniciada).
                            </p>
                        </section>

                        {/* Link to Privacy */}
                        <section className="s-legal__section">
                            <p>
                                Para más información sobre cómo protegemos sus datos, consulte nuestra:
                            </p>
                            <p>
                                <Link href="/privacidad">Política de Privacidad</Link>
                            </p>
                        </section>
                    </div>
                </div>
            </div>
        </main>
    );
}
