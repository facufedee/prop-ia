import { Metadata } from 'next';
import { Scale, CheckCircle, Zap, User, Copyright, FileText, AlertTriangle, ShieldAlert, RefreshCcw, Mail } from 'lucide-react';

export const metadata: Metadata = {
    title: 'Términos y Condiciones | Zeta Prop',
    description: 'Términos y condiciones de uso de la plataforma Zeta Prop. Derechos, obligaciones y marco legal del servicio.',
    alternates: {
        canonical: 'https://zetaprop.com.ar/terminos',
    },
};


export default function TermsPage() {
    return (
        <div className="min-h-screen bg-gray-50 pt-32 pb-20 px-4 md:px-8">
            <div className="max-w-4xl mx-auto space-y-12">

                {/* Header */}
                <div className="text-center space-y-4">
                    <div className="inline-flex items-center justify-center p-3 bg-indigo-100 rounded-2xl mb-4">
                        <Scale className="w-8 h-8 text-indigo-600" />
                    </div>
                    <h1 className="text-4xl font-bold text-gray-900">Términos y Condiciones</h1>
                    <p className="text-gray-500">
                        Última actualización: {new Date().toLocaleDateString('es-AR', { year: 'numeric', month: 'long', day: 'numeric' })}
                    </p>
                </div>

                {/* Intro */}
                <div className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100 text-gray-600 leading-relaxed">
                    <p className="mb-4">
                        Bienvenido a <strong>Zeta Prop</strong>. Estos Términos y Condiciones ("Términos") rigen el acceso y uso de nuestra plataforma de servicios inmobiliarios y herramientas de inteligencia artificial.
                    </p>
                    <p>
                        Por favor, lea estos términos detenidamente. Al acceder, registrarse o utilizar nuestros servicios, usted reconoce haber leído, entendido y aceptado estar legalmente vinculado por este acuerdo. Si no está de acuerdo con alguno de estos términos, no debe utilizar nuestros servicios.
                    </p>
                </div>

                {/* Sections */}
                <div className="grid gap-8">

                    {/* 1. Aceptación */}
                    <section className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="p-2 bg-green-50 rounded-lg text-green-600">
                                <CheckCircle size={24} />
                            </div>
                            <h2 className="text-2xl font-bold text-gray-900">1. Aceptación del Acuerdo</h2>
                        </div>
                        <p className="text-gray-600 leading-relaxed">
                            Este Acuerdo constituye un contrato legalmente vinculante entre usted ("Usuario", "Usted") y Zeta Prop ("Nosotros", "Plataforma"). El uso de la plataforma implica la aceptación plena y sin reservas de todas las disposiciones incluidas en este documento, así como de nuestra Política de Privacidad y Política de Cookies.
                        </p>
                    </section>

                    {/* 2. Descripción del Servicio */}
                    <section className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="p-2 bg-yellow-50 rounded-lg text-yellow-600">
                                <Zap size={24} />
                            </div>
                            <h2 className="text-2xl font-bold text-gray-900">2. Descripción de los Servicios</h2>
                        </div>
                        <p className="text-gray-600 mb-4">
                            Zeta Prop proporciona herramientas tecnológicas para el sector inmobiliario, que incluyen pero no se limitan a:
                        </p>
                        <ul className="space-y-3 text-gray-600 list-disc list-inside ml-2">
                            <li>Tasaciones automatizadas mediante Inteligencia Artificial.</li>
                            <li>Sistema de gestión de relaciones con clientes (CRM Inmobiliario).</li>
                            <li>Gestión y publicación de propiedades.</li>
                            <li>Generación de contratos y documentos legales.</li>
                        </ul>
                    </section>

                    {/* 3. Cuentas de Usuario */}
                    <section className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="p-2 bg-blue-50 rounded-lg text-blue-600">
                                <User size={24} />
                            </div>
                            <h2 className="text-2xl font-bold text-gray-900">3. Cuentas y Seguridad</h2>
                        </div>
                        <p className="text-gray-600 mb-4 leading-relaxed">
                            Para acceder a ciertas funciones, deberá registrarse y crear una cuenta. Usted es responsable de mantener la confidencialidad de sus credenciales de acceso y de todas las actividades que ocurran bajo su cuenta. Zeta Prop se reserva el derecho de suspender o cancelar cuentas que violen estos términos o que presenten actividad sospechosa.
                        </p>
                    </section>

                    {/* 4. Propiedad Intelectual */}
                    <section className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="p-2 bg-purple-50 rounded-lg text-purple-600">
                                <Copyright size={24} />
                            </div>
                            <h2 className="text-2xl font-bold text-gray-900">4. Propiedad Intelectual</h2>
                        </div>
                        <p className="text-gray-600 leading-relaxed">
                            El software, algoritmos, diseños, logotipos y todo el contenido generado por Zeta Prop son propiedad exclusiva de la empresa y están protegidos por las leyes de propiedad intelectual y derechos de autor. Se prohíbe la reproducción, distribución o ingeniería inversa de cualquier componente de la plataforma sin autorización expresa por escrito.
                        </p>
                    </section>

                    {/* 5. Contenido del Usuario */}
                    <section className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="p-2 bg-gray-100 rounded-lg text-gray-600">
                                <FileText size={24} />
                            </div>
                            <h2 className="text-2xl font-bold text-gray-900">5. Responsabilidad del Contenido</h2>
                        </div>
                        <p className="text-gray-600 leading-relaxed">
                            Usted conserva los derechos sobre los datos y archivos que carga en la plataforma (fotos de propiedades, datos de clientes). Sin embargo, garantiza que posee los derechos necesarios sobre dicho contenido y que su publicación no infringe derechos de terceros ni leyes vigentes. Zeta Prop no se hace responsable por la veracidad o legalidad del contenido cargado por los usuarios.
                        </p>
                    </section>

                    {/* 6. Prohibiciones */}
                    <section className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="p-2 bg-red-50 rounded-lg text-red-600">
                                <AlertTriangle size={24} />
                            </div>
                            <h2 className="text-2xl font-bold text-gray-900">6. Usos Prohibidos</h2>
                        </div>
                        <ul className="space-y-3 text-gray-600 list-disc list-inside ml-2">
                            <li>Utilizar la plataforma para fines ilegales o no autorizados.</li>
                            <li>Intentar interferir con el funcionamiento adecuado del servicio (ataques DDoS, inyecciones de código).</li>
                            <li>Extraer datos de forma masiva (scraping) sin permiso.</li>
                            <li>Subir contenido ofensivo, fraudulento o que contenga malware.</li>
                        </ul>
                    </section>

                    {/* 7. Limitación de Responsabilidad */}
                    <section className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="p-2 bg-orange-50 rounded-lg text-orange-600">
                                <ShieldAlert size={24} />
                            </div>
                            <h2 className="text-2xl font-bold text-gray-900">7. Limitación de Responsabilidad</h2>
                        </div>
                        <p className="text-gray-600 mb-4 leading-relaxed">
                            Zeta Prop ofrece sus servicios "tal cual" y "según disponibilidad". Aunque nos esforzamos por garantizar la precisión de nuestras tasaciones y la estabilidad del sistema, no garantizamos que el servicio sea ininterrumpido o libre de errores.
                        </p>
                        <p className="text-gray-600 leading-relaxed">
                            En la máxima medida permitida por la ley, Zeta Prop no será responsable por daños indirectos, incidentales o consecuentes (incluyendo pérdida de beneficios o datos) derivados del uso del servicio. Las tasaciones generadas por IA son estimaciones referenciales y no reemplazan el juicio de un tasador profesional matriculado.
                        </p>
                    </section>

                    {/* 8. Modificaciones */}
                    <section className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="p-2 bg-indigo-50 rounded-lg text-indigo-600">
                                <RefreshCcw size={24} />
                            </div>
                            <h2 className="text-2xl font-bold text-gray-900">8. Modificaciones</h2>
                        </div>
                        <p className="text-gray-600 leading-relaxed">
                            Nos reservamos el derecho de modificar estos Términos en cualquier momento. Los cambios entrarán en vigor tan pronto como se publiquen en esta página. Su uso continuado de la plataforma después de dichos cambios constituirá su aceptación de los nuevos términos.
                        </p>
                    </section>

                    {/* Contacto */}
                    <div className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100 text-center">
                        <div className="flex items-center justify-center gap-3 mb-4">
                            <div className="p-2 bg-gray-100 rounded-lg text-gray-600">
                                <Mail size={20} />
                            </div>
                            <h2 className="text-xl font-bold text-gray-900">Contacto Legal</h2>
                        </div>
                        <p className="text-gray-600 mb-4">
                            Si tiene preguntas sobre estos términos, por favor contáctenos.
                        </p>
                        <a href="mailto:contact@zetaprop.com" className="text-indigo-600 font-bold text-sm hover:underline">
                            contact@zetaprop.com
                        </a>
                    </div>

                </div>
            </div>
        </div>
    );
}
