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
  Settings,
  X
} from "lucide-react";

interface DashboardSidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
}

export default function DashboardSidebar({ isOpen = false, onClose }: DashboardSidebarProps) {
  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 md:hidden backdrop-blur-sm"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed inset-y-0 left-0 z-50 w-64 bg-white border-r shadow-lg md:shadow-sm p-6 flex flex-col gap-6
        transform transition-transform duration-300 ease-in-out
        md:relative md:translate-x-0
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className="flex justify-between items-center">
          <h1 className="text-xl font-bold tracking-tight text-black">PROP-IA</h1>
          <button onClick={onClose} className="md:hidden p-1 hover:bg-gray-100 rounded-lg">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <nav className="flex flex-col gap-3 text-gray-700 overflow-y-auto">

          <Link href="/dashboard" className="flex items-center gap-2 hover:text-black" onClick={onClose}>
            <Home className="w-5 h-5" /> Dashboard
          </Link>

          <Link href="/dashboard/tasacion" className="flex items-center gap-2 hover:text-black" onClick={onClose}>
            <Calculator className="w-5 h-5" /> Tasación Inteligente
          </Link>

          <Link href="/dashboard/propiedades" className="flex items-center gap-2 hover:text-black" onClick={onClose}>
            <Building2 className="w-5 h-5" /> Propiedades
          </Link>

          <Link href="/dashboard/leads" className="flex items-center gap-2 hover:text-black" onClick={onClose}>
            <MessageSquare className="w-5 h-5" /> Leads / Consultas
          </Link>

          <Link href="/dashboard/clientes" className="flex items-center gap-2 hover:text-black" onClick={onClose}>
            <Users className="w-5 h-5" /> Clientes
          </Link>

          <Link href="/dashboard/chat" className="flex items-center gap-2 hover:text-black" onClick={onClose}>
            <Bot className="w-5 h-5" /> Chat Prop-IA
          </Link>

          <Link href="/dashboard/publicaciones" className="flex items-center gap-2 hover:text-black" onClick={onClose}>
            <Megaphone className="w-5 h-5" /> Publicaciones
          </Link>

          <Link href="/dashboard/finanzas" className="flex items-center gap-2 hover:text-black" onClick={onClose}>
            <Banknote className="w-5 h-5" /> Finanzas
          </Link>

          <Link href="/dashboard/calendario" className="flex items-center gap-2 hover:text-black" onClick={onClose}>
            <Calendar className="w-5 h-5" /> Calendario
          </Link>

          <Link href="/dashboard/cuenta" className="flex items-center gap-2 hover:text-black" onClick={onClose}>
            <User className="w-5 h-5" /> Cuenta
          </Link>

          <Link href="/dashboard/configuracion" className="flex items-center gap-2 hover:text-black" onClick={onClose}>
            <Settings className="w-5 h-5" /> Configuración
          </Link>

          <div className="mt-auto pt-6 border-t">
            <Link href="/" className="flex items-center gap-2 text-gray-500 hover:text-black transition-colors">
              <Home className="w-5 h-5" /> Volver al Inicio
            </Link>
          </div>
        </nav>
      </aside>
    </>
  );
}
