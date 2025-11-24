import { Brain, Database, CheckCircle, TrendingUp, AlertTriangle } from "lucide-react";
import Image from "next/image";
import type { Metadata } from "next";
import Footer from "@/ui/components/layout/Footer";
import { CTA } from "@/ui/sections/CTA";

export const metadata: Metadata = {
    title: "Cómo funciona nuestra IA | PROP-IA",
    description: "Entendé cómo nuestra Inteligencia Artificial calcula el valor de tu propiedad. Transparencia, datos masivos (+450k desde 2015) y Deep Learning.",
    openGraph: {
        title: "Cómo funciona la IA de PROP-IA",
        description: "Transparencia total: +450k propiedades analizadas y algoritmos de Deep Learning para tasaciones precisas.",
        url: 'https://prop-ia.com/modelo',
    },
};

export default function ModelExplanationPage() {
    return (
        <main className="bg-white">
            <div className="space-y-12 max-w-5xl mx-auto py-24 px-6">
                {/* Header */}
                <div className="text-center space-y-4">
                    <div className="inline-flex items-center justify-center p-3 bg-black rounded-2xl mb-4">
                        <Brain className="w-8 h-8 text-white" />
                    </div>
                    <h1 className="text-4xl font-bold text-gray-900">Cómo funciona nuestra IA</h1>
                    <p className="text-xl text-gray-500 max-w-2xl mx-auto">
                        Transparencia total sobre cómo PROP-IA calcula el valor de tu propiedad utilizando tecnología de vanguardia.
                    </p>
                </div>

                {/* Section 1: The Technology */}
                <div className="grid md:grid-cols-2 gap-12 items-center">
                    <div className="space-y-6">
                        <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
                            <div className="p-2 bg-blue-100 rounded-lg text-blue-600"><Database className="w-6 h-6" /></div>
                            Entrenamiento Masivo
                        </h2>
                        <p className="text-gray-600 leading-relaxed">
                            Nuestro modelo no adivina; aprende. Hemos entrenado a nuestra Inteligencia Artificial con una base de datos masiva y actualizada:
                        </p>
                        <ul className="space-y-3">
                            <li className="flex items-center gap-3 text-gray-700">
                                <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
                                <span><strong>+450,000 propiedades</strong> históricas (desde 2015 a la actualidad).</span>
                            </li>
                            <li className="flex items-center gap-3 text-gray-700">
                                <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
                                <span><strong>+25,000 publicaciones</strong> recientes (menos de 30 días).</span>
                            </li>
                            <li className="flex items-center gap-3 text-gray-700">
                                <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
                                <span>Análisis periódicos para actualización constante del modelo.</span>
                            </li>
                        </ul>
                    </div>
                    <div className="bg-gray-50 p-8 rounded-3xl border border-gray-100">
                        <div className="space-y-4">
                            <div className="flex justify-between items-center border-b pb-4">
                                <span className="text-gray-500">Datos Históricos</span>
                                <span className="font-bold text-2xl text-black">+450k</span>
                            </div>
                            <div className="flex justify-between items-center border-b pb-4">
                                <span className="text-gray-500">Datos Recientes</span>
                                <span className="font-bold text-2xl text-black">+25k</span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-gray-500">Tecnología</span>
                                <span className="font-bold text-xl text-blue-600">Deep Learning</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Section 2: Learning Process */}
                <div className="bg-white border rounded-3xl p-8 shadow-sm">
                    <div className="grid md:grid-cols-2 gap-12 items-center">
                        <div className="relative h-80 w-full bg-gray-50 rounded-xl overflow-hidden border">
                            <Image
                                src="/images/model/loss_curve.png"
                                alt="Curva de Aprendizaje del Modelo"
                                fill
                                className="object-contain p-4"
                            />
                        </div>
                        <div className="space-y-6">
                            <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
                                <div className="p-2 bg-purple-100 rounded-lg text-purple-600"><TrendingUp className="w-6 h-6" /></div>
                                El Proceso de Aprendizaje
                            </h2>
                            <p className="text-gray-600 leading-relaxed">
                                Al igual que un experto humano mejora con la experiencia, nuestra IA mejora con cada "época" de entrenamiento.
                                El gráfico muestra cómo el <strong>Error (pérdida)</strong> disminuye drásticamente a medida que el modelo procesa más datos.
                            </p>
                            <div className="bg-blue-50 p-4 rounded-xl border border-blue-100 text-sm text-blue-800">
                                <strong>¿Qué significa esto?</strong><br />
                                La línea azul (Entrenamiento) y la naranja (Validación) bajan juntas, lo que indica que el modelo está aprendiendo patrones reales del mercado, no simplemente memorizando precios.
                            </div>
                        </div>
                    </div>
                </div>

                {/* Section 3: Accuracy */}
                <div className="grid md:grid-cols-2 gap-12 items-center">
                    <div className="space-y-6 order-2 md:order-1">
                        <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
                            <div className="p-2 bg-green-100 rounded-lg text-green-600"><CheckCircle className="w-6 h-6" /></div>
                            Precisión Comprobada
                        </h2>
                        <p className="text-gray-600 leading-relaxed">
                            Sometemos a nuestro modelo a pruebas rigurosas. Comparamos sus predicciones con precios reales de venta que el modelo <strong>nunca había visto antes</strong>.
                        </p>
                        <p className="text-gray-600 leading-relaxed">
                            En el gráfico, cada punto representa una propiedad. Si la predicción fuera perfecta, todos los puntos caerían sobre la línea punteada roja.
                        </p>
                        <div className="flex items-start gap-3 bg-yellow-50 p-4 rounded-xl border border-yellow-100">
                            <AlertTriangle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                            <p className="text-sm text-yellow-800">
                                <strong>Nota de Transparencia:</strong><br />
                                Existen desviaciones naturales debido a factores subjetivos (estado de conservación, urgencia de venta) que ninguna IA puede ver en fotos. Por eso, PROP-IA es una herramienta de apoyo, no un reemplazo del criterio profesional.
                            </p>
                        </div>
                    </div>
                    <div className="relative h-96 w-full bg-gray-50 rounded-xl overflow-hidden border order-1 md:order-2">
                        <Image
                            src="/images/model/scatter_plot.png"
                            alt="Gráfico de Dispersión Predicción vs Realidad"
                            fill
                            className="object-contain p-4"
                        />
                    </div>
                </div>
            </div>

            <CTA />
            <Footer />
        </main>
    );
}
