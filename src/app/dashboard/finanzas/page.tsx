import { Info, TrendingUp, DollarSign, CreditCard, ArrowUpRight, ArrowDownRight } from "lucide-react";

export default function FinanzasPage() {
    return (
        <div className="space-y-6">
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex items-center gap-3 text-blue-800">
                <Info className="w-5 h-5 flex-shrink-0" />
                <p className="font-medium">Esta sección es una demostración. Aquí podrás ver el rendimiento financiero de tu inmobiliaria.</p>
            </div>

            <h1 className="text-2xl font-bold text-gray-900">Finanzas</h1>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white p-6 rounded-2xl border shadow-sm">
                    <div className="flex justify-between items-start mb-4">
                        <div className="p-2 bg-green-100 rounded-lg text-green-600">
                            <DollarSign className="w-6 h-6" />
                        </div>
                        <span className="flex items-center text-green-600 text-sm font-medium bg-green-50 px-2 py-1 rounded">
                            <ArrowUpRight className="w-4 h-4 mr-1" /> +12%
                        </span>
                    </div>
                    <p className="text-gray-500 text-sm">Ingresos Totales (Mes)</p>
                    <h3 className="text-3xl font-bold text-gray-900">$4.2M</h3>
                </div>

                <div className="bg-white p-6 rounded-2xl border shadow-sm">
                    <div className="flex justify-between items-start mb-4">
                        <div className="p-2 bg-blue-100 rounded-lg text-blue-600">
                            <TrendingUp className="w-6 h-6" />
                        </div>
                        <span className="flex items-center text-green-600 text-sm font-medium bg-green-50 px-2 py-1 rounded">
                            <ArrowUpRight className="w-4 h-4 mr-1" /> +5%
                        </span>
                    </div>
                    <p className="text-gray-500 text-sm">Comisiones Pendientes</p>
                    <h3 className="text-3xl font-bold text-gray-900">$1.8M</h3>
                </div>

                <div className="bg-white p-6 rounded-2xl border shadow-sm">
                    <div className="flex justify-between items-start mb-4">
                        <div className="p-2 bg-purple-100 rounded-lg text-purple-600">
                            <CreditCard className="w-6 h-6" />
                        </div>
                        <span className="flex items-center text-red-600 text-sm font-medium bg-red-50 px-2 py-1 rounded">
                            <ArrowDownRight className="w-4 h-4 mr-1" /> -2%
                        </span>
                    </div>
                    <p className="text-gray-500 text-sm">Gastos Operativos</p>
                    <h3 className="text-3xl font-bold text-gray-900">$850k</h3>
                </div>
            </div>

            <div className="bg-white border rounded-2xl p-6">
                <h3 className="text-lg font-bold text-gray-900 mb-4">Últimos Movimientos</h3>
                <div className="space-y-4">
                    {[1, 2, 3].map((i) => (
                        <div key={i} className="flex justify-between items-center py-3 border-b last:border-0">
                            <div className="flex items-center gap-4">
                                <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
                                    <DollarSign className="w-5 h-5 text-gray-600" />
                                </div>
                                <div>
                                    <p className="font-medium text-gray-900">Comisión Venta - Depto Palermo</p>
                                    <p className="text-sm text-gray-500">23 Nov, 2024</p>
                                </div>
                            </div>
                            <span className="font-bold text-green-600">+$1,200,000</span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
