"use client";

import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { ArrowRight, CheckCircle2, TrendingUp, Home, MessageSquare } from "lucide-react";

const TRUST_PILLS = [
    "Publicación Ilimitada",
    "Gestión de Alquileres",
    "Tasador Inteligente",
    "7 días gratis",
];

// Removed useCounter to avoid React re-renders on every tick.

type KpiRowData = {
    label: string;
    value: number;
    suffix?: string;
    color: string;
    icon: typeof Home;
    trend: string;
    format?: "currency";
};

const KPI_ROWS: KpiRowData[] = [
    { label: "Casas vendidas", value: 23, suffix: "", color: "#059669", icon: Home, trend: "+18% este mes" },
    { label: "Consultas hoy", value: 47, suffix: "", color: "#4f46e5", icon: MessageSquare, trend: "12 sin responder" },
];

const STAT_BADGE: KpiRowData = { label: "Ingreso del mes", value: 4182000, suffix: "", color: "#7c3aed", icon: TrendingUp, trend: "+9% vs mes anterior", format: "currency" };

function KpiRow({ label, value, suffix, color, icon: Icon, trend, format }: KpiRowData) {
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
        <div className="flex items-center gap-3 py-3 border-b border-gray-100 last:border-0">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                style={{ background: `${color}18` }}>
                <Icon size={15} style={{ color }} />
            </div>
            <div className="flex-1 min-w-0">
                <p className="text-xs text-gray-700 leading-none mb-1 font-medium truncate">{label}</p>
                <p className="text-[11px] text-gray-400 leading-none truncate">{trend}</p>
            </div>
            <p ref={valueRef} className="text-lg font-extrabold tabular-nums shrink-0" style={{ color }}>
                {format === "currency" ? "$0M" : `0${suffix}`}
            </p>
        </div>
    );
}

function StatValue({ value, color }: { value: number; color: string }) {
    const ref = useRef<HTMLParagraphElement>(null);

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
                if (ref.current) {
                    ref.current.textContent = `$${(count / 1000000).toFixed(count >= 1000000 ? 1 : 0)}M`;
                }
                if (current >= steps) clearInterval(timer);
            }, interval);
        }, 100);

        return () => {
            clearTimeout(delay);
            clearInterval(timer);
        };
    }, [value]);

    return <p ref={ref} className="text-base font-extrabold tabular-nums leading-none" style={{ color }}>$0M</p>;
}

const ACTIVITY = [
    { msg: "Nueva consulta en Castelar", time: "hace 2 min", dot: "#4f46e5" },
    { msg: "Alquiler renovado — Morón", time: "hace 8 min", dot: "#059669" },
    { msg: "Tasación solicitada — Palermo", time: "hace 15 min", dot: "#d97706" },
    { msg: "Propiedad publicada — Ituzaingó", time: "hace 21 min", dot: "#7c3aed" },
];

export default function Hero() {
    const [activeActivity, setActiveActivity] = useState(0);
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

    // Mouse tilt effect on photo
    const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
        const rect = e.currentTarget.getBoundingClientRect();
        const x = ((e.clientY - rect.top) / rect.height - 0.5) * -8;
        const y = ((e.clientX - rect.left) / rect.width - 0.5) * 8;
        setTilt({ x, y });
    };
    const handleMouseLeave = () => setTilt({ x: 0, y: 0 });

    return (
        <section className="relative w-full min-h-[100dvh] lg:min-h-0 flex items-start lg:items-center overflow-hidden bg-white pt-32 lg:pt-28 lg:pb-20 xl:pb-24">

            {/* Dot grid */}
            <div className="absolute inset-0 pointer-events-none" style={{
                backgroundImage: "radial-gradient(rgba(79,70,229,0.07) 1px, transparent 1px)",
                backgroundSize: "28px 28px",
            }} />

            {/* Soft decorative glows */}
            <div className="absolute -top-24 -right-24 w-[420px] h-[420px] bg-gradient-to-br from-indigo-100 to-purple-100 rounded-full blur-3xl opacity-70 pointer-events-none" />
            <div className="absolute bottom-0 -left-24 w-[380px] h-[380px] bg-gradient-to-tr from-emerald-50 to-indigo-50 rounded-full blur-3xl opacity-60 pointer-events-none" />

            <div className="relative z-10 max-w-[1400px] mx-auto px-5 sm:px-8 lg:px-12 w-full">
                <div className="grid lg:grid-cols-[1fr_380px] xl:grid-cols-[1fr_420px] gap-8 lg:gap-12 xl:gap-20 items-center">

                    {/* LEFT — text scrolls up slightly on scroll */}
                    <div ref={textGroupRef} className="flex flex-col text-center lg:text-left items-center lg:items-start w-full" style={{ transform: `translateY(0px)`, opacity: 1, transition: "opacity 0.1s" }}>

                        {/* Main headline */}
                        <h1 className="text-4xl sm:text-5xl lg:text-4xl xl:text-5xl font-extrabold leading-[1.08] tracking-tight text-gray-900 mb-6">
                            Vendé más,{" "}
                            <br className="hidden lg:block" />
                            alquilá mejor,{" "}
                            <br className="hidden lg:block" />
                            <span className="text-indigo-600">sin planillas.</span>
                        </h1>

                        {/* Subtitle */}
                        <div className="text-gray-600 text-[15px] sm:text-lg leading-relaxed max-w-xl mx-auto lg:mx-0 mb-10">
                            <p>
                                Centralizá <span className="text-gray-900 font-semibold">clientes, leads y alquileres</span> en un solo lugar.
                                Con <span className="text-gray-900 font-semibold">tasación inteligente</span> y tu propia <span className="text-indigo-600 font-semibold">página web conectada</span>,
                                tu inmobiliaria trabaja sola mientras vos cerrás operaciones.
                            </p>
                            <p className="mt-4 text-gray-500 italic text-sm sm:text-base">
                                Evolucionamos con vos, adaptándonos a cada requerimiento de tu inmobiliaria.
                            </p>
                        </div>

                        {/* CTAs */}
                        <div className="flex flex-col items-center lg:items-start gap-3 mb-10 w-full">
                            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 w-full sm:w-auto">
                                <Link href="/register"
                                    className="group flex items-center justify-center gap-3 px-6 py-4 sm:px-8 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-[15px] sm:text-base rounded-2xl transition-colors duration-200 hover:shadow-xl hover:shadow-indigo-500/20 active:scale-95">
                                    ¡Probá Zeta Prop Gratis!
                                    <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform flex-shrink-0" />
                                </Link>
                                <Link href="/precios"
                                    className="flex items-center justify-center gap-2 px-6 py-4 sm:px-8 text-gray-700 hover:text-gray-900 font-semibold text-[15px] sm:text-base rounded-2xl border border-gray-300 hover:border-gray-400 hover:bg-gray-50 transition-colors duration-200">
                                    Ver planes y precios
                                </Link>
                            </div>
                            <p className="text-[12px] sm:text-[13px] text-gray-500 font-medium px-2">
                                <span className="text-gray-900 font-bold">Sin tarjetas, sin pagos anticipados, ¡NADA!</span> Activación instantánea en un clic.
                            </p>
                        </div>

                        {/* Trust pills */}
                        <div className="flex flex-wrap items-center justify-center lg:justify-start gap-2.5">
                            {TRUST_PILLS.map(label => (
                                <div key={label} className="flex items-center gap-1.5 text-[13px] sm:text-sm text-gray-700 border border-gray-200 rounded-full px-3 py-1.5 bg-gray-50 hover:bg-gray-100 transition-colors cursor-default">
                                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                                    {label}
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* RIGHT — agent photo with floating product cards */}
                    <div ref={cardContainerRef} className="relative mx-auto w-full max-w-[300px] sm:max-w-[340px] lg:max-w-none lg:w-full mt-4 lg:mt-0">
                        <div className="relative mx-auto w-full max-w-[300px] lg:max-w-[380px] xl:max-w-[420px]">

                            {/* Decorative backdrop behind photo */}
                            <div className="absolute -inset-4 lg:-inset-6 bg-gradient-to-br from-indigo-100 via-indigo-50 to-purple-50 rounded-[2.5rem] -z-10" />
                            <div className="absolute -top-6 -right-6 w-40 h-40 lg:w-56 lg:h-56 bg-gradient-to-br from-indigo-200/70 to-purple-200/70 rounded-full blur-2xl -z-10" />

                            {/* Photo, subtle tilt on desktop mouse move */}
                            <div
                                className="cursor-default"
                                style={{ perspective: "900px" }}
                                onMouseMove={handleMouseMove}
                                onMouseLeave={handleMouseLeave}
                            >
                                <div
                                    className="transition-transform duration-200 ease-out"
                                    style={{ transform: `rotateX(${tilt.x}deg) rotateY(${tilt.y}deg)` }}
                                >
                                    <Image
                                        src="/images/agente.png"
                                        alt="Agente inmobiliaria gestionando su cartera con Zeta Prop"
                                        width={1024}
                                        height={1536}
                                        priority
                                        className="relative z-0 w-full h-auto select-none drop-shadow-2xl"
                                    />
                                </div>
                            </div>

                            {/* Floating dashboard card — top-left over photo */}
                            <div className="absolute top-3 -left-3 sm:top-6 sm:-left-6 lg:-left-12 z-20 w-[190px] sm:w-[215px] rounded-2xl border border-gray-200 bg-white/95 backdrop-blur-xl shadow-xl shadow-indigo-500/10 overflow-hidden">
                                <div className="flex items-center justify-between px-3.5 pt-3 pb-2">
                                    <div>
                                        <p className="text-[9px] text-gray-500 uppercase tracking-wider font-bold leading-none mb-1">Tu Dashboard</p>
                                        <p className="text-[11px] font-semibold text-gray-900 leading-none">Resumen del mes</p>
                                    </div>
                                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse shrink-0" />
                                </div>
                                <div className="px-3.5 pb-1">
                                    {KPI_ROWS.map(row => <KpiRow key={row.label} {...row} />)}
                                </div>
                                <div className="border-t border-gray-100 px-3.5 py-2">
                                    <div className="flex items-center gap-2 transition-opacity duration-500" key={activeActivity}>
                                        <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: ACTIVITY[activeActivity].dot }} />
                                        <p className="text-[10px] text-gray-500 truncate leading-none">{ACTIVITY[activeActivity].msg}</p>
                                    </div>
                                </div>
                            </div>

                            {/* Floating stat badge — bottom-right over photo */}
                            <div className="absolute bottom-6 -right-3 sm:bottom-10 sm:-right-6 lg:-right-8 z-20 flex items-center gap-2.5 rounded-2xl border border-gray-200 bg-white/95 backdrop-blur-xl shadow-xl shadow-indigo-500/10 px-3.5 py-3">
                                <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" style={{ background: `${STAT_BADGE.color}18` }}>
                                    <STAT_BADGE.icon size={15} style={{ color: STAT_BADGE.color }} />
                                </div>
                                <div className="min-w-0">
                                    <p className="text-[10px] text-gray-500 leading-none mb-1 truncate">{STAT_BADGE.label}</p>
                                    <div className="flex items-baseline gap-1.5">
                                        <StatValue value={STAT_BADGE.value} color={STAT_BADGE.color} />
                                        <span className="text-[10px] font-semibold text-emerald-500 whitespace-nowrap">{STAT_BADGE.trend}</span>
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
