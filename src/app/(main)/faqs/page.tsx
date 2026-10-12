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
                answer: "Es muy simple. Entrás a zetaprop.com.ar, hacés clic en \"Comenzar\" y creás tu cuenta con tu email o con Google. Una vez adentro, el dashboard te guía para configurar tu inmobiliaria: nombre, logo, datos de contacto. Después ya podés empezar a cargar propiedades, clientes y contratos."
            },
            {
                question: "¿Hay un período de prueba?",
                answer: "Sí. Tenés 14 días de prueba gratis con el plan Básico, sin ingresar datos de pago. Podés cargar propiedades, gestionar contratos y alquileres y probar el sistema antes de decidir."
            },
            {
                question: "¿Qué es lo primero que tengo que configurar?",
                answer: "Lo más importante al arrancar es completar los datos de tu inmobiliaria en Configuración: nombre, logo y datos de contacto. Después cargá tus primeras propiedades y, si administrás alquileres, tus contratos activos. En poco tiempo ya tenés todo organizado en un solo lugar."
            },
            {
                question: "¿Puedo cargar mi cartera actual de propiedades y contratos?",
                answer: "Sí. Podés cargar propiedades, clientes y contratos que ya están en curso. Para los alquileres activos, indicás la fecha de inicio y el sistema arma el calendario de vencimientos desde ese punto. Los meses que ya se cobraron los podés marcar como pagados."
            },
            {
                question: "¿Necesito conocimientos técnicos para usar la plataforma?",
                answer: "No. Está diseñada para que cualquier profesional inmobiliario pueda usarla desde el primer día, sin capacitaciones ni soporte técnico. Todo es intuitivo y podés empezar a trabajar en minutos."
            },
            {
                question: "¿Funciona para inmobiliarias pequeñas o también para equipos grandes?",
                answer: "Para los dos. El plan Básico es para un usuario; desde el plan Profesional podés sumar miembros del equipo y asignarles roles. Los límites de usuarios y propiedades de cada plan están en la página de precios."
            },
        ]
    },
    {
        title: "Propiedades y clientes",
        faqs: [
            {
                question: "¿Cómo gestiono mi inventario de propiedades?",
                answer: "Desde el módulo de propiedades podés crear fichas completas con fotos, video, ubicación en mapa, precio y estado (activa, inactiva, reservada, vendida). Además podés generar una ficha para imprimir o compartir con clientes."
            },
            {
                question: "¿Cómo funciona el CRM de clientes?",
                answer: "Desde el plan Profesional tenés el módulo de consultas: cada interesado queda registrado con sus datos, zona, presupuesto, notas e interacciones. Lo movés por etapas en un tablero visual y ves la tasa de conversión de tu pipeline."
            },
        ]
    },
    {
        title: "Alquileres y contratos",
        faqs: [
            {
                question: "¿Cómo cargo un contrato de alquiler?",
                answer: "Completás un formulario con los datos del contrato: partes, monto inicial, fecha de inicio, duración, tipo de ajuste (ICL, IPC, porcentaje fijo, manual, etc.) y periodicidad. El contrato queda registrado y el sistema arma el calendario de vencimientos y calcula los aumentos."
            },
            {
                question: "¿El sistema calcula los aumentos e índices de ajuste?",
                answer: "Sí. Podés configurar ajuste por ICL, IPC, porcentaje fijo o manual, y cada cuántos meses se aplica. Para ICL e IPC el sistema calcula el nuevo monto con los índices oficiales publicados."
            },
            {
                question: "¿Cómo se generan los recibos?",
                answer: "Cuando marcás un pago como cobrado, el sistema genera el recibo en PDF con los datos del contrato, el período, el monto y los punitorios si los hubiera. Lo descargás y se lo enviás al inquilino."
            },
            {
                question: "¿La plataforma calcula punitorios por mora?",
                answer: "Sí. En el contrato configurás el recargo por mora (monto fijo o porcentaje). Cuando un pago está vencido, calculás el recargo con un clic y queda sumado al pago y al recibo."
            },
            {
                question: "¿Puedo generar contratos desde la plataforma?",
                answer: "Sí, para alquileres. Zeta Prop arma el contrato de alquiler con los datos cargados en el sistema y lo descargás en Word (.docx) para revisarlo, imprimirlo y firmarlo."
            },
        ]
    },
    {
        title: "Portal del inquilino",
        faqs: [
            {
                question: "¿Qué es el portal del inquilino?",
                answer: "Es un acceso para que cada inquilino vea su contrato y el historial de sus pagos. Entra con el código del contrato y su DNI: no necesita instalar nada ni crear un usuario."
            },
            {
                question: "¿El uso del portal es obligatorio para el inquilino?",
                answer: "No. Es completamente opcional. Vos podés gestionar todo desde tu cuenta y, si querés, compartirle el código de acceso al inquilino."
            },
        ]
    },
    {
        title: "Agenda y equipo",
        faqs: [
            {
                question: "¿Cómo funciona la agenda?",
                answer: "Desde el plan Profesional podés agendar visitas a tus propiedades en un calendario, con el cliente, la propiedad y el agente asignado. Las próximas visitas también aparecen en el inicio del panel."
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
                answer: "Sí. A partir de los pagos cobrados, la plataforma arma la liquidación de cada mes para el propietario: alquiler cobrado, honorarios y otros descuentos, y neto a transferir. Podés descargarla en PDF para enviársela."
            },
            {
                question: "¿Cómo se gestionan las comisiones?",
                answer: "En cada venta cargás el porcentaje de comisión y cómo se reparte, y el sistema calcula el monto. En alquileres, los honorarios de la inmobiliaria se descuentan en la liquidación al propietario. En la ficha de cada agente ves el total de sus comisiones."
            },
            {
                question: "¿Qué reportes y métricas tengo disponibles?",
                answer: "El inicio del panel resume tu cartera: propiedades, alquileres, próximos vencimientos, próximas visitas y nuevas consultas. En Finanzas ves cobros y pagos a propietarios por período, y podés descargar en PDF el reporte de un contrato y el historial de sus liquidaciones."
            },
        ]
    },
    {
        title: "Seguridad y soporte",
        faqs: [
            {
                question: "¿Qué tan segura es la información en Zeta Prop?",
                answer: "Usamos la infraestructura de Google Firebase: la información viaja cifrada y se guarda en la nube de Google."
            },
            {
                question: "¿Tienen soporte técnico?",
                answer: "Sí. Desde el panel podés abrir un ticket de soporte y seguir su estado, consultar la sección Tutoriales y escribirnos por WhatsApp o por el chat del sitio."
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
