"use client";

import { ArrowRight, CheckCircle, LineChart, Home, FileText, Sparkles } from "lucide-react";
import Link from "next/link";

export default function Hero() {
  return (
    <section className="relative pt-24 pb-32 px-6 overflow-hidden bg-gradient-to-br from-gray-950 via-gray-900 to-black">
      {/* Animated Grid Background */}
      <div className="absolute inset-0 opacity-20">
        <div className="absolute inset-0" style={{
          backgroundImage: `
            linear-gradient(rgba(59, 130, 246, 0.1) 1px, transparent 1px),
            linear-gradient(90deg, rgba(59, 130, 246, 0.1) 1px, transparent 1px)
          `,
          backgroundSize: '50px 50px'
        }}></div>
      </div>

      {/* Animated Floating Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {/* Gradient Orbs */}
        <div className="absolute top-20 left-10 w-72 h-72 bg-blue-600/20 rounded-full blur-[100px] animate-pulse"></div>
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-purple-600/20 rounded-full blur-[120px] animate-pulse" style={{ animationDelay: '1s' }}></div>

        {/* Floating Data Points */}
        <div className="absolute top-40 left-1/4 w-2 h-2 bg-blue-400 rounded-full animate-ping"></div>
        <div className="absolute top-60 right-1/3 w-2 h-2 bg-purple-400 rounded-full animate-ping" style={{ animationDelay: '0.5s' }}></div>
        <div className="absolute bottom-40 left-1/3 w-2 h-2 bg-cyan-400 rounded-full animate-ping" style={{ animationDelay: '1s' }}></div>
      </div>

      <div className="relative max-w-6xl mx-auto text-center flex flex-col items-center">
        {/* Tech Badge */}
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 backdrop-blur-sm border border-white/10 text-sm font-medium text-white mb-8 animate-fade-in">
          <Sparkles className="w-4 h-4 text-blue-400" />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400">
            Powered by Deep Learning
          </span>
        </div>

        {/* Title */}
        <h1 className="text-5xl md:text-7xl font-bold text-white leading-tight max-w-4xl">
          Inteligencia Inmobiliaria en{" "}
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-cyan-400 to-purple-400 animate-gradient">
            tiempo real
          </span>
        </h1>

        {/* Subtitle */}
        <p className="text-gray-300 text-lg md:text-xl mt-6 max-w-3xl leading-relaxed">
          Un <strong className="text-white">Asistente Inmobiliario IA</strong> entrenado con datos reales de Argentina.
          Análisis precisos, precios de mercado, oferta disponible, tendencias y
          recomendaciones inteligentes para cada operación.
        </p>

        {/* CTA */}
        <div className="flex flex-col md:flex-row gap-4 mt-10">
          <Link
            href="/dashboard"
            className="group px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl text-lg font-medium hover:from-blue-500 hover:to-purple-500 transition inline-flex items-center gap-2 shadow-lg shadow-blue-500/50"
          >
            Comenzá GRATIS!
            <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
          </Link>

          <a
            href="#como-funciona"
            className="px-8 py-4 bg-white/5 backdrop-blur-sm border border-white/10 text-white rounded-xl text-lg font-medium hover:bg-white/10 transition"
          >
            Ver cómo funciona
          </a>
        </div>

        {/* Feature icons */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mt-16 text-left max-w-3xl">
          <div className="flex items-center gap-3 p-4 rounded-xl bg-white/5 backdrop-blur-sm border border-white/10 hover:bg-white/10 transition group">
            <CheckCircle className="text-blue-400 w-6 h-6 group-hover:scale-110 transition-transform" />
            <span className="text-white text-sm font-medium">Tasaciones precisas</span>
          </div>
          <div className="flex items-center gap-3 p-4 rounded-xl bg-white/5 backdrop-blur-sm border border-white/10 hover:bg-white/10 transition group">
            <LineChart className="text-cyan-400 w-6 h-6 group-hover:scale-110 transition-transform" />
            <span className="text-white text-sm font-medium">Análisis del mercado</span>
          </div>
          <div className="flex items-center gap-3 p-4 rounded-xl bg-white/5 backdrop-blur-sm border border-white/10 hover:bg-white/10 transition group">
            <Home className="text-purple-400 w-6 h-6 group-hover:scale-110 transition-transform" />
            <span className="text-white text-sm font-medium">Precios óptimos</span>
          </div>
          <div className="flex items-center gap-3 p-4 rounded-xl bg-white/5 backdrop-blur-sm border border-white/10 hover:bg-white/10 transition group">
            <FileText className="text-pink-400 w-6 h-6 group-hover:scale-110 transition-transform" />
            <span className="text-white text-sm font-medium">Contratos automáticos</span>
          </div>
        </div>

      </div>

      {/* Add custom animation styles */}
      <style jsx>{`
        @keyframes gradient {
          0%, 100% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
        }
        .animate-gradient {
          background-size: 200% 200%;
          animation: gradient 3s ease infinite;
        }
        @keyframes fade-in {
          from { opacity: 0; transform: translateY(-10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in {
          animation: fade-in 0.8s ease-out;
        }
      `}</style>
    </section>
  );
}
