"use client";

import { useState, useEffect } from "react";
import { app, auth } from "@/infrastructure/firebase/client";
import { visitasService } from "@/infrastructure/services/visitasService";
import { Visita } from "@/domain/models/Visita";
import { Calendar, Plus, Filter, ChevronLeft, ChevronRight } from "lucide-react";
import Link from "next/link";

import { format } from "date-fns";
import { es } from "date-fns/locale";

export default function CalendarioPage() {
    const [visitas, setVisitas] = useState<Visita[]>([]);
    const [loading, setLoading] = useState(true);
    const [currentDate, setCurrentDate] = useState(new Date());

    useEffect(() => {
        fetchVisitas();
    }, [currentDate]);

    const fetchVisitas = async () => {
        if (!auth?.currentUser) return;

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
            // Sort by date
            const sorted = data.sort((a, b) => new Date(a.fechaHora).getTime() - new Date(b.fechaHora).getTime());
            setVisitas(sorted);
        } catch (error) {
            console.error("Error fetching visitas:", error);
        } finally {
            setLoading(false);
        }
    };

    const getStartOfWeek = (date: Date) => {
        const d = new Date(date);
        const day = d.getDay();
        const diff = d.getDate() - day; // Adjust if week starts on Monday? default Sunday is 0
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
            programada: 'bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100',
            confirmada: 'bg-green-50 text-green-700 border-green-200 hover:bg-green-100',
            en_curso: 'bg-yellow-50 text-yellow-700 border-yellow-200 hover:bg-yellow-100',
            completada: 'bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100',
            cancelada: 'bg-red-50 text-red-700 border-red-200 hover:bg-red-100',
            no_asistio: 'bg-orange-50 text-orange-700 border-orange-200 hover:bg-orange-100',
        };
        return colors[estado as keyof typeof colors] || colors.programada;
    };

    // Badge color for lists
    const getStatusBadge = (estado: string) => {
        const styles = {
            programada: 'bg-blue-100 text-blue-800',
            confirmada: 'bg-green-100 text-green-800',
            en_curso: 'bg-yellow-100 text-yellow-800',
            completada: 'bg-gray-100 text-gray-800',
            cancelada: 'bg-red-100 text-red-800',
            no_asistio: 'bg-orange-100 text-orange-800',
        };
        const labels = {
            programada: 'Programada',
            confirmada: 'Confirmada',
            en_curso: 'En Curso',
            completada: 'Completada',
            cancelada: 'Cancelada',
            no_asistio: 'No Asistió',
        };
        return (
            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${styles[estado as keyof typeof styles] || styles.programada}`}>
                {labels[estado as keyof typeof labels] || estado}
            </span>
        );
    };

    const weekDays = getWeekDays();
    const hours = Array.from({ length: 14 }, (_, i) => i + 8); // 8am to 10pm

    return (
        <div className="p-6 h-[calc(100vh-64px)] overflow-hidden flex flex-col">
            {/* Header Area */}
            <div className="flex flex-shrink-0 justify-between items-center mb-6">
                <div className="flex items-center gap-3">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">Calendario</h1>
                        <p className="text-gray-500">Gestioná tus visitas y citas</p>
                    </div>
                    {loading && (
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-indigo-600"></div>
                    )}
                </div>
                <Link
                    href="/dashboard/calendario/nueva"
                    className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition shadow-sm"
                >
                    <Plus className="w-5 h-5" />
                    Nueva Visita
                </Link>
            </div>

            <div className={`flex flex-col lg:flex-row gap-6 flex-1 min-h-0 transition-opacity duration-300 ${loading ? 'opacity-60 pointer-events-none' : 'opacity-100'}`}>

                {/* Left Column: Agenda List */}
                <div className="w-full lg:w-80 flex-shrink-0 bg-white rounded-2xl border border-gray-200 shadow-sm flex flex-col overflow-hidden">
                    <div className="p-4 border-b border-gray-100 bg-gray-50">
                        <h2 className="font-semibold text-gray-900">Agenda Semanal</h2>
                        <p className="text-xs text-gray-500 mt-1">
                            {format(weekDays[0], "d MMM", { locale: es })} - {format(weekDays[6], "d MMM yyyy", { locale: es })}
                        </p>
                    </div>

                    <div className="flex-1 overflow-y-auto p-2 space-y-2">
                        {visitas.length === 0 ? (
                            <div className="text-center py-8 px-4 text-gray-400 text-sm">
                                <Calendar className="w-8 h-8 mx-auto mb-2 opacity-20" />
                                No hay visitas programadas para esta semana.
                            </div>
                        ) : (
                            visitas.map(visita => (
                                <Link
                                    key={visita.id}
                                    href={`/dashboard/calendario/${visita.id}`}
                                    className="block p-3 rounded-xl border border-gray-100 hover:border-indigo-200 hover:bg-indigo-50 transition-all group bg-white"
                                >
                                    <div className="flex justify-between items-start mb-2">
                                        <div className="text-xs font-bold text-gray-900">
                                            {format(new Date(visita.fechaHora), "EEEE d, HH:mm", { locale: es })} hs
                                        </div>
                                        {getStatusBadge(visita.estado)}
                                    </div>
                                    <div className="text-sm font-medium text-gray-800 mb-1 line-clamp-1">
                                        {visita.clienteNombre}
                                    </div>
                                    <div className="text-xs text-gray-500 flex items-center gap-1">
                                        <span className="truncate">{visita.propiedadDireccion}</span>
                                    </div>
                                </Link>
                            ))
                        )}
                    </div>
                </div>

                {/* Right Column: Calendar Grid */}
                <div className="flex-1 bg-white rounded-2xl border border-gray-200 shadow-sm flex flex-col overflow-hidden">
                    {/* Calendar Controls */}
                    <div className="p-4 border-b border-gray-200 flex justify-between items-center bg-white">
                        <div className="flex items-center gap-2">
                            <span className="text-lg font-bold text-gray-900 capitalize">
                                {format(currentDate, "MMMM yyyy", { locale: es })}
                            </span>
                        </div>
                        <div className="flex bg-gray-100 rounded-lg p-1 gap-1">
                            <button onClick={goToPreviousWeek} className="p-1.5 hover:bg-white rounded-md shadow-sm transition">
                                <ChevronLeft className="w-4 h-4 text-gray-600" />
                            </button>
                            <button onClick={goToToday} className="px-3 py-1 text-xs font-medium text-gray-600 hover:bg-white rounded-md transition">
                                Hoy
                            </button>
                            <button onClick={goToNextWeek} className="p-1.5 hover:bg-white rounded-md shadow-sm transition">
                                <ChevronRight className="w-4 h-4 text-gray-600" />
                            </button>
                        </div>
                    </div>

                    {/* Week Header */}
                    <div className="grid grid-cols-8 border-b border-gray-200 bg-gray-50">
                        <div className="p-2 text-xs font-medium text-center text-gray-400 border-r border-gray-200 py-3">
                            Hora
                        </div>
                        {weekDays.map((day, idx) => {
                            const isToday = day.toDateString() === new Date().toDateString();
                            return (
                                <div key={idx} className={`p-2 text-center border-r border-gray-200 py-3 ${isToday ? 'bg-indigo-50/50' : ''}`}>
                                    <div className={`text-xs uppercase font-semibold mb-1 ${isToday ? 'text-indigo-600' : 'text-gray-500'}`}>
                                        {format(day, "EEE", { locale: es })}
                                    </div>
                                    <div className={`text-sm font-bold w-7 h-7 mx-auto flex items-center justify-center rounded-full ${isToday ? 'bg-indigo-600 text-white shadow-sm' : 'text-gray-900'}`}>
                                        {format(day, "d")}
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    {/* Scrollable Grid */}
                    <div className="flex-1 overflow-y-auto">
                        <div className="grid grid-cols-1"> {/* Wrapper to maintain structure */}
                            {hours.map(hour => (
                                <div key={hour} className="grid grid-cols-8 border-b border-gray-100 min-h-[60px]">
                                    {/* Time Label */}
                                    <div className="relative border-r border-gray-100 bg-white">
                                        <span className="absolute -top-2.5 right-2 text-xs text-gray-400 bg-white px-1">
                                            {hour}:00
                                        </span>
                                    </div>

                                    {/* Days Cells */}
                                    {weekDays.map((day, dayIdx) => {
                                        const dayVisitas = getVisitasForDay(day).filter(v => {
                                            const visitaHour = new Date(v.fechaHora).getHours();
                                            return visitaHour === hour;
                                        });

                                        return (
                                            <div key={dayIdx} className="border-r border-gray-100 p-1 relative hover:bg-gray-50/50 transition-colors">
                                                {dayVisitas.map(visita => (
                                                    <Link
                                                        key={visita.id}
                                                        href={`/dashboard/calendario/${visita.id}`}
                                                        className={`block text-[10px] p-1 mb-1 rounded border overflow-hidden shadow-sm transition-transform hover:scale-105 z-10 relative ${getEstadoColor(visita.estado)}`}
                                                        title={`${visita.clienteNombre} - ${visita.propiedadDireccion}`}
                                                    >
                                                        <div className="font-bold truncate">{visita.clienteNombre}</div>
                                                        <div className="truncate opacity-75">{visita.propiedadDireccion}</div>
                                                    </Link>
                                                ))}
                                            </div>
                                        );
                                    })}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
