import { Info, Search, MoreVertical, User } from "lucide-react";

export default function ClientesPage() {
    const clients = [
        { id: 1, name: "Roberto Gómez", type: "Vendedor", email: "roberto@email.com", phone: "+54 11 1234-5678", properties: 2 },
        { id: 2, name: "Ana Silva", type: "Comprador", email: "ana@email.com", phone: "+54 11 8765-4321", properties: 0 },
        { id: 3, name: "Inversiones SA", type: "Inversor", email: "contacto@inversiones.com", phone: "+54 11 5555-5555", properties: 5 },
    ];

    return (
        <div className="space-y-6">
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex items-center gap-3 text-blue-800">
                <Info className="w-5 h-5 flex-shrink-0" />
                <p className="font-medium">Esta sección es una demostración. Aquí podrás gestionar tu base de datos de clientes y su historial.</p>
            </div>

            <div className="flex justify-between items-center">
                <h1 className="text-2xl font-bold text-gray-900">Cartera de Clientes</h1>
                <button className="px-4 py-2 bg-black text-white rounded-lg text-sm font-medium">Nuevo Cliente</button>
            </div>

            <div className="bg-white border rounded-2xl overflow-hidden">
                <div className="p-4 border-b flex items-center gap-4">
                    <div className="relative flex-1 max-w-md">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Buscar cliente..."
                            className="w-full pl-10 pr-4 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-black focus:border-transparent outline-none"
                        />
                    </div>
                </div>

                <table className="w-full text-left text-sm">
                    <thead className="bg-gray-50 text-gray-600 font-medium">
                        <tr>
                            <th className="px-6 py-4">Nombre</th>
                            <th className="px-6 py-4">Tipo</th>
                            <th className="px-6 py-4">Contacto</th>
                            <th className="px-6 py-4">Propiedades</th>
                            <th className="px-6 py-4"></th>
                        </tr>
                    </thead>
                    <tbody className="divide-y">
                        {clients.map((client) => (
                            <tr key={client.id} className="hover:bg-gray-50">
                                <td className="px-6 py-4 flex items-center gap-3">
                                    <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center text-gray-600">
                                        <User className="w-4 h-4" />
                                    </div>
                                    <span className="font-medium text-gray-900">{client.name}</span>
                                </td>
                                <td className="px-6 py-4">
                                    <span className="px-2 py-1 bg-gray-100 rounded text-xs font-medium text-gray-600">{client.type}</span>
                                </td>
                                <td className="px-6 py-4 text-gray-500">
                                    <div>{client.email}</div>
                                    <div className="text-xs">{client.phone}</div>
                                </td>
                                <td className="px-6 py-4 text-gray-500">{client.properties} Activas</td>
                                <td className="px-6 py-4 text-right">
                                    <button className="text-gray-400 hover:text-black"><MoreVertical className="w-4 h-4" /></button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
