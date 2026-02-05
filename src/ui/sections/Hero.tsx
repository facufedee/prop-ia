"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { ArrowRight, Sparkles, Clock, ShieldCheck, Building2, HardHat, MapPin, ChevronLeft, ChevronRight } from "lucide-react";
import { useRouter } from "next/navigation";

export default function Hero() {
  const router = useRouter();
  const [currentSlide, setCurrentSlide] = useState(0);

  const slides = [
    {
      id: "alquileres",
      theme: "indigo",
      badge: {
        icon: Sparkles,
        text: "La revolución del Real Estate en Argentina 🇦🇷",
        color: "text-indigo-600",
      },
      title: (
        <>
          Gestioná tus Alquileres <br />
          <span className="bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-600 bg-clip-text text-transparent bg-[length:200%_auto] animate-gradient">
            en tiempo récord
          </span>
        </>
      ),
      description: (
        <>
          Automatizá tu inmobiliaria en tan solo <span className="font-semibold text-gray-900">10 minutos</span>. Carga propiedades, inquilinos y propietarios una sola vez y ahorrá horas de trabajo.
          <br className="hidden sm:block mt-2" />
          Cobranzas en un click, portal de inquilinos, informes profesionales y aumentos automáticos.
        </>
      ),
      cta: {
        primary: { text: "Comenzar Gratis", action: "/register" },
        secondary: { text: "Iniciar Sesión", action: "/login" }
      },
      features: [
        { icon: Clock, text: "Ahorrá +20hs semanales", color: "text-indigo-500" },
        { icon: ShieldCheck, text: "Cobranza Segura", color: "text-green-500" }
      ],
      visual: (
        <div className="relative w-full max-w-[500px] lg:max-w-[600px] transform hover:scale-[1.02] transition-transform duration-700 ease-in-out">
          {/* Glow Effect */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[90%] h-[90%] bg-indigo-500/20 blur-[60px] rounded-full -z-10 animate-pulse-slow"></div>
          {/* Tablet Image */}
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
      )
    },
    {
      id: "emprendimientos",
      theme: "blue",
      badge: {
        icon: HardHat,
        text: "Nuevo Módulo de Construcciones 🏗️",
        color: "text-blue-600",
      },
      title: (
        <>
          Administración de <br />
          <span className="bg-gradient-to-r from-blue-600 via-cyan-500 to-blue-600 bg-clip-text text-transparent bg-[length:200%_auto] animate-gradient">
            Emprendimientos
          </span>
        </>
      ),
      description: (
        <>
          Llevá el control total de tus obras y desarrollos. Gestioná unidades, avances de obra, pagos y certificaciones en un solo lugar.
          <br className="hidden sm:block mt-2" />
          Ideal para desarrolladoras y constructoras que buscan eficiencia y transparencia.
        </>
      ),
      cta: {
        primary: { text: "Ver Demo", action: "/register" }, // Could route somewhere else if needed
        secondary: { text: "Saber Más", action: "/features/developments" } // Placeholder
      },
      features: [
        { icon: Building2, text: "Gestión de Unidades", color: "text-blue-500" },
        { icon: MapPin, text: "Seguimiento de Obras", color: "text-cyan-500" }
      ],
      visual: (
        <div className="relative w-full max-w-[500px] lg:max-w-[550px] perspective-1000">
          <div className="relative transform hover:scale-[1.02] transition-transform duration-700 ease-in-out">
            {/* Glow */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[90%] h-[90%] bg-blue-500/20 blur-[60px] rounded-full -z-10 animate-pulse-slow"></div>

            {/* Mock Dashboard UI Container */}
            <div className="bg-white/90 backdrop-blur-md border border-gray-200/80 rounded-2xl shadow-2xl p-4 sm:p-6 animate-float w-full">

              {/* Mock Header */}
              <div className="flex items-center justify-between mb-6 border-b border-gray-100 pb-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-50 rounded-lg">
                    <Building2 className="w-6 h-6 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-800 text-lg leading-tight">Torre Alvear II</h3>
                    <p className="text-xs text-gray-500 flex items-center gap-1"><MapPin size={10} /> Puerto Madero, CABA</p>
                  </div>
                </div>
                <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-bold border border-green-200">En Obra</span>
              </div>

              {/* Mock Stats Grid */}
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="bg-gray-50 rounded-xl p-3 border border-gray-100">
                  <p className="text-xs text-gray-400 mb-1">Avance de Obra</p>
                  <div className="flex items-end justify-between">
                    <span className="text-2xl font-bold text-gray-900">45%</span>
                    <div className="h-1.5 w-16 bg-gray-200 rounded-full mb-1.5 overflow-hidden">
                      <div className="h-full bg-blue-500 w-[45%] rounded-full"></div>
                    </div>
                  </div>
                </div>
                <div className="bg-gray-50 rounded-xl p-3 border border-gray-100">
                  <p className="text-xs text-gray-400 mb-1">Unidades Vendidas</p>
                  <div className="flex items-end gap-2">
                    <span className="text-2xl font-bold text-gray-900">12</span>
                    <span className="text-sm text-gray-500 mb-1">/ 24</span>
                  </div>
                </div>
              </div>

              {/* Mock Unit List */}
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 rounded-lg border border-gray-100 hover:border-blue-200 transition-colors bg-white shadow-sm">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-xs font-bold text-indigo-700">1A</div>
                    <div>
                      <p className="text-sm font-semibold text-gray-800">Departamento 2 Amb</p>
                      <p className="text-[10px] text-gray-500">Piso 1 - Frente</p>
                    </div>
                  </div>
                  <span className="text-xs font-medium text-green-600 bg-green-50 px-2 py-0.5 rounded">Vendido</span>
                </div>
                <div className="flex items-center justify-between p-3 rounded-lg border border-gray-100 hover:border-blue-200 transition-colors bg-white shadow-sm">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-xs font-bold text-gray-700">2B</div>
                    <div>
                      <p className="text-sm font-semibold text-gray-800">Departamento 3 Amb</p>
                      <p className="text-[10px] text-gray-500">Piso 2 - Contrafrente</p>
                    </div>
                  </div>
                  <span className="text-xs font-medium text-blue-600 bg-blue-50 px-2 py-0.5 rounded">Disponible</span>
                </div>
              </div>

            </div>
          </div>
        </div>
      )
    }
  ];

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev === slides.length - 1 ? 0 : prev + 1));
    }, 6000); // 6 seconds per slide
    return () => clearInterval(timer);
  }, [slides.length]);

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev === slides.length - 1 ? 0 : prev + 1));
  };

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev === 0 ? slides.length - 1 : prev - 1));
  };

  return (
    <section className="relative min-h-screen flex items-center overflow-hidden bg-white pt-20 lg:pt-0">
      {/* Background Gradients - Dynamic based on slide logic if wanted, currently static */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none transition-colors duration-1000">
        <div className="absolute top-[-10%] right-[-5%] w-[60%] h-[60%] bg-indigo-100/40 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-10%] left-[-10%] w-[50%] h-[50%] bg-purple-100/40 rounded-full blur-[100px]" />
      </div>

      <div className="relative max-w-7xl mx-auto px-6 w-full z-10">

        {/* Navigation Arrows (Optional - visible on hover or always) */}
        <button
          onClick={prevSlide}
          className="hidden lg:flex absolute left-0 top-1/2 -translate-y-1/2 -translate-x-12 p-2 rounded-full bg-white/50 hover:bg-white border border-gray-200 text-gray-600 hover:text-indigo-600 transition-all z-20"
          aria-label="Previous slide"
        >
          <ChevronLeft size={24} />
        </button>
        <button
          onClick={nextSlide}
          className="hidden lg:flex absolute right-0 top-1/2 -translate-y-1/2 translate-x-12 p-2 rounded-full bg-white/50 hover:bg-white border border-gray-200 text-gray-600 hover:text-indigo-600 transition-all z-20"
          aria-label="Next slide"
        >
          <ChevronRight size={24} />
        </button>


        <div className="relative grid grid-cols-1 items-center overflow-hidden">
          {/* Slide Content */}
          {slides.map((slide, index) => (
            <div
              key={slide.id}
              className={`col-start-1 row-start-1 w-full h-full transition-all duration-700 ease-in-out transform ${index === currentSlide
                  ? "opacity-100 translate-x-0 z-10"
                  : "opacity-0 translate-x-full -z-10 pointer-events-none"
                }`}
            >
              <div className="grid lg:grid-cols-2 gap-12 lg:gap-8 items-center h-full">

                {/* Left Column: Text & CTA */}
                <div className="text-center lg:text-left pt-8 lg:pt-0">
                  {/* Badge */}
                  <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-white border border-gray-100 rounded-full shadow-sm mb-6 animate-fade-in hover:scale-105 transition-transform cursor-default mx-auto lg:mx-0">
                    <slide.badge.icon className={`w-4 h-4 ${slide.badge.color}`} />
                    <span className="text-xs sm:text-sm font-medium text-gray-800">
                      {slide.badge.text}
                    </span>
                  </div>

                  {/* Main Headline */}
                  <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 mb-6 leading-[1.1] animate-fade-in-up tracking-tight">
                    {slide.title}
                  </h1>

                  {/* Subheadline */}
                  <p className="text-lg text-gray-600 mb-8 max-w-2xl mx-auto lg:mx-0 leading-relaxed animate-fade-in-up animation-delay-200">
                    {slide.description}
                  </p>

                  {/* CTA Buttons */}
                  <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start items-center mb-10 animate-fade-in-up animation-delay-400">
                    <button
                      onClick={() => router.push(slide.cta.primary.action)}
                      className="group w-full sm:w-auto px-8 py-4 bg-gray-900 text-white rounded-2xl font-semibold text-lg hover:bg-black hover:shadow-xl hover:-translate-y-1 active:scale-95 transition-all duration-300 flex items-center justify-center gap-3"
                    >
                      {slide.cta.primary.text}
                      <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform text-indigo-400" />
                    </button>

                    <button
                      onClick={() => router.push(slide.cta.secondary.action)}
                      className="group w-full sm:w-auto px-8 py-4 bg-white text-gray-900 rounded-2xl font-semibold text-lg border border-gray-200 hover:border-indigo-200 hover:bg-indigo-50/50 hover:shadow-lg hover:-translate-y-1 active:scale-95 transition-all duration-300"
                    >
                      {slide.cta.secondary.text}
                    </button>
                  </div>

                  {/* Feature Pills */}
                  <div className="flex flex-wrap justify-center lg:justify-start gap-3 sm:gap-4 text-sm font-medium text-gray-600 animate-fade-in-up animation-delay-600">
                    {slide.features.map((feature, i) => (
                      <div key={i} className="flex items-center gap-2 px-3 py-1.5 bg-gray-50/80 backdrop-blur-sm rounded-lg border border-gray-100">
                        <feature.icon className={`w-4 h-4 ${feature.color}`} />
                        <span>{feature.text}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Right Column: Visual */}
                <div className="relative flex justify-center lg:justify-end animate-fade-in-up animation-delay-600 pb-16 lg:pb-0 perspective-1000">
                  {slide.visual}
                </div>

              </div>
            </div>
          ))}
        </div>

        {/* Dots Navigation */}
        <div className="flex justify-center gap-2 mt-8 lg:mt-0 lg:absolute lg:bottom-10 lg:left-1/2 lg:-translate-x-1/2 z-20">
          {slides.map((_, idx) => (
            <button
              key={idx}
              onClick={() => setCurrentSlide(idx)}
              className={`w-3 h-3 rounded-full transition-all duration-300 ${currentSlide === idx
                ? "bg-indigo-600 w-8"
                : "bg-gray-300 hover:bg-indigo-400"
                }`}
              aria-label={`Go to slide ${idx + 1}`}
            />
          ))}
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
          opacity: 0; 
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
