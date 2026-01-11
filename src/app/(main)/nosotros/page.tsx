import { Metadata } from 'next';
import Link from 'next/link';
import { Linkedin, Code2, Target, Lightbulb } from 'lucide-react';

export const metadata: Metadata = {
    title: 'Nosotros | Zeta Prop',
    description: 'Conoce al equipo detrás de Zeta Prop. Liderados por expertos en Real Estate y Tecnología, transformamos el mercado inmobiliario argentino con IA.',
    alternates: {
        canonical: 'https://zetaprop.com.ar/nosotros',
    },
};

export default function AboutPage() {
    return (
        <div className="bg-white font-sans text-gray-900">
            {/* Hero Section */}
            <section className="bg-indigo-50/30 overflow-hidden relative pt-32 pb-20 px-4">
                {/* Decorative Elements */}
                <div className="absolute top-0 right-0 -mr-20 -mt-20 w-96 h-96 bg-purple-200/30 rounded-full blur-3xl pointer-events-none" />
                <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-96 h-96 bg-indigo-200/30 rounded-full blur-3xl pointer-events-none" />

                <div className="max-w-4xl mx-auto text-center relative z-10">
                    <div className="inline-block px-4 py-1.5 bg-indigo-100 text-indigo-700 rounded-full text-sm font-semibold mb-6">
                        Sobre Nosotros
                    </div>
                    <h1 className="text-4xl md:text-5xl font-extrabold mb-6 leading-tight text-gray-900">
                        Impulsando el futuro del <br />
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600">Real Estate en Argentina</span>
                    </h1>
                    <p className="text-xl text-gray-500 max-w-2xl mx-auto">
                        Somos un equipo apasionado por la tecnología y el mercado inmobiliario, dedicados a crear herramientas que simplifican y potencian el trabajo de miles de profesionales.
                    </p>
                </div>
            </section>

            {/* Mission & Vision Grid */}
            <section className="py-20 px-6 max-w-7xl mx-auto">
                <div className="grid md:grid-cols-2 gap-8 mb-20">
                    <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 flex flex-col items-start hover:shadow-md transition-shadow">
                        <div className="w-12 h-12 bg-indigo-100 rounded-xl flex items-center justify-center text-indigo-600 mb-6">
                            <Target size={24} />
                        </div>
                        <h2 className="text-2xl font-bold mb-4">Nuestra Misión</h2>
                        <p className="text-gray-600 leading-relaxed">
                            Democratizar el acceso a herramientas tecnológicas avanzadas para el sector inmobiliario. Queremos que cada inmobiliaria, agente y tasador, sin importar su tamaño, cuente con el poder de la Inteligencia Artificial para ser más eficiente y brindar un mejor servicio.
                        </p>
                    </div>
                    <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 flex flex-col items-start hover:shadow-md transition-shadow">
                        <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center text-purple-600 mb-6">
                            <Lightbulb size={24} />
                        </div>
                        <h2 className="text-2xl font-bold mb-4">Nuestra Visión</h2>
                        <p className="text-gray-600 leading-relaxed">
                            Ser la plataforma de referencia en Latinoamérica para la gestión inmobiliaria integral. Imaginamos un futuro donde la tecnología elimina las fricciones administrativas, permitiendo a los profesionales enfocarse en lo que realmente importa: las relaciones humanas.
                        </p>
                    </div>
                </div>

                {/* Team Section */}
                <div className="max-w-4xl mx-auto">
                    <h2 className="text-3xl font-bold text-center mb-12">Quiénes Somos</h2>
                    <div className="grid md:grid-cols-2 gap-12">

                        {/* Facundo */}
                        <div className="bg-white rounded-2xl overflow-hidden shadow-lg border border-gray-100 group hover:-translate-y-1 transition-transform duration-300">
                            <div className="h-32 bg-gradient-to-r from-indigo-500 to-blue-500"></div>
                            <div className="px-8 pb-8 -mt-12 text-center">
                                <div className="w-24 h-24 bg-white rounded-full p-1 mx-auto shadow-md mb-4 flex items-center justify-center">
                                    <div className="w-full h-full rounded-full bg-gray-100 flex items-center justify-center text-gray-400 font-bold text-2xl">
                                        FF
                                    </div>
                                </div>
                                <h3 className="text-xl font-bold text-gray-900">Facundo Flores</h3>
                                <p className="text-indigo-600 font-medium mb-4">CEO & Fundador</p>
                                <p className="text-gray-500 text-sm mb-6 leading-relaxed">
                                    Ingeniero en Sistemas apasionado por la innovación. Lidera la estrategia y visión de Prop-IA con el objetivo de transformar la industria.
                                </p>
                                <a
                                    href="https://www.linkedin.com/in/floreszamoranofacundo/"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center gap-2 text-gray-600 hover:text-blue-600 transition-colors bg-gray-50 px-4 py-2 rounded-full text-sm font-medium hover:bg-blue-50"
                                >
                                    <Linkedin size={16} />
                                    Ver LinkedIn
                                </a>
                            </div>
                        </div>

                        {/* Nahuel */}
                        <div className="bg-white rounded-2xl overflow-hidden shadow-lg border border-gray-100 group hover:-translate-y-1 transition-transform duration-300">
                            <div className="h-32 bg-gradient-to-r from-purple-500 to-pink-500"></div>
                            <div className="px-8 pb-8 -mt-12 text-center">
                                <div className="w-24 h-24 bg-white rounded-full p-1 mx-auto shadow-md mb-4 flex items-center justify-center">
                                    <div className="w-full h-full rounded-full bg-gray-100 flex items-center justify-center text-gray-400 font-bold text-2xl">
                                        NS
                                    </div>
                                </div>
                                <h3 className="text-xl font-bold text-gray-900">Nahuel Serrano</h3>
                                <p className="text-purple-600 font-medium mb-4">CTO</p>
                                <p className="text-gray-500 text-sm mb-6 leading-relaxed">
                                    El cerebro detrás de nuestra infraestructura tecnológica. Asegura que Prop-IA sea robusto, escalable y seguro para todos nuestros usuarios.
                                </p>
                                <div className="inline-flex items-center gap-2 text-gray-400 cursor-default bg-gray-50 px-4 py-2 rounded-full text-sm font-medium">
                                    <Code2 size={16} />
                                    Tech Lead
                                </div>
                            </div>
                        </div>

                    </div>
                </div>

            </section>
        </div>
    );
}
