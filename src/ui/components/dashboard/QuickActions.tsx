import { Calculator, PlusCircle, Building2, ChartBarBigIcon } from "lucide-react";
import Link from "next/link";

export default function QuickActions() {
    const actions = [
        { icon: <Calculator className="w-5 h-5" />, label: "Nueva Tasación", href: "/dashboard/tasacion" },
        { icon: <PlusCircle className="w-5 h-5" />, label: "Cargar Propiedad", href: "/dashboard/propiedades/nueva" },
        { icon: <Building2 className="w-5 h-5" />, label: "Ver Propiedades", href: "/dashboard/propiedades" },
        { icon: <ChartBarBigIcon className="w-5 h-5" />, label: "Chat PropIA", href: "/dashboard/chat" },
    ];

    return (
        <div className="grid md:grid-cols-3 gap-4">
            {actions.map((a, i) => (
                <Link
                    key={i}
                    href={a.href}
                    className="bg-white border rounded-xl shadow-sm p-5 flex items-center gap-3 hover:bg-gray-50 transition"
                >
                    <div className="p-3 bg-gray-100 rounded-xl text-black">{a.icon}</div>
                    <span className="font-medium text-gray-900">{a.label}</span>
                </Link>
            ))}
        </div>
    );
}