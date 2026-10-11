"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { PrimaryCta } from "@/ui/sections/PhotoHero";

const categories = [
    {
        title: "Cómo empezar",
        faqs: [
            {
                question: "¿Cómo empiezo a usar Zeta Prop?",
                answer: "Es muy simple. Entrás a zetaprop.com.ar, hacés clic en \"Comenzar\" y creás tu cuenta con tu email o con Google. Una vez adentro, el dashboard te guía para configurar tu inmobiliaria: nombre, logo, datos de contacto. Después ya podés empezar a cargar propiedades, clientes y contratos. Todo el proceso lleva menos de 10 minutos."
            },
            {
                question: "¿Hay un período de prueba?",
                answer: "Sí. Tenés un período de prueba gratuito para explorar todas las funcionalidades sin necesidad de ingresar datos de pago. Podés cargar propiedades, gestionar contratos y probar el sistema completo antes de decidir."
            },
            {
                question: "¿Qué es lo primero que tengo que configurar?",
                answer: "Lo más importante al arrancar es completar los datos de tu inmobiliaria en Configuración: nombre, logo y datos de contacto. Después cargá tus primeras propiedades y, si administrás alquileres, tus contratos activos. En poco tiempo ya tenés todo organizado en un solo lugar."
            },
            {
                question: "¿Puedo cargar mi cartera actual de propiedades y contratos?",
                answer: "Sí. Podés cargar propiedades, clientes y contratos que ya están en curso. Para los alquileres activos, indicás la fecha de inicio y el sistema ajusta automáticamente los vencimientos y montos desde ese punto. Si querés, también podés cargar el historial de pagos anteriores."
            },
            {
                question: "¿Necesito conocimientos técnicos para usar la plataforma?",
                answer: "No. Está diseñada para que cualquier profesional inmobiliario pueda usarla desde el primer día, sin capacitaciones ni soporte técnico. Todo es intuitivo y podés empezar a trabajar en minutos."
            },
            {
                question: "¿Funciona para inmobiliarias pequeñas o también para equipos grandes?",
                answer: "Para los dos. Escala según tu operación: desde un agente independiente con unas pocas propiedades hasta una inmobiliaria con múltiples colaboradores. Podés agregar miembros del equipo, asignarles roles y ver la actividad de cada uno desde el dashboard."
            },
        ]
    },
    {
        title: "Propiedades y clientes",
        faqs: [
            {
                question: "¿Cómo gestiono mi inventario de propiedades?",
                answer: "Desde el módulo de propiedades podés crear fichas completas con fotos, videos, ubicación en mapa, precios y estado (disponible, reservado, vendido, alquilado). El sistema genera automáticamente una ficha PDF lista para compartir con clientes o publicar."
            },
            {
                question: "¿Cómo funciona el CRM de clientes?",
                answer: "El CRM te permite llevar un seguimiento detallado de cada lead desde que entra hasta que cierra. Podés registrar el perfil de búsqueda de cada cliente, hacer el matching con las propiedades disponibles y recibir alertas cuando hay una nueva propiedad que coincide. También tenés un pipeline visual para ver en qué etapa está cada oportunidad."
            },
            {
                question: "¿Puedo hacer matching automático entre clientes y propiedades?",
                answer: "Sí. Al cargar el perfil de búsqueda de un cliente (zona, tipo de propiedad, rango de precio, ambientes), el sistema cruza esa información con tu inventario y te alerta cuando hay propiedades que coinciden. Así no se te escapa ninguna oportunidad."
            },
        ]
    },
    {
        title: "Alquileres y contratos",
        faqs: [
            {
                question: "¿Cómo cargo un contrato de alquiler?",
                answer: "Completás un formulario con los datos del contrato: partes, monto inicial, fecha de inicio, duración, tipo de ajuste (IPC, porcentaje fijo, manual, etc.) y periodicidad. En minutos el contrato queda registrado y el sistema se encarga de los vencimientos, aumentos y punitorios automáticamente."
            },
            {
                question: "¿El sistema calcula los aumentos e índices de ajuste?",
                answer: "Sí. Podés configurar distintos tipos de ajuste: porcentaje fijo, índice ICL/IPC, manual o sin ajuste. El sistema aplica el aumento en la fecha correspondiente sin que tengas que hacer nada. Es lo suficientemente flexible para adaptarse a cualquier contrato vigente en Argentina."
            },
            {
                question: "¿Cómo se generan los recibos?",
                answer: "Los recibos se generan automáticamente cada mes. Solo tenés que marcar el pago como realizado y el sistema crea el recibo con todos los datos: monto, período, ajustes y punitorios si los hubiera. Podés descargarlo en PDF o compartírselo al inquilino directamente."
            },
            {
                question: "¿La plataforma calcula punitorios por mora?",
                answer: "Sí. Si activás la opción, la plataforma calcula los punitorios día a día en caso de demora en el pago, según el porcentaje que hayas configurado en el contrato. Todo queda registrado y visible tanto para vos como para el inquilino en su portal."
            },
            {
                question: "¿Puedo generar contratos en PDF desde la plataforma?",
                answer: "Sí. Zeta Prop genera contratos de alquiler y venta automáticamente con los datos cargados en el sistema. El documento queda listo para descargar e imprimir. No requiere firma digital: lo imprimís, firmás y listo."
            },
        ]
    },
    {
        title: "Portal del inquilino",
        faqs: [
            {
                question: "¿Qué es el portal del inquilino?",
                answer: "Es un acceso exclusivo que podés compartirle a cada inquilino para que vea su información de forma transparente: monto del mes, pagos realizados, punitorios si los hubiera y el resumen de su contrato. No necesita instalar nada ni registrarse con usuario y contraseña."
            },
            {
                question: "¿El uso del portal es obligatorio para el inquilino?",
                answer: "No. Es completamente opcional. Vos podés gestionar todo desde tu cuenta y, si querés, compartirle el link al inquilino. Muchos inquilinos valoran tener esa visibilidad, pero no es un requisito."
            },
        ]
    },
    {
        title: "Agenda y equipo",
        faqs: [
            {
                question: "¿Cómo funciona la agenda inteligente?",
                answer: "Podés coordinar visitas, reuniones y tareas directamente desde la plataforma. La agenda se sincroniza con Google Calendar para que no te solapés y envía recordatorios automáticos. Si tenés equipo, podés ver la disponibilidad de cada agente y asignar visitas sin conflictos."
            },
            {
                question: "¿Puedo agregar colaboradores a mi cuenta?",
                answer: "Sí. Podés invitar a agentes, administrativos u otros roles a tu espacio de trabajo y asignarles permisos diferenciados. Cada uno ve solo lo que le corresponde según su rol."
            },
        ]
    },
    {
        title: "Finanzas y reportes",
        faqs: [
            {
                question: "¿Puedo hacer liquidaciones a propietarios desde la plataforma?",
                answer: "Sí. La plataforma calcula automáticamente la liquidación mensual para cada propietario: alquiler cobrado, comisiones y gastos descontados, neto a transferir. Podés descargarla en PDF para enviársela."
            },
            {
                question: "¿Cómo se gestionan las comisiones?",
                answer: "Podés configurar el porcentaje de comisión por operación y el sistema lo calcula automáticamente al cerrar un alquiler o venta. También podés asignar comisiones a agentes específicos y llevar el control desde los reportes financieros."
            },
            {
                question: "¿Qué reportes y métricas tengo disponibles?",
                answer: "El dashboard te muestra en tiempo real el estado de tu cartera: propiedades activas, pagos del mes, vencimientos próximos y leads en pipeline. También tenés analytics de rendimiento por agente, propiedades más consultadas y métricas de conversión. Los datos se pueden exportar a Excel."
            },
        ]
    },
    {
        title: "Seguridad y soporte",
        faqs: [
            {
                question: "¿Qué tan segura es la información en Zeta Prop?",
                answer: "Usamos infraestructura de Google Firebase con estándares de seguridad de nivel empresarial. Tu información y la de tus clientes está cifrada, respaldada en la nube y no se comparte con terceros."
            },
            {
                question: "¿Tienen soporte técnico?",
                answer: "Sí. Contamos con mesa de ayuda con soporte prioritario, base de conocimientos con tutoriales en video y un gestor de cuenta para los planes más completos. Si tenés algún problema, podés escribirnos y te respondemos a la brevedad."
            },
        ]
    },
];

export default function FAQsPage() {
    const [openKey, setOpenKey] = useState<string | null>(null);

    const toggle = (key: string) => setOpenKey(openKey === key ? null : key);

    return (
        <main className="flex-1">
            {/* ── Page header ── */}
            <section className="l-section s-page-head" aria-labelledby="faqs-title">
                <div className="l-container">
                    <div className="s-page-head__inner">
                        <p className="l-eyebrow">FAQs</p>
                        <h1 id="faqs-title" className="s-page-title">
                            Preguntas Frecuentes
                        </h1>
                        <p className="s-page-lede">
                            Todo lo que necesitás saber sobre Zeta Prop para gestionar tu inmobiliaria.
                        </p>
                    </div>
                </div>
            </section>

            {/* FAQ Categories */}
            <section className="l-section l-section--tight">
                <div className="l-container">
                    {categories.map((cat) => (
                        <div key={cat.title} className="s-faq-group l-faq">
                            <h2 className="l-section__title">{cat.title}</h2>
                            <div className="s-faq-list">
                                {cat.faqs.map((faq, i) => {
                                    const key = `${cat.title}-${i}`;
                                    const isOpen = openKey === key;
                                    const panelId = `faq-panel-${key.replace(/\s+/g, "-")}`;
                                    return (
                                        <div key={key} className="s-faq-item">
                                            <button
                                                type="button"
                                                onClick={() => toggle(key)}
                                                className="s-faq-item__button"
                                                aria-expanded={isOpen}
                                                aria-controls={panelId}
                                            >
                                                <span>{faq.question}</span>
                                                <ChevronDown className="s-faq-item__icon" size={20} aria-hidden="true" />
                                            </button>
                                            <div
                                                id={panelId}
                                                className={`overflow-hidden transition-all duration-300 ease-in-out ${isOpen ? "max-h-[400px] opacity-100" : "max-h-0 opacity-0"}`}
                                            >
                                                <p className="s-faq-item__answer">{faq.answer}</p>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    ))}
                </div>
            </section>

            {/* CTA */}
            <section className="l-section l-section--tight" aria-labelledby="faqs-cta-title">
                <div className="l-container l-cta-band">
                    <h2 id="faqs-cta-title">¿No encontrás lo que buscás?</h2>
                    <p>Escribinos y te respondemos a la brevedad.</p>
                    <PrimaryCta href="/contacto">Contactanos</PrimaryCta>
                </div>
            </section>
        </main>
    );
}
