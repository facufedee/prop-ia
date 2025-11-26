import { Brain, Database, Zap, ArrowRight, TrendingUp, ShieldCheck } from "lucide-react";
import Link from "next/link";

export function HowItWorks() {
    const steps = [
        {
            icon: <Database className="w-8 h-8 text-blue-600" />,
            title: "1. Recolección de Datos",
            desc: "Nuestro sistema procesa miles de propiedades en tiempo real, analizando precios, ubicaciones y características del mercado en toda Argentina."
        },
        {
            icon: <Brain className="w-8 h-8 text-purple-600" />,
            title: "2. Análisis con IA",
            desc: "Utilizamos algoritmos de Machine Learning para identificar patrones complejos y correlaciones que escapan al ojo humano."
        },
        {
            icon: <Zap className="w-8 h-8 text-yellow-500" />,
            title: "3. Tasación Instantánea",
            desc: "Obtené una valoración precisa en segundos, respaldada por datos reales y tendencias de mercado actualizadas."
        },
    ];

    return (
        <section id="como-funciona" className="py-24 bg-gray-50 px-6 scroll-mt-20">
            <div className="max-w-6xl mx-auto">
                <div className="text-center mb-16">
                    <h2 className="text-4xl font-bold text-gray-900 mb-4">¿Cómo funciona PROP-IA?</h2>
                    <p className="text-xl text-gray-600 max-w-2xl mx-auto">
                        Combinamos Big Data con Inteligencia Artificial avanzada para ofrecerte las tasaciones más precisas del mercado.
                    </p>
                </div>

                {/* Steps Grid */}
                <div className="grid md:grid-cols-3 gap-8 mb-20">
                    {steps.map((s, i) => (
                        <div key={i} className="bg-white p-8 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
                            <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                                {s.icon}
                            </div>
                            <div className="mb-6 p-3 bg-gray-50 rounded-xl w-fit group-hover:scale-110 transition-transform duration-300">
                                {s.icon}
                            </div>
                            <h3 className="text-xl font-bold mb-3 text-gray-900">{s.title}</h3>
                            <p className="text-gray-600 leading-relaxed">{s.desc}</p>
                        </div>
                    ))}
                </div>

                {/* AI Tech Explanation - Marketing Friendly */}
                <div className="bg-black rounded-3xl p-8 md:p-12 text-white overflow-hidden relative">
                    {/* Background Effects */}
                    <div className="absolute top-0 right-0 w-96 h-96 bg-purple-600 rounded-full blur-[120px] opacity-20 translate-x-1/2 -translate-y-1/2"></div>
                    <div className="absolute bottom-0 left-0 w-96 h-96 bg-blue-600 rounded-full blur-[120px] opacity-20 -translate-x-1/2 translate-y-1/2"></div>

                    <div className="relative z-10 grid md:grid-cols-2 gap-12 items-center">
                        <div>
                            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-sm font-medium mb-6 backdrop-blur-sm border border-white/10">
                                <Zap className="w-4 h-4 text-yellow-400" />
                                <span>Tecnología de Vanguardia</span>
                            </div>
                            <h3 className="text-3xl md:text-4xl font-bold mb-6">
                                Más que una calculadora, <br />
                                <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400">Inteligencia Real</span>
                            </h3>
                            <p className="text-gray-300 text-lg mb-8 leading-relaxed">
                                A diferencia de las tasaciones tradicionales, nuestro modelo aprende constantemente del mercado inmobiliario argentino.
                                Entrenado con <strong>+450,000 propiedades históricas</strong> (desde 2015) y actualizado con <strong>+25,000 publicaciones recientes</strong> (menos de 30 días).
                            </p>
                            <div className="flex flex-col sm:flex-row gap-4 mb-8">
                                <div className="flex items-center gap-3 bg-white/5 p-4 rounded-xl border border-white/10">
                                    <TrendingUp className="w-5 h-5 text-green-400" />
                                    <span className="font-medium">Datos en Tiempo Real</span>
                                </div>
                                <div className="flex items-center gap-3 bg-white/5 p-4 rounded-xl border border-white/10">
                                    <ShieldCheck className="w-5 h-5 text-blue-400" />
                                    <span className="font-medium">Máxima Precisión</span>
                                </div>
                            </div>

                            <Link
                                href="/modelo"
                                className="inline-flex items-center gap-2 bg-white text-black px-6 py-3 rounded-xl font-semibold hover:bg-gray-100 transition-colors"
                            >
                                Conocer nuestra tecnología <ArrowRight className="w-4 h-4" />
                            </Link>
                        </div>

                        {/* Visual Representation - Marketing Style */}
                        <div className="relative flex justify-center">
                            <div className="relative w-full max-w-sm aspect-square">
                                {/* Central Brain/Core */}
                                <div className="absolute inset-0 flex items-center justify-center z-20">
                                    <div className="w-32 h-32 bg-gradient-to-br from-blue-600 to-purple-600 rounded-full flex items-center justify-center shadow-2xl shadow-purple-500/30 animate-pulse">
                                        <Brain className="w-16 h-16 text-white" />
                                    </div>
                                </div>

                                {/* Orbiting Elements */}
                                <div className="absolute inset-0 animate-spin-slow">
                                    <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-4 bg-gray-800 p-3 rounded-xl border border-gray-700 shadow-lg">
                                        <Database className="w-6 h-6 text-blue-400" />
                                    </div>
                                    <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-4 bg-gray-800 p-3 rounded-xl border border-gray-700 shadow-lg">
                                        <TrendingUp className="w-6 h-6 text-green-400" />
                                    </div>
                                    <div className="absolute left-0 top-1/2 -translate-x-4 -translate-y-1/2 bg-gray-800 p-3 rounded-xl border border-gray-700 shadow-lg">
                                        <Zap className="w-6 h-6 text-yellow-400" />
                                    </div>
                                    <div className="absolute right-0 top-1/2 translate-x-4 -translate-y-1/2 bg-gray-800 p-3 rounded-xl border border-gray-700 shadow-lg">
                                        <ShieldCheck className="w-6 h-6 text-purple-400" />
                                    </div>
                                </div>

                                {/* Connecting Lines (Decorative) */}
                                <svg className="absolute inset-0 w-full h-full pointer-events-none opacity-30" viewBox="0 0 100 100">
                                    <circle cx="50" cy="50" r="35" fill="none" stroke="white" strokeWidth="0.5" strokeDasharray="4 4" />
                                    <circle cx="50" cy="50" r="45" fill="none" stroke="white" strokeWidth="0.5" opacity="0.5" />
                                </svg>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}