import { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
    title: 'Nosotros | PROP-IA',
    description: 'Conoce al equipo detrás de PROP-IA. Liderados por expertos en Real Estate y Tecnología, transformamos el mercado inmobiliario argentino con IA.',
    alternates: {
        canonical: 'https://prop-ia.com/nosotros',
    },
};

export default function AboutPage() {
    return (
        <main className="bg-white min-h-screen">
            {/* Hero Section */}
            <section className="bg-indigo-600 text-white py-20 px-4">
                <div className="max-w-4xl mx-auto text-center">
                    <h1 className="text-4xl md:text-5xl font-bold mb-6">Innovando el Real Estate con Inteligencia Artificial</h1>
                    <p className="text-xl text-indigo-100 max-w-2xl mx-auto">
                        Nuestra misión es potenciar a cada martillero y corredor inmobiliario de Argentina con herramientas tecnológicas de vanguardia.
                    </p>
                </div>
            </section>

            {/* Founder Section (E-E-A-T Core) */}
            <section className="py-16 px-4">
                <div className="max-w-4xl mx-auto">
                    <div className="flex flex-col md:flex-row items-center gap-12">
                        <div className="w-48 h-48 bg-gray-200 rounded-full flex-shrink-0 flex items-center justify-center text-4xl overflow-hidden relative">
                            {/* Fallback avatar if no image */}
                            <span className="z-10 text-gray-400">FF</span>
                            {/* Setup for next/image if user provides one: <Image src="/facundo.jpg" fill className="object-cover" alt="Facundo Flores" /> */}
                        </div>

                        <div className="flex-1 text-center md:text-left">
                            <span className="text-indigo-600 font-semibold tracking-wide uppercase text-sm">Fundador & CEO</span>
                            <h2 className="text-3xl font-bold text-gray-900 mt-2 mb-4">Facundo Federico Flores Zamorano</h2>
                            <p className="text-gray-600 leading-relaxed mb-6">
                                Con una profunda trayectoria en el sector tecnológico y una visión clara sobre el futuro del mercado inmobiliario, Facundo lidera PROP-IA con el objetivo de democratizar el acceso a la Inteligencia Artificial para profesionales del rubro. Su experiencia combina desarrollo de software avanzado con entendimiento estratégico de negocios digitales.
                            </p>
                            <div className="flex gap-4 justify-center md:justify-start">
                                <a href="#" className="text-gray-500 hover:text-indigo-600 transition-colors">LinkedIn</a>
                                <a href="#" className="text-gray-500 hover:text-indigo-600 transition-colors">Twitter / X</a>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Values Section */}
            <section className="bg-gray-50 py-16 px-4">
                <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
                    <div className="bg-white p-8 rounded-xl shadow-sm">
                        <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-lg flex items-center justify-center mx-auto mb-4">
                            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                        </div>
                        <h3 className="text-xl font-bold text-gray-900 mb-2">Innovación Constante</h3>
                        <p className="text-gray-600">No seguimos tendencias, las creamos. Usamos IA generativa para resolver problemas reales.</p>
                    </div>
                    <div className="bg-white p-8 rounded-xl shadow-sm">
                        <div className="w-12 h-12 bg-green-100 text-green-600 rounded-lg flex items-center justify-center mx-auto mb-4">
                            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                        </div>
                        <h3 className="text-xl font-bold text-gray-900 mb-2">Integridad y Confianza</h3>
                        <p className="text-gray-600">Tus datos son sagrados. Priorizamos la seguridad y la transparencia en cada línea de código.</p>
                    </div>
                    <div className="bg-white p-8 rounded-xl shadow-sm">
                        <div className="w-12 h-12 bg-purple-100 text-purple-600 rounded-lg flex items-center justify-center mx-auto mb-4">
                            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
                        </div>
                        <h3 className="text-xl font-bold text-gray-900 mb-2">Comunidad</h3>
                        <p className="text-gray-600">Construimos junto a nuestros usuarios. Escuchamos, adaptamos y mejoramos la plataforma día a día.</p>
                    </div>
                </div>
            </section>

            {/* CTA */}
            <section className="py-20 px-4 text-center">
                <h2 className="text-3xl font-bold text-gray-900 mb-6">¿Listo para transformar tu inmobiliaria?</h2>
                <Link href="/registro" className="inline-block bg-indigo-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-200">
                    Comenzar Gratis
                </Link>
            </section>

            {/* Structured Data - Person (E-E-A-T) */}
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{
                    __html: JSON.stringify({
                        '@context': 'https://schema.org',
                        '@type': 'Person',
                        name: 'Facundo Federico Flores Zamorano',
                        jobTitle: 'Founder & CEO',
                        worksFor: {
                            '@type': 'Organization',
                            name: 'PROP-IA',
                            url: 'https://prop-ia.com'
                        },
                        url: 'https://prop-ia.com/nosotros',
                        description: 'Experto en tecnología y mercado inmobiliario. Fundador de PROP-IA.',
                        knowsAbout: ['Real Estate', 'Artificial Intelligence', 'Software Development', 'PropTech'],
                        nationality: 'Argentine',
                    }),
                }}
            />
        </main>
    );
}
