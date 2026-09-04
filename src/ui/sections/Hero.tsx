"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ArrowRight, CheckCircle2, TrendingUp, Home, MessageSquare } from "lucide-react";

const TRUST_PILLS = [
    "Publicación Ilimitada",
    "Gestión de Alquileres",
    "Tasador Inteligente",
    "14 días gratis",
];

const prefersReducedMotion = () =>
    typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

type KpiRowData = {
    label: string;
    value: number;
    color: string;
    icon: typeof Home;
    trend: string;
    format?: "currency";
};

const KPI_ROWS: KpiRowData[] = [
    { label: "Casas vendidas", value: 23, color: "var(--color-positive)", icon: Home, trend: "+18% este mes" },
    { label: "Consultas hoy", value: 47, color: "var(--color-accent)", icon: MessageSquare, trend: "12 sin responder" },
];

const STAT_BADGE: KpiRowData = { label: "Ingreso del mes", value: 4182000, color: "var(--color-accent)", icon: TrendingUp, trend: "+9% vs mes anterior", format: "currency" };

const CHART_BARS = [38, 52, 44, 61, 58, 74];

function CountUpValue({ value, format, color }: { value: number; format?: "currency"; color?: string }) {
    const ref = useRef<HTMLParagraphElement>(null);

    const render = (n: number) =>
        format === "currency" ? `$${(n / 1000000).toFixed(n >= 1000000 ? 1 : 0)}M` : n.toLocaleString("es-AR");

    useEffect(() => {
        if (!ref.current) return;
        if (prefersReducedMotion()) {
            ref.current.textContent = render(value);
            return;
        }

        let timer: NodeJS.Timeout;
        const steps = 36;
        const duration = 1200;
        const delay = setTimeout(() => {
            let current = 0;
            timer = setInterval(() => {
                current++;
                if (ref.current) ref.current.textContent = render(Math.round((value * current) / steps));
                if (current >= steps) clearInterval(timer);
            }, duration / steps);
        }, 150);

        return () => {
            clearTimeout(delay);
            clearInterval(timer);
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [value, format]);

    return (
        <p ref={ref} className="l-mock__stat-value" style={color ? { color } : undefined}>
            {format === "currency" ? "$0M" : "0"}
        </p>
    );
}

const ACTIVITY = [
    "Nueva consulta en Castelar",
    "Alquiler renovado — Morón",
    "Tasación solicitada — Palermo",
    "Propiedad publicada — Ituzaingó",
];

function ActivityFeed() {
    const [active, setActive] = useState(0);

    useEffect(() => {
        if (prefersReducedMotion()) return;
        let interval: NodeJS.Timeout;
        const delay = setTimeout(() => {
            interval = setInterval(() => setActive((a) => (a + 1) % ACTIVITY.length), 2600);
        }, 4000);
        return () => {
            clearTimeout(delay);
            clearInterval(interval);
        };
    }, []);

    return (
        <div className="l-mock__feed">
            <span className="l-mock__feed-dot" style={{ background: "var(--color-accent)" }} />
            <span className="l-mock__feed-text">{ACTIVITY[active]}</span>
        </div>
    );
}

export default function Hero() {
    const heroRef = useRef<HTMLElement>(null);

    // HP3 cursor-spotlight — scoped to the hero only, never page-wide.
    useEffect(() => {
        const hero = heroRef.current;
        if (!hero || prefersReducedMotion()) return;
        const bg = hero.querySelector<HTMLElement>(".l-hero__bg");
        if (!bg) return;

        const onMove = (e: PointerEvent) => {
            const r = hero.getBoundingClientRect();
            bg.style.setProperty("--mx", `${((e.clientX - r.left) / r.width) * 100}%`);
            bg.style.setProperty("--my", `${((e.clientY - r.top) / r.height) * 100}%`);
        };
        hero.addEventListener("pointermove", onMove);
        return () => hero.removeEventListener("pointermove", onMove);
    }, []);

    return (
        <section ref={heroRef} className="l-hero">
            <div className="l-hero__bg" aria-hidden="true" />

            <div className="l-hero__grid">
                {/* LEFT — copy */}
                <div className="l-reveal" style={{ ["--i" as string]: 0 }}>
                    <h1>
                        <span className="l-hero__lead-in">Más que un CRM.</span>
                        <span className="l-hero__headline">Gestión inteligente para inmobiliarias.</span>
                    </h1>

                    <p className="l-hero__lede">
                        Centralizá <strong>propiedades, alquileres y clientes</strong> en un solo lugar. Con{" "}
                        <strong>tasación inteligente</strong> y tu propio sitio web conectado, tu inmobiliaria
                        trabaja mientras vos cerrás operaciones.
                    </p>

                    <div className="l-hero__ctas">
                        <Link href="/register" className="l-btn l-btn--primary">
                            Probar gratis
                            <ArrowRight size={18} />
                        </Link>
                        <Link href="/precios" className="l-btn l-btn--secondary">
                            Ver planes y precios
                        </Link>
                    </div>

                    <p className="l-hero__fineprint">
                        <strong>Sin tarjetas, sin pagos anticipados.</strong> Activación instantánea en un clic.
                    </p>

                    <ul className="l-pills">
                        {TRUST_PILLS.map((label) => (
                            <li key={label}>
                                <CheckCircle2 size={13} />
                                {label}
                            </li>
                        ))}
                    </ul>
                </div>

                {/* RIGHT — dashboard mockup (Tier A CSS-art, illustrative sample data) */}
                <div className="l-reveal" style={{ ["--i" as string]: 1 }}>
                    <div className="l-mock" aria-hidden="true">
                        <div className="l-mock__bar">
                            <span className="l-mock__bar-label">Tu dashboard · Resumen del mes</span>
                            <span className="l-mock__dot" />
                        </div>
                        <div className="l-mock__body">
                            <div className="l-mock__stats">
                                {KPI_ROWS.map((row) => (
                                    <div key={row.label} className="l-mock__stat">
                                        <p className="l-mock__stat-label">
                                            <row.icon size={12} style={{ color: row.color }} />
                                            {row.label}
                                        </p>
                                        <CountUpValue value={row.value} color={row.color} />
                                        <p className="l-mock__stat-trend">{row.trend}</p>
                                    </div>
                                ))}
                            </div>

                            <div className="l-mock__chart">
                                {CHART_BARS.map((h, i) => (
                                    <div key={i} className="l-mock__bar-col" style={{ height: `${h}%` }} />
                                ))}
                            </div>

                            <div className="l-mock__stat">
                                <p className="l-mock__stat-label">
                                    <STAT_BADGE.icon size={12} style={{ color: STAT_BADGE.color }} />
                                    {STAT_BADGE.label}
                                </p>
                                <CountUpValue value={STAT_BADGE.value} format={STAT_BADGE.format} color={STAT_BADGE.color} />
                                <p className="l-mock__stat-trend">{STAT_BADGE.trend}</p>
                            </div>

                            <ActivityFeed />
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}
