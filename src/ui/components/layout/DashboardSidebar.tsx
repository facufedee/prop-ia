import Link from "next/link";
import { usePathname } from "next/navigation";
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
  X,
  Shield
} from "lucide-react";

interface DashboardSidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
}

const MENU_ITEMS = [
  { href: "/dashboard", label: "Dashboard", icon: Home },
  { href: "/dashboard/tasacion", label: "Tasación Inteligente", icon: Calculator },
  { href: "/dashboard/propiedades", label: "Propiedades", icon: Building2 },
  { href: "/dashboard/leads", label: "Leads / Consultas", icon: MessageSquare },
  { href: "/dashboard/clientes", label: "Clientes", icon: Users },
  { href: "/dashboard/chat", label: "Chat Prop-IA", icon: Bot },
  { href: "/dashboard/publicaciones", label: "Publicaciones", icon: Megaphone },
  { href: "/dashboard/finanzas", label: "Finanzas", icon: Banknote },
  { href: "/dashboard/calendario", label: "Calendario", icon: Calendar },
  { href: "/dashboard/cuenta", label: "Cuenta", icon: User },
  { href: "/dashboard/configuracion", label: "Configuración", icon: Settings },
  { href: "/dashboard/configuracion/roles", label: "Roles y Permisos", icon: Shield },
];

export default function DashboardSidebar({ isOpen = false, onClose }: DashboardSidebarProps) {
  const pathname = usePathname();

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
          <h1 className="text-xl font-bold tracking-tight text-indigo-900">PROP-IA</h1>
          <button onClick={onClose} className="md:hidden p-1 hover:bg-gray-100 rounded-lg">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <nav className="flex flex-col gap-2 text-gray-600 overflow-y-auto flex-1">
          {MENU_ITEMS.map((item) => {
            const isActive = pathname === item.href;
            const Icon = item.icon;

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-3 py-2 rounded-xl transition-all duration-200
                  ${isActive
                    ? 'bg-indigo-50 text-indigo-700 font-medium'
                    : 'hover:bg-gray-50 hover:text-gray-900'
                  }
                `}
                onClick={onClose}
              >
                <Icon className={`w-5 h-5 ${isActive ? 'text-indigo-600' : 'text-gray-400'}`} />
                {item.label}
              </Link>
            );
          })}

          <div className="mt-auto pt-6 border-t">
            <Link href="/" className="flex items-center gap-3 px-3 py-2 text-gray-500 hover:text-gray-900 hover:bg-gray-50 rounded-xl transition-colors">
              <Home className="w-5 h-5" /> Volver al Inicio
            </Link>
          </div>
        </nav>
      </aside>
    </>
  );
}
