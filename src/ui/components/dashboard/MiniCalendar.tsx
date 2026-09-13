"use client";

import { useState } from "react";
import {
    startOfMonth,
    endOfMonth,
    startOfWeek,
    endOfWeek,
    eachDayOfInterval,
    isSameMonth,
    isSameDay,
    isToday,
    addMonths,
    subMonths,
    format,
} from "date-fns";
import { es } from "date-fns/locale";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface MiniCalendarProps {
    eventDates: Date[];
}

const WEEKDAY_LABELS = ["LUN", "MAR", "MIÉ", "JUE", "VIE", "SÁB", "DOM"];

// Feriados nacionales de Argentina 2026 (fuente: Boletín Oficial / Jefatura de
// Gabinete, argentina.gob.ar/jefatura/feriados-nacionales-2026). Al ser una lista
// fija por año, solo cubre 2026 — navegando a otro año simplemente no se marca nada.
const FERIADOS_2026: { date: Date; name: string }[] = [
    { date: new Date(2026, 0, 1), name: "Año Nuevo" },
    { date: new Date(2026, 1, 16), name: "Carnaval" },
    { date: new Date(2026, 1, 17), name: "Carnaval" },
    { date: new Date(2026, 2, 23), name: "Día no laborable con fines turísticos" },
    { date: new Date(2026, 2, 24), name: "Día Nacional de la Memoria por la Verdad y la Justicia" },
    { date: new Date(2026, 3, 2), name: "Día del Veterano y de los Caídos en la Guerra de Malvinas" },
    { date: new Date(2026, 3, 3), name: "Viernes Santo" },
    { date: new Date(2026, 4, 1), name: "Día del Trabajador" },
    { date: new Date(2026, 4, 25), name: "Día de la Revolución de Mayo" },
    { date: new Date(2026, 5, 15), name: "Paso a la Inmortalidad del Gral. Güemes (trasladado)" },
    { date: new Date(2026, 5, 20), name: "Paso a la Inmortalidad del Gral. Belgrano" },
    { date: new Date(2026, 6, 9), name: "Día de la Independencia" },
    { date: new Date(2026, 7, 17), name: "Paso a la Inmortalidad del Gral. San Martín" },
    { date: new Date(2026, 9, 12), name: "Día del Respeto a la Diversidad Cultural" },
    { date: new Date(2026, 10, 23), name: "Día de la Soberanía Nacional (trasladado)" },
    { date: new Date(2026, 11, 8), name: "Inmaculada Concepción de María" },
    { date: new Date(2026, 11, 25), name: "Navidad" },
];

// Fecha fija todos los años (no depende del calendario 2026).
const isDiaDelCorredor = (day: Date) => day.getMonth() === 9 && day.getDate() === 11;

export function MiniCalendar({ eventDates }: MiniCalendarProps) {
    const [viewDate, setViewDate] = useState(new Date());

    const monthStart = startOfMonth(viewDate);
    const monthEnd = endOfMonth(viewDate);
    const gridStart = startOfWeek(monthStart, { weekStartsOn: 1 });
    const gridEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });
    const days = eachDayOfInterval({ start: gridStart, end: gridEnd });

    const hasEvent = (day: Date) => eventDates.some((d) => isSameDay(d, day));
    const getFeriado = (day: Date) => FERIADOS_2026.find((f) => isSameDay(f.date, day));

    return (
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-4">
            <div className="flex items-center justify-between mb-3">
                <h3 className="text-[13px] font-bold text-gray-900 capitalize">
                    {format(viewDate, "MMMM yyyy", { locale: es })}
                </h3>
                <div className="flex items-center gap-1">
                    <button
                        type="button"
                        onClick={() => setViewDate((d) => subMonths(d, 1))}
                        aria-label="Mes anterior"
                        className="p-1 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-700 transition-colors"
                    >
                        <ChevronLeft size={14} />
                    </button>
                    <button
                        type="button"
                        onClick={() => setViewDate((d) => addMonths(d, 1))}
                        aria-label="Mes siguiente"
                        className="p-1 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-700 transition-colors"
                    >
                        <ChevronRight size={14} />
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-7 gap-y-1">
                {WEEKDAY_LABELS.map((label) => (
                    <div key={label} className="text-center text-[9px] font-bold text-gray-400 pb-1">
                        {label}
                    </div>
                ))}

                {days.map((day) => {
                    const inMonth = isSameMonth(day, viewDate);
                    const today = isToday(day);
                    const event = hasEvent(day);
                    const feriado = getFeriado(day);
                    const corredor = isDiaDelCorredor(day);

                    const titleParts = [feriado?.name, corredor ? "Día del Martillero Público y Corredor Inmobiliario" : null].filter(Boolean);

                    return (
                        <div key={day.toISOString()} className="flex items-center justify-center py-0.5">
                            <div
                                title={titleParts.join(" · ") || undefined}
                                className={`w-6 h-6 flex items-center justify-center rounded-full text-[11px] font-semibold relative
                                    ${today ? "bg-indigo-900 text-white" : feriado && inMonth ? "text-rose-600" : inMonth ? "text-gray-700" : "text-gray-300"}
                                `}
                            >
                                {format(day, "d")}
                                <span className="absolute -bottom-0.5 flex items-center gap-0.5">
                                    {event && !today && <span className="w-1 h-1 rounded-full bg-orange-500" />}
                                    {feriado && !today && <span className="w-1 h-1 rounded-full bg-rose-500" />}
                                    {corredor && !today && <span className="w-1 h-1 rounded-full bg-violet-500" />}
                                </span>
                            </div>
                        </div>
                    );
                })}
            </div>

            <div className="flex items-center gap-3 mt-3 pt-3 border-t border-gray-100 flex-wrap">
                <span className="flex items-center gap-1 text-[9px] font-bold text-gray-400 uppercase tracking-wide">
                    <span className="w-1.5 h-1.5 rounded-full bg-orange-500" /> Visita
                </span>
                <span className="flex items-center gap-1 text-[9px] font-bold text-gray-400 uppercase tracking-wide">
                    <span className="w-1.5 h-1.5 rounded-full bg-rose-500" /> Feriado
                </span>
                <span className="flex items-center gap-1 text-[9px] font-bold text-gray-400 uppercase tracking-wide">
                    <span className="w-1.5 h-1.5 rounded-full bg-violet-500" /> Día del Corredor
                </span>
            </div>
        </div>
    );
}
