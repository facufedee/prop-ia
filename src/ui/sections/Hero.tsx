"use client";

import Link from "next/link";
import Image from "next/image";
import { ArrowRight, Sparkles, TrendingUp, Zap, Clock, ShieldCheck } from "lucide-react";
import { useRouter } from "next/navigation";

export default function Hero() {
  const router = useRouter();

  return (
    <section className="relative min-h-screen flex items-center overflow-hidden bg-white pt-20 lg:pt-0">
      {/* Modern Background Gradients */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] right-[-5%] w-[60%] h-[60%] bg-indigo-100/40 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-10%] left-[-10%] w-[50%] h-[50%] bg-purple-100/40 rounded-full blur-[100px]" />
      </div>

      <div className="relative max-w-7xl mx-auto px-6 w-full z-10">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-8 items-center">

          {/* Left Column: Text & CTA */}
          <div className="text-center lg:text-left pt-8 lg:pt-0">

            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-white border border-indigo-100 rounded-full shadow-sm mb-6 animate-fade-in hover:scale-105 transition-transform cursor-default mx-auto lg:mx-0">
              <Sparkles className="w-4 h-4 text-indigo-600" />
              <span className="text-xs sm:text-sm font-medium text-gray-800">
                La revolución del Real Estate en Argentina 🇦🇷
              </span>
            </div>

            {/* Main Headline */}
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 mb-6 leading-[1.1] animate-fade-in-up tracking-tight">
              Gestioná tus Alquileres <br />
              <span className="bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-600 bg-clip-text text-transparent bg-[length:200%_auto] animate-gradient">
                en tiempo récord
              </span>
            </h1>

            {/* Subheadline (SEO & Persuasion) */}
            <p className="text-lg text-gray-600 mb-8 max-w-2xl mx-auto lg:mx-0 leading-relaxed animate-fade-in-up animation-delay-200">
              Automatizá tu inmobiliaria en tan solo <span className="font-semibold text-gray-900">10 minutos</span>. Carga propiedades, inquilinos y propietarios una sola vez y ahorrá horas de trabajo.
              <br className="hidden sm:block mt-2" />
              Cobranzas en un click, portal de inquilinos, informes profesionales y aumentos automáticos. Todo en una sola plataforma.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start items-center mb-10 animate-fade-in-up animation-delay-400">
              <button
                onClick={() => router.push('/register')}
                className="group w-full sm:w-auto px-8 py-4 bg-gray-900 text-white rounded-2xl font-semibold text-lg hover:bg-black hover:shadow-xl hover:-translate-y-1 active:scale-95 transition-all duration-300 flex items-center justify-center gap-3"
                aria-label="Comenzar Gratis - Registro"
              >
                Comenzar Gratis
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform text-indigo-400" />
              </button>

              <button
                onClick={() => router.push('/login')}
                className="group w-full sm:w-auto px-8 py-4 bg-white text-gray-900 rounded-2xl font-semibold text-lg border border-gray-200 hover:border-indigo-200 hover:bg-indigo-50/50 hover:shadow-lg hover:-translate-y-1 active:scale-95 transition-all duration-300"
                aria-label="Iniciar Sesión"
              >
                Iniciar Sesión
              </button>
            </div>

            {/* Feature Pills */}
            <div className="flex flex-wrap justify-center lg:justify-start gap-3 sm:gap-4 text-sm font-medium text-gray-600 animate-fade-in-up animation-delay-600">
              <div className="flex items-center gap-2 px-3 py-1.5 bg-gray-50/80 backdrop-blur-sm rounded-lg border border-gray-100">
                <Clock className="w-4 h-4 text-indigo-500" />
                <span>Ahorrá +20hs semanales</span>
              </div>
              <div className="flex items-center gap-2 px-3 py-1.5 bg-gray-50/80 backdrop-blur-sm rounded-lg border border-gray-100">
                <ShieldCheck className="w-4 h-4 text-green-500" />
                <span>Cobranza Segura</span>
              </div>
            </div>
          </div>

          {/* Right Column: Tablet Mockup */}
          <div className="relative flex justify-center lg:justify-end animate-fade-in-up animation-delay-600 pb-16 lg:pb-0 perspective-1000">
            {/* Floating Container */}
            <div className="relative w-full max-w-[500px] lg:max-w-[600px] transform hover:scale-[1.02] transition-transform duration-700 ease-in-out">
              {/* Glow Effect behind Tablet */}
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[90%] h-[90%] bg-indigo-500/20 blur-[60px] rounded-full -z-10 animate-pulse-slow"></div>

              {/* Tablet Image with Floating Animation */}
              <div className="animate-float">
                <img
                  src="/assets/img/tablet_mockup_zetaprop.png?v=updated"
                  alt="ZetaProp Dashboard en Tablet"
                  width={800}
                  height={600}
                  className="drop-shadow-2xl rounded-[2rem] object-contain w-full h-auto"
                />
              </div>
            </div>
          </div>

        </div>
      </div>

      <style jsx>{`
        .perspective-1000 {
            perspective: 1000px;
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
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-fade-in-up {
          animation: fade-in-up 0.8s cubic-bezier(0.16, 1, 0.3, 1) forwards;
          opacity: 0; /* Helper to ensure delay works */
        }
        .animate-fade-in {
             animation: fade-in 1s ease-out forwards;
        }
         @keyframes fade-in {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes float {
            0% { transform: translateY(0px); }
            50% { transform: translateY(-15px); }
            100% { transform: translateY(0px); }
        }
        .animate-float {
            animation: float 6s ease-in-out infinite;
        }
        .animate-pulse-slow {
             animation: pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite;
        }
        .animation-delay-200 { animation-delay: 0.2s; }
        .animation-delay-400 { animation-delay: 0.3s; }
        .animation-delay-600 { animation-delay: 0.5s; }
        .animation-delay-800 { animation-delay: 0.7s; }
      `}</style>
    </section>
  );
}
