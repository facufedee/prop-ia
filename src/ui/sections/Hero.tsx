"use client";

import { ArrowRight, CheckCircle, LineChart, Home, FileText } from "lucide-react";
import Link from "next/link";

export default function Hero() {
  return (
    <section
      className="
        relative
        pt-24 pb-32 px-6
        bg-cover bg-center bg-no-repeat
        bg-[url('/assets/img/fondo_hero.jpg')]
      "
    >
      {/* Overlay suave para que se lea bien */}
      <div className="absolute inset-0 bg-white/80 backdrop-blur-sm"></div>

      <div className="relative max-w-6xl mx-auto text-center flex flex-col items-center">

        {/* Title */}
        <h1 className="text-5xl md:text-6xl font-bold text-gray-900 leading-tight max-w-4xl">
          Inteligencia Inmobiliaria en{" "}
          <span className="text-black">tiempo real</span>
        </h1>

        {/* Subtitle */}
        <p className="text-gray-700 text-lg md:text-xl mt-6 max-w-3xl">
          Un <strong>Asistente Inmobiliario IA</strong> entrenado con datos reales de Argentina.  
          Análisis precisos, precios de mercado, oferta disponible, tendencias y 
          recomendaciones inteligentes para cada operación.
        </p>

        {/* CTA */}
        <div className="flex flex-col md:flex-row gap-4 mt-10">
          <Link
            href="/dashboard"
            className="px-8 py-4 bg-black text-white rounded-xl text-lg font-medium hover:bg-gray-800 transition inline-flex items-center gap-2"
          >
            Comenzá GRATIS! <ArrowRight size={20} />
          </Link>

          <a
            href="#como-funciona"
            className="px-8 py-4 border border-gray-300 rounded-xl text-lg font-medium hover:bg-gray-100 transition"
          >
            Ver cómo funciona
          </a>
        </div>

        {/* Feature icons */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mt-16 text-left max-w-3xl">
          <div className="flex items-center gap-3">
            <CheckCircle className="text-black w-6 h-6" />
            <span>Tasaciones precisas</span>
          </div>
          <div className="flex items-center gap-3">
            <LineChart className="text-black w-6 h-6" />
            <span>Análisis del mercado</span>
          </div>
          <div className="flex items-center gap-3">
            <Home className="text-black w-6 h-6" />
            <span>Precios óptimos</span>
          </div>
          <div className="flex items-center gap-3">
            <FileText className="text-black w-6 h-6" />
            <span>Contratos automáticos</span>
          </div>
        </div>

      </div>
    </section>
  );
}
