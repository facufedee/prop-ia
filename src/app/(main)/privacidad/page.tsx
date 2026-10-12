import { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
    title: 'Política de Privacidad | Zeta Prop',
    description: 'Política de privacidad detallada y protección de datos de Zeta Prop. Conozca sus derechos y cómo manejamos su información.',
    alternates: {
        canonical: 'https://zetaprop.com.ar/privacidad',
    },
};


export default function PrivacyPage() {
    return (
        <main className="flex-1">
            {/* Header */}
            <section className="l-section s-page-head s-legal-head" aria-labelledby="privacidad-title">
                <div className="l-container">
                    <div className="s-page-head__inner">
                        <p className="l-eyebrow">Legal</p>
                        <h1 id="privacidad-title" className="s-page-title">Política de Privacidad</h1>
                        <p className="s-legal-updated">
                            Última actualización: {new Date().toLocaleDateString('es-AR', { year: 'numeric', month: 'long', day: 'numeric' })}
                        </p>
                    </div>
                </div>
            </section>

            <div className="l-section s-flush-top">
                <div className="l-container">
                    <div className="s-legal">
                        {/* Introduction */}
                        <div className="s-legal__intro">
                            <p>
                                En <strong>Zeta Prop</strong> (&quot;nosotros&quot;, &quot;nuestro&quot;), valoramos profundamente la confianza que deposita en nosotros al utilizar nuestra plataforma. Nos comprometemos a proteger su privacidad y a tratar sus datos personales con la máxima transparencia y seguridad.
                            </p>
                            <p>
                                Esta Política de Privacidad describe qué información recopilamos, por qué la necesitamos, cómo la utilizamos y cuáles son sus derechos. Al acceder o utilizar nuestros servicios de tasación inmobiliaria con inteligencia artificial y gestión (CRM), usted acepta las prácticas descritas en este documento.
                            </p>
                        </div>

                        {/* 1. Información que Recopilamos */}
                        <section className="s-legal__section">
                            <h2>1. Información que Recopilamos</h2>
                            <p>Recopilamos diferentes tipos de información para poder ofrecerle nuestros servicios:</p>
                            <ul>
                                <li><strong>Datos de Cuenta:</strong> Nombre completo, dirección de correo electrónico, número de teléfono y contraseña segura (encriptada).</li>
                                <li><strong>Datos de Propiedades:</strong> Información sobre los inmuebles que carga para tasar o gestionar (ubicación, superficie, características, fotos).</li>
                                <li><strong>Información de Uso:</strong> Datos técnicos sobre cómo interactúa con nuestra plataforma (dirección IP, tipo de navegador, páginas visitadas) para mejorar la experiencia.</li>
                            </ul>
                        </section>

                        {/* 2. Uso de la Información */}
                        <section className="s-legal__section">
                            <h2>2. Finalidad del Uso de Datos</h2>
                            <p>Utilizamos sus datos exclusivamente para los siguientes fines:</p>
                            <div className="s-legal__grid">
                                <div>
                                    <h3>Servicios Principales</h3>
                                    <p>Generar tasaciones precisas con IA, gestionar su cartera de propiedades y facilitar el contacto con clientes.</p>
                                </div>
                                <div>
                                    <h3>Mejora Continua</h3>
                                    <p>Entrenar nuestros algoritmos para mejorar la precisión de las valuaciones (utilizando datos anonimizados).</p>
                                </div>
                                <div>
                                    <h3>Seguridad</h3>
                                    <p>Detectar y prevenir fraudes, abusos o incidentes de seguridad en la plataforma.</p>
                                </div>
                                <div>
                                    <h3>Comunicaciones</h3>
                                    <p>Enviarle notificaciones importantes sobre su cuenta, actualizaciones del servicio o respuestas a soporte.</p>
                                </div>
                            </div>
                        </section>

                        {/* 3. Compartir Información */}
                        <section className="s-legal__section">
                            <h2>3. Compartición de Información</h2>
                            <p>
                                <strong>No vendemos sus datos personales a terceros.</strong> Solo compartimos información en los siguientes casos limitados:
                            </p>
                            <ul>
                                <li>Con <strong>proveedores de servicios de confianza</strong> que nos ayudan a operar (por ejemplo, procesamiento de pagos, alojamiento en la nube), bajo estrictos acuerdos de confidencialidad.</li>
                                <li>Para cumplir con una <strong>obligación legal</strong>, orden judicial o requerimiento de una autoridad gubernamental competente.</li>
                                <li>Para <strong>proteger los derechos</strong>, propiedad o seguridad de Zeta Prop, nuestros usuarios o el público en general.</li>
                            </ul>
                        </section>

                        {/* 4. Seguridad */}
                        <section className="s-legal__section">
                            <h2>4. Seguridad de los Datos</h2>
                            <p>
                                Implementamos medidas de seguridad técnicas, administrativas y físicas robustas para proteger su información. Esto incluye el uso de encriptación <strong>SSL/TLS</strong> para datos en tránsito, hashing para contraseñas y controles de acceso estrictos a nuestros servidores. Sin embargo, ningún método de transmisión por Internet es 100% seguro, por lo que no podemos garantizar seguridad absoluta.
                            </p>
                        </section>

                        {/* 5. Sus Derechos */}
                        <section className="s-legal__section">
                            <h2>5. Sus Derechos</h2>
                            <p>
                                Como usuario, usted tiene derechos sobre sus datos personales. Puede ejercer los siguientes derechos contactándonos:
                            </p>
                            <ul>
                                <li>Acceso a sus datos</li>
                                <li>Rectificación de errores</li>
                                <li>Cancelación (Borrado)</li>
                                <li>Oposición al tratamiento</li>
                            </ul>
                        </section>

                        {/* 6. Cookies */}
                        <section className="s-legal__section">
                            <h2>Política de Cookies</h2>
                            <p>
                                Utilizamos cookies esenciales para que el sitio funcione y cookies analíticas para entender cómo se usa. Puede configurar su navegador para rechazar cookies, aunque algunas funciones podrían no estar disponibles.
                            </p>
                            <p>
                                <Link href="/cookies">Ver Política de Cookies completa &rarr;</Link>
                            </p>
                        </section>

                        {/* 7. Contacto */}
                        <section className="s-legal__section">
                            <h2>Contacto</h2>
                            <p>
                                Si tiene dudas, inquietudes o desea ejercer sus derechos de privacidad, nuestro equipo de Protección de Datos está a su disposición.
                            </p>
                            <p>
                                <a href="mailto:zetaprop.com.ar@gmail.com">zetaprop.com.ar@gmail.com</a>
                            </p>
                        </section>
                    </div>
                </div>
            </div>
        </main>
    );
}
