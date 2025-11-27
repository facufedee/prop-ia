import PropertiesTable from "@/ui/components/tables/PropertiesTable";
import { Plus, Building2, Home, Key } from "lucide-react";
import Link from "next/link";

export default function PropiedadesPage() {
    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-2xl font-bold text-gray-900">Propiedades</h1>
                <Link href="/dashboard/propiedades/nueva" className="flex items-center gap-2 bg-black text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-gray-800 transition">
                    <Plus className="w-4 h-4" /> Nueva Propiedad
                </Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-white p-4 rounded-xl border shadow-sm flex items-center gap-4">
                    <div className="p-3 bg-gray-100 rounded-lg">
                        <Building2 className="w-6 h-6 text-gray-700" />
                    </div>
                    <div>
                        <p className="text-sm text-gray-500">Total Propiedades</p>
                        <p className="text-2xl font-bold text-gray-900">12</p>
                    </div>
                </div>
                <div className="bg-white p-4 rounded-xl border shadow-sm flex items-center gap-4">
                    <div className="p-3 bg-green-100 rounded-lg">
                        <Home className="w-6 h-6 text-green-700" />
                    </div>
                    <div>
                        <p className="text-sm text-gray-500">En Venta</p>
                        <p className="text-2xl font-bold text-gray-900">8</p>
                    </div>
                </div>
                <div className="bg-white p-4 rounded-xl border shadow-sm flex items-center gap-4">
                    <div className="p-3 bg-blue-100 rounded-lg">
                        <Key className="w-6 h-6 text-blue-700" />
                    </div>
                    <div>
                        <p className="text-sm text-gray-500">En Alquiler</p>
                        <p className="text-2xl font-bold text-gray-900">4</p>
                    </div>
                </div>
            </div>

            <div className="bg-white border rounded-2xl shadow-sm overflow-hidden">
                <PropertiesTable />
            </div>
        </div>
    );
}