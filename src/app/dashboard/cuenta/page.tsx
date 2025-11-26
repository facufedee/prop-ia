import { Info, User, Mail, Lock, Bell } from "lucide-react";

export default function CuentaPage() {
    return (
        <div className="space-y-6">
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex items-center gap-3 text-blue-800">
                <Info className="w-5 h-5 flex-shrink-0" />
                <p className="font-medium">Esta sección es una demostración. Aquí podrás gestionar tu perfil y preferencias de usuario.</p>
            </div>

            <h1 className="text-2xl font-bold text-gray-900">Mi Cuenta</h1>

            <div className="bg-white border rounded-2xl overflow-hidden">
                <div className="p-6 border-b bg-gray-50 flex items-center gap-4">
                    <div className="w-20 h-20 bg-black text-white rounded-full flex items-center justify-center text-2xl font-bold">
                        NP
                    </div>
                    <div>
                        <h2 className="text-xl font-bold text-gray-900">Nahuel Pérez</h2>
                        <p className="text-gray-500">Agente Inmobiliario - Plan Premium</p>
                    </div>
                </div>

                <div className="p-6 space-y-6">
                    <div className="grid md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-700">Nombre Completo</label>
                            <div className="relative">
                                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                <input type="text" defaultValue="Nahuel Pérez" className="w-full pl-10 p-3 border rounded-xl bg-gray-50" />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-700">Email</label>
                            <div className="relative">
                                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                <input type="email" defaultValue="nahuel@prop-ia.com" className="w-full pl-10 p-3 border rounded-xl bg-gray-50" />
                            </div>
                        </div>
                    </div>

                    <div className="pt-6 border-t">
                        <h3 className="font-bold text-lg mb-4">Seguridad</h3>
                        <button className="flex items-center gap-2 text-gray-700 hover:text-black border p-3 rounded-xl w-full md:w-auto justify-center">
                            <Lock className="w-5 h-5" /> Cambiar Contraseña
                        </button>
                    </div>

                    <div className="pt-6 border-t">
                        <h3 className="font-bold text-lg mb-4">Notificaciones</h3>
                        <div className="space-y-3">
                            <label className="flex items-center gap-3 p-3 border rounded-xl cursor-pointer hover:bg-gray-50">
                                <input type="checkbox" defaultChecked className="w-5 h-5 text-black rounded focus:ring-black" />
                                <div className="flex-1">
                                    <p className="font-medium">Nuevos Leads</p>
                                    <p className="text-sm text-gray-500">Recibir email cuando ingresa una nueva consulta</p>
                                </div>
                            </label>
                            <label className="flex items-center gap-3 p-3 border rounded-xl cursor-pointer hover:bg-gray-50">
                                <input type="checkbox" defaultChecked className="w-5 h-5 text-black rounded focus:ring-black" />
                                <div className="flex-1">
                                    <p className="font-medium">Resumen Semanal</p>
                                    <p className="text-sm text-gray-500">Estadísticas de rendimiento cada lunes</p>
                                </div>
                            </label>
                        </div>
                    </div>
                </div>

                <div className="p-6 bg-gray-50 border-t flex justify-end gap-3">
                    <button className="px-6 py-2 border border-gray-300 rounded-xl font-medium hover:bg-white transition">Cancelar</button>
                    <button className="px-6 py-2 bg-black text-white rounded-xl font-medium hover:bg-gray-800 transition">Guardar Cambios</button>
                </div>
            </div>
        </div>
    );
}
