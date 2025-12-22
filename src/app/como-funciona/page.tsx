import React from 'react';
import Link from 'next/link';
import { CheckCircle2, Zap, BarChart3, Users, Search, FileText, Calculator, Receipt, CreditCard, Mail } from 'lucide-react';

export default function HowItWorksPage() {
    return (
        <div className="min-h-screen bg-gray-50 font-sans text-gray-900">


            {/* Hero Section */}
            <header className="pt-32 pb-16 px-6 text-center max-w-5xl mx-auto">
                <div className="inline-block px-4 py-1.5 bg-indigo-50 text-indigo-700 rounded-full text-sm font-semibold mb-6">
                    Gestión Integral Inmobiliaria
                </div>
                <h1 className="text-4xl md:text-5xl font-extrabold text-gray-900 mb-6 leading-tight">
                    Funciones para tu <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600">Inmobiliaria</span>
                </h1>
                <p className="text-lg text-gray-600 mb-10 max-w-3xl mx-auto">
                    Centralizamos inquilinos, propiedades y contratos, automatizando tareas como la emisión de recibos, cálculo de punitorios, liquidaciones y facturación electrónica.
                    <br /> <br />
                    <span className="font-semibold text-gray-800">Clientes, Agentes y Tasadores también pueden publicar y gestionar sus propiedades.</span>
                </p>

                <div className="flex justify-center gap-4">
                    <Link href="/login" className="bg-indigo-600 text-white px-8 py-3 rounded-full font-semibold hover:bg-indigo-700 transition shadow-lg hover:shadow-xl">
                        Solicitar Demostración
                    </Link>
                </div>
            </header>

            {/* Detailed Features Grid */}
            <section className="px-6 pb-24 max-w-7xl mx-auto">
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">

                    {/* Buscador Inteligente */}
                    <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-all duration-300">
                        <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center text-blue-600 mb-6">
                            <Search size={24} />
                        </div>
                        <h3 className="text-xl font-bold mb-3 text-gray-900">Buscador inteligente</h3>
                        <p className="text-gray-600 text-sm leading-relaxed">
                            Encuentre la carpeta con solo teclear 2 letras del apellido del inquilino, propietario o dirección de la propiedad.
                        </p>
                    </div>

                    {/* Carga simple */}
                    <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-all duration-300">
                        <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center text-green-600 mb-6">
                            <FileText size={24} />
                        </div>
                        <h3 className="text-xl font-bold mb-3 text-gray-900">Carga simple de contratos</h3>
                        <p className="text-gray-600 text-sm leading-relaxed">
                            Solo deberá completar dirección de la propiedad, propietario con honorario, inquilino con punitorio y para finalizar el importe de alquiler.
                        </p>
                    </div>

                    {/* Emisión de recibos */}
                    <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-all duration-300">
                        <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center text-purple-600 mb-6">
                            <Receipt size={24} />
                        </div>
                        <h3 className="text-xl font-bold mb-3 text-gray-900">Emisión de recibos</h3>
                        <p className="text-gray-600 text-sm leading-relaxed">
                            Genere recibos con punitorios calculados automáticamente, comprobantes de servicios entregados, conceptos extras, notificaciones y más.
                        </p>
                    </div>

                    {/* Emisión de liquidaciones */}
                    <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-all duration-300">
                        <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center text-orange-600 mb-6">
                            <BarChart3 size={24} />
                        </div>
                        <h3 className="text-xl font-bold mb-3 text-gray-900">Liquidaciones a Propietarios</h3>
                        <p className="text-gray-600 text-sm leading-relaxed">
                            Emita liquidaciones con los honorarios calculados de forma automática. Además, puede adelantar las liquidaciones cuando lo necesite.
                        </p>
                    </div>

                    {/* Cálculo de punitorios */}
                    <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-all duration-300">
                        <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center text-red-600 mb-6">
                            <Calculator size={24} />
                        </div>
                        <h3 className="text-xl font-bold mb-3 text-gray-900">Cálculo de punitorios</h3>
                        <p className="text-gray-600 text-sm leading-relaxed">
                            Indique la fecha de primer día de pago y días de gracia para que el sistema calcule automáticamente los punitorios (porcentaje o monto fijo).
                        </p>
                    </div>

                    {/* Cálculo de honorarios */}
                    <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-all duration-300">
                        <div className="w-12 h-12 bg-teal-100 rounded-xl flex items-center justify-center text-teal-600 mb-6">
                            <CreditCard size={24} />
                        </div>
                        <h3 className="text-xl font-bold mb-3 text-gray-900">Cálculo de honorarios</h3>
                        <p className="text-gray-600 text-sm leading-relaxed">
                            El software calculará los honorarios en base a un porcentaje o monto fijo. La comisión quedará registrada en el detalle de movimientos.
                        </p>
                    </div>

                    {/* Facturación electrónica */}
                    <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-all duration-300">
                        <div className="w-12 h-12 bg-indigo-100 rounded-xl flex items-center justify-center text-indigo-600 mb-6">
                            <Zap size={24} />
                        </div>
                        <h3 className="text-xl font-bold mb-3 text-gray-900">Facturación electrónica</h3>
                        <p className="text-gray-600 text-sm leading-relaxed">
                            Conexión directa con AFIP para emitir comprobantes electrónicos sin necesidad de acceder al sitio web del organismo.
                        </p>
                    </div>

                    {/* Comunicación */}
                    <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-all duration-300">
                        <div className="w-12 h-12 bg-pink-100 rounded-xl flex items-center justify-center text-pink-600 mb-6">
                            <Mail size={24} />
                        </div>
                        <h3 className="text-xl font-bold mb-3 text-gray-900">Comunicación Masiva</h3>
                        <p className="text-gray-600 text-sm leading-relaxed">
                            Envie mensajes masivos a clientes mediante WhatsApp o imprima avisos en todos los recibos. Alertas automáticas de liquidación disponible.
                        </p>
                    </div>

                    {/* Control de caja */}
                    <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-all duration-300">
                        <div className="w-12 h-12 bg-yellow-100 rounded-xl flex items-center justify-center text-yellow-600 mb-6">
                            <BarChart3 size={24} />
                        </div>
                        <h3 className="text-xl font-bold mb-3 text-gray-900">Control de caja y Reportes</h3>
                        <p className="text-gray-600 text-sm leading-relaxed">
                            Control de ingresos y egresos. Reportes de morosos, vencimientos de contratos y proyecciones de cobro.
                        </p>
                    </div>

                </div>
            </section>

            {/* Technological Advantages Section */}
            <section className="py-20 px-6 bg-white overflow-hidden relative">
                <div className="absolute top-0 right-0 w-1/2 h-full bg-gradient-to-l from-indigo-50 to-transparent pointer-events-none" />
                <div className="max-w-7xl mx-auto relative z-10">
                    <div className="text-center mb-16">
                        <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6">Tecnología de Punta</h2>
                        <p className="text-lg text-gray-600 max-w-3xl mx-auto">
                            Prop-IA está construido con las últimas tecnologías web para garantizar velocidad, seguridad y disponibilidad total.
                        </p>
                    </div>

                    <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
                        {/* Advantage 1 */}
                        <div className="text-center p-6 rounded-2xl hover:bg-gray-50 transition-colors">
                            <div className="w-16 h-16 bg-blue-100 rounded-2xl flex items-center justify-center text-blue-600 mx-auto mb-6">
                                <Zap size={32} />
                            </div>
                            <h3 className="text-xl font-bold mb-3 text-gray-900">100% Web</h3>
                            <p className="text-gray-600 text-sm">
                                Olvídate de instalaciones complejas. Accede desde cualquier navegador, en cualquier computadora o tablet.
                            </p>
                        </div>

                        {/* Advantage 2 */}
                        <div className="text-center p-6 rounded-2xl hover:bg-gray-50 transition-colors">
                            <div className="w-16 h-16 bg-purple-100 rounded-2xl flex items-center justify-center text-purple-600 mx-auto mb-6">
                                <CheckCircle2 size={32} />
                            </div>
                            <h3 className="text-xl font-bold mb-3 text-gray-900">Interfaz Moderna</h3>
                            <p className="text-gray-600 text-sm">
                                Diseño intuitivo, limpio y fácil de usar. Curva de aprendizaje mínima para todo tu equipo.
                            </p>
                        </div>

                        {/* Advantage 3 */}
                        <div className="text-center p-6 rounded-2xl hover:bg-gray-50 transition-colors">
                            <div className="w-16 h-16 bg-indigo-100 rounded-2xl flex items-center justify-center text-indigo-600 mx-auto mb-6">
                                <Users size={32} />
                            </div>
                            <h3 className="text-xl font-bold mb-3 text-gray-900">Multi-Dispositivo</h3>
                            <p className="text-gray-600 text-sm">
                                Gestiona tu inmobiliaria desde la oficina o mientras muestras una propiedad desde tu celular.
                            </p>
                        </div>

                        {/* Advantage 4 */}
                        <div className="text-center p-6 rounded-2xl hover:bg-gray-50 transition-colors">
                            <div className="w-16 h-16 bg-pink-100 rounded-2xl flex items-center justify-center text-pink-600 mx-auto mb-6">
                                <BarChart3 size={32} />
                            </div>
                            <h3 className="text-xl font-bold mb-3 text-gray-900">IA Integrada</h3>
                            <p className="text-gray-600 text-sm">
                                Inteligencia Artificial presente en cada proceso para optimizar tiempos y mejorar la toma de decisiones.
                            </p>
                        </div>
                    </div>
                </div>
            </section>

            {/* Roles Section */}
            <section className="bg-gray-900 py-20 px-6 text-white">
                <div className="max-w-7xl mx-auto text-center">
                    <h2 className="text-3xl md:text-4xl font-bold mb-12">Un ecosistema para todos</h2>
                    <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
                        <div className="bg-gray-800 p-6 rounded-2xl border border-gray-700">
                            <div className="text-indigo-400 font-bold text-xl mb-4">Clientes</div>
                            <p className="text-gray-400 text-sm">
                                Acceso a portal de autogestión para ver propiedades, estado de contratos y realizar pagos.
                            </p>
                        </div>
                        <div className="bg-gray-800 p-6 rounded-2xl border border-gray-700">
                            <div className="text-purple-400 font-bold text-xl mb-4">Agentes</div>
                            <p className="text-gray-400 text-sm">
                                Herramientas móviles para captación, gestión de leads y agenda de visitas integrada.
                            </p>
                        </div>
                        <div className="bg-gray-800 p-6 rounded-2xl border border-gray-700">
                            <div className="text-green-400 font-bold text-xl mb-4">Tasadores</div>
                            <p className="text-gray-400 text-sm">
                                Módulos específicos para realizar tasaciones profesionales y comparativas de mercado.
                            </p>
                        </div>
                    </div>
                </div>
            </section>

            {/* CTA Section */}
            <section className="bg-indigo-600 py-20 px-6 text-white text-center">
                <div className="max-w-3xl mx-auto">
                    <h2 className="text-3xl font-bold mb-6">Reducí los tiempos de administración</h2>
                    <p className="text-indigo-100 text-lg mb-8">
                        Optimizá los procesos en tu inmobiliaria y probá todas las funciones del sistema de administración de alquileres.
                    </p>
                    <Link href="/register" className="bg-white text-indigo-600 px-8 py-3 rounded-full font-bold hover:bg-gray-100 transition shadow-lg">
                        Comenzar Gratis
                    </Link>
                </div>
            </section>

            {/* Footer */}
            <footer className="bg-white border-t border-gray-200 py-12 px-6 text-center text-gray-500 text-sm">
                <p>&copy; {new Date().getFullYear()} Prop-IA. Todos los derechos reservados.</p>
            </footer>
        </div>
    );
}
