"use client";

import { useState } from "react";
import { ChevronDown, ChevronUp, HelpCircle } from "lucide-react";

const faqs = [
    {
        question: "¿Qué tan precisa es la tasación?",
        answer: "Nuestra IA tiene un margen de error promedio del 3-5% en zonas urbanas densas como CABA. El modelo se entrena con miles de datos reales de operaciones recientes, aunque siempre recomendamos usar el valor como una referencia sólida y consultar a un profesional para el cierre final."
    },
    {
        question: "¿Cómo protege PROP-IA mis datos?",
        answer: "Tu privacidad es nuestra prioridad. Utilizamos protocolos de seguridad avanzados para garantizar que la información de tu propiedad se procese de manera confidencial y segura, cumpliendo con los más altos estándares de protección de datos."
    },
    {
        question: "¿Sirve para todo el país?",
        answer: "Sí, nuestro modelo procesa datos de toda Argentina. Si bien la mayor densidad de información se encuentra en centros urbanos principales, la tecnología de Machine Learning adapta sus predicciones basándose en características locales de cada provincia y localidad."
    },
    {
        question: "¿Tiene costo el servicio?",
        answer: "Ofrecemos una versión gratuita con funcionalidades completas para propietarios individuales. Para inmobiliarias y tasadores profesionales que requieren volumen masivo de consultas y API, disponemos de planes Premium."
    }
];

export function FAQ() {
    const [openIndex, setOpenIndex] = useState<number | null>(null);

    return (
        <section id="faq" className="py-24 bg-white px-6 scroll-mt-20">
            <div className="max-w-3xl mx-auto">
                <div className="text-center mb-16">
                    <div className="inline-flex items-center justify-center p-3 bg-gray-100 rounded-xl mb-4">
                        <HelpCircle className="w-6 h-6 text-gray-600" />
                    </div>
                    <h2 className="text-4xl font-bold text-gray-900 mb-4">Preguntas Frecuentes</h2>
                    <p className="text-xl text-gray-600">
                        Todo lo que necesitas saber sobre nuestra tecnología de tasación.
                    </p>
                </div>

                <div className="space-y-4">
                    {faqs.map((faq, index) => (
                        <div
                            key={index}
                            className="border border-gray-200 rounded-2xl overflow-hidden transition-all duration-200 hover:border-gray-300"
                        >
                            <button
                                onClick={() => setOpenIndex(openIndex === index ? null : index)}
                                className="w-full flex items-center justify-between p-6 text-left bg-white hover:bg-gray-50 transition-colors"
                            >
                                <span className="font-semibold text-lg text-gray-900">{faq.question}</span>
                                {openIndex === index ? (
                                    <ChevronUp className="w-5 h-5 text-gray-500" />
                                ) : (
                                    <ChevronDown className="w-5 h-5 text-gray-500" />
                                )}
                            </button>

                            <div
                                className={`overflow-hidden transition-all duration-300 ease-in-out ${openIndex === index ? "max-h-48 opacity-100" : "max-h-0 opacity-0"
                                    }`}
                            >
                                <div className="p-6 pt-0 text-gray-600 leading-relaxed bg-white border-t border-gray-100">
                                    {faq.answer}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}
