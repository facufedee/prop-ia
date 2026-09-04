"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Quote } from "lucide-react";

export default function HumanPromise() {
    return (
        <section className="relative w-full lg:min-h-screen flex items-center overflow-hidden bg-[#070710]">

            {/* Subtle grid */}
            <div
                className="absolute inset-0 pointer-events-none"
                style={{
                    backgroundImage: "radial-gradient(rgba(255,255,255,0.05) 1px, transparent 1px)",
                    backgroundSize: "32px 32px",
                }}
            />

            {/* Glow blob behind image */}
            <div className="absolute right-0 top-1/4 w-[600px] h-[600px] bg-indigo-800/20 rounded-full blur-[120px] pointer-events-none" />
            <div className="absolute left-1/4 bottom-0 w-[400px] h-[400px] bg-violet-900/15 rounded-full blur-[100px] pointer-events-none" />

            <div className="relative z-10 max-w-7xl mx-auto px-5 sm:px-8 lg:px-16 w-full py-14 sm:py-20 lg:py-24">
                <div className="grid lg:grid-cols-2 gap-16 items-center">

                    {/* LEFT — text */}
                    <div>
                        {/* Section label */}
                        <div className="inline-flex items-center gap-2 mb-8 px-3 py-1.5 rounded-full text-xs font-bold uppercase tracking-widest"
                            style={{ background: "rgba(99,102,241,0.12)", border: "1px solid rgba(129,140,248,0.3)", color: "#a5b4fc" }}>
                            🤝 Nuestra Promesa
                        </div>

                        {/* Headline */}
                        <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white leading-[1.1] tracking-tight mb-8">
                            Tu voz importa.{" "}
                            <span style={{
                                background: "linear-gradient(135deg,#818cf8,#c4b5fd)",
                                WebkitBackgroundClip: "text",
                                WebkitTextFillColor: "transparent",
                                backgroundClip: "text",
                            }}>
                                Siempre.
                            </span>
                        </h2>

                        {/* Quote mark */}
                        <Quote size={32} className="text-indigo-500/50 mb-4" />

                        {/* Main paragraph */}
                        <div className="space-y-5 mb-10">
                            <p className="text-gray-300 text-lg leading-relaxed">
                                Sabemos lo que se siente pagar una plataforma y que nadie te escuche. Por eso, desde nuestra versión básica,{" "}
                                <span className="text-white font-semibold">tenés un canal directo y prioritario</span>{" "}
                                para sugerir nuevos módulos, reportar mejoras o pedir las funcionalidades que tu inmobiliaria necesita para ser más eficiente.
                            </p>
                            <p className="text-gray-300 text-lg leading-relaxed">
                                No queremos que solo nos pagues una suscripción;{" "}
                                <span className="text-indigo-300 font-semibold">queremos ser tu socio tecnológico</span>.
                                Tu crecimiento es nuestro crecimiento, y nuestro compromiso es que nunca te sientas solo en la digitalización de tu negocio.
                            </p>
                            <p className="text-white font-bold text-xl">
                                Crecemos juntos. 🚀
                            </p>
                        </div>

                        {/* CTA */}
                        <div>
                            <Link
                                href="/register"
                                className="group inline-flex items-center justify-center gap-3 px-8 py-4 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-base rounded-2xl transition-all duration-200 hover:shadow-2xl hover:shadow-indigo-500/30 hover:-translate-y-1 active:scale-95 mb-3"
                            >
                                Empezá tu prueba gratuita de 14 días
                                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                            </Link>
                            <p className="text-sm text-gray-500 flex items-center gap-1.5 mt-3">
                                <span className="text-emerald-500">✓</span> Sin tarjetas, sin letra chica. Empezá a crecer hoy.
                            </p>
                        </div>
                    </div>

                    {/* RIGHT — image */}
                    <div className="relative flex justify-center lg:justify-end">
                        {/* Frame glow */}
                        <div className="absolute inset-4 bg-indigo-600/10 blur-2xl rounded-3xl" />

                        {/* Image container with border and overlay */}
                        <div className="relative w-full max-w-md rounded-3xl overflow-hidden border border-white/10 shadow-2xl shadow-black/60">
                            <Image
                                src="/assets/img/human_promise.png"
                                alt="Tu socio tecnológico inmobiliario"
                                width={600}
                                height={700}
                                className="object-cover w-full h-[480px] lg:h-[560px]"
                            />
                            {/* Dark gradient overlay at bottom */}
                            <div className="absolute inset-0 bg-gradient-to-t from-[#070710] via-transparent to-transparent" />

                            {/* Floating badge on image */}
                            <div className="absolute bottom-6 left-6 right-6">
                                <div className="flex items-center gap-3 bg-black/60 backdrop-blur-xl border border-white/10 rounded-2xl px-4 py-3">
                                    <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shrink-0" />
                                    <div>
                                        <p className="text-white text-sm font-semibold leading-tight">+64 inmobiliarias activas</p>
                                        <p className="text-gray-400 text-xs">creciendo con Zeta Prop hoy</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                </div>
            </div>
        </section>
    );
}
