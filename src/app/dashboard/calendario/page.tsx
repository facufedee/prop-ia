"use client";

import { useState, useEffect } from "react";
import { app } from "@/infrastructure/firebase/client";
import { getAuth } from "firebase/auth";

const auth = getAuth(app);
import { visitasService } from "@/infrastructure/services/visitasService";
import { Visita } from "@/domain/models/Visita";
import { Calendar, Plus, Filter, ChevronLeft, ChevronRight } from "lucide-react";
import Link from "next/link";

export default function CalendarioPage() {
    const [visitas, setVisitas] = useState<Visita[]>([]);
    const [loading, setLoading] = useState(true);
    const [currentDate, setCurrentDate] = useState(new Date());
    const [viewMode, setViewMode] = useState<'day' | 'week'>('week');

    useEffect(() => {
        fetchVisitas();
    }, [currentDate]);

    const fetchVisitas = async () => {
        if (!auth.currentUser) return;

        try {
            setLoading(true);
            // Get visitas for current week
            const startOfWeek = getStartOfWeek(currentDate);
            const endOfWeek = getEndOfWeek(currentDate);

            const data = await visitasService.getVisitasByDateRange(
                auth.currentUser.uid,
                startOfWeek,
                endOfWeek
            );
            setVisitas(data);
        } catch (error) {
            console.error("Error fetching visitas:", error);
        } finally {
            setLoading(false);
        }
    };

    const getStartOfWeek = (date: Date) => {
        const d = new Date(date);
        const day = d.getDay();
        const diff = d.getDate() - day;
        return new Date(d.setDate(diff));
    };

    const getEndOfWeek = (date: Date) => {
        const d = getStartOfWeek(date);
        d.setDate(d.getDate() + 6);
        d.setHours(23, 59, 59, 999);
        return d;
    };

    const goToPreviousWeek = () => {
        const newDate = new Date(currentDate);
        newDate.setDate(newDate.getDate() - 7);
        setCurrentDate(newDate);
    };

    const goToNextWeek = () => {
        const newDate = new Date(currentDate);
        newDate.setDate(newDate.getDate() + 7);
        setCurrentDate(newDate);
    };

    const goToToday = () => {
        setCurrentDate(new Date());
    };

    const getWeekDays = () => {
        const days = [];
        const start = getStartOfWeek(currentDate);

        for (let i = 0; i < 7; i++) {
            const day = new Date(start);
            day.setDate(start.getDate() + i);
            days.push(day);
        }

        return days;
    };

    const getVisitasForDay = (date: Date) => {
        return visitas.filter(v => {
            const visitaDate = new Date(v.fechaHora);
            return visitaDate.toDateString() === date.toDateString();
        });
    };

    const getEstadoColor = (estado: string) => {
        const colors = {
            programada: 'bg-blue-100 text-blue-700 border-blue-300',
            confirmada: 'bg-green-100 text-green-700 border-green-300',
            en_curso: 'bg-yellow-100 text-yellow-700 border-yellow-300',
            completada: 'bg-gray-100 text-gray-700 border-gray-300',
            cancelada: 'bg-red-100 text-red-700 border-red-300',
            no_asistio: 'bg-orange-100 text-orange-700 border-orange-300',
        };
        return colors[estado as keyof typeof colors] || colors.programada;
    };

    if (loading) {
        return (
            <div className="p-6 flex items-center justify-center min-h-[400px]">
                <div className="text-gray-500">Cargando calendario...</div>
            </div>
        );
    }

    const weekDays = getWeekDays();
    const hours = Array.from({ length: 14 }, (_, i) => i + 8); // 8am to 10pm

    return (
        <div className="p-6 max-w-7xl mx-auto space-y-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Calendario de Visitas</h1>
                    <p className="text-gray-500">Gestión de visitas a propiedades</p>
                </div>
                <Link
                    href="/dashboard/calendario/nueva"
                    className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                >
                    <Plus className="w-5 h-5" />
                    Nueva Visita
                </Link>
            </div>

            {/* Controls */}
            <div className="flex items-center justify-between bg-white rounded-xl border border-gray-200 p-4">
                <div className="flex items-center gap-2">
                    <button
                        onClick={goToPreviousWeek}
                        className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                        <ChevronLeft className="w-5 h-5" />
                    </button>
                    <button
                        onClick={goToToday}
                        className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors text-sm font-medium"
                    >
                        Hoy
                    </button>
                    <button
                        onClick={goToNextWeek}
                        className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                        <ChevronRight className="w-5 h-5" />
                    </button>
                    <span className="ml-4 text-lg font-semibold text-gray-900">
                        {weekDays[0].toLocaleDateString('es-AR', { month: 'long', year: 'numeric' })}
                    </span>
                </div>

                <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-600">Total visitas: {visitas.length}</span>
                </div>
            </div>

            {/* Calendar Grid */}
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                <div className="grid grid-cols-8 border-b border-gray-200">
                    <div className="p-4 bg-gray-50 border-r border-gray-200">
                        <span className="text-sm font-medium text-gray-500">Hora</span>
                    </div>
                    {weekDays.map((day, idx) => {
                        const isToday = day.toDateString() === new Date().toDateString();
                        return (
                            <div
                                key={idx}
                                className={`p-4 text-center border-r border-gray-200 ${isToday ? 'bg-indigo-50' : 'bg-gray-50'
                                    }`}
                            >
                                <div className="text-xs text-gray-500 uppercase">
                                    {day.toLocaleDateString('es-AR', { weekday: 'short' })}
                                </div>
                                <div className={`text-lg font-semibold ${isToday ? 'text-indigo-600' : 'text-gray-900'}`}>
                                    {day.getDate()}
                                </div>
                            </div>
                        );
                    })}
                </div>

                <div className="overflow-y-auto max-h-[600px]">
                    {hours.map(hour => (
                        <div key={hour} className="grid grid-cols-8 border-b border-gray-200 min-h-[80px]">
                            <div className="p-2 bg-gray-50 border-r border-gray-200 text-sm text-gray-600">
                                {hour}:00
                            </div>
                            {weekDays.map((day, dayIdx) => {
                                const dayVisitas = getVisitasForDay(day).filter(v => {
                                    const visitaHour = new Date(v.fechaHora).getHours();
                                    return visitaHour === hour;
                                });

                                return (
                                    <div key={dayIdx} className="p-2 border-r border-gray-200 relative">
                                        {dayVisitas.map(visita => (
                                            <Link
                                                key={visita.id}
                                                href={`/dashboard/calendario/${visita.id}`}
                                                className={`block p-2 rounded-lg border mb-1 hover:shadow-md transition-shadow ${getEstadoColor(visita.estado)}`}
                                            >
                                                <div className="text-xs font-semibold truncate">{visita.clienteNombre}</div>
                                                <div className="text-xs truncate">{visita.propiedadDireccion}</div>
                                                <div className="text-xs text-gray-600">
                                                    {new Date(visita.fechaHora).toLocaleTimeString('es-AR', {
                                                        hour: '2-digit',
                                                        minute: '2-digit'
                                                    })}
                                                </div>
                                            </Link>
                                        ))}
                                    </div>
                                );
                            })}
                        </div>
                    ))}
                </div>
            </div>

            {/* Legend */}
            <div className="bg-white rounded-xl border border-gray-200 p-4">
                <h3 className="text-sm font-medium text-gray-700 mb-3">Estados</h3>
                <div className="flex flex-wrap gap-3">
                    {[
                        { estado: 'programada', label: 'Programada' },
                        { estado: 'confirmada', label: 'Confirmada' },
                        { estado: 'en_curso', label: 'En Curso' },
                        { estado: 'completada', label: 'Completada' },
                        { estado: 'cancelada', label: 'Cancelada' },
                    ].map(({ estado, label }) => (
                        <div key={estado} className="flex items-center gap-2">
                            <div className={`w-4 h-4 rounded border ${getEstadoColor(estado)}`} />
                            <span className="text-sm text-gray-600">{label}</span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
