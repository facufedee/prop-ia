"use client";

import { useState } from "react";
import { ChevronDown, ChevronUp, HelpCircle } from "lucide-react";

const faqs = [
    {
        question: "¿Necesito tener conocimientos técnicos para usar la app?",
        answer: "No. La plataforma fue diseñada pensando en propietarios sin experiencia técnica. Es clara, intuitiva y podés empezar a usarla sin capacitaciones ni tutoriales largos. Todo está explicado paso a paso."
    },
    {
        question: "¿Cómo cargo un contrato?",
        answer: "Solo tenés que completar un formulario con los datos básicos del alquiler (monto, fecha de inicio, ajustes, etc.). En menos de 5 minutos, el contrato queda registrado y la app se encarga del resto: vencimientos, aumentos, punitorios y más."
    },
    {
        question: "¿Qué información ve mi inquilino si le paso el link al portal?",
        answer: `El inquilino accede a un portal exclusivo donde puede consultar:
        • El resumen del contrato
        • El monto a pagar mes a mes
        • Los pagos realizados
        • Los punitorios si se atrasó
        No necesita instalar nada ni registrarse.`
    },
    {
        question: "¿Qué pasa si necesito cambiar el monto de un mes puntual?",
        answer: "Podés editarlo en cualquier momento. La app es flexible, no te encierra en reglas fijas. Si querés cobrar más, menos o agregar un gasto extra, lo hacés en segundos y queda reflejado para vos y para el inquilino."
    },
    {
        question: "¿La app calcula automáticamente los aumentos y punitorios?",
        answer: "Sí. Si activás esas opciones, la plataforma aplica los aumentos según el contrato (IPC, % fijo, etc.) y también los punitorios día a día si hay demoras en el pago. Todo sin que tengas que hacer cuentas."
    },
    {
        question: "¿Puedo registrar gastos relacionados al alquiler?",
        answer: "Claro. Podés cargar gastos mensuales o puntuales (expensas, reparaciones, impuestos) y llevar el control en un solo lugar. Incluso podés marcar si querés que el gasto lo vea el inquilino o no."
    },
    {
        question: "Ya tengo una planilla en Excel, ¿para qué cambiar?",
        answer: "Una planilla de Excel es útil pero estática. PropIA trabaja por vos: te envía recordatorios de vencimientos, calcula intereses por mora día a día automáticamente, aplica índices de actualización al instante y mantiene todo respaldado en la nube con seguridad bancaria. Además, le das una imagen mucho más profesional a tus inquilinos."
    },
    {
        question: "¿Puedo usarla si tengo solo una propiedad?",
        answer: "Sí, absolutamente. La plataforma está diseñada para escalar. Te sirve tanto para ordenar un único alquiler y olvidarte de las fechas de cobro, como para gestionar una cartera de cientos de propiedades."
    },
    {
        question: "¿Es seguro compartir esta información?",
        answer: "Sí. Usamos estándares de seguridad de nivel bancario. Tu información y la de tus inquilinos está protegida y no se comparte con nadie."
    },
    {
        question: "¿Qué pasa si mi inquilino no quiere usar la app?",
        answer: "No pasa nada. El uso del portal del inquilino es opcional. Vos podés seguir usando la app para gestionar todo y, si querés, enviarle un link con su resumen. Muchos inquilinos agradecen tener esa info clara y accesible."
    },
    {
        question: "¿La app me avisa de vencimientos o pagos pendientes?",
        answer: "Sí. Vas a ver un resumen del mes actual donde te mostramos qué pagos ya se hicieron y cuáles están pendientes."
    },
    {
        question: "¿Puedo agregar contratos anteriores que ya están en curso?",
        answer: "Sí. Podés cargar contratos que ya están activos y la app ajusta los vencimientos automáticamente desde la fecha que indiques. Incluso podés cargar pagos pasados si querés tener el historial completo."
    },
    {
        question: "¿Tengo que cargar los datos todos los meses?",
        answer: "No. Una vez que cargás el contrato, la app genera automáticamente los vencimientos mes a mes. Solo necesitás marcar si se realizó el pago, editar algún monto puntual o registrar un gasto. El resto lo hace la plataforma."
    },
    {
        question: "¿Funciona para contratos con ajustes especiales o no estándar?",
        answer: "Sí. Podés definir ajustes personalizados: manuales, un porcentaje fijo, una frecuencia específica, ajustes por índice (como IPC), o incluso sin ajustes. La app es lo suficientemente flexible como para adaptarse a la mayoría de los contratos usados en Argentina."
    }
];

export default function FAQ() {
    const [openIndex, setOpenIndex] = useState<number | null>(null);

    return (
        <section id="faq" className="py-24 bg-gray-50 px-6 scroll-mt-20">
            <div className="max-w-4xl mx-auto">
                <div className="text-center mb-16">
                    <div className="inline-flex items-center justify-center p-3 bg-white border border-gray-200 shadow-sm rounded-xl mb-4">
                        <HelpCircle className="w-6 h-6 text-indigo-600" />
                    </div>
                    <h2 className="text-4xl font-bold text-gray-900 mb-4">Preguntas Frecuentes</h2>
                    <p className="text-xl text-gray-600">
                        Resolvemos tus dudas sobre cómo gestionar tus alquileres con Prop-IA.
                    </p>
                </div>

                <div className="space-y-4">
                    {faqs.map((faq, index) => (
                        <div
                            key={index}
                            className="bg-white border border-gray-200 rounded-2xl overflow-hidden transition-all duration-200 hover:border-indigo-200 hover:shadow-md"
                        >
                            <button
                                onClick={() => setOpenIndex(openIndex === index ? null : index)}
                                className="w-full flex items-center justify-between p-6 text-left bg-white transition-colors"
                            >
                                <span className="font-semibold text-lg text-gray-900 pr-8">{faq.question}</span>
                                {openIndex === index ? (
                                    <ChevronUp className="w-5 h-5 text-indigo-500 flex-shrink-0" />
                                ) : (
                                    <ChevronDown className="w-5 h-5 text-gray-400 flex-shrink-0" />
                                )}
                            </button>

                            <div
                                className={`overflow-hidden transition-all duration-300 ease-in-out ${openIndex === index ? "max-h-[500px] opacity-100" : "max-h-0 opacity-0"
                                    }`}
                            >
                                <div className="p-6 pt-0 text-gray-600 leading-relaxed bg-white whitespace-pre-line">
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
