import { Metadata } from 'next';
import { Shield, Lock, Eye, FileText, Database, Share2, Cookie, Mail } from 'lucide-react';

export const metadata: Metadata = {
    title: 'Política de Privacidad | PROP-IA',
    description: 'Política de privacidad detallada y protección de datos de PROP-IA. Conozca sus derechos y cómo manejamos su información.',
    alternates: {
        canonical: 'https://prop-ia.com/privacidad',
    },
};

export default function PrivacyPage() {
    return (
        <div className="min-h-screen bg-gray-50 py-20 px-4 md:px-8">
            <div className="max-w-4xl mx-auto space-y-12">

                {/* Header */}
                <div className="text-center space-y-4">
                    <div className="inline-flex items-center justify-center p-3 bg-indigo-100 rounded-2xl mb-4">
                        <Shield className="w-8 h-8 text-indigo-600" />
                    </div>
                    <h1 className="text-4xl font-bold text-gray-900">Política de Privacidad</h1>
                    <p className="text-gray-500">
                        Última actualización: {new Date().toLocaleDateString('es-AR', { year: 'numeric', month: 'long', day: 'numeric' })}
                    </p>
                </div>

                {/* Introduction */}
                <div className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100 text-gray-600 leading-relaxed">
                    <p className="mb-4">
                        En <strong>PROP-IA</strong> ("nosotros", "nuestro"), valoramos profundamente la confianza que deposita en nosotros al utilizar nuestra plataforma. Nos comprometemos a proteger su privacidad y a tratar sus datos personales con la máxima transparencia y seguridad.
                    </p>
                    <p>
                        Esta Política de Privacidad describe qué información recopilamos, por qué la necesitamos, cómo la utilizamos y cuáles son sus derechos. Al acceder o utilizar nuestros servicios de tasación inmobiliaria con inteligencia artificial y gestión (CRM), usted acepta las prácticas descritas en este documento.
                    </p>
                </div>

                {/* Sections */}
                <div className="grid gap-8">

                    {/* 1. Información que Recopilamos */}
                    <section className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="p-2 bg-blue-50 rounded-lg text-blue-600">
                                <Database size={24} />
                            </div>
                            <h2 className="text-2xl font-bold text-gray-900">1. Información que Recopilamos</h2>
                        </div>
                        <p className="text-gray-600 mb-4">Recopilamos diferentes tipos de información para poder ofrecerle nuestros servicios:</p>
                        <ul className="space-y-3 text-gray-600">
                            <li className="flex gap-3">
                                <span className="w-1.5 h-1.5 bg-blue-500 rounded-full mt-2.5 flex-shrink-0" />
                                <span><strong>Datos de Cuenta:</strong> Nombre completo, dirección de correo electrónico, número de teléfono y contraseña segura (encriptada).</span>
                            </li>
                            <li className="flex gap-3">
                                <span className="w-1.5 h-1.5 bg-blue-500 rounded-full mt-2.5 flex-shrink-0" />
                                <span><strong>Datos de Propiedades:</strong> Información sobre los inmuebles que carga para tasar o gestionar (ubicación, superficie, características, fotos).</span>
                            </li>
                            <li className="flex gap-3">
                                <span className="w-1.5 h-1.5 bg-blue-500 rounded-full mt-2.5 flex-shrink-0" />
                                <span><strong>Información de Uso:</strong> Datos técnicos sobre cómo interactúa con nuestra plataforma (dirección IP, tipo de navegador, páginas visitadas) para mejorar la experiencia.</span>
                            </li>
                        </ul>
                    </section>

                    {/* 2. Uso de la Información */}
                    <section className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="p-2 bg-green-50 rounded-lg text-green-600">
                                <FileText size={24} />
                            </div>
                            <h2 className="text-2xl font-bold text-gray-900">2. Finalidad del Uso de Datos</h2>
                        </div>
                        <p className="text-gray-600 mb-4">Utilizamos sus datos exclusivamente para los siguientes fines:</p>
                        <div className="grid md:grid-cols-2 gap-4">
                            <div className="bg-gray-50 p-4 rounded-xl">
                                <h3 className="font-semibold text-gray-900 mb-2">Servicios Principales</h3>
                                <p className="text-sm text-gray-600">Generar tasaciones precisas con IA, gestionar su cartera de propiedades y facilitar el contacto con clientes.</p>
                            </div>
                            <div className="bg-gray-50 p-4 rounded-xl">
                                <h3 className="font-semibold text-gray-900 mb-2">Mejora Continua</h3>
                                <p className="text-sm text-gray-600">Entrenar nuestros algoritmos para mejorar la precisión de las valuaciones (utilizando datos anonimizados).</p>
                            </div>
                            <div className="bg-gray-50 p-4 rounded-xl">
                                <h3 className="font-semibold text-gray-900 mb-2">Seguridad</h3>
                                <p className="text-sm text-gray-600">Detectar y prevenir fraudes, abusos o incidentes de seguridad en la plataforma.</p>
                            </div>
                            <div className="bg-gray-50 p-4 rounded-xl">
                                <h3 className="font-semibold text-gray-900 mb-2">Comunicaciones</h3>
                                <p className="text-sm text-gray-600">Enviarle notificaciones importantes sobre su cuenta, actualizaciones del servicio o respuestas a soporte.</p>
                            </div>
                        </div>
                    </section>

                    {/* 3. Compartir Información */}
                    <section className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="p-2 bg-purple-50 rounded-lg text-purple-600">
                                <Share2 size={24} />
                            </div>
                            <h2 className="text-2xl font-bold text-gray-900">3. Compartición de Información</h2>
                        </div>
                        <p className="text-gray-600 mb-4">
                            <strong>No vendemos sus datos personales a terceros.</strong> Solo compartimos información en los siguientes casos limitados:
                        </p>
                        <ul className="space-y-3 text-gray-600 list-disc list-inside ml-2">
                            <li>Con <strong>proveedores de servicios de confianza</strong> que nos ayudan a operar (por ejemplo, procesamiento de pagos, alojamiento en la nube), bajo estrictos acuerdos de confidencialidad.</li>
                            <li>Para cumplir con una <strong>obligación legal</strong>, orden judicial o requerimiento de una autoridad gubernamental competente.</li>
                            <li>Para <strong>proteger los derechos</strong>, propiedad o seguridad de PROP-IA, nuestros usuarios o el público en general.</li>
                        </ul>
                    </section>

                    {/* 4. Seguridad */}
                    <section className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="p-2 bg-red-50 rounded-lg text-red-600">
                                <Lock size={24} />
                            </div>
                            <h2 className="text-2xl font-bold text-gray-900">4. Seguridad de los Datos</h2>
                        </div>
                        <p className="text-gray-600 leading-relaxed">
                            Implementamos medidas de seguridad técnicas, administrativas y físicas robustas para proteger su información. Esto incluye el uso de encriptación <strong>SSL/TLS</strong> para datos en tránsito, hashing para contraseñas y controles de acceso estrictos a nuestros servidores. Sin embargo, ningún método de transmisión por Internet es 100% seguro, por lo que no podemos garantizar seguridad absoluta.
                        </p>
                    </section>

                    {/* 5. Sus Derechos */}
                    <section className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="p-2 bg-indigo-50 rounded-lg text-indigo-600">
                                <Eye size={24} />
                            </div>
                            <h2 className="text-2xl font-bold text-gray-900">5. Sus Derechos</h2>
                        </div>
                        <p className="text-gray-600 mb-4">
                            Como usuario, usted tiene derechos sobre sus datos personales. Puede ejercer los siguientes derechos contactándonos:
                        </p>
                        <ul className="grid sm:grid-cols-2 gap-4">
                            <li className="flex items-center gap-3 text-gray-700 bg-gray-50 px-4 py-3 rounded-lg">
                                <span className="w-2 h-2 bg-indigo-500 rounded-full" />
                                Acceso a sus datos
                            </li>
                            <li className="flex items-center gap-3 text-gray-700 bg-gray-50 px-4 py-3 rounded-lg">
                                <span className="w-2 h-2 bg-indigo-500 rounded-full" />
                                Rectificación de errores
                            </li>
                            <li className="flex items-center gap-3 text-gray-700 bg-gray-50 px-4 py-3 rounded-lg">
                                <span className="w-2 h-2 bg-indigo-500 rounded-full" />
                                Cancelación (Borrado)
                            </li>
                            <li className="flex items-center gap-3 text-gray-700 bg-gray-50 px-4 py-3 rounded-lg">
                                <span className="w-2 h-2 bg-indigo-500 rounded-full" />
                                Oposición al tratamiento
                            </li>
                        </ul>
                    </section>

                    {/* 6. Cookies y Contacto */}
                    <div className="grid md:grid-cols-2 gap-8">
                        <section className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="p-2 bg-orange-50 rounded-lg text-orange-600">
                                    <Cookie size={20} />
                                </div>
                                <h2 className="text-xl font-bold text-gray-900">Política de Cookies</h2>
                            </div>
                            <p className="text-sm text-gray-600 leading-relaxed mb-4">
                                Utilizamos cookies esenciales para que el sitio funcione y cookies analíticas para entender cómo se usa. Puede configurar su navegador para rechazar cookies, aunque algunas funciones podrían no estar disponibles.
                            </p>
                            <a href="/cookies" className="text-indigo-600 font-bold text-sm hover:underline">
                                Ver Política de Cookies completa &rarr;
                            </a>
                        </section>

                        <section className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="p-2 bg-gray-100 rounded-lg text-gray-600">
                                    <Mail size={20} />
                                </div>
                                <h2 className="text-xl font-bold text-gray-900">Contacto</h2>
                            </div>
                            <p className="text-sm text-gray-600 leading-relaxed mb-4">
                                Si tiene dudas, inquietudes o desea ejercer sus derechos de privacidad, nuestro equipo de Protección de Datos está a su disposición.
                            </p>
                            <a href="mailto:contacto@prop-ia.com.ar" className="text-indigo-600 font-bold text-sm hover:underline">
                                contacto@prop-ia.com.ar
                            </a>
                        </section>
                    </div>

                </div>
            </div>
        </div>
    );
}
