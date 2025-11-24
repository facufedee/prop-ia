import { Info, Globe, CheckCircle, AlertCircle } from "lucide-react";

export default function PublicacionesPage() {
    const portals = [
        { name: "ZonaProp", status: "Conectado", listings: 12, views: 1450 },
        { name: "ArgenProp", status: "Conectado", listings: 12, views: 890 },
        { name: "MercadoLibre", status: "Error de Sync", listings: 10, views: 0 },
    ];

    return (
        <div className="space-y-6">
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex items-center gap-3 text-blue-800">
                <Info className="w-5 h-5 flex-shrink-0" />
                <p className="font-medium">Esta sección es una demostración. Aquí podrás sincronizar tus propiedades con los principales portales inmobiliarios.</p>
            </div>

            <h1 className="text-2xl font-bold text-gray-900">Publicaciones Multiplataforma</h1>

            <div className="grid md:grid-cols-3 gap-6">
                {portals.map((portal) => (
                    <div key={portal.name} className="bg-white border rounded-xl p-6 flex flex-col gap-4">
                        <div className="flex justify-between items-start">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-gray-100 rounded-lg">
                                    <Globe className="w-6 h-6 text-gray-700" />
                                </div>
                                <h3 className="font-bold text-lg">{portal.name}</h3>
                            </div>
                            {portal.status === 'Conectado' ? (
                                <CheckCircle className="w-5 h-5 text-green-500" />
                            ) : (
                                <AlertCircle className="w-5 h-5 text-red-500" />
                            )}
                        </div>

                        <div className="space-y-2">
                            <div className="flex justify-between text-sm">
                                <span className="text-gray-500">Estado</span>
                                <span className={`font-medium ${portal.status === 'Conectado' ? 'text-green-600' : 'text-red-600'}`}>
                                    {portal.status}
                                </span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-gray-500">Propiedades</span>
                                <span className="font-medium">{portal.listings}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-gray-500">Visitas (Mes)</span>
                                <span className="font-medium">{portal.views}</span>
                            </div>
                        </div>

                        <button className="w-full mt-2 py-2 border border-gray-200 rounded-lg text-sm font-medium hover:bg-gray-50 transition">
                            Configurar
                        </button>
                    </div>
                ))}
            </div>
        </div>
    );
}
