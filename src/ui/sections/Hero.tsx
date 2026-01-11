"use client";

import Link from "next/link";
import { ArrowRight, Sparkles, TrendingUp, Zap } from "lucide-react";
import { useRouter } from "next/navigation";

export default function Hero() {
  const router = useRouter();

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden bg-white">
      {/* Modern Background Gradients */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-indigo-100/50 rounded-full blur-[100px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-purple-100/50 rounded-full blur-[100px]" />
      </div>

      <div className="relative max-w-7xl mx-auto px-6 py-32 text-center z-10">

        {/* Badge */}
        <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-white border border-indigo-100 rounded-full shadow-sm mb-8 animate-fade-in hover:scale-105 transition-transform cursor-default">
          <Sparkles className="w-4 h-4 text-indigo-600" />
          <span className="text-sm font-medium text-gray-800">
            La revolución del Real Estate en Buenos Aires - Argentina 🇦🇷
          </span>
        </div>

        {/* Main Headline */}
        <h1 className="text-5xl md:text-7xl font-bold text-gray-900 mb-6 leading-[1.1] animate-fade-in-up tracking-tight">
          El CRM Inmobiliario <br />
          <span className="bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-600 bg-clip-text text-transparent bg-[length:200%_auto] animate-gradient">
            más moderno de Argentina
          </span>
        </h1>

        {/* Subheadline */}
        <p className="text-xl text-gray-600 mb-10 max-w-3xl mx-auto leading-relaxed animate-fade-in-up animation-delay-200">
          Administración integral de propiedades, clientes, alquileres y emprendimientos. Agenda inteligente con Google Calendar, bot de WhatsApp, multisucursal y portal de inquilinos.
        </p>

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-16 animate-fade-in-up animation-delay-400">
          <button
            onClick={() => router.push('/register')}
            className="group px-8 py-4 bg-gray-900 text-white rounded-2xl font-semibold text-lg hover:bg-black hover:shadow-2xl hover:-translate-y-1 active:scale-95 transition-all duration-300 flex items-center gap-3"
            aria-label="Comenzar Gratis - Ir a registro"
          >
            Comenzar Gratis
            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform text-indigo-400" />
          </button>

          <button
            onClick={() => router.push('/login')}
            className="group px-8 py-4 bg-white text-gray-900 rounded-2xl font-semibold text-lg border border-gray-200 hover:border-indigo-200 hover:bg-indigo-50/50 hover:shadow-lg hover:-translate-y-1 active:scale-95 transition-all duration-300"
            aria-label="Iniciar Sesión"
          >
            Iniciar Sesión
          </button>
        </div>

        {/* Feature Pills */}
        <div className="flex flex-wrap justify-center gap-4 text-sm font-medium text-gray-600 animate-fade-in-up animation-delay-600">
          <div className="flex items-center gap-2 px-4 py-2 bg-gray-50 rounded-lg border border-gray-100">
            <Zap className="w-4 h-4 text-amber-500" />
            <span>Configuración en 2 minutos</span>
          </div>
          <div className="flex items-center gap-2 px-4 py-2 bg-gray-50 rounded-lg border border-gray-100">
            <TrendingUp className="w-4 h-4 text-green-500" />
            <span>Sin tarjeta de crédito</span>
          </div>
          <div className="flex items-center gap-2 px-4 py-2 bg-gray-50 rounded-lg border border-gray-100">
            <Sparkles className="w-4 h-4 text-indigo-500" />
            <span>Prueba Premium incluida</span>
          </div>
        </div>



      </div>

      <style jsx>{`
        .perspective-1000 {
            perspective: 1000px;
        }
        .rotate-x-12 {
            transform: rotateX(12deg);
        }
        @keyframes gradient {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
        .animate-gradient {
          animation: gradient 6s ease infinite;
        }
        @keyframes fade-in-up {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-fade-in-up {
          animation: fade-in-up 0.8s cubic-bezier(0.16, 1, 0.3, 1);
        }
        .animate-fade-in {
             animation: fade-in 1s ease-out;
        }
         @keyframes fade-in {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        .animation-delay-200 { animation-delay: 0.1s; animation-fill-mode: backwards; }
        .animation-delay-400 { animation-delay: 0.2s; animation-fill-mode: backwards; }
        .animation-delay-600 { animation-delay: 0.3s; animation-fill-mode: backwards; }
        .animation-delay-800 { animation-delay: 0.4s; animation-fill-mode: backwards; }
      `}</style>
    </section>
  );
}
