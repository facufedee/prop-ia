import Link from 'next/link';
import { Bot, LineChart, Globe, Zap, Users, Building2, BrainCircuit, Share2, Receipt } from 'lucide-react';

export const metadata = {
    title: "Servicios | CRM Inmobiliario | Gestión de Propiedades | Alquileres | Compra y Venta | Zeta Prop",
    description: "Servicios inmobiliarios potenciados con IA. Tasaciones automáticas, gestión de alquileres, CRM para agentes y red inmobiliaria federal.",
};

export default function ServicesPage() {
    return (
        <div className="bg-white font-sans text-gray-900">

            {/* Hero Section */}
            <header className="pt-32 pb-16 px-6 text-center max-w-5xl mx-auto">
                <div className="inline-block px-4 py-1.5 bg-indigo-50 text-indigo-700 rounded-full text-sm font-semibold mb-6">
                    Nuestros Servicios
                </div>
                <h1 className="text-4xl md:text-6xl font-extrabold text-gray-900 mb-6 leading-tight">
                    Una plataforma integral impulsada por <br />
                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600">Inteligencia Artificial</span>
                </h1>
                <p className="text-xl text-gray-600 mb-10 max-w-3xl mx-auto">
                    Desde la tasación automática hasta la gestión de contratos y la publicación en red. Todo lo que tu inmobiliaria necesita para escalar en 2025.
                </p>

                <div className="flex justify-center gap-4">
                    <Link href="/register" className="bg-indigo-600 text-white px-8 py-4 rounded-xl font-bold hover:bg-indigo-700 transition shadow-lg hover:shadow-indigo-200 transform hover:-translate-y-1">
                        Probar Gratis
                    </Link>
                </div>
            </header>

            {/* Feature 1: AI */}
            <section className="py-20 px-6">
                <div className="max-w-7xl mx-auto grid md:grid-cols-2 gap-12 items-center">
                    <div className="relative order-2 md:order-1">
                        <div className="absolute inset-0 bg-gradient-to-tr from-indigo-100 to-purple-100 rounded-3xl transform rotate-3 scale-95 opacity-70"></div>
                        <div className="relative bg-gray-900 rounded-3xl p-8 shadow-2xl border border-gray-800">
                            {/* Mock UI */}
                            <div className="flex items-center gap-3 mb-6 border-b border-gray-800 pb-4">
                                <div className="w-3 h-3 rounded-full bg-red-500"></div>
                                <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                                <div className="w-3 h-3 rounded-full bg-green-500"></div>
                                <span className="text-xs text-gray-500 ml-2">Tasación.exe</span>
                            </div>
                            <div className="space-y-4 font-mono text-sm">
                                <div className="text-green-400">$ Analizando mercado...</div>
                                <div className="text-gray-400"> Comparables encontrados: 1,245</div>
                                <div className="text-gray-400"> Ajustando por inflación y zona...</div>
                                <div className="text-white bg-gray-800 p-3 rounded border-l-2 border-green-500">
                                    Valor estimado: <span className="text-green-400 font-bold">USD 145,000</span>
                                    <div className="text-xs text-gray-500 mt-1">Confianza: 98.5%</div>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="order-1 md:order-2">
                        <div className="w-14 h-14 bg-indigo-100 rounded-xl flex items-center justify-center text-indigo-600 mb-6">
                            <BrainCircuit size={32} />
                        </div>
                        <h2 className="text-3xl md:text-4xl font-bold mb-6">Tasaciones Precisas en Segundos</h2>
                        <p className="text-lg text-gray-600 mb-6 leading-relaxed">
                            No pierdas días analizando comparables manualmente. Nuestro algoritmo de IA procesa miles de datos del mercado argentino en tiempo real para darte una valuación justa y competitiva al instante.
                        </p>
                        <ul className="space-y-3">
                            <li className="flex items-center text-gray-700">
                                <CheckCircle className="w-5 h-5 text-green-500 mr-3" />
                                Análisis de tendencias de zona
                            </li>
                            <li className="flex items-center text-gray-700">
                                <CheckCircle className="w-5 h-5 text-green-500 mr-3" />
                                Ajuste por amenidades y estado
                            </li>
                            <li className="flex items-center text-gray-700">
                                <CheckCircle className="w-5 h-5 text-green-500 mr-3" />
                                Reportes PDF profesionales con tu marca
                            </li>
                        </ul>
                    </div>
                </div>
            </section>

            {/* Feature 2: Alquileres */}
            <section className="py-20 px-6 bg-gray-50">
                <div className="max-w-7xl mx-auto grid md:grid-cols-2 gap-12 items-center">
                    <div>
                        <div className="w-14 h-14 bg-blue-100 rounded-xl flex items-center justify-center text-blue-600 mb-6">
                            <Receipt size={32} />
                        </div>
                        <h2 className="text-3xl md:text-4xl font-bold mb-6">Administración de Alquileres</h2>
                        <p className="text-lg text-gray-600 mb-6 leading-relaxed">
                            Nuestra solución más robusta. Automatiza el ciclo completo del alquiler: desde la firma del contrato hasta la liquidación al propietario.
                        </p>
                        <div className="grid sm:grid-cols-2 gap-4">
                            <ul className="space-y-3">
                                <li className="flex items-center text-gray-700">
                                    <CheckCircle className="w-5 h-5 text-blue-500 mr-3 flex-shrink-0" />
                                    <span>Emisión automática de recibos</span>
                                </li>
                                <li className="flex items-center text-gray-700">
                                    <CheckCircle className="w-5 h-5 text-blue-500 mr-3 flex-shrink-0" />
                                    <span>Cálculo de punitorios</span>
                                </li>
                                <li className="flex items-center text-gray-700">
                                    <CheckCircle className="w-5 h-5 text-blue-500 mr-3 flex-shrink-0" />
                                    <span>Control de caja y morosos</span>
                                </li>
                            </ul>
                            <ul className="space-y-3">
                                <li className="flex items-center text-gray-700">
                                    <CheckCircle className="w-5 h-5 text-blue-500 mr-3 flex-shrink-0" />
                                    <span>Liquidaciones a propietarios</span>
                                </li>
                                <li className="flex items-center text-gray-700">
                                    <CheckCircle className="w-5 h-5 text-blue-500 mr-3 flex-shrink-0" />
                                    <span>Ajustes por inflación (ICL/CAC)</span>
                                </li>
                                <li className="flex items-center text-gray-700">
                                    <CheckCircle className="w-5 h-5 text-blue-500 mr-3 flex-shrink-0" />
                                    <span>Facturación electrónica AFIP</span>
                                </li>
                            </ul>
                        </div>
                    </div>
                    <div className="relative">
                        {/* Abstract Shape */}
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120%] h-[120%] bg-blue-200/20 rounded-full blur-3xl"></div>
                        <div className="relative bg-white p-6 rounded-2xl shadow-xl border border-gray-100">
                            {/* Mock Receipt/Liquidacion */}
                            <div className="flex justify-between items-center mb-6 border-b border-gray-100 pb-4">
                                <div>
                                    <div className="text-xs text-gray-500 uppercase font-bold">Liquidación #1245</div>
                                    <div className="text-sm font-medium">Propietario: Roberto Gómez</div>
                                </div>
                                <div className="text-right">
                                    <div className="text-xs text-green-600 bg-green-50 px-2 py-1 rounded-full font-bold">PAGADO</div>
                                </div>
                            </div>
                            <div className="space-y-3 text-sm">
                                <div className="flex justify-between">
                                    <span className="text-gray-600">Alquiler (Enero)</span>
                                    <span className="font-medium">$ 450.000</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-600">Honorarios (5%)</span>
                                    <span className="text-red-500">- $ 22.500</span>
                                </div>
                                <div className="flex justify-between border-t border-gray-100 pt-2 mt-2">
                                    <span className="font-bold text-gray-900">Total a Transferir</span>
                                    <span className="font-bold text-indigo-600 text-lg">$ 427.500</span>
                                </div>
                            </div>
                            <div className="mt-6 flex gap-2">
                                <button className="flex-1 bg-indigo-600 text-white text-xs py-2 rounded-lg font-medium hover:bg-indigo-700">Enviar Comprobante</button>
                                <button className="flex-1 bg-gray-100 text-gray-600 text-xs py-2 rounded-lg font-medium hover:bg-gray-200">Ver Detalles</button>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Feature 3: Red */}
            <section className="py-20 px-6">
                <div className="max-w-7xl mx-auto grid md:grid-cols-2 gap-12 items-center">
                    <div className="order-2 md:order-1 relative">
                        <div className="absolute inset-0 bg-gradient-to-br from-orange-100 to-pink-100 rounded-3xl transform -rotate-2 scale-95 opacity-70"></div>
                        <div className="relative bg-white rounded-3xl p-8 shadow-xl border border-gray-100 grid grid-cols-2 gap-4">
                            {[1, 2, 3, 4].map(i => (
                                <div key={i} className="bg-gray-50 p-4 rounded-xl flex flex-col items-center text-center">
                                    <Building2 className="w-8 h-8 text-indigo-400 mb-2" />
                                    <div className="h-3 w-16 bg-gray-200 rounded"></div>
                                </div>
                            ))}
                        </div>
                    </div>
                    <div className="order-1 md:order-2">
                        <div className="w-14 h-14 bg-orange-100 rounded-xl flex items-center justify-center text-orange-600 mb-6">
                            <Globe size={32} />
                        </div>
                        <h2 className="text-3xl md:text-4xl font-bold mb-6">Red Inmobiliaria Federal</h2>
                        <p className="text-lg text-gray-600 mb-6 leading-relaxed">
                            No estás solo. Únete a la red colaborativa más grande del país. Comparte propiedades, genera operaciones compartidas y expande tu cartera sin límites.
                        </p>
                        <ul className="space-y-3">
                            <li className="flex items-center text-gray-700">
                                <CheckCircle className="w-5 h-5 text-orange-500 mr-3" />
                                Publicación simultánea en la red
                            </li>
                            <li className="flex items-center text-gray-700">
                                <CheckCircle className="w-5 h-5 text-orange-500 mr-3" />
                                Sistema de referidos
                            </li>
                            <li className="flex items-center text-gray-700">
                                <CheckCircle className="w-5 h-5 text-orange-500 mr-3" />
                                Marca blanca para compartir fichas
                            </li>
                        </ul>
                    </div>
                </div>
            </section>

            {/* CTA */}
            <section className="bg-gray-900 py-24 px-6 text-white text-center rounded-t-[3rem]">
                <div className="max-w-3xl mx-auto">
                    <h2 className="text-3xl md:text-5xl font-bold mb-6">El futuro es hoy</h2>
                    <p className="text-gray-400 text-xl mb-10">
                        Deja que la IA haga el trabajo pesado mientras vos te enfocas en cerrar tratos.
                    </p>
                    <Link href="/register" className="inline-flex items-center bg-white text-gray-900 px-8 py-4 rounded-xl font-bold hover:bg-indigo-50 transition transform hover:scale-105">
                        <Zap className="w-5 h-5 mr-2 text-yellow-500" />
                        Crear Cuenta Gratis
                    </Link>
                </div>
            </section>

        </div>
    );
}

// Icon helper
function CheckCircle({ className }: { className: string }) {
    return (
        <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
        </svg>
    )
}
