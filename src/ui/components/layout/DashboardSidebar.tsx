import Link from "next/link";
import { Home, Calculator, Building2, User } from "lucide-react";


export default function DashboardSidebar() {
return (
<aside className="w-64 bg-white border-r shadow-sm p-6 flex flex-col gap-6">
<h1 className="text-xl font-bold tracking-tight text-black">PROP-IA</h1>


<nav className="flex flex-col gap-3 text-gray-700">
<Link href="/dashboard" className="flex items-center gap-2 hover:text-black">
<Home className="w-5 h-5" /> Dashboard
</Link>
<Link href="/dashboard/tasacion" className="flex items-center gap-2 hover:text-black">
<Calculator className="w-5 h-5" /> Tasación
</Link>
<Link href="/dashboard/propiedades" className="flex items-center gap-2 hover:text-black">
<Building2 className="w-5 h-5" /> Propiedades
</Link>
<Link href="/dashboard/cuenta" className="flex items-center gap-2 hover:text-black">
<User className="w-5 h-5" /> Cuenta
</Link>
</nav>
</aside>
);
}