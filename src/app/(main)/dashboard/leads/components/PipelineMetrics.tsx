"use client";

import { Lead } from "@/domain/models/Lead";
import { TrendingUp, Users, CalendarCheck, Target } from "lucide-react";

interface PipelineMetricsProps {
    leads: Lead[];
}

export default function PipelineMetrics({ leads }: PipelineMetricsProps) {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const leadsDelMes = leads.filter(l => new Date(l.createdAt) >= startOfMonth).length;
    const visitasProgramadas = leads.filter(l => l.estado === 'visita_programada').length;
    const cerrados = leads.filter(l => l.estado === 'cerrado').length;
    const total = leads.length;
    const tasaConversion = total > 0 ? Math.round((cerrados / total) * 100) : 0;

    const metrics = [
        {
            label: "Leads del mes",
            value: leadsDelMes,
            suffix: "",
            icon: Users,
            color: "text-[var(--color-accent)]",
            bg: "bg-[var(--color-accent-soft)]",
            border: "border-[var(--color-accent)]/30",
        },
        {
            label: "Visitas programadas",
            value: visitasProgramadas,
            suffix: "",
            icon: CalendarCheck,
            color: "text-[var(--color-warning)]",
            bg: "bg-[var(--color-warning-soft)]",
            border: "border-[var(--color-warning)]/30",
        },
        {
            label: "Operaciones cerradas",
            value: cerrados,
            suffix: "",
            icon: Target,
            color: "text-[var(--color-positive)]",
            bg: "bg-[var(--color-positive-soft)]",
            border: "border-[var(--color-positive)]/30",
        },
        {
            label: "Tasa de conversión",
            value: tasaConversion,
            suffix: "%",
            icon: TrendingUp,
            color: "text-[var(--color-accent)]",
            bg: "bg-[var(--color-accent-soft)]",
            border: "border-[var(--color-accent)]/30",
        },
    ];

    return (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
            {metrics.map((m) => (
                <div
                    key={m.label}
                    className={`bg-[var(--color-paper-2)] rounded-2xl border ${m.border} p-4 flex items-center gap-4 shadow-sm`}
                >
                    <div className={`${m.bg} ${m.color} p-3 rounded-xl flex-shrink-0`}>
                        <m.icon size={20} />
                    </div>
                    <div>
                        <p className="text-2xl font-bold text-[var(--color-ink)]">
                            {m.value}
                            <span className="text-lg">{m.suffix}</span>
                        </p>
                        <p className="text-xs text-[var(--color-muted)] mt-0.5 leading-tight">{m.label}</p>
                    </div>
                </div>
            ))}
        </div>
    );
}
