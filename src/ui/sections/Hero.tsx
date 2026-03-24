"use client";

import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { ArrowRight, CheckCircle2, TrendingUp, Home, MessageSquare, FileText } from "lucide-react";

const TRUST_PILLS = [
    "Publicación Ilimitada",
    "Gestión de Alquileres",
    "Tasador Inteligente",
    "14 días gratis",
];

// Removed useCounter to avoid React re-renders on every tick.

const KPI_ROWS = [
    { label: "Casas vendidas este mes", value: 23, suffix: "", color: "#10b981", icon: Home, trend: "+18% vs mes anterior" },
    { label: "Consultas recibidas hoy", value: 47, suffix: "", color: "#818cf8", icon: MessageSquare, trend: "12 sin responder" },
    { label: "Alquileres al día", value: 98, suffix: "%", color: "#fbbf24", icon: FileText, trend: "de 156 contratos" },
    { label: "Ingreso del mes", value: 4182000, suffix: "", color: "#a78bfa", icon: TrendingUp, trend: "+9% vs mes anterior", format: "currency" as const },
];

function KpiRow({ label, value, suffix, color, icon: Icon, trend, format }: typeof KPI_ROWS[0]) {
    const valueRef = useRef<HTMLParagraphElement>(null);

    useEffect(() => {
        let timer: NodeJS.Timeout;
        const duration = 1400;
        const steps = 40;
        const interval = duration / steps;
        
        const delay = setTimeout(() => {
            let current = 0;
            timer = setInterval(() => {
                current++;
                const count = Math.round((value * current) / steps);
                if (valueRef.current) {
                    const display = format === "currency"
                        ? `$${(count / 1000000).toFixed(count >= 1000000 ? 1 : 0)}M`
                        : `${count.toLocaleString("es-AR")}${suffix}`;
                    valueRef.current.textContent = display;
                }
                if (current >= steps) clearInterval(timer);
            }, interval);
        }, 100);

        return () => {
            clearTimeout(delay);
            clearInterval(timer);
        };
    }, [value, suffix, format]);

    return (
        <div className="flex items-center gap-3 py-3 border-b border-white/[0.08] last:border-0">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                style={{ background: `${color}25` }}>
                <Icon size={15} style={{ color }} />
            </div>
            <div className="flex-1 min-w-0">
                <p className="text-xs text-gray-300 leading-none mb-1 font-medium truncate">{label}</p>
                <p className="text-[11px] text-gray-500 leading-none truncate">{trend}</p>
            </div>
            <p ref={valueRef} className="text-lg font-extrabold tabular-nums shrink-0" style={{ color }}>
                {format === "currency" ? "$0M" : `0${suffix}`}
            </p>
        </div>
    );
}

const ACTIVITY = [
    { msg: "Nueva consulta en Castelar", time: "hace 2 min", dot: "#818cf8" },
    { msg: "Alquiler renovado — Morón", time: "hace 8 min", dot: "#10b981" },
    { msg: "Tasación solicitada — Palermo", time: "hace 15 min", dot: "#fbbf24" },
    { msg: "Propiedad publicada — Ituzaingó", time: "hace 21 min", dot: "#a78bfa" },
];

export default function Hero() {
    const [activeActivity, setActiveActivity] = useState(0);
    const tiltCardRef = useRef<HTMLDivElement>(null);
    const bgRef = useRef<HTMLDivElement>(null);
    const textGroupRef = useRef<HTMLDivElement>(null);
    const cardContainerRef = useRef<HTMLDivElement>(null);
    const [tilt, setTilt] = useState({ x: 0, y: 0 });

    // Cycle activity feed (delayed start for Lighthouse LCP window)
    useEffect(() => {
        let t: NodeJS.Timeout;
        const delayTimeout = setTimeout(() => {
            t = setInterval(() => setActiveActivity(a => (a + 1) % ACTIVITY.length), 2500);
        }, 4000);
        return () => {
            clearTimeout(delayTimeout);
            clearInterval(t);
        };
    }, []);

    // Parallax on scroll (no React state updates)
    useEffect(() => {
        let ticking = false;
        const onScroll = () => {
            if (!ticking) {
                window.requestAnimationFrame(() => {
                    const sy = window.scrollY;
                    if (bgRef.current) {
                        bgRef.current.style.background = `rgba(8,8,16,${Math.min(sy / 400, 0.6)})`;
                    }
                    if (textGroupRef.current) {
                        textGroupRef.current.style.transform = `translateY(${-sy * 0.08}px)`;
                        textGroupRef.current.style.opacity = `${Math.max(1 - sy / 500, 0)}`;
                    }
                    if (cardContainerRef.current) {
                        cardContainerRef.current.style.transform = `translateY(${-sy * 0.04}px)`;
                    }
                    ticking = false;
                });
                ticking = true;
            }
        };
        window.addEventListener("scroll", onScroll, { passive: true });
        return () => window.removeEventListener("scroll", onScroll);
    }, []);

    // Mouse tilt effect on card
    const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
        const rect = e.currentTarget.getBoundingClientRect();
        const x = ((e.clientY - rect.top) / rect.height - 0.5) * -14;
        const y = ((e.clientX - rect.left) / rect.width - 0.5) * 14;
        setTilt({ x, y });
    };
    const handleMouseLeave = () => setTilt({ x: 0, y: 0 });

    return (
        <section className="relative w-full min-h-screen md:h-screen flex items-start md:items-center overflow-hidden bg-[#080810] pt-24 md:pt-0">

            {/* Dot grid */}
            <div className="absolute inset-0 pointer-events-none" style={{
                backgroundImage: "radial-gradient(rgba(255,255,255,0.07) 1px, transparent 1px)",
                backgroundSize: "28px 28px",
            }} />

            {/* Animated blobs */}
            <div className="blob blob-1" />
            <div className="blob blob-2" />
            <div className="blob blob-3" />

            {/* Scroll-parallax vignette on blobs */}
            <div ref={bgRef} className="absolute inset-0 pointer-events-none transition-opacity duration-300"
                style={{ background: `rgba(8,8,16,0)` }} />

            <div className="relative z-10 max-w-7xl mx-auto px-6 lg:px-16 w-full">
                <div className="grid lg:grid-cols-[1fr_420px] gap-14 items-center">

                    {/* LEFT — text scrolls up slightly on scroll */}
                    <div ref={textGroupRef} style={{ transform: `translateY(0px)`, opacity: 1, transition: "opacity 0.1s" }}>

                        {/* Main headline */}
                        <h1 className="text-4xl sm:text-5xl lg:text-5xl xl:text-6xl font-extrabold leading-[1.08] tracking-tight text-white mb-6">
                            ¡El portal que se adapta<br />
                            <span className="text-gradient">a las necesidades</span><br />
                            de tu inmobiliaria!
                        </h1>

                        {/* Subtitle */}
                        <p className="text-gray-300 text-base sm:text-lg leading-relaxed max-w-xl mb-10">
                            Mucho más que una web de avisos: somos el{" "}
                            <span className="text-white font-semibold">ecosistema de gestión integral (ERP)</span>{" "}
                            diseñado para que recuperes el control de tu oficina. En Zeta Prop no sos un número de cliente;{" "}
                            <span className="text-indigo-300 font-semibold">crecemos desde las bases con vos</span>,
                            escuchando cada una de tus sugerencias para evolucionar juntos.
                        </p>

                        {/* CTAs */}
                        <div className="flex flex-col sm:flex-row gap-4 mb-12">
                            <Link href="/register"
                                className="group inline-flex items-center justify-center gap-3 px-8 py-4 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-base rounded-2xl transition-all duration-200 hover:shadow-2xl hover:shadow-indigo-500/30 hover:-translate-y-1 active:scale-95">
                                Registrá tu Inmobiliaria Gratis
                                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                            </Link>
                            <Link href="/precios"
                                className="inline-flex items-center justify-center gap-2 px-8 py-4 text-gray-200 hover:text-white font-semibold text-base rounded-2xl border border-white/15 hover:border-white/30 hover:bg-white/8 transition-all duration-200">
                                Ver planes y precios
                            </Link>
                        </div>

                        {/* Trust pills */}
                        <div className="flex flex-wrap gap-3">
                            {TRUST_PILLS.map(label => (
                                <div key={label} className="flex items-center gap-1.5 text-sm text-gray-300 border border-white/15 rounded-full px-3 py-1.5 bg-white/[0.04] hover:bg-white/[0.08] transition-colors cursor-default">
                                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                                    {label}
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* RIGHT — tilt card */}
                    <div
                        ref={cardContainerRef}
                        className="hidden lg:block cursor-default"
                        style={{ perspective: "900px", transform: `translateY(0px)` }}
                        onMouseMove={handleMouseMove}
                        onMouseLeave={handleMouseLeave}
                    >
                        <div
                            className="rounded-2xl border border-white/10 overflow-hidden transition-transform duration-200 ease-out"
                            style={{
                                background: "rgba(10,10,22,0.88)",
                                backdropFilter: "blur(20px)",
                                transform: `rotateX(${tilt.x}deg) rotateY(${tilt.y}deg) scale(${tilt.x || tilt.y ? 1.02 : 1})`,
                                boxShadow: tilt.x || tilt.y
                                    ? "0 30px 80px rgba(99,102,241,0.18), 0 0 0 1px rgba(129,140,248,0.15)"
                                    : "0 20px 60px rgba(0,0,0,0.4)",
                            }}
                        >
                            {/* Header */}
                            <div className="flex items-center justify-between px-5 py-4 border-b border-white/[0.08]">
                                <div>
                                    <p className="text-[11px] text-gray-400 uppercase tracking-wider font-bold mb-0.5">Tu Dashboard</p>
                                    <p className="text-sm font-semibold text-white">Resumen del mes</p>
                                </div>
                                <div className="flex items-center gap-1.5 bg-emerald-500/10 border border-emerald-500/20 rounded-full px-2.5 py-1">
                                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                                    <span className="text-[11px] text-emerald-400 font-semibold">En vivo</span>
                                </div>
                            </div>

                            {/* KPIs */}
                            <div className="px-5 py-1">
                                {KPI_ROWS.map(row => <KpiRow key={row.label} {...row} />)}
                            </div>

                            {/* Activity feed */}
                            <div className="border-t border-white/[0.08] px-5 py-4">
                                <p className="text-[11px] text-gray-400 uppercase tracking-wider font-bold mb-3">Actividad reciente</p>
                                <div className="space-y-2">
                                    {ACTIVITY.map((a, i) => (
                                        <div key={i} className={`flex items-center gap-3 rounded-lg px-2 py-1.5 transition-all duration-500 ${activeActivity === i ? 'bg-white/[0.06]' : 'opacity-40'}`}>
                                            <div className="w-1.5 h-1.5 rounded-full shrink-0 transition-all duration-500"
                                                style={{ backgroundColor: activeActivity === i ? a.dot : "#3f3f4f" }} />
                                            <p className="text-xs text-gray-200 flex-1 truncate">{a.msg}</p>
                                            <p className="text-[10px] text-gray-500 shrink-0">{a.time}</p>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>

                </div>
            </div>

            <style>{`
                /* Gradient text */
                .text-gradient {
                  background: linear-gradient(135deg, #818cf8 0%, #c4b5fd 50%, #6ee7b7 100%);
                  -webkit-background-clip: text;
                  -webkit-text-fill-color: transparent;
                  background-clip: text;
                }

                /* Animated blobs */
                .blob {
                  position: absolute;
                  border-radius: 50%;
                  pointer-events: none;
                  animation: blobMove 12s ease-in-out infinite alternate;
                }
                .blob-1 { width: 500px; height: 500px; background: radial-gradient(circle, rgba(99,102,241,0.18) 0%, rgba(99,102,241,0) 70%); top: -10%; right: 5%; animation-duration: 14s; }
                .blob-2 { width: 380px; height: 380px; background: radial-gradient(circle, rgba(139,92,246,0.18) 0%, rgba(139,92,246,0) 70%); bottom: 0; left: 10%; animation-duration: 10s; animation-delay: -4s; }
                .blob-3 { width: 300px; height: 300px; background: radial-gradient(circle, rgba(16,185,129,0.09) 0%, rgba(16,185,129,0) 70%); top: 40%; right: 30%; animation-duration: 16s; animation-delay: -8s; }

                @keyframes blobMove {
                  0%   { transform: translate(0, 0) scale(1); }
                  33%  { transform: translate(30px, -30px) scale(1.05); }
                  66%  { transform: translate(-20px, 20px) scale(0.97); }
                  100% { transform: translate(10px,-10px) scale(1.02); }
                }

                @keyframes blink { 0%,100% { opacity:1; } 50% { opacity:0; } }
                .animate-blink { animation: blink 1s step-end infinite; }
            `}</style>
        </section>
    );
}
