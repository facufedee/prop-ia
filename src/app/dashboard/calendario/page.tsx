import { Info, Calendar as CalendarIcon, Clock, MapPin } from "lucide-react";

export default function CalendarioPage() {
    const events = [
        { id: 1, title: "Visita Depto Palermo", time: "10:00 AM", location: "Av. Santa Fe 3200", type: "Visita" },
        { id: 2, title: "Firma de Contrato", time: "14:30 PM", location: "Oficina Central", type: "Trámite" },
        { id: 3, title: "Tasación Casa Belgrano", time: "16:00 PM", location: "Juramento 1500", type: "Tasación" },
    ];

    return (
        <div className="space-y-6">
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex items-center gap-3 text-blue-800">
                <Info className="w-5 h-5 flex-shrink-0" />
                <p className="font-medium">Esta sección es una demostración. Aquí podrás gestionar tu agenda y sincronizarla con Google Calendar.</p>
            </div>

            <div className="flex justify-between items-center">
                <h1 className="text-2xl font-bold text-gray-900">Agenda</h1>
                <button className="px-4 py-2 bg-black text-white rounded-lg text-sm font-medium">Nuevo Evento</button>
            </div>

            <div className="grid md:grid-cols-3 gap-6">
                <div className="md:col-span-2 bg-white border rounded-2xl p-6">
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="font-bold text-lg">Noviembre 2024</h2>
                        <div className="flex gap-2">
                            <button className="p-2 hover:bg-gray-100 rounded-lg"><CalendarIcon className="w-5 h-5" /></button>
                        </div>
                    </div>
                    {/* Mock Calendar Grid */}
                    <div className="grid grid-cols-7 gap-2 text-center text-sm mb-2 text-gray-500">
                        <div>Dom</div><div>Lun</div><div>Mar</div><div>Mié</div><div>Jue</div><div>Vie</div><div>Sáb</div>
                    </div>
                    <div className="grid grid-cols-7 gap-2 text-sm">
                        {Array.from({ length: 30 }).map((_, i) => (
                            <div key={i} className={`p-3 rounded-lg border ${i === 22 ? 'bg-black text-white border-black' : 'hover:bg-gray-50 border-transparent'}`}>
                                {i + 1}
                            </div>
                        ))}
                    </div>
                </div>

                <div className="bg-white border rounded-2xl p-6">
                    <h3 className="font-bold text-lg mb-4">Próximos Eventos</h3>
                    <div className="space-y-4">
                        {events.map((event) => (
                            <div key={event.id} className="p-4 bg-gray-50 rounded-xl border border-gray-100">
                                <div className="flex justify-between items-start mb-2">
                                    <span className="text-xs font-bold px-2 py-1 bg-white rounded border text-gray-600">{event.type}</span>
                                    <span className="text-xs text-gray-500">{event.time}</span>
                                </div>
                                <h4 className="font-semibold text-gray-900 mb-1">{event.title}</h4>
                                <div className="flex items-center gap-1 text-xs text-gray-500">
                                    <MapPin className="w-3 h-3" /> {event.location}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
