import { Metadata } from 'next';
import { Scale, CheckCircle, Zap, User, Copyright, FileText, AlertTriangle, ShieldAlert, RefreshCcw, Mail, CreditCard, Lock, Clock, Bell, Gavel, Book } from 'lucide-react';

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
                        Bienvenido a <strong>Zeta Prop</strong>. Estos son los términos y condiciones que rigen el uso de nuestra plataforma.
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
                            <h2 className="text-2xl font-bold text-gray-900">1. Aceptación</h2>
                        </div>
                        <p className="text-gray-600 leading-relaxed">
                            La creación de una cuenta en Zeta Prop, así como el uso de la plataforma en cualquiera de sus modalidades (prueba gratuita o suscripción), implica la aceptación expresa, plena y sin reservas de los presentes Términos y Condiciones (“TyC”) y de la Política de Privacidad. Dicha aceptación se considera otorgada de manera electrónica y tiene la misma validez legal que la firma manuscrita.
                        </p>
                    </section>

                    {/* 2. Definiciones */}
                    <section className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="p-2 bg-blue-50 rounded-lg text-blue-600">
                                <Book size={24} />
                            </div>
                            <h2 className="text-2xl font-bold text-gray-900">2. Definiciones</h2>
                        </div>
                        <ul className="space-y-3 text-gray-600 list-disc list-inside ml-2">
                            <li><strong>Usuario:</strong> toda persona que se registra en la plataforma y utiliza las funcionalidades de Zeta Prop.</li>
                            <li><strong>Visitante:</strong> toda persona que navega el sitio web o recibe accesos limitados (ej. inquilinos con PIN).</li>
                            <li><strong>Cuenta:</strong> registro individual de un Usuario en la plataforma.</li>
                            <li><strong>Servicio:</strong> funcionalidades provistas por Zeta Prop bajo modalidad SaaS.</li>
                        </ul>
                    </section>

                    {/* 3. Elegibilidad y cuentas */}
                    <section className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="p-2 bg-indigo-50 rounded-lg text-indigo-600">
                                <User size={24} />
                            </div>
                            <h2 className="text-2xl font-bold text-gray-900">3. Elegibilidad y cuentas</h2>
                        </div>
                        <p className="text-gray-600 leading-relaxed mb-2">
                            Se requiere mayoría de edad y la provisión de datos verídicos.
                        </p>
                        <p className="text-gray-600 leading-relaxed">
                            El acceso de inquilinos mediante PIN es una cortesía, pero el titular de la cuenta sigue siendo responsable de la información cargada y del uso de la plataforma.
                        </p>
                    </section>

                    {/* 4. Planes, pruebas y pagos */}
                    <section className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="p-2 bg-yellow-50 rounded-lg text-yellow-600">
                                <CreditCard size={24} />
                            </div>
                            <h2 className="text-2xl font-bold text-gray-900">4. Planes, pruebas y pagos</h2>
                        </div>
                        <p className="text-gray-600 mb-4">
                            Zeta Prop ofrece planes denominados Free, Pro, Enterprise.
                        </p>
                        <p className="text-gray-600 mb-4">
                            Se otorga una prueba gratuita de 14 días con acceso al plan Básico , única, intransferible y no prorrogable. Finalizado dicho plazo, el acceso a la cuenta quedará revocado, y la reactivación dependerá de la contratación de un plan pago. Zeta Prop no garantiza la conservación de los datos si no se contrata un plan dentro de los 30 días posteriores.
                        </p>
                        <h3 className="font-semibold text-gray-900 mb-2">Precios y moneda:</h3>
                        <ul className="space-y-2 text-gray-600 list-disc list-inside ml-2 mb-4">
                            <li>Los planes se expresan en pesos argentinos, que se cancelarán en pesos argentinos.</li>
                            <li>Zeta Prop podrá modificar en cualquier momento los precios, planes y condiciones. En planes mensuales, el precio aplicable será el publicado al momento de iniciar cada nuevo ciclo de facturación. En planes anuales, el precio contratado se mantendrá fijo hasta la finalización del período, y en la renovación aplicará el precio vigente en ese momento.</li>
                            <li>Los cambios de precio nunca tendrán efecto retroactivo sobre montos ya abonados.</li>
                        </ul>
                        <h3 className="font-semibold text-gray-900 mb-2">Conformidad:</h3>
                        <p className="text-gray-600">
                            Al contratar un plan pago, el Usuario reconoce que ya tuvo la posibilidad de evaluar la plataforma durante la prueba gratuita. El uso continuado del servicio tras la publicación de nuevos precios implica aceptación de los mismos. Si no está de acuerdo, podrá cancelar su suscripción antes de la renovación, sin derecho a reembolso por períodos ya abonados.
                        </p>
                    </section>

                    {/* 5. Cancelación y reembolsos */}
                    <section className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="p-2 bg-red-50 rounded-lg text-red-600">
                                <AlertTriangle size={24} />
                            </div>
                            <h2 className="text-2xl font-bold text-gray-900">5. Cancelación y reembolsos</h2>
                        </div>
                        <ul className="space-y-3 text-gray-600 list-disc list-inside ml-2">
                            <li>El usuario puede cancelar desde la sección “Mi cuenta”.</li>
                            <li>Los cargos ya efectuados no son reembolsables, salvo lo previsto en el art. 34 de la Ley 24.240.</li>
                            <li>Los planes anuales son finales y no admiten cancelación anticipada con devolución proporcional.</li>
                            <li>El usuario es responsable de verificar sus medios de pago; Zeta Prop no responde por rechazos, débitos duplicados o inconvenientes ajenos.</li>
                        </ul>
                    </section>

                    {/* 6. Obligaciones del usuario */}
                    <section className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="p-2 bg-gray-100 rounded-lg text-gray-600">
                                <FileText size={24} />
                            </div>
                            <h2 className="text-2xl font-bold text-gray-900">6. Obligaciones del usuario</h2>
                        </div>
                        <p className="text-gray-600 mb-4">El usuario se compromete a:</p>
                        <ul className="space-y-2 text-gray-600 list-disc list-inside ml-2">
                            <li>a) No cargar contenido ilícito, ofensivo o que infrinja derechos de terceros.</li>
                            <li>b) Garantizar que cuenta con todos los derechos sobre la información cargada.</li>
                            <li>c) Mantener confidenciales sus credenciales y PIN.</li>
                            <li>d) Respetar los límites del plan contratado.</li>
                            <li>e) No utilizar la plataforma con fines fraudulentos ni realizar ingeniería inversa, copias, spiders, scraping, automatizaciones indebidas, reventa de accesos ni usos distintos a los autorizados.</li>
                        </ul>
                    </section>

                    {/* 7. Propiedad intelectual */}
                    <section className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="p-2 bg-purple-50 rounded-lg text-purple-600">
                                <Copyright size={24} />
                            </div>
                            <h2 className="text-2xl font-bold text-gray-900">7. Propiedad intelectual</h2>
                        </div>
                        <p className="text-gray-600">
                            Las marcas, el software y el diseño de Zeta Prop pertenecen a Zeta Prop. Se otorga una licencia no exclusiva, limitada, no sublicenciable y revocable mientras exista una suscripción activa.
                        </p>
                    </section>

                    {/* 8. Confidencialidad */}
                    <section className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="p-2 bg-green-50 rounded-lg text-green-600">
                                <Lock size={24} />
                            </div>
                            <h2 className="text-2xl font-bold text-gray-900">8. Confidencialidad</h2>
                        </div>
                        <p className="text-gray-600">
                            Toda información técnica, comercial o de seguridad a la que acceda el usuario en relación con Zeta Prop deberá ser considerada confidencial y no podrá divulgarse a terceros sin autorización expresa.
                        </p>
                    </section>

                    {/* 9. Disponibilidad y actualizaciones */}
                    <section className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="p-2 bg-orange-50 rounded-lg text-orange-600">
                                <RefreshCcw size={24} />
                            </div>
                            <h2 className="text-2xl font-bold text-gray-900">9. Disponibilidad y actualizaciones</h2>
                        </div>
                        <ul className="space-y-3 text-gray-600 list-disc list-inside ml-2">
                            <li>El servicio se presta “tal cual” y puede experimentar interrupciones o limitaciones, programadas o imprevistas.</li>
                            <li>Las actualizaciones, mejoras o nuevas funcionalidades podrán realizarse en cualquier momento sin necesidad de aviso previo y podrán variar según el plan contratado.</li>
                            <li>La ausencia de determinadas funciones no generará derecho a reclamo ni reembolso.</li>
                        </ul>
                    </section>

                    {/* 10. Datos personales */}
                    <section className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="p-2 bg-blue-50 rounded-lg text-blue-600">
                                <User size={24} />
                            </div>
                            <h2 className="text-2xl font-bold text-gray-900">10. Datos personales y tratamiento de la información</h2>
                        </div>
                        <p className="text-gray-600 mb-4">
                            El Usuario declara que es titular de los datos que ingresa en la plataforma y autoriza a Zeta Prop a tratarlos con la única finalidad de brindar el Servicio, de conformidad con lo previsto en la Ley 25.326 y normas complementarias.
                        </p>
                        <p className="text-gray-600 mb-4">
                            Zeta Prop no compartirá, cederá ni transferirá datos personales a terceros, salvo en los siguientes supuestos:
                        </p>
                        <ul className="space-y-2 text-gray-600 list-disc list-inside ml-2 mb-4">
                            <li>a) cuando sea necesario para la prestación del Servicio (ej. proveedores tecnológicos);</li>
                            <li>b) cuando exista obligación legal de hacerlo;</li>
                            <li>c) cuando medie autorización expresa del Usuario.</li>
                        </ul>
                        <p className="text-gray-600">
                            El Usuario podrá ejercer sus derechos de acceso, rectificación, actualización o supresión de datos conforme a la normativa vigente, contactando a facundo@zeta-prop.com.ar.
                        </p>
                    </section>

                    {/* 11. Acceso para soporte técnico */}
                    <section className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="p-2 bg-indigo-50 rounded-lg text-indigo-600">
                                <ShieldAlert size={24} />
                            </div>
                            <h2 className="text-2xl font-bold text-gray-900">11. Acceso para soporte técnico</h2>
                        </div>
                        <p className="text-gray-600 mb-4">
                            El Usuario reconoce y acepta que, en caso de requerir asistencia técnica o soporte, el equipo de Zeta Prop podrá acceder temporalmente a los datos y registros de su cuenta, única y exclusivamente con el fin de diagnosticar, resolver incidencias o brindar acompañamiento en el uso de la plataforma.
                        </p>
                        <p className="text-gray-600">
                            Dicho acceso será limitado a la finalidad mencionada, no implicará en ningún caso transmisión o cesión de los datos a terceros, y se realizará bajo las obligaciones de confidencialidad establecidas en estos TyC y en la Política de Privacidad.
                        </p>
                    </section>

                    {/* 12. Limitación de responsabilidad */}
                    <section className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="p-2 bg-red-50 rounded-lg text-red-600">
                                <AlertTriangle size={24} />
                            </div>
                            <h2 className="text-2xl font-bold text-gray-900">12. Limitación de responsabilidad</h2>
                        </div>
                        <p className="text-gray-600 mb-4">Salvo dolo o culpa grave, Zeta Prop no será responsable por:</p>
                        <ul className="space-y-2 text-gray-600 list-disc list-inside ml-2">
                            <li>Daños indirectos, lucro cesante o pérdida de datos.</li>
                            <li>Errores derivados de información incorrecta o incompleta cargada por el usuario.</li>
                            <li>Caídas, rechazos de pago o fallas de proveedores externos (ej. bancos, AFIP, WhatsApp).</li>
                            <li>Bugs, ataques informáticos, virus, congestión de internet o variaciones de rendimiento propias de servicios SaaS.</li>
                        </ul>
                    </section>

                    {/* 13. Indemnidad */}
                    <section className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="p-2 bg-blue-50 rounded-lg text-blue-600">
                                <CheckCircle size={24} />
                            </div>
                            <h2 className="text-2xl font-bold text-gray-900">13. Indemnidad</h2>
                        </div>
                        <p className="text-gray-600">
                            El usuario mantendrá indemne a Zeta Prop frente a reclamos de terceros por uso indebido de la plataforma o por la carga de datos sin legitimación.
                        </p>
                    </section>

                    {/* 14. Duración y baja de cuentas */}
                    <section className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="p-2 bg-gray-100 rounded-lg text-gray-600">
                                <Clock size={24} />
                            </div>
                            <h2 className="text-2xl font-bold text-gray-900">14. Duración y baja de cuentas</h2>
                        </div>
                        <ul className="space-y-3 text-gray-600 list-disc list-inside ml-2">
                            <li>La continuidad del servicio está sujeta al pago oportuno. La mora implica suspensión automática del acceso.</li>
                            <li>Zeta Prop podrá suspender o cancelar cuentas en caso de incumplimiento de los TyC o uso abusivo.</li>
                            <li>Los datos se conservarán hasta 60 días posteriores a la baja (por vencimiento, impago o cancelación). Transcurrido dicho plazo, podrán ser eliminados definitivamente.</li>
                        </ul>
                    </section>

                    {/* 15. Notificaciones */}
                    <section className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="p-2 bg-yellow-50 rounded-lg text-yellow-600">
                                <Bell size={24} />
                            </div>
                            <h2 className="text-2xl font-bold text-gray-900">15. Notificaciones</h2>
                        </div>
                        <p className="text-gray-600">
                            Toda notificación de Zeta Prop al usuario se considerará válida si se envía al correo electrónico registrado en la cuenta, entendiéndose recibida a las 24 horas del envío. El usuario es responsable de mantener su correo actualizado.
                        </p>
                    </section>

                    {/* 16. Resolución de conflictos */}
                    <section className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="p-2 bg-purple-50 rounded-lg text-purple-600">
                                <Gavel size={24} />
                            </div>
                            <h2 className="text-2xl font-bold text-gray-900">16. Resolución de conflictos</h2>
                        </div>
                        <p className="text-gray-600">
                            Las partes se someterán en primer término al Servicio de Conciliación Previa en las Relaciones de Consumo (COPREC). De no haber acuerdo, serán competentes los tribunales ordinarios de la Ciudad Autónoma de Buenos Aires.
                        </p>
                    </section>

                    {/* 17. Ley aplicable */}
                    <section className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="p-2 bg-indigo-50 rounded-lg text-indigo-600">
                                <Scale size={24} />
                            </div>
                            <h2 className="text-2xl font-bold text-gray-900">17. Ley aplicable</h2>
                        </div>
                        <p className="text-gray-600">
                            Estos TyC se rigen por la legislación argentina, incluidos el Código Civil y Comercial y la Ley 24.240.
                        </p>
                    </section>

                    {/* 18. Prescripción */}
                    <section className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="p-2 bg-orange-50 rounded-lg text-orange-600">
                                <Clock size={24} />
                            </div>
                            <h2 className="text-2xl font-bold text-gray-900">18. Prescripción</h2>
                        </div>
                        <p className="text-gray-600">
                            Toda acción o reclamo contra Zeta Prop deberá iniciarse dentro del plazo de 1 año contado desde el hecho generador, bajo pena de caducidad.
                        </p>
                    </section>

                    {/* 19. Modificaciones */}
                    <section className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="p-2 bg-green-50 rounded-lg text-green-600">
                                <RefreshCcw size={24} />
                            </div>
                            <h2 className="text-2xl font-bold text-gray-900">19. Modificaciones</h2>
                        </div>
                        <p className="text-gray-600">
                            Zeta Prop podrá modificar estos TyC en cualquier momento publicando los cambios en su plataforma. El uso continuado de la plataforma tras la publicación de modificaciones implica aceptación de los mismos.
                        </p>
                    </section>

                    {/* 20. Contacto */}
                    <section className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100 text-center">
                        <div className="flex items-center justify-center gap-3 mb-4">
                            <div className="p-2 bg-gray-100 rounded-lg text-gray-600">
                                <Mail size={20} />
                            </div>
                            <h2 className="text-xl font-bold text-gray-900">20. Contacto</h2>
                        </div>
                        <p className="text-gray-600 mb-4">
                            Para consultas, reclamos o ejercicio de derechos, el usuario puede escribir a:
                        </p>
                        <a href="mailto:facundo@zeta-prop.com.ar" className="text-indigo-600 font-bold text-sm hover:underline">
                            facundo@zeta-prop.com.ar
                        </a>
                    </section>

                </div>
            </div>
        </div>
    );
}
