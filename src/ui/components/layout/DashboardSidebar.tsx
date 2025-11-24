import Link from "next/link";
import {
  Home,
  Calculator,
  Building2,
  MessageSquare,
  Users,
  Bot,
  Megaphone,
  Banknote,
  Calendar,
  User,
  Settings
} from "lucide-react";

export default function DashboardSidebar() {
  return (
    <aside className="w-64 bg-white border-r shadow-sm p-6 flex flex-col gap-6">
      <h1 className="text-xl font-bold tracking-tight text-black">PROP-IA</h1>

      <nav className="flex flex-col gap-3 text-gray-700">

        <Link href="/dashboard" className="flex items-center gap-2 hover:text-black">
          <Home className="w-5 h-5" /> Dashboard
        </Link>

        <Link href="/dashboard/tasacion" className="flex items-center gap-2 hover:text-black">
          <Calculator className="w-5 h-5" /> Tasación Inteligente
        </Link>



        <Link href="/dashboard/propiedades" className="flex items-center gap-2 hover:text-black">
          <Building2 className="w-5 h-5" /> Propiedades
        </Link>

        <Link href="/dashboard/leads" className="flex items-center gap-2 hover:text-black">
          <MessageSquare className="w-5 h-5" /> Leads / Consultas
        </Link>

        <Link href="/dashboard/clientes" className="flex items-center gap-2 hover:text-black">
          <Users className="w-5 h-5" /> Clientes
        </Link>

        <Link href="/dashboard/chat" className="flex items-center gap-2 hover:text-black">
          <Bot className="w-5 h-5" /> Chat Prop-IA
        </Link>

        <Link href="/dashboard/publicaciones" className="flex items-center gap-2 hover:text-black">
          <Megaphone className="w-5 h-5" /> Publicaciones
        </Link>

        <Link href="/dashboard/finanzas" className="flex items-center gap-2 hover:text-black">
          <Banknote className="w-5 h-5" /> Finanzas
        </Link>

        <Link href="/dashboard/calendario" className="flex items-center gap-2 hover:text-black">
          <Calendar className="w-5 h-5" /> Calendario
        </Link>

        <Link href="/dashboard/cuenta" className="flex items-center gap-2 hover:text-black">
          <User className="w-5 h-5" /> Cuenta
        </Link>

        <Link href="/dashboard/configuracion" className="flex items-center gap-2 hover:text-black">
          <Settings className="w-5 h-5" /> Configuración
        </Link>

        <div className="mt-auto pt-6 border-t">
          <Link href="/" className="flex items-center gap-2 text-gray-500 hover:text-black transition-colors">
            <Home className="w-5 h-5" /> Volver al Inicio
          </Link>
        </div>
      </nav>
    </aside>
  );
}
