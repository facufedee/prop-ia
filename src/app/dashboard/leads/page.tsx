import { Info, MessageSquare, Phone, Mail } from "lucide-react";

export default function LeadsPage() {
    const leads = [
        { id: 1, name: "Juan Pérez", property: "Depto en Palermo", date: "Hace 2 horas", status: "Nuevo", message: "Hola, me interesa ver el departamento de 3 ambientes." },
        { id: 2, name: "María González", property: "Casa en Belgrano", date: "Ayer", status: "Contactado", message: "¿Aceptan mascotas? Gracias." },
        { id: 3, name: "Carlos Rodríguez", property: "PH en Villa Crespo", date: "Hace 2 días", status: "Visita Agendada", message: "Podría visitarlo el sábado?" },
    ];

    return (
        <div className="space-y-6">
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex items-center gap-3 text-blue-800">
                <Info className="w-5 h-5 flex-shrink-0" />
                <p className="font-medium">Esta sección es una demostración. En la versión completa, aquí gestionarás todas las consultas entrantes de portales y web.</p>
            </div>

            <div className="flex justify-between items-center">
                <h1 className="text-2xl font-bold text-gray-900">Leads y Consultas</h1>
                <button className="px-4 py-2 bg-black text-white rounded-lg text-sm font-medium">Exportar CSV</button>
            </div>

            <div className="grid gap-4">
                {leads.map((lead) => (
                    <div key={lead.id} className="bg-white border rounded-xl p-6 hover:shadow-md transition-shadow">
                        <div className="flex justify-between items-start mb-4">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center text-gray-600 font-bold">
                                    {lead.name.charAt(0)}
                                </div>
                                <div>
                                    <h3 className="font-semibold text-gray-900">{lead.name}</h3>
                                    <p className="text-sm text-gray-500">{lead.property}</p>
                                </div>
                            </div>
                            <span className={`px-3 py-1 rounded-full text-xs font-medium 
                ${lead.status === 'Nuevo' ? 'bg-green-100 text-green-700' :
                                    lead.status === 'Contactado' ? 'bg-blue-100 text-blue-700' : 'bg-purple-100 text-purple-700'}`}>
                                {lead.status}
                            </span>
                        </div>

                        <div className="bg-gray-50 p-3 rounded-lg text-gray-700 text-sm mb-4">
                            "{lead.message}"
                        </div>

                        <div className="flex items-center gap-4 text-sm text-gray-500 border-t pt-4">
                            <span className="flex items-center gap-1"><MessageSquare className="w-4 h-4" /> Responder</span>
                            <span className="flex items-center gap-1"><Phone className="w-4 h-4" /> Llamar</span>
                            <span className="flex items-center gap-1"><Mail className="w-4 h-4" /> Email</span>
                            <span className="ml-auto text-xs">{lead.date}</span>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
