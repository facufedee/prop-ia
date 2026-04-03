import { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import { Linkedin, Target, Lightbulb, Zap, Shield, Users, TrendingUp } from 'lucide-react';

export const metadata: Metadata = {
    title: 'Nosotros | Zeta Prop',
    description: 'Conocé al equipo detrás de Zeta Prop. Construimos el CRM inmobiliario más completo de Argentina para que las inmobiliarias crezcan sin fricciones.',
    alternates: {
        canonical: 'https://zetaprop.com.ar/nosotros',
    },
};

export default function AboutPage() {
    return (
        <div className="bg-white font-sans text-gray-900">

            {/* ── Hero ── */}
            <section className="relative overflow-hidden pt-32 pb-24 px-5 sm:px-6 bg-[#080810]">
                <div className="absolute inset-0 bg-gradient-to-br from-indigo-950/80 via-[#080810] to-purple-950/60 pointer-events-none" />
                <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-indigo-600/10 rounded-full blur-3xl pointer-events-none" />
                <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-purple-600/10 rounded-full blur-3xl pointer-events-none" />

                <div className="max-w-4xl mx-auto text-center relative z-10">
                    <div className="inline-block px-4 py-1.5 bg-indigo-500/20 border border-indigo-500/30 text-indigo-300 rounded-full text-sm font-semibold mb-6">
                        Sobre Nosotros
                    </div>
                    <h1 className="text-4xl md:text-6xl font-extrabold mb-6 leading-tight text-white">
                        Construimos el CRM que las
                        <span className="block text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-400">
                            inmobiliarias argentinas merecen
                        </span>
                    </h1>
                    <p className="text-xl text-gray-400 max-w-2xl mx-auto leading-relaxed">
                        Nacimos para eliminar el Excel, los cuadernos y los recordatorios en papel. Hoy ayudamos a inmobiliarias de todo el país a operar con más orden, más velocidad y más profesionalismo.
                    </p>
                </div>
            </section>

            {/* ── Historia / Por qué existimos ── */}
            <section className="py-20 px-5 sm:px-6 border-b border-gray-100">
                <div className="max-w-3xl mx-auto">
                    <span className="text-xs font-bold text-indigo-600 uppercase tracking-widest">Nuestra historia</span>
                    <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mt-3 mb-6 leading-tight">
                        Todo empezó con una planilla de Excel que se cayó
                    </h2>
                    <div className="space-y-5 text-gray-600 text-lg leading-relaxed">
                        <p>
                            Trabajando junto a inmobiliarias vimos de cerca un problema que se repetía: contratos en papel, pagos anotados a mano, liquidaciones calculadas en Excel y clientes perdidos por falta de seguimiento. El sector tenía mucho potencial y muy poca tecnología.
                        </p>
                        <p>
                            Creamos Zeta Prop para cambiar eso. No con una herramienta genérica adaptada a la fuerza, sino con un sistema pensado desde cero para la realidad inmobiliaria argentina: contratos con ajuste ICL, punitorios automáticos, portal del inquilino, CRM de clientes y gestión financiera en un solo lugar.
                        </p>
                        <p>
                            Hoy crecemos junto a las inmobiliarias que confían en nosotros, escuchando cada sugerencia y mejorando la plataforma semana a semana.
                        </p>
                    </div>
                </div>
            </section>

            {/* ── Misión y Visión ── */}
            <section className="py-20 px-5 sm:px-6 bg-gray-50/50 border-b border-gray-100">
                <div className="max-w-5xl mx-auto grid md:grid-cols-2 gap-8">
                    <div className="bg-white p-8 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
                        <div className="w-12 h-12 bg-indigo-100 rounded-xl flex items-center justify-center text-indigo-600 mb-6">
                            <Target size={24} />
                        </div>
                        <h2 className="text-2xl font-bold mb-4">Nuestra Misión</h2>
                        <p className="text-gray-600 leading-relaxed">
                            Darle a cada inmobiliaria, sin importar su tamaño, las herramientas que antes solo tenían las grandes: automatización, datos en tiempo real y una experiencia profesional para sus clientes. Sin complicaciones, sin costos ocultos.
                        </p>
                    </div>
                    <div className="bg-white p-8 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
                        <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center text-purple-600 mb-6">
                            <Lightbulb size={24} />
                        </div>
                        <h2 className="text-2xl font-bold mb-4">Nuestra Visión</h2>
                        <p className="text-gray-600 leading-relaxed">
                            Ser la plataforma de referencia para inmobiliarias en Argentina y Latinoamérica. Un ecosistema donde la tecnología se encarga de lo administrativo y los profesionales pueden enfocarse en lo que realmente importa: las personas.
                        </p>
                    </div>
                </div>
            </section>

            {/* ── Valores ── */}
            <section className="py-20 px-5 sm:px-6 border-b border-gray-100">
                <div className="max-w-5xl mx-auto">
                    <div className="text-center mb-14">
                        <span className="text-xs font-bold text-indigo-600 uppercase tracking-widest">Cómo trabajamos</span>
                        <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mt-3">Nuestros valores</h2>
                    </div>
                    <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
                        {[
                            {
                                icon: Zap,
                                color: "bg-yellow-100 text-yellow-600",
                                title: "Velocidad",
                                desc: "Cada semana hay mejoras. Escuchamos a los usuarios y actualizamos la plataforma de forma constante."
                            },
                            {
                                icon: Shield,
                                color: "bg-green-100 text-green-600",
                                title: "Confianza",
                                desc: "La información de nuestros clientes es sagrada. Infraestructura segura y backups automáticos."
                            },
                            {
                                icon: Users,
                                color: "bg-indigo-100 text-indigo-600",
                                title: "Cercanía",
                                desc: "No somos una empresa anónima. Somos accesibles, respondemos rápido y tomamos cada feedback en serio."
                            },
                            {
                                icon: TrendingUp,
                                color: "bg-purple-100 text-purple-600",
                                title: "Crecimiento",
                                desc: "Queremos que cada inmobiliaria que usa Zeta Prop opere mejor, cierre más y pierda menos tiempo."
                            },
                        ].map(({ icon: Icon, color, title, desc }) => (
                            <div key={title} className="bg-white rounded-2xl border border-gray-100 p-6 hover:shadow-md transition-shadow">
                                <div className={`w-11 h-11 rounded-xl flex items-center justify-center mb-4 ${color}`}>
                                    <Icon size={22} />
                                </div>
                                <h3 className="font-bold text-gray-900 mb-2">{title}</h3>
                                <p className="text-sm text-gray-500 leading-relaxed">{desc}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ── Equipo ── */}
            <section className="py-20 px-5 sm:px-6 bg-gray-50/50 border-b border-gray-100">
                <div className="max-w-3xl mx-auto">
                    <div className="text-center mb-14">
                        <span className="text-xs font-bold text-indigo-600 uppercase tracking-widest">El equipo</span>
                        <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mt-3">Las personas detrás de Zeta Prop</h2>
                        <p className="text-gray-500 mt-3 max-w-xl mx-auto">
                            Un equipo chico con foco en construir algo grande para el sector inmobiliario argentino.
                        </p>
                    </div>

                    <div className="grid md:grid-cols-2 gap-8">
                        {/* Facundo */}
                        <div className="bg-white rounded-2xl overflow-hidden border border-gray-100 shadow-sm hover:-translate-y-1 transition-transform duration-300">
                            <div className="h-28 bg-gradient-to-r from-indigo-500 to-blue-500" />
                            <div className="px-8 pb-8 -mt-12 text-center">
                                <div className="w-24 h-24 relative bg-white rounded-full p-1 mx-auto shadow-md mb-4 overflow-hidden">
                                    <Image
                                        src="/assets/img/facundo.jpg"
                                        alt="Facundo Flores"
                                        fill
                                        className="rounded-full object-cover p-1"
                                        sizes="96px"
                                        loading="lazy"
                                    />
                                </div>
                                <h3 className="text-xl font-bold text-gray-900">Facundo Flores</h3>
                                <p className="text-indigo-600 font-medium text-sm mb-3">CEO & Fundador</p>
                                <p className="text-gray-500 text-sm mb-5 leading-relaxed">
                                    Ingeniero en Sistemas con experiencia en startups de tecnología. Lidera la estrategia, el producto y la visión de Zeta Prop.
                                </p>
                                <a
                                    href="https://www.linkedin.com/in/floreszamoranofacundo/"
                                    target="_blank" rel="noopener noreferrer"
                                    className="inline-flex items-center gap-2 text-gray-600 hover:text-blue-600 bg-gray-50 hover:bg-blue-50 px-4 py-2 rounded-full text-sm font-medium transition-colors"
                                >
                                    <Linkedin size={15} />
                                    LinkedIn
                                </a>
                            </div>
                        </div>

                        {/* Nahuel */}
                        <div className="bg-white rounded-2xl overflow-hidden border border-gray-100 shadow-sm hover:-translate-y-1 transition-transform duration-300">
                            <div className="h-28 bg-gradient-to-r from-purple-500 to-pink-500" />
                            <div className="px-8 pb-8 -mt-12 text-center">
                                <div className="w-24 h-24 relative bg-white rounded-full p-1 mx-auto shadow-md mb-4 overflow-hidden">
                                    <Image
                                        src="/assets/img/nahuel.jpg"
                                        alt="Nahuel Serrano"
                                        fill
                                        className="rounded-full object-cover p-1"
                                        sizes="96px"
                                        loading="lazy"
                                    />
                                </div>
                                <h3 className="text-xl font-bold text-gray-900">Nahuel Serrano</h3>
                                <p className="text-purple-600 font-medium text-sm mb-3">CTO</p>
                                <p className="text-gray-500 text-sm mb-5 leading-relaxed">
                                    El arquitecto de la infraestructura tecnológica. Garantiza que la plataforma sea robusta, rápida y segura para cada usuario.
                                </p>
                                <a
                                    href="https://www.linkedin.com/in/nahuelserrano/"
                                    target="_blank" rel="noopener noreferrer"
                                    className="inline-flex items-center gap-2 text-gray-600 hover:text-blue-600 bg-gray-50 hover:bg-blue-50 px-4 py-2 rounded-full text-sm font-medium transition-colors"
                                >
                                    <Linkedin size={15} />
                                    LinkedIn
                                </a>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* ── CTA Final ── */}
            <section className="py-20 px-5 sm:px-6 bg-[#080810] text-center relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-indigo-950/60 to-purple-950/40 pointer-events-none" />
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-indigo-600/10 rounded-full blur-3xl pointer-events-none" />
                <div className="relative z-10 max-w-2xl mx-auto">
                    <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
                        ¿Querés ser parte del cambio?
                    </h2>
                    <p className="text-gray-400 mb-8 text-lg">
                        Sumate a las inmobiliarias que ya gestionan su negocio con Zeta Prop.
                    </p>
                    <div className="flex flex-col sm:flex-row gap-4 justify-center">
                        <Link
                            href="/register"
                            className="px-8 py-3.5 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-xl transition-colors shadow-lg shadow-indigo-500/20"
                        >
                            Comenzar gratis
                        </Link>
                        <Link
                            href="/contacto"
                            className="px-8 py-3.5 border border-white/20 text-white/80 hover:bg-white/10 font-semibold rounded-xl transition-colors"
                        >
                            Hablar con el equipo
                        </Link>
                    </div>
                </div>
            </section>

        </div>
    );
}
