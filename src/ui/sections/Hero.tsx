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
            La revolución del Real Estate con IA
          </span>
        </div>

        {/* Main Headline */}
        <h1 className="text-5xl md:text-7xl font-bold text-gray-900 mb-6 leading-[1.1] animate-fade-in-up tracking-tight">
          Gestiona tu Inmobiliaria <br />
          <span className="bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-600 bg-clip-text text-transparent bg-[length:200%_auto] animate-gradient">
            Sin límites ni instalación
          </span>
        </h1>

        {/* Subheadline */}
        <p className="text-xl text-gray-600 mb-10 max-w-2xl mx-auto leading-relaxed animate-fade-in-up animation-delay-200">
          Centraliza propiedades, clientes y contratos en una plataforma 100% web.
          Accede desde cualquier lugar y potencia tus ventas con Inteligencia Artificial.
        </p>

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-16 animate-fade-in-up animation-delay-400">
          <button
            onClick={() => router.push('/register')}
            className="group px-8 py-4 bg-gray-900 text-white rounded-2xl font-semibold text-lg hover:bg-black hover:shadow-2xl hover:-translate-y-1 active:scale-95 transition-all duration-300 flex items-center gap-3"
          >
            Comenzar Gratis
            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform text-indigo-400" />
          </button>

          <button
            onClick={() => router.push('/login')}
            className="group px-8 py-4 bg-white text-gray-900 rounded-2xl font-semibold text-lg border border-gray-200 hover:border-indigo-200 hover:bg-indigo-50/50 hover:shadow-lg hover:-translate-y-1 active:scale-95 transition-all duration-300"
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

        {/* Mockup Placeholder - Glassy Effect */}
        <div className="mt-20 animate-fade-in-up animation-delay-800 perspective-1000">
          <div className="relative mx-auto max-w-5xl transform rotate-x-12 hover:rotate-x-0 transition-transform duration-700 ease-out">
            {/* Glow behind */}
            <div className="absolute -inset-4 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 rounded-[2rem] blur-2xl opacity-20 animate-pulse"></div>

            {/* Main Card */}
            <div className="relative bg-white rounded-2xl shadow-2xl border border-gray-200/50 overflow-hidden ring-1 ring-gray-900/5">
              {/* Header of Mockup */}
              <div className="h-10 bg-gray-50 border-b border-gray-100 flex items-center px-4 gap-2">
                <div className="flex gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-red-400/80"></div>
                  <div className="w-3 h-3 rounded-full bg-yellow-400/80"></div>
                  <div className="w-3 h-3 rounded-full bg-green-400/80"></div>
                </div>
              </div>
              {/* Body of Mockup - Abstract Representation */}
              <div className="aspect-[16/9] bg-white p-8 overflow-hidden relative">
                {/* Sidebar */}
                <div className="absolute left-0 top-0 bottom-0 w-64 border-r border-gray-100 p-6 hidden md:block">
                  <div className="w-8 h-8 bg-indigo-600 rounded-lg mb-8"></div>
                  <div className="space-y-4">
                    <div className="h-2 w-32 bg-gray-100 rounded"></div>
                    <div className="h-2 w-24 bg-gray-100 rounded"></div>
                    <div className="h-2 w-28 bg-gray-100 rounded"></div>
                    <div className="h-2 w-20 bg-gray-100 rounded"></div>
                  </div>
                </div>
                {/* Main Content Area */}
                <div className="md:ml-64 h-full flex flex-col">
                  <div className="flex justify-between items-center mb-8">
                    <div className="h-8 w-48 bg-gray-100 rounded-lg"></div>
                    <div className="flex gap-3">
                      <div className="h-8 w-8 bg-gray-100 rounded-full"></div>
                      <div className="h-8 w-8 bg-gray-100 rounded-full"></div>
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-6 mb-8">
                    <div className="h-32 bg-indigo-50 rounded-xl border border-indigo-100"></div>
                    <div className="h-32 bg-purple-50 rounded-xl border border-purple-100"></div>
                    <div className="h-32 bg-pink-50 rounded-xl border border-pink-100"></div>
                  </div>
                  <div className="flex-1 bg-gray-50 rounded-xl border border-gray-100"></div>
                </div>
              </div>
            </div>
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
