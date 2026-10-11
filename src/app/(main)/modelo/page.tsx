import { CheckCircle, AlertTriangle } from "lucide-react";
import Image from "next/image";
import type { Metadata } from "next";

import { CTA } from "@/ui/sections/CTA";

export const metadata: Metadata = {
    title: "Cómo funciona nuestra IA | Zeta Prop",
    description: "Entendé cómo nuestra Inteligencia Artificial calcula el valor de tu propiedad. Transparencia, datos masivos (+450k desde 2015) y Deep Learning.",
    openGraph: {
        title: "Cómo funciona la IA de Zeta Prop",
        description: "Transparencia total: +450k propiedades analizadas y algoritmos de Deep Learning para tasaciones precisas.",
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
                        <h1 id="modelo-title" className="s-page-title">Cómo funciona nuestra IA</h1>
                        <p className="s-page-lede">
                            Transparencia total sobre cómo Zeta Prop calcula el valor de tu propiedad utilizando tecnología de vanguardia.
                        </p>
                    </div>
                </div>
            </section>

            <section className="l-section l-section--tight">
                <div className="l-container">
                    {/* Section 1: The Technology */}
                    <div className="s-split">
                        <div className="s-split__text">
                            <h2 className="s-split__title">Entrenamiento Masivo</h2>
                            <p>
                                Nuestro modelo no adivina; aprende. Hemos entrenado a nuestra Inteligencia Artificial con una base de datos masiva y actualizada:
                            </p>
                            <ul className="s-check-list s-check-list--md">
                                <li>
                                    <CheckCircle size={18} aria-hidden="true" />
                                    <span><strong>+450,000 propiedades</strong> históricas (desde 2015 a la actualidad).</span>
                                </li>
                                <li>
                                    <CheckCircle size={18} aria-hidden="true" />
                                    <span><strong>+25,000 publicaciones</strong> recientes (menos de 30 días).</span>
                                </li>
                                <li>
                                    <CheckCircle size={18} aria-hidden="true" />
                                    <span>Análisis periódicos para actualización constante del modelo.</span>
                                </li>
                            </ul>
                        </div>
                        <dl className="s-stats">
                            <div>
                                <dt>Datos Históricos</dt>
                                <dd>+450k</dd>
                            </div>
                            <div>
                                <dt>Datos Recientes</dt>
                                <dd>+25k</dd>
                            </div>
                            <div>
                                <dt>Tecnología</dt>
                                <dd>Deep Learning</dd>
                            </div>
                        </dl>
                    </div>

                    {/* Section 2: Learning Process */}
                    <div className="s-split">
                        <div className="s-figure">
                            <Image
                                src="/images/model/loss_curve.png"
                                alt="Curva de Aprendizaje del Modelo"
                                fill
                                className="object-contain p-4"
                            />
                        </div>
                        <div className="s-split__text">
                            <h2 className="s-split__title">El Proceso de Aprendizaje</h2>
                            <p>
                                Al igual que un experto humano mejora con la experiencia, nuestra IA mejora con cada &quot;época&quot; de entrenamiento.
                                El gráfico muestra cómo el <strong>Error (pérdida)</strong> disminuye drásticamente a medida que el modelo procesa más datos.
                            </p>
                            <div className="s-note">
                                <div>
                                    <strong>¿Qué significa esto?</strong><br />
                                    La línea azul (Entrenamiento) y la naranja (Validación) bajan juntas, lo que indica que el modelo está aprendiendo patrones reales del mercado, no simplemente memorizando precios.
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Section 3: Accuracy */}
                    <div className="s-split">
                        <div className="s-split__text">
                            <h2 className="s-split__title">Precisión Comprobada</h2>
                            <p>
                                Sometemos a nuestro modelo a pruebas rigurosas. Comparamos sus predicciones con precios reales de venta que el modelo <strong>nunca había visto antes</strong>.
                            </p>
                            <p>
                                En el gráfico, cada punto representa una propiedad. Si la predicción fuera perfecta, todos los puntos caerían sobre la línea punteada roja.
                            </p>
                            <div className="s-note s-note--warning">
                                <AlertTriangle size={18} aria-hidden="true" />
                                <p className="m-0">
                                    <strong>Nota de Transparencia:</strong><br />
                                    Existen desviaciones naturales debido a factores subjetivos (estado de conservación, urgencia de venta) que ninguna IA puede ver en fotos. Por eso, Zeta Prop es una herramienta de apoyo, no un reemplazo del criterio profesional.
                                </p>
                            </div>
                        </div>
                        <div className="s-figure s-figure--tall s-split__figure--first-mobile">
                            <Image
                                src="/images/model/scatter_plot.png"
                                alt="Gráfico de Dispersión Predicción vs Realidad"
                                fill
                                className="object-contain p-4"
                            />
                        </div>
                    </div>
                </div>
            </section>

            <CTA />
        </main>
    );
}
