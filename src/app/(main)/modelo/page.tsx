import { CheckCircle, AlertTriangle } from "lucide-react";
import type { Metadata } from "next";

import { CTA } from "@/ui/sections/CTA";

export const metadata: Metadata = {
    title: "Cómo funciona la tasación con IA",
    description: "Qué hace la tasación con IA de Zeta Prop: una red neuronal entrenada con datos de propiedades de Argentina que da un valor estimado orientativo.",
    alternates: { canonical: "/modelo" },
    openGraph: {
        title: "Cómo funciona la tasación de Zeta Prop",
        description: "Una red neuronal estima un valor orientativo a partir de las características y la ubicación de la propiedad.",
        url: 'https://zetaprop.com.ar/modelo',
    },
};

export default function ModelExplanationPage() {
    return (
        <main className="flex-1">
            {/* Header */}
            <section className="l-section s-page-head" aria-labelledby="modelo-title">
                <div className="l-container">
                    <div className="s-page-head__inner">
                        <h1 id="modelo-title" className="s-page-title">Cómo funciona nuestra tasación con IA</h1>
                        <p className="s-page-lede">
                            Te contamos qué hace la herramienta de tasación de Zeta Prop, qué datos usa y cuáles son sus límites.
                        </p>
                    </div>
                </div>
            </section>

            <section className="l-section l-section--tight">
                <div className="l-container">
                    {/* Section 1: The model */}
                    <div className="s-split">
                        <div className="s-split__text">
                            <h2 className="s-split__title">Un modelo entrenado con datos reales</h2>
                            <p>
                                La tasación usa una red neuronal entrenada con datos históricos de propiedades de Argentina. A partir de lo que cargás, estima un valor de la propiedad:
                            </p>
                            <ul className="s-check-list s-check-list--md">
                                <li>
                                    <CheckCircle size={18} aria-hidden="true" />
                                    <span><strong>Ubicación:</strong> barrio, ciudad y provincia.</span>
                                </li>
                                <li>
                                    <CheckCircle size={18} aria-hidden="true" />
                                    <span><strong>Características:</strong> tipo de propiedad, superficie total y cubierta, ambientes, dormitorios, baños, piso, año de construcción y expensas.</span>
                                </li>
                                <li>
                                    <CheckCircle size={18} aria-hidden="true" />
                                    <span><strong>Descripción:</strong> el texto de la propiedad también se analiza como dato de entrada.</span>
                                </li>
                            </ul>
                        </div>
                        <dl className="s-stats">
                            <div>
                                <dt>Modelo</dt>
                                <dd>Red neuronal</dd>
                            </div>
                            <div>
                                <dt>Dónde corre</dt>
                                <dd>En tu navegador</dd>
                            </div>
                            <div>
                                <dt>Disponible en</dt>
                                <dd>Plan Pro</dd>
                            </div>
                        </dl>
                    </div>

                    {/* Section 2: What happens on each valuation + limits */}
                    <div className="s-split">
                        <div className="s-split__text">
                            <h2 className="s-split__title">Qué pasa cuando tasás</h2>
                            <ul className="s-check-list s-check-list--md">
                                <li>
                                    <CheckCircle size={18} aria-hidden="true" />
                                    <span>Si dejás un dato numérico vacío, se completa con un valor de referencia (la mediana de los datos de entrenamiento).</span>
                                </li>
                                <li>
                                    <CheckCircle size={18} aria-hidden="true" />
                                    <span>El modelo calcula un valor estimado para la propiedad.</span>
                                </li>
                                <li>
                                    <CheckCircle size={18} aria-hidden="true" />
                                    <span>Sobre ese valor se aplican ajustes: un factor de corrección para casas y PH, un ajuste según la cantidad de baños y, si están configurados, ajustes porcentuales por características como pileta o cochera.</span>
                                </li>
                            </ul>
                        </div>
                        <div className="s-note s-note--warning">
                            <AlertTriangle size={18} aria-hidden="true" />
                            <p className="m-0">
                                <strong>Nota de transparencia:</strong><br />
                                El resultado es una estimación orientativa y no publicamos métricas de precisión del modelo. No ve el estado de conservación, la luminosidad ni la urgencia de venta. Es una herramienta de apoyo: no reemplaza el criterio profesional ni una tasación formal.
                            </p>
                        </div>
                    </div>
                </div>
            </section>

            <CTA />
        </main>
    );
}
