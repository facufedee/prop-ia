"use client";

import { Star, Quote } from "lucide-react";

export default function Testimonials() {
    const testimonials = [
        {
            name: "Carlos Rodríguez",
            role: "Director, Inmobiliaria Rodríguez",
            image: "https://randomuser.me/api/portraits/men/32.jpg",
            content: "Desde que usamos PROP-IA, hemos reducido el tiempo de tasación en un 80%. La precisión de la IA es impresionante y a nuestros clientes les encantan los reportes detallados.",
            stars: 5
        },
        {
            name: "Ana Martínez",
            role: "Agente Inmobiliaria, Remax",
            image: "https://randomuser.me/api/portraits/women/44.jpg",
            content: "La gestión de leads es fantástica. Antes perdía muchas oportunidades por no hacer seguimiento a tiempo. Ahora el sistema me avisa automáticamente.",
            stars: 5
        },
        {
            name: "Roberto Gómez",
            role: "Fundador, Urban Properties",
            image: "https://randomuser.me/api/portraits/men/67.jpg",
            content: "La mejor inversión que hemos hecho. El CRM es súper intuitivo y la publicación automática en portales nos ahorra horas de trabajo manual cada semana.",
            stars: 5
        }
    ];

    return (
        <section className="py-24 bg-gray-50">
            <div className="max-w-7xl mx-auto px-6">
                <div className="text-center mb-16">
                    <span className="inline-block px-4 py-2 bg-indigo-100 text-indigo-700 rounded-full text-sm font-semibold mb-6">
                        TESTIMONIOS
                    </span>

                    <div className="flex flex-col items-center gap-6">
                        <h2 className="text-4xl font-bold text-gray-900 leading-tight">
                            Únete a las inmobiliarias que ya <br />
                            <span className="text-indigo-600">están transformando el mercado</span>
                        </h2>

                        <p className="text-xl text-gray-600 max-w-2xl mx-auto mb-4">
                            Más de 1,200 inmobiliarias en Argentina ya confían en PROP-IA para hacer crecer su negocio.
                        </p>

                        <button className="px-8 py-3 bg-gray-900 text-white rounded-xl font-semibold hover:bg-black hover:shadow-lg transition-all transform hover:-translate-y-1">
                            Comenzar Prueba Gratis
                        </button>
                    </div>
                </div>

                <div className="grid md:grid-cols-3 gap-8">
                    {testimonials.map((testimonial, idx) => (
                        <div key={idx} className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 relative">
                            <Quote className="absolute top-8 right-8 w-8 h-8 text-indigo-100" />

                            <div className="flex gap-1 mb-6">
                                {[...Array(testimonial.stars)].map((_, i) => (
                                    <Star key={i} className="w-5 h-5 text-yellow-400 fill-current" />
                                ))}
                            </div>

                            <p className="text-gray-600 mb-8 leading-relaxed">
                                "{testimonial.content}"
                            </p>

                            <div className="flex items-center gap-4">
                                <div>
                                    <h4 className="font-bold text-gray-900">{testimonial.name}</h4>
                                    <p className="text-sm text-gray-500">{testimonial.role}</p>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}
